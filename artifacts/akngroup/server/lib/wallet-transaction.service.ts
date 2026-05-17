import mongoose from 'mongoose';
import { WalletTransaction, User, CommissionAudit } from './models';
import { checkEarningLimit } from './earning-checker';

export async function applyWalletTransactions(
  transactions: {
    userId: string;
    amount: number;
    type: string;
    reference: string;
    description?: string;
  }[],
  performedBy: string = 'system'
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let processedCount = 0;
    let heldCount = 0;

    for (const tx of transactions) {
      // Idempotency: Check if transaction reference already exists
      if (tx.reference) {
        const existingTx = await WalletTransaction.findOne({ reference: tx.reference }).session(session);
        if (existingTx) {
          console.log(`⚠️ Transaction with reference ${tx.reference} already exists, skipping.`);
          continue;
        }
      }

      const user = await User.findById(tx.userId).session(session);
      if (!user) {
        console.warn(`User ${tx.userId} not found, skipping transaction`);
        continue;
      }

      // Limit kontrolü yap
      const status = await checkEarningLimit(user, tx.amount, session);

      // İşlem kaydını oluştur (Ledger)
      await WalletTransaction.create([{
        userId: user._id,
        amount: tx.amount,
        type: tx.type,
        reference: tx.reference,
        description: tx.description,
        status
      }], { session });

      // Eğer limit aşılmadıysa cüzdanı güncelle (Atomik işlem)
      if (status === 'PAID') {
        const updateQuery: any = {
          $inc: {
            "wallet.balance": tx.amount,
            "wallet.totalEarnings": tx.amount
          }
        };

        // Bonus tipine göre alt kırılımları da atomik güncelle
        if (tx.type === 'SPONSOR') updateQuery.$inc["wallet.sponsorBonus"] = tx.amount;
        else if (tx.type === 'CAREER') updateQuery.$inc["wallet.careerBonus"] = tx.amount;
        else if (tx.type === 'PASSIVE') updateQuery.$inc["wallet.passiveIncome"] = tx.amount;
        else if (tx.type === 'LEADERSHIP') updateQuery.$inc["wallet.leadershipBonus"] = tx.amount;

        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          updateQuery,
          { session, new: true }
        );

        if (!updatedUser) {
          throw new Error(`Failed to update wallet for user ${user._id}`);
        }

        processedCount++;
      } else if (status === 'HELD') {
        heldCount++;
      }
      // NOT: user.save() artık çağrılmıyor çünkü findOneAndUpdate her şeyi yaptı
    }

    // Audit log
    if (processedCount > 0 || heldCount > 0) {
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

      await CommissionAudit.create([{
        userId: 'system',
        action: 'DISTRIBUTED',
        amount: totalAmount,
        reason: `Applied ${transactions.length} transactions (${processedCount} PAID, ${heldCount} HELD)`,
        performedBy,
        timestamp: new Date(),
        metadata: {
          processedCount,
          heldCount,
          totalTransactions: transactions.length,
          references: transactions.map(t => t.reference)
        }
      }], { session });
    }

    await session.commitTransaction();

    console.log(`✅ Applied ${processedCount} transactions (${heldCount} held)`);
    return { processedCount, heldCount };

  } catch (err) {
    await session.abortTransaction();
    console.error('Error applying wallet transactions:', err);
    throw err;
  } finally {
    session.endSession();
  }
}
