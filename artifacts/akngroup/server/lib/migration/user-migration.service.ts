import mongoose from 'mongoose';
import { User } from '../models';
import { mlmDb } from '../mlm-database';
import { FeatureFlags } from '../feature-flags';

/**
 * User Migration Service
 * 
 * File-based kullanıcı verilerini Mongoose'a taşır.
 */
export class UserMigrationService {
  
  /**
   * Tüm kullanıcıları file-based'dan Mongoose'a taşı
   */
  static async migrateAllUsers(): Promise<{
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

    console.log('🚀 User migration başlatılıyor...');

    try {
      // File-based'dan tüm kullanıcıları al
      const fileUsers = await mlmDb.getAllUsers();
      result.total = fileUsers.length;

      console.log(`📊 Toplam ${result.total} kullanıcı bulundu`);

      for (const user of fileUsers) {
        try {
          await this.migrateUser(user);
          result.migrated++;
          console.log(`✅ Kullanıcı taşındi: ${user.email} (${user.id})`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ Kullanıcı taşınamadı: ${user.id} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ User migration tamamlandı: ${result.migrated}/${result.total}`);
      
      if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} kullanıcı taşınamadı`);
      }

      return result;
    } catch (error) {
      console.error('❌ User migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Tek bir kullanıcıyı Mongoose'a taşı
   */
  static async migrateUser(userData: any): Promise<void> {
    if (!userData || !userData.id) {
      throw new Error('Geçersiz kullanıcı verisi');
    }

    // Mongoose User model'ine göre veriyi hazırla
    const mongoUserData = {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone || '',
      password: userData.password,
      role: userData.role || 'user',
      membershipType: userData.membershipType || 'entry',
      membershipStartDate: userData.membershipStartDate ? new Date(userData.membershipStartDate) : undefined,
      careerLevel: userData.careerLevel,
      wallet: userData.wallet || {
        balance: 0,
        totalEarnings: 0,
        sponsorBonus: 0,
        careerBonus: 0,
        passiveIncome: 0,
        leadershipBonus: 0
      },
      isActive: userData.isActive ?? false,
      sponsorId: userData.sponsorId || null,
      referralCode: userData.referralCode,
      memberId: userData.memberId,
      registrationDate: userData.registrationDate ? new Date(userData.registrationDate) : new Date(),
      totalInvestment: userData.totalInvestment || 0,
      directReferrals: userData.directReferrals || 0,
      totalTeamSize: userData.totalTeamSize || 0,
      monthlySalesVolume: userData.monthlySalesVolume || 0,
      annualSalesVolume: userData.annualSalesVolume || 0,
      kycStatus: userData.kycStatus || 'pending',
      twoFactorEnabled: userData.twoFactorEnabled || false,
      lastLoginDate: userData.lastLoginDate ? new Date(userData.lastLoginDate) : null,
      receiptFile: userData.receiptFile,
      receiptUploadedAt: userData.receiptUploadedAt ? new Date(userData.receiptUploadedAt) : null,
      receiptVerified: userData.receiptVerified || false,
      cloneStoreEnabled: userData.cloneStoreEnabled || false,
      leftChild: userData.leftChild,
      rightChild: userData.rightChild,
    };

    // Mongoose'da güncelle veya oluştur
    await User.findOneAndUpdate(
      { id: userData.id },
      { $set: mongoUserData },
      { upsert: true, new: true }
    );
  }

  /**
   * Migrasyon doğrulama - File-based ve Mongoose verilerini karşılaştır
   */
  static async validateMigration(): Promise<{
    isValid: boolean;
    discrepancies: string[];
    totalUsers: number;
  }> {
    const result = {
      isValid: true,
      discrepancies: [] as string[],
      totalUsers: 0
    };

    console.log('🔍 User migration doğrulanıyor...');

    const fileUsers = await mlmDb.getAllUsers();
    result.totalUsers = fileUsers.length;

    for (const fileUser of fileUsers) {
      const mongoUser = await User.findOne({ id: fileUser.id });
      
      if (!mongoUser) {
        result.discrepancies.push(`Kullanıcı Mongoose'da bulunamadı: ${fileUser.id}`);
        result.isValid = false;
        continue;
      }

      // Kritik alanları kontrol et
      if (mongoUser.email !== fileUser.email) {
        result.discrepancies.push(`Email uyuşmazlığı: ${fileUser.id} (${fileUser.email} vs ${mongoUser.email})`);
      }

      if (Math.abs(mongoUser.wallet.balance - (fileUser.wallet?.balance || 0)) > 0.01) {
        result.discrepancies.push(`Bakiye uyuşmazlığı: ${fileUser.id} (${fileUser.wallet?.balance} vs ${mongoUser.wallet.balance})`);
      }
    }

    if (result.isValid) {
      console.log('✅ User migration doğrulaması başarılı!');
    } else {
      console.warn(`⚠️ ${result.discrepancies.length} uyumsuzluk bulundu`);
    }

    return result;
  }

  /**
   * Rollback - Mongoose'dan kullanıcıları sil (sadece migration sonrası)
   */
  static async rollback(): Promise<void> {
    console.log('🔄 User rollback başlatılıyor...');
    
    // Sadece migration flag'i kapalıyken rollback yapılabilir
    if (FeatureFlags.USE_MONGOOSE_FOR_USERS) {
      throw new Error('USE_MONGOOSE_FOR_USERS flag\'i açıkken rollback yapılamaz!');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Migration sırasında eklenen kullanıcıları sil
      const result = await User.deleteMany({}, { session });
      await session.commitTransaction();
      console.log(`✅ Rollback tamamlandı: ${result.deletedCount} kullanıcı silindi`);
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Rollback başarısız:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}