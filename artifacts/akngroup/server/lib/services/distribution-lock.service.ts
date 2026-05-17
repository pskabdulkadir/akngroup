import mongoose from 'mongoose';
import { Schema, Document, Model } from 'mongoose';

/**
 * Distribution Lock Interface
 * 
 * Passive income distribution için distributed lock mekanizması.
 * Aynı anda sadece bir instance'ın çalışmasını garanti eder.
 */
interface IDistributionLock extends Document {
  lockName: string;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
  lastReleaseAt?: Date;
  releaseCount: number;
}

const DistributionLockSchema = new Schema<IDistributionLock>({
  lockName: { type: String, required: true, unique: true },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: String, default: null },
  lockedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  lastReleaseAt: { type: Date },
  releaseCount: { type: Number, default: 0 }
});

export const DistributionLock: Model<IDistributionLock> = 
  mongoose.models.DistributionLock || 
  mongoose.model<IDistributionLock>("DistributionLock", DistributionLockSchema);

/**
 * Distribution Lock Service
 * 
 * Distributed lock yönetimi için servis.
 * Race condition'ları engeller, double distribution riskini ortadan kaldırır.
 */
export class DistributionLockService {
  
  private static readonly LOCK_TTL_MS = 5 * 60 * 1000; // 5 dakika
  private static readonly PASSIVE_DISTRIBUTION_LOCK = 'passive_income_distribution';
  
  /**
   * Lock almayı dene
   * @param lockName Lock adı
   * @param instanceId Bu lock'u alan instance ID'si
   * @returns Lock alınsa true, alınamasa false
   */
  static async acquireLock(
    lockName: string, 
    instanceId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.LOCK_TTL_MS);
      
      // MongoDB atomic operation ile lock almayı dene
      const result = await DistributionLock.findOneAndUpdate(
        {
          lockName,
          $or: [
            { isLocked: false },
            { expiresAt: { $lt: now } } // Süresi dolmuş lock'ları da alabiliriz
          ]
        },
        {
          $set: {
            isLocked: true,
            lockedBy: instanceId,
            lockedAt: now,
            expiresAt: expiresAt
          },
          $inc: { releaseCount: 0 } // Değiştirme, sadece set
        },
        {
          upsert: true,
          new: true,
          returnDocument: 'after'
        }
      );
      
      if (result && result.isLocked && result.lockedBy === instanceId) {
        console.log(`✅ Lock alındi: ${lockName} (instance: ${instanceId})`);
        return {
          success: true,
          message: `Lock alındi: ${lockName}`
        };
      }
      
      // Lock alınamadı, kimin elinde olduğunu kontrol et
      const existingLock = await DistributionLock.findOne({ lockName });
      if (existingLock && existingLock.isLocked) {
        const remainingTime = Math.max(0, Math.floor((existingLock.expiresAt.getTime() - now.getTime()) / 1000));
        console.log(`⏳ Lock zaten alinmiş: ${lockName} (instance: ${existingLock.lockedBy}, kalan: ${remainingTime}s)`);
        return {
          success: false,
          message: `Lock zaten alinmiş: ${existingLock.lockedBy} (${remainingTime}s kala)`
        };
      }
      
      return {
        success: false,
        message: 'Bilinmeyen nedenle lock alınamadı'
      };
      
    } catch (error) {
      console.error(`❌ Lock alma hatasi: ${lockName}`, error);
      return {
        success: false,
        message: `Lock alma hatasi: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Lock'u serbest bırak
   * @param lockName Lock adı
   * @param instanceId Lock'u alan instance ID'si (sadece kendi lock'unu bırakabilir)
   * @returns Başarılı ise true
   */
  static async releaseLock(
    lockName: string, 
    instanceId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await DistributionLock.findOneAndUpdate(
        {
          lockName,
          isLocked: true,
          lockedBy: instanceId
        },
        {
          $set: {
            isLocked: false,
            lockedBy: null,
            lockedAt: null,
            expiresAt: null,
            lastReleaseAt: new Date()
          },
          $inc: { releaseCount: 1 }
        },
        { new: true }
      );
      
      if (result) {
        console.log(`✅ Lock serbest bırakıldı: ${lockName} (instance: ${instanceId})`);
        return {
          success: true,
          message: 'Lock serbest bırakıldı'
        };
      }
      
      console.warn(`⚠️ Lock serbest bırakılamadı: ${lockName} (sahibi: ${instanceId} değil)`);
      return {
        success: false,
        message: 'Lock serbest bırakılamadı (sahibi değilsiniz)'
      };
      
    } catch (error) {
      console.error(`❌ Lock serbest bırakma hatasi: ${lockName}`, error);
      return {
        success: false,
        message: `Lock serbest bırakma hatasi: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Lock durumunu kontrol et
   * @param lockName Lock adı
   * @returns Lock durumu bilgisi
   */
  static async checkLockStatus(lockName: string): Promise<{
    isLocked: boolean;
    lockedBy: string | null;
    lockedAt: Date | null;
    expiresAt: Date | null;
    remainingSeconds: number;
    releaseCount: number;
  }> {
    try {
      const lock = await DistributionLock.findOne({ lockName });
      
      if (!lock) {
        return {
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          expiresAt: null,
          remainingSeconds: 0,
          releaseCount: 0
        };
      }
      
      const now = new Date();
      const remainingSeconds = lock.expiresAt 
        ? Math.max(0, Math.floor((lock.expiresAt.getTime() - now.getTime()) / 1000))
        : 0;
      
      // Süresi dolmuş lock'ları otomatik serbest bırak
      if (lock.isLocked && remainingSeconds === 0) {
        await this.releaseLock(lockName, lock.lockedBy);
        return {
          isLocked: false,
          lockedBy: null,
          lockedAt: null,
          expiresAt: null,
          remainingSeconds: 0,
          releaseCount: lock.releaseCount
        };
      }
      
      return {
        isLocked: lock.isLocked,
        lockedBy: lock.lockedBy,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
        remainingSeconds,
        releaseCount: lock.releaseCount
      };
      
    } catch (error) {
      console.error(`❌ Lock durumu kontrol hatasi: ${lockName}`, error);
      return {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        expiresAt: null,
        remainingSeconds: 0,
        releaseCount: 0
      };
    }
  }
  
  /**
   * Passive income distribution için lock al
   * @param instanceId Instance ID
   * @returns Lock alınsa true
   */
  static async acquirePassiveDistributionLock(instanceId: string): Promise<{ success: boolean; message: string }> {
    return this.acquireLock(this.PASSIVE_DISTRIBUTION_LOCK, instanceId);
  }
  
  /**
   * Passive income distribution lock'unu serbest bırak
   * @param instanceId Instance ID
   * @returns Lock serbest bırakıldıysa true
   */
  static async releasePassiveDistributionLock(instanceId: string): Promise<{ success: boolean; message: string }> {
    return this.releaseLock(this.PASSIVE_DISTRIBUTION_LOCK, instanceId);
  }
  
  /**
   * Passive income distribution lock durumunu kontrol et
   * @returns Lock durumu
   */
  static async getPassiveDistributionLockStatus(): Promise<{
    isLocked: boolean;
    lockedBy: string | null;
    remainingSeconds: number;
    releaseCount: number;
  }> {
    const status = await this.checkLockStatus(this.PASSIVE_DISTRIBUTION_LOCK);
    return {
      isLocked: status.isLocked,
      lockedBy: status.lockedBy,
      remainingSeconds: status.remainingSeconds,
      releaseCount: status.releaseCount
    };
  }
  
  /**
   * Tüm lock'ları temizle (sadece development için!)
   */
  static async clearAllLocks(): Promise<{ success: boolean; count: number }> {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, count: 0 };
    }
    
    try {
      const result = await DistributionLock.deleteMany({});
      console.log(`🗑️ Tüm lock'lar temizlendi: ${result.deletedCount}`);
      return { success: true, count: result.deletedCount };
    } catch (error) {
      console.error('❌ Lock temizleme hatasi', error);
      return { success: false, count: 0 };
    }
  }
}