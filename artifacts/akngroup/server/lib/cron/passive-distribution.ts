import { mlmDb } from "../mlm-database";
import { DistributionLockService } from "../services/distribution-lock.service";
import { shouldUseMongoose } from "../feature-flags";
import { PassiveIncomePool, WalletTransaction } from "../models";
import mongoose from "mongoose";

const DEFAULT_INTERVAL = parseInt(process.env.PASSIVE_DISTRIBUTION_INTERVAL_MS || "60000", 10); // 60s default for testing
const BATCH_SIZE = parseInt(process.env.PASSIVE_DISTRIBUTION_BATCH_SIZE || "1000", 10);

// Instance ID oluştur (her sunucu instance'ı için unique)
const INSTANCE_ID = `instance-${process.pid}-${Date.now()}`;

/**
 * Passive income dağıtımı yap (lock ile korunmuş)
 */
async function executePassiveDistribution() {
  // 1. Lock almayı dene
  const lockResult = await DistributionLockService.acquirePassiveDistributionLock(INSTANCE_ID);
  
  if (!lockResult.success) {
    console.log(`⏳ Passive distribution atlandı: ${lockResult.message}`);
    return;
  }

  try {
    console.log('🔒 Passive distribution lock alındı, dağıtım başlatılıyor...');

    if (shouldUseMongoose('pools')) {
      // Mongoose ile dağıtım
      await executePassiveDistributionMongoose();
    } else {
      // File-based ile dağıtım
      await executePassiveDistributionFile();
    }

    console.log('✅ Passive distribution tamamlandı');
  } catch (error) {
    console.error('❌ Passive distribution hatasi:', error);
  } finally {
    // 2. Lock'u mutlaka serbest bırak
    const releaseResult = await DistributionLockService.releasePassiveDistributionLock(INSTANCE_ID);
    if (releaseResult.success) {
      console.log('🔓 Passive distribution lock serbest bırakıldı');
    } else {
      console.error('❌ Lock serbest bırakılamadı:', releaseResult.message);
    }
  }
}

/**
 * Mongoose ile passive income dağıtımı
 */
async function executePassiveDistributionMongoose() {
  try {
    // Pool bilgilerini al
    const pool = await PassiveIncomePool.findOne();
    if (!pool || !pool.totalAmount || pool.totalAmount <= 0) {
      console.log('💰 Passive income pool boş, dağıtım yapılmadı');
      return;
    }

    const totalAmount = pool.totalAmount;
    
    // Aktif kullanıcıları al (sadece aktif olanlar)
    const activeUsers = await mongoose.model('User').find({ isActive: true }).select('id email');
    
    if (!activeUsers || activeUsers.length === 0) {
      console.log('👥 Aktif kullanıcı yok, dağıtım yapılmadı');
      return;
    }

    const userCount = Math.min(activeUsers.length, BATCH_SIZE);
    const perUserAmount = Math.floor((totalAmount / userCount) * 100) / 100; // Cent'e yuvarla

    if (perUserAmount <= 0) {
      console.log('💰 Kişi başı tutar çok küçük, dağıtım yapılmadı');
      return;
    }

    // İşlemleri oluştur
    const transactions = activeUsers.slice(0, userCount).map(user => ({
      userId: user.id,
      amount: perUserAmount,
      type: 'PASSIVE' as const,
      reference: `PASSIVE-${Date.now()}-${user.id}`,
      description: 'Passive income pool dağıtımı',
      status: 'PAID' as const,
      sourceUserId: 'system'
    }));

    // Toplam dağıtılan tutarı hesapla
    const totalDistributed = perUserAmount * transactions.length;

    // İşlemleri veritabanına yaz
    await WalletTransaction.insertMany(transactions);

    // Pool'dan düş
    pool.totalAmount = Math.max(0, pool.totalAmount - totalDistributed);
    pool.lastUpdated = new Date();
    
    // Distribution history ekle
    pool.distributionHistory = pool.distributionHistory || [];
    pool.distributionHistory.push({
      distributedAt: new Date(),
      amount: totalDistributed,
      recipients: transactions.length,
      method: pool.settings?.distribution || 'equal'
    });

    await pool.save();

    console.log(`✅ Passive distribution: ${totalDistributed} TL, ${transactions.length} kullanıcıya dağıtıldı`);

  } catch (error) {
    console.error('❌ Mongoose passive distribution hatasi:', error);
    throw error;
  }
}

/**
 * File-based ile passive income dağıtımı
 */
async function executePassiveDistributionFile() {
  try {
    const db = await mlmDb;
    await db.db.read();
    
    const pool = db.db.data.passiveIncomePool?.totalAmount || 0;
    if (!pool || pool <= 0) {
      console.log('💰 Passive income pool boş, dağıtım yapılmadı');
      return;
    }

    const userIds = db.userIds || Object.values(db.indices?.referral || {});
    if (!userIds || userIds.length === 0) {
      console.log('👥 Kullanıcı yok, dağıtım yapılmadı');
      return;
    }

    const count = Math.min(userIds.length, BATCH_SIZE);
    const perUser = Math.floor((pool / count) * 100) / 100; // Cent'e yuvarla

    if (perUser <= 0) {
      console.log('💰 Kişi başı tutar çok küçük, dağıtım yapılmadı');
      return;
    }

    const transactions: any[] = [];
    for (let i = 0; i < count; i++) {
      transactions.push({ 
        recipientId: userIds[i], 
        amount: perUser, 
        type: 'passive', 
        description: 'Passive pool distribution',
        reference: `PASSIVE-${Date.now()}-${userIds[i]}`
      });
    }

    const totalDistributed = perUser * transactions.length;
    
    // İşlemleri oluştur
    const res = await db.createMonolineCommissionTransactions(transactions);

    // Pool'dan düş
    db.db.data.passiveIncomePool.totalAmount = Math.max(0, (db.db.data.passiveIncomePool.totalAmount || 0) - totalDistributed);
    db.db.data.passiveIncomePool.lastUpdated = new Date();
    await db.db.write();

    console.log(`✅ Passive distribution: ${totalDistributed} TL, ${transactions.length} kullanıcıya dağıtıldı. Sonuç:`, res);

  } catch (error) {
    console.error('❌ File-based passive distribution hatasi:', error);
    throw error;
  }
}

/**
 * Passive distribution scheduler'ı başlat
 * Artık setInterval yerine lock-korumalı sistem kullanılıyor
 */
export function startPassiveDistribution() {
  console.log('📆 Passive distribution scheduler başlatılıyor. Interval(ms):', DEFAULT_INTERVAL);
  console.log('🔒 Distributed lock koruması aktif. Instance ID:', INSTANCE_ID);

  // İlk dağıtımı hemen yap
  executePassiveDistribution();

  // Periyodik olarak çalıştır
  setInterval(async () => {
    await executePassiveDistribution();
  }, DEFAULT_INTERVAL);
}

/**
 * Manuel dağıtım için export
 */
export { executePassiveDistribution };