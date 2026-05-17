import cron from 'node-cron';
import mongoose from 'mongoose';
import { User } from '../models';
import { WalletTransaction, User as UserModel, CommissionAudit } from '../models';
import LoggerService, { LogContext } from '../logger';

/**
 * Otomatik Reset İşlemleri
 * 1. Aylık Reset (Her ayın 1'i 00:00): Aylık limitleri sıfırlar, HELD kazançları serbest bırakır.
 * 2. Günlük Reset (Her gün 00:00): Günlük limitleri sıfırlar.
 */
export const monthlyResetJob = () => {

  // 📅 AYLIK RESET (Her ayın 1. günü saat 00:00)
  cron.schedule('0 0 1 * *', async () => {
    LoggerService.info('📅 Monthly reset job started', { context: LogContext.SYSTEM });
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Kullanıcı bazlı aylık kazanç sayaçlarını sıfırla
      const userUpdateResult = await User.updateMany(
        {},
        {
          $set: {
            'wallet.monthlyEarnings': 0,
            monthlySalesVolume: 0
          }
        },
        { session }
      );
      LoggerService.info(`✅ Reset monthly counters for ${userUpdateResult.modifiedCount} users`, { context: LogContext.SYSTEM });

      // 2️⃣ HELD (Bekleyen) kazançları kontrol et ve serbest bırak
      const heldTx = await WalletTransaction.find({ status: 'HELD' }).session(session);
      LoggerService.info(`📊 Found ${heldTx.length} HELD transactions to release`, { context: LogContext.SYSTEM });

      let releasedCount = 0;
      for (const tx of heldTx) {
        const user = await User.findById(tx.userId).session(session);
        if (user) {
          // Cüzdan bakiyesine ekle (Limit kontrolü yapmadan, çünkü yeni ay başladı)
          user.wallet.balance += tx.amount;
          user.wallet.totalEarnings += tx.amount;

          // İlgili bonus tipine göre güncelle
          if (tx.type === 'SPONSOR') user.wallet.sponsorBonus += tx.amount;
          else if (tx.type === 'CAREER') user.wallet.careerBonus += tx.amount;
          else if (tx.type === 'LEADERSHIP') user.wallet.leadershipBonus += tx.amount;
          else if (tx.type === 'PASSIVE') user.wallet.passiveIncome += tx.amount;

          await user.save({ session });

          // Transaction durumunu güncelle
          tx.status = 'PAID';
          tx.monthlyResetReleasedAt = new Date();
          tx.description = (tx.description || '') + ' [Released on monthly reset]';
          await tx.save({ session });

          releasedCount++;
        }
      }

      // Audit log
      if (releasedCount > 0) {
        await CommissionAudit.create([{
          userId: 'system',
          action: 'RELEASED',
          amount: heldTx.reduce((sum, tx) => sum + tx.amount, 0),
          reason: `Monthly reset - Released ${releasedCount} HELD transactions`,
          performedBy: 'monthly-reset-cron',
          timestamp: new Date(),
          metadata: {
            releasedTransactions: releasedCount,
            totalAmount: heldTx.reduce((sum, tx) => sum + tx.amount, 0)
          }
        }], { session });
      }

      await session.commitTransaction();
      LoggerService.info(`✅ Monthly reset completed. Released ${releasedCount}/${heldTx.length} HELD transactions`, { context: LogContext.SYSTEM });

    } catch (err) {
      await session.abortTransaction();
      LoggerService.error('❌ Monthly reset failed', { error: err, context: LogContext.SYSTEM });
    } finally {
      session.endSession();
    }
  });

  // 📅 GÜNLÜK RESET (Her gün saat 00:00)
  cron.schedule('0 0 * * *', async () => {
    LoggerService.info('📅 Daily reset job started', { context: LogContext.SYSTEM });
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await User.updateMany(
        {},
        { $set: { 'wallet.dailyEarnings': 0 } },
        { session }
      );
      LoggerService.info(`✅ Daily earnings counters reset for ${result.modifiedCount} users`, { context: LogContext.SYSTEM });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      LoggerService.error('❌ Daily reset failed', { error: err, context: LogContext.SYSTEM });
    } finally {
      session.endSession();
    }
  });

  LoggerService.info('⏰ Cron jobs initialized: Monthly & Daily Reset', { context: LogContext.SYSTEM });
};
