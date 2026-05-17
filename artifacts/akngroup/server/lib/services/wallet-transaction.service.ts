import mongoose from 'mongoose';
import { WalletTransaction, CommissionLog, CommissionAudit } from '../models';
import { mlmDb } from '../mlm-database';
import { shouldUseMongoose } from '../feature-flags';
import LoggerService, { LogContext } from '../logger';

/**
 * Wallet Transaction Service
 * 
 * Cüzdan işlem ve komisyon işlemleri için servis katmanı.
 * Feature flag'e göre file-based veya Mongoose kullanır.
 */
export class WalletTransactionService {
  
  /**
   * Yeni işlem oluştur
   */
  static async createTransaction(data: {
    userId: string;
    amount: number;
    type: 'SPONSOR' | 'CAREER' | 'PASSIVE' | 'LEADERSHIP' | 'BONUS' | 'COMMISSION' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'REFUND';
    reference: string;
    description?: string;
    sourceUserId?: string;
    status?: 'PAID' | 'HELD' | 'BURNED' | 'PENDING';
  }): Promise<any> {
    const { userId, amount, type, reference, description, sourceUserId, status = 'PAID' } = data;

    // Validation
    if (!userId || !amount || !reference) {
      throw new Error('userId, amount ve reference zorunludur');
    }

    if (amount <= 0) {
      throw new Error('Amount pozitif olmalıdır');
    }

    const transactionData = {
      userId,
      amount,
      type,
      reference,
      description: description || '',
      sourceUserId: sourceUserId || null,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (shouldUseMongoose('transactions')) {
      // Mongoose ile oluştur
      const transaction = await WalletTransaction.create(transactionData);
      LoggerService.info(`✅ İşlem oluşturuldu (Mongoose): ${reference}`, { context: LogContext.TRANSACTION });
      return transaction;
    } else {
      // File-based ile oluştur
      const tx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...transactionData,
        date: new Date()
      };
      mlmDb.db.data.walletTransactions = mlmDb.db.data.walletTransactions || [];
      mlmDb.db.data.walletTransactions.push(tx);
      await mlmDb.db.write();
      LoggerService.info(`✅ İşlem oluşturuldu (File): ${reference}`, { context: LogContext.TRANSACTION });
      return tx;
    }
  }

  /**
   * Referans ile işlem bul
   */
  static async getTransactionByReference(reference: string): Promise<any> {
    if (shouldUseMongoose('transactions')) {
      return await WalletTransaction.findOne({ reference });
    } else {
      const transactions = mlmDb.db.data.walletTransactions || [];
      return transactions.find(tx => tx.reference === reference);
    }
  }

  /**
   * Kullanıcının işlemlerini getir
   */
  static async getUserTransactions(userId: string, limit: number = 100, skip: number = 0): Promise<{
    transactions: any[];
    total: number;
  }> {
    if (shouldUseMongoose('transactions')) {
      const [transactions, total] = await Promise.all([
        WalletTransaction.find({ userId })
          .limit(limit)
          .skip(skip)
          .sort({ createdAt: -1 }),
        WalletTransaction.countDocuments({ userId })
      ]);
      return { transactions, total };
    } else {
      const allTransactions = mlmDb.db.data.walletTransactions || [];
      const userTransactions = allTransactions.filter(tx => tx.userId === userId);
      const paginatedTransactions = userTransactions.slice(skip, skip + limit);
      return { transactions: paginatedTransactions, total: userTransactions.length };
    }
  }

  /**
   * Tüm işlemleri getir
   */
  static async getAllTransactions(limit: number = 100, skip: number = 0): Promise<{
    transactions: any[];
    total: number;
  }> {
    if (shouldUseMongoose('transactions')) {
      const [transactions, total] = await Promise.all([
        WalletTransaction.find()
          .limit(limit)
          .skip(skip)
          .sort({ createdAt: -1 }),
        WalletTransaction.countDocuments()
      ]);
      return { transactions, total };
    } else {
      const allTransactions = mlmDb.db.data.walletTransactions || [];
      const paginatedTransactions = allTransactions.slice(skip, skip + limit);
      return { transactions: paginatedTransactions, total: allTransactions.length };
    }
  }

  /**
   * İşlem durumunu güncelle
   */
  static async updateTransactionStatus(reference: string, status: 'PAID' | 'HELD' | 'BURNED' | 'PENDING'): Promise<any> {
    if (shouldUseMongoose('transactions')) {
      return await WalletTransaction.findOneAndUpdate(
        { reference },
        { $set: { status, updatedAt: new Date() } },
        { new: true }
      );
    } else {
      const transactions = mlmDb.db.data.walletTransactions || [];
      const tx = transactions.find(t => t.reference === reference);
      if (tx) {
        tx.status = status;
        await mlmDb.db.write();
      }
      return tx;
    }
  }

  /**
   * Komisyon dağıtımı oluştur (toplu işlem)
   */
  static async distributeCommissions(transactions: Array<{
    userId: string;
    amount: number;
    type: string;
    reference: string;
    description?: string;
    sourceUserId?: string;
  }>): Promise<{
    success: boolean;
    transactionCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const tx of transactions) {
      try {
        await this.createTransaction(tx);
        successCount++;
      } catch (error) {
        errors.push(`İşlem oluşturulamadı ${tx.reference}: ${(error as Error).message}`);
      }
    }

    return {
      success: errors.length === 0,
      transactionCount: successCount,
      errors
    };
  }

  /**
   * Commission log oluştur
   */
  static async createCommissionLog(data: {
    reference: string;
    userId: string;
    totalAmount: number;
    transactionCount: number;
    processedBy?: string;
    details?: any;
  }): Promise<any> {
    const { reference, userId, totalAmount, transactionCount, processedBy, details } = data;

    const logData = {
      reference,
      userId,
      totalAmount,
      transactionCount,
      processedAt: new Date(),
      processedBy: processedBy || 'system',
      details: details || {}
    };

    if (shouldUseMongoose('transactions')) {
      return await CommissionLog.create(logData);
    } else {
      // File-based'da commission log yok, sadece console'a yaz
      LoggerService.info(`📝 Commission log: ${reference} - ${totalAmount} (${transactionCount} işlem)`, { context: LogContext.COMMISSION });
      return logData;
    }
  }

  /**
   * Commission audit kaydı oluştur
   */
  static async createCommissionAudit(data: {
    userId: string;
    action: 'CALCULATED' | 'DISTRIBUTED' | 'HELD' | 'RELEASED' | 'REFUNDED';
    amount: number;
    reason?: string;
    performedBy?: string;
    transactionRef?: string;
    metadata?: any;
  }): Promise<any> {
    const { userId, action, amount, reason, performedBy, transactionRef, metadata } = data;

    const auditData = {
      userId,
      action,
      amount,
      reason: reason || '',
      performedBy: performedBy || 'system',
      transactionRef: transactionRef || '',
      timestamp: new Date(),
      metadata: metadata || {}
    };

    if (shouldUseMongoose('transactions')) {
      return await CommissionAudit.create(auditData);
    } else {
      // File-based'da audit log yok, sadece console'a yaz
      LoggerService.info(`🔍 Commission audit: ${action} - ${amount} (${userId})`, { context: LogContext.COMMISSION });
      return auditData;
    }
  }

  /**
   * HELD işlemleri serbest bırak (monthly reset için)
   */
  static async releaseHeldTransactions(userId: string): Promise<{
    releasedCount: number;
    totalAmount: number;
  }> {
    let releasedCount = 0;
    let totalAmount = 0;

    if (shouldUseMongoose('transactions')) {
      const result = await WalletTransaction.updateMany(
        { userId, status: 'HELD' },
        { $set: { status: 'PAID', monthlyResetReleasedAt: new Date(), updatedAt: new Date() } }
      );
      releasedCount = result.modifiedCount;

      // Toplam amount'u hesapla
      const heldTransactions = await WalletTransaction.find({ userId, status: 'HELD' });
      totalAmount = heldTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    } else {
      const transactions = mlmDb.db.data.walletTransactions || [];
      for (const tx of transactions) {
        if (tx.userId === userId && tx.status === 'HELD') {
          tx.status = 'PAID';
          tx.monthlyResetReleasedAt = new Date();
          releasedCount++;
          totalAmount += tx.amount;
        }
      }
      await mlmDb.db.write();
    }

    LoggerService.info(`✅ HELD işlemler serbest bırakıldı: ${releasedCount} işlem, ${totalAmount} TL`, { context: LogContext.TRANSACTION });
    return { releasedCount, totalAmount };
  }

  /**
   * Kullanıcının toplam HELD bakiyesini hesapla
   */
  static async getHeldBalance(userId: string): Promise<number> {
    if (shouldUseMongoose('transactions')) {
      const result = await WalletTransaction.aggregate([
        { $match: { userId: userId as any, status: 'HELD' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return result.length > 0 ? result[0].total : 0;
    } else {
      const transactions = mlmDb.db.data.walletTransactions || [];
      return transactions
        .filter(tx => tx.userId === userId && tx.status === 'HELD')
        .reduce((sum, tx) => sum + tx.amount, 0);
    }
  }

  /**
   * İşlem istatistikleri
   */
  static async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    heldAmount: number;
    paidAmount: number;
    byType: Record<string, number>;
  }> {
    if (shouldUseMongoose('transactions')) {
      const userIdObj = userId; // Mongoose ObjectId değil, string ID kullanıyoruz

      const [allTransactions, heldTransactions] = await Promise.all([
        WalletTransaction.find({ userId: userIdObj }),
        WalletTransaction.find({ userId: userIdObj, status: 'HELD' })
      ]);

      const byType: Record<string, number> = {};
      let totalAmount = 0;
      let heldAmount = 0;
      let paidAmount = 0;

      for (const tx of allTransactions) {
        totalAmount += tx.amount;
        byType[tx.type] = (byType[tx.type] || 0) + tx.amount;
        if (tx.status === 'PAID') {
          paidAmount += tx.amount;
        }
      }

      for (const tx of heldTransactions) {
        heldAmount += tx.amount;
      }

      return {
        totalTransactions: allTransactions.length,
        totalAmount,
        heldAmount,
        paidAmount,
        byType
      };
    } else {
      const transactions = mlmDb.db.data.walletTransactions || [];
      const userTransactions = transactions.filter(tx => tx.userId === userId);

      const byType: Record<string, number> = {};
      let totalAmount = 0;
      let heldAmount = 0;
      let paidAmount = 0;

      for (const tx of userTransactions) {
        totalAmount += tx.amount;
        byType[tx.type] = (byType[tx.type] || 0) + tx.amount;
        if (tx.status === 'PAID') {
          paidAmount += tx.amount;
        } else if (tx.status === 'HELD') {
          heldAmount += tx.amount;
        }
      }

      return {
        totalTransactions: userTransactions.length,
        totalAmount,
        heldAmount,
        paidAmount,
        byType
      };
    }
  }
}