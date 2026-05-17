import mongoose from 'mongoose';
import { WalletTransaction, CommissionLog, CommissionAudit } from '../models';
import { mlmDb } from '../mlm-database';
import { FeatureFlags } from '../feature-flags';

/**
 * Transaction Migration Service
 * 
 * File-based işlem verilerini Mongoose'a taşır.
 */
export class TransactionMigrationService {
  
  /**
   * Tüm işlemleri file-based'dan Mongoose'a taşı
   */
  static async migrateAllTransactions(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log('🚀 Transaction migration başlatılıyor...');

    try {
      // File-based'dan tüm işlemleri al
      const fileTransactions = mlmDb.db.data.walletTransactions || [];
      const fileMonolineCommissions = mlmDb.db.data.monolineCommissions || [];
      
      result.total = fileTransactions.length + fileMonolineCommissions.length;
      console.log(`📊 Toplam ${result.total} işlem bulundu (wallet: ${fileTransactions.length}, monoline: ${fileMonolineCommissions.length})`);

      // Wallet transactions migrate et
      for (const tx of fileTransactions) {
        try {
          await this.migrateWalletTransaction(tx);
          result.migrated++;
          console.log(`✅ İşlem taşındı: ${tx.id || tx.reference}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ İşlem taşınamadı: ${tx.id || tx.reference} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Monoline commissions migrate et
      for (const commission of fileMonolineCommissions) {
        try {
          await this.migrateMonolineCommission(commission);
          result.migrated++;
          console.log(`✅ Monoline komisyonu taşındı: ${commission.id || commission.reference}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ Monoline komisyonu taşınamadı: ${commission.id || commission.reference} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ Transaction migration tamamlandı: ${result.migrated}/${result.total}`);
      
      if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} işlem taşınamadı`);
      }

      return result;
    } catch (error) {
      console.error('❌ Transaction migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Tek bir wallet transaction'ı Mongoose'a taşı
   */
  static async migrateWalletTransaction(txData: any): Promise<void> {
    if (!txData || !txData.userId) {
      throw new Error('Geçersiz işlem verisi');
    }

    const mongoTxData = {
      userId: txData.userId,
      amount: txData.amount || 0,
      type: txData.type || 'COMMISSION',
      status: txData.status || 'PAID',
      reference: txData.reference || `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description: txData.description || 'Migrated transaction',
      createdAt: txData.date ? new Date(txData.date) : new Date(),
      sourceUserId: txData.sourceUserId,
    };

    // Mongoose'da güncelle veya oluştur
    await WalletTransaction.findOneAndUpdate(
      { reference: mongoTxData.reference },
      { $set: mongoTxData },
      { upsert: true, new: true }
    );
  }

  /**
   * Tek bir monoline komisyonunu Mongoose'a taşı
   */
  static async migrateMonolineCommission(commissionData: any): Promise<void> {
    if (!commissionData || !commissionData.userId) {
      throw new Error('Geçersiz komisyon verisi');
    }

    const mongoTxData = {
      userId: commissionData.userId,
      amount: commissionData.amount || 0,
      type: 'CAREER', // Monoline komisyonları CAREER tipi olarak işaretlenir
      status: commissionData.status || 'PAID',
      reference: commissionData.reference || `MONO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description: commissionData.description || 'Monoline commission (migrated)',
      createdAt: commissionData.createdAt ? new Date(commissionData.createdAt) : new Date(),
      sourceUserId: commissionData.sourceUserId,
    };

    // Mongoose'da güncelle veya oluştur
    await WalletTransaction.findOneAndUpdate(
      { reference: mongoTxData.reference },
      { $set: mongoTxData },
      { upsert: true, new: true }
    );
  }

  /**
   * Commission log'ları migrate et
   */
  static async migrateCommissionLogs(): Promise<{
    total: number;
    migrated: number;
    failed: number;
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0
    };

    console.log('🚀 Commission log migration başlatılıyor...');

    try {
      // File-based commission log'ları al (varsa)
      const fileCommissionLogs = mlmDb.db.data.commissionLogs || [];
      result.total = fileCommissionLogs.length;

      for (const log of fileCommissionLogs) {
        try {
          await CommissionLog.findOneAndUpdate(
            { reference: log.reference },
            { $set: log },
            { upsert: true, new: true }
          );
          result.migrated++;
        } catch (error) {
          result.failed++;
          console.error(`❌ Commission log taşınamadı: ${log.reference}`, error);
        }
      }

      console.log(`✅ Commission log migration tamamlandı: ${result.migrated}/${result.total}`);
      return result;
    } catch (error) {
      console.error('❌ Commission log migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Migrasyon doğrulama
   */
  static async validateMigration(): Promise<{
    isValid: boolean;
    discrepancies: string[];
    totalTransactions: number;
  }> {
    const result = {
      isValid: true,
      discrepancies: [] as string[],
      totalTransactions: 0
    };

    console.log('🔍 Transaction migration doğrulanıyor...');

    const fileTransactions = mlmDb.db.data.walletTransactions || [];
    const fileMonolineCommissions = mlmDb.db.data.monolineCommissions || [];
    result.totalTransactions = fileTransactions.length + fileMonolineCommissions.length;

    // Wallet transactions doğrula
    for (const fileTx of fileTransactions) {
      const mongoTx = await WalletTransaction.findOne({ reference: fileTx.reference });
      
      if (!mongoTx) {
        result.discrepancies.push(`İşlem Mongoose'da bulunamadı: ${fileTx.reference}`);
        result.isValid = false;
        continue;
      }

      if (Math.abs(mongoTx.amount - fileTx.amount) > 0.01) {
        result.discrepancies.push(`Tutar uyuşmazlığı: ${fileTx.reference} (${fileTx.amount} vs ${mongoTx.amount})`);
      }
    }

    // Monoline commissions doğrula
    for (const fileCommission of fileMonolineCommissions) {
      const mongoTx = await WalletTransaction.findOne({ reference: fileCommission.reference });
      
      if (!mongoTx) {
        result.discrepancies.push(`Monoline komisyonu Mongoose'da bulunamadı: ${fileCommission.reference}`);
        result.isValid = false;
      }
    }

    if (result.isValid) {
      console.log('✅ Transaction migration doğrulaması başarılı!');
    } else {
      console.warn(`⚠️ ${result.discrepancies.length} uyumsuzluk bulundu`);
    }

    return result;
  }

  /**
   * Rollback
   */
  static async rollback(): Promise<void> {
    console.log('🔄 Transaction rollback başlatılıyor...');
    
    if (FeatureFlags.USE_MONGOOSE_FOR_TRANSACTIONS) {
      throw new Error('USE_MONGOOSE_FOR_TRANSACTIONS flag\'i açıkken rollback yapılamaz!');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const txResult = await WalletTransaction.deleteMany({}, { session });
      const logResult = await CommissionLog.deleteMany({}, { session });
      const auditResult = await CommissionAudit.deleteMany({}, { session });
      
      await session.commitTransaction();
      console.log(`✅ Rollback tamamlandı: ${txResult.deletedCount} işlem, ${logResult.deletedCount} log, ${auditResult.deletedCount} audit silindi`);
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Rollback başarısız:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}