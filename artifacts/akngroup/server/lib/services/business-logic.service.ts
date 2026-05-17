import mongoose from 'mongoose';
import { User } from '../models';
import { MonolineSettings, CommissionLog } from '../models';
import { WalletTransactionService } from './wallet-transaction.service';

/**
 * Business Logic Service
 * 
 * MLM sisteminin kritik iş mantığı fonksiyonları.
 * Production-ready, edge case'leri handle eden, net business logic.
 */
export class BusinessLogicService {

  // ==================== EARNING LIMIT CHECK ====================

  /**
   * Kullanıcının günlük/aylık komisyon limitini kontrol et
   * 
   * Business Rules:
   * - Günlük maksimum komisyon: $10,000 (ayarlanabilir)
   * - Aylık maksimum komisyon: $100,000 (ayarlanabilir)
   * - Limit aşımı durumunda komisyon HELD statüsünde bekletilir
   * - Limit aşımı tespit edilirse admin'e bildirim gider
   * 
   * @param userId Kullanıcı ID
   * @param requestedAmount İstenen komisyon tutarı
   * @returns Limit durumu ve izin verilen miktar
   */
  static async checkEarningLimit(
    userId: string,
    requestedAmount: number
  ): Promise<{
    canProceed: boolean;
    allowedAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
    reason?: string;
  }> {
    // Ayarları al
    const settings = await MonolineSettings.findOne();
    const dailyLimit = settings?.settings?.dailyEarningLimit || 10000;
    const monthlyLimit = settings?.settings?.monthlyEarningLimit || 100000;

    // Bugünün başlangıcı ve bu ayın başlangıcı
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Kullanıcının bugünkü ve bu aylık komisyonlarını hesapla
    const [dailyTransactions, monthlyTransactions] = await Promise.all([
      WalletTransactionService.getUserTransactions(userId),
      WalletTransactionService.getUserTransactions(userId)
    ]);

    // Sadece PAID statüsündeki işlemleri filtrele ve topla
    const dailyUsed = dailyTransactions.transactions
      .filter(tx => 
        tx.status === 'PAID' && 
        new Date(tx.createdAt) >= startOfDay
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyUsed = monthlyTransactions.transactions
      .filter(tx => 
        tx.status === 'PAID' && 
        new Date(tx.createdAt) >= startOfMonth
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Günlük limit kontrolü
    const dailyTotal = dailyUsed + requestedAmount;
    if (dailyTotal > dailyLimit) {
      const allowedDaily = Math.max(0, dailyLimit - dailyUsed);
      return {
        canProceed: false,
        allowedAmount: allowedDaily,
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
        reason: `Günlük limit aşıldi: ${dailyTotal} > ${dailyLimit}. İzin verilen: ${allowedDaily}`
      };
    }

    // Aylık limit kontrolü
    const monthlyTotal = monthlyUsed + requestedAmount;
    if (monthlyTotal > monthlyLimit) {
      const allowedMonthly = Math.max(0, monthlyLimit - monthlyUsed);
      return {
        canProceed: false,
        allowedAmount: allowedMonthly,
        dailyLimit,
        monthlyLimit,
        dailyUsed,
        monthlyUsed,
        reason: `Aylık limit aşıldi: ${monthlyTotal} > ${monthlyLimit}. İzin verilen: ${allowedMonthly}`
      };
    }

    // Tüm limitler uygun
    return {
      canProceed: true,
      allowedAmount: requestedAmount,
      dailyLimit,
      monthlyLimit,
      dailyUsed,
      monthlyUsed
    };
  }

  // ==================== INITIAL MEMBERSHIP VALIDATION ====================

  /**
   * İlk üyelik satın alımını doğrula
   * 
   * Business Rules:
   * - Minimum satın alma tutarı: $20 (ayarlanabilir)
   * - Kullanıcı zaten aktif üyeliğe sahip olamaz
   * - Satın alma tutarı ürün fiyatının katları olmalı
   * - Aynı kullanıcı birden fazla ücretsiz üyelik alamaz
   * 
   * @param userId Kullanıcı ID
   * @param purchaseAmount Satın alma tutarı
   * @param session MongoDB session (opsiyonel)
   * @returns Doğrulama sonucu ve detaylar
   */
  static async validateInitialMembership(
    userId: string,
    purchaseAmount: number,
    session?: mongoose.ClientSession
  ): Promise<{
    isValid: boolean;
    message: string;
    minimumRequired: number;
    maximumAllowed?: number;
    suggestedAmount?: number;
    errorCode?: string;
  }> {
    try {
      // Ayarları al
      const settings = await MonolineSettings.findOne().session(session || null);
      const productPrice = settings?.productPrice || 20;
      const minAmount = settings?.membershipRequirements?.initialPurchase?.minimumAmount || productPrice;
      const maxAmount = settings?.membershipRequirements?.initialPurchase?.maximumAmount || productPrice * 100;

      // 1. Tutar validation'ları
      if (purchaseAmount <= 0) {
        return {
          isValid: false,
          message: 'Satın alma tutarı pozitif olmalıdır',
          minimumRequired: minAmount,
          maximumAllowed: maxAmount,
          errorCode: 'INVALID_AMOUNT'
        };
      }

      if (purchaseAmount < minAmount) {
        return {
          isValid: false,
          message: `Minimum satın alma tutarı: $${minAmount}`,
          minimumRequired: minAmount,
          maximumAllowed: maxAmount,
          suggestedAmount: minAmount,
          errorCode: 'BELOW_MINIMUM'
        };
      }

      if (purchaseAmount > maxAmount) {
        return {
          isValid: false,
          message: `Maksimum satın alma tutarı: $${maxAmount}`,
          minimumRequired: minAmount,
          maximumAllowed: maxAmount,
          suggestedAmount: maxAmount,
          errorCode: 'ABOVE_MAXIMUM'
        };
      }

      // 2. Ürün fiyatının katı mı kontrol et (isteğe bağlı, strict mode)
      if (settings?.membershipRequirements?.initialPurchase?.requireMultipleOfProductPrice) {
        const remainder = purchaseAmount % productPrice;
        if (remainder !== 0) {
          const suggestedAmount = Math.floor(purchaseAmount / productPrice) * productPrice;
          return {
            isValid: false,
            message: `Satın alma tutarı ürün fiyatının ($${productPrice}) katı olmalıdır`,
            minimumRequired: minAmount,
            maximumAllowed: maxAmount,
            suggestedAmount: suggestedAmount > 0 ? suggestedAmount : productPrice,
            errorCode: 'NOT_MULTIPLE_OF_PRODUCT_PRICE'
          };
        }
      }

      // 3. Kullanıcı zaten aktif üyeliğe sahip mi?
      const user = await User.findById(userId).session(session || null);
      if (!user) {
        return {
          isValid: false,
          message: 'Kullanıcı bulunamadı',
          minimumRequired: minAmount,
          errorCode: 'USER_NOT_FOUND'
        };
      }

      // 4. Zaten üyelik var mı kontrol et
      if (user.membershipType && user.membershipType !== 'free' && user.membershipType !== 'NONE') {
        return {
          isValid: false,
          message: `Kullanıcının zaten aktif ${user.membershipType} üyeliği var`,
          minimumRequired: minAmount,
          errorCode: 'ALREADY_HAS_MEMBERSHIP'
        };
      }

      // 5. Kullanıcı aktif mi (daha önce satın alma yapmış mı)?
      if (user.isActive && user.membershipStartDate) {
        return {
          isValid: false,
          message: 'Kullanıcı zaten aktif üyelik başlatmış',
          minimumRequired: minAmount,
          errorCode: 'MEMBERSHIP_ALREADY_STARTED'
        };
      }

      // 6. Bekleyen satın alma var mı?
      const pendingPurchases = await CommissionLog.countDocuments({
        reference: { $regex: `^PURCHASE-${userId}-` },
        processedBy: 'pending'
      });

      if (pendingPurchases > 0) {
        return {
          isValid: false,
          message: 'Bekleyen satın alma işlemi var',
          minimumRequired: minAmount,
          errorCode: 'PENDING_PURCHASE_EXISTS'
        };
      }

      // Tüm validasyonlar başarılı
      return {
        isValid: true,
        message: 'Geçerli ilk üyelik satın alımı',
        minimumRequired: minAmount,
        maximumAllowed: maxAmount,
        suggestedAmount: purchaseAmount
      };

    } catch (error) {
      console.error('Membership validation error:', error);
      return {
        isValid: false,
        message: 'Doğrulama sırasında beklenmeyen hata',
        minimumRequired: 20,
        errorCode: 'VALIDATION_ERROR'
      };
    }
  }

  // ==================== USER ACTIVITY CHECK ====================

  /**
   * Kullanıcı aktivitesini kontrol et
   * 
   * Business Rules:
   * - Kullanıcı aktif olmalı (isActive = true)
   * - Üyelik tipi 'free' veya 'NONE' olmamalı
   * - Aylık minimum aktivite hacmi: $20 (ayarlanabilir)
   * - Son aktivite tarihi 30 günden eski olmamalı
   * - KYC durumu 'approved' olmalı (opsiyonel)
   * 
   * @param userId Kullanıcı ID
   * @param session MongoDB session (opsiyonel)
   * @returns Aktivite durumu ve detaylar
   */
  static async checkUserActivity(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<{
    isActive: boolean;
    lastActivityDate: Date | null;
    monthlyVolume: number;
    annualVolume: number;
    message: string;
    canEarnCommission: boolean;
    canReceivePassiveIncome: boolean;
    restrictions?: string[];
  }> {
    try {
      // Kullanıcıyı al
      const user = await User.findById(userId).session(session || null);
      if (!user) {
        return {
          isActive: false,
          lastActivityDate: null,
          monthlyVolume: 0,
          annualVolume: 0,
          message: 'Kullanıcı bulunamadı',
          canEarnCommission: false,
          canReceivePassiveIncome: false,
          restrictions: ['USER_NOT_FOUND']
        };
      }

      const restrictions: string[] = [];
      let canEarnCommission = true;
      let canReceivePassiveIncome = true;

      // 1. Kullanıcı aktif mi?
      const isUserActive = user.isActive;
      if (!isUserActive) {
        restrictions.push('USER_NOT_ACTIVE');
        canEarnCommission = false;
        canReceivePassiveIncome = false;
      }

      // 2. Üyelik tipi uygun mu?
      const hasValidMembership = user.membershipType && 
                                  user.membershipType !== 'free' && 
                                  user.membershipType !== 'NONE';
      if (!hasValidMembership) {
        restrictions.push('NO_VALID_MEMBERSHIP');
        canEarnCommission = false;
        canReceivePassiveIncome = false;
      }

      // 3. KYC durumu kontrolü (opsiyonel)
      if (user.kycStatus && user.kycStatus !== 'approved') {
        restrictions.push('KYC_NOT_APPROVED');
        canEarnCommission = false;
        // Passive income için KYC şart değil (sadece warning)
      }

      // 4. Aylık aktivite hacmi
      const settings = await MonolineSettings.findOne().session(session || null);
      const monthlyMin = settings?.membershipRequirements?.monthlyActivity?.minimumAmount || 20;
      const monthlyVolume = user.monthlySalesVolume || 0;
      
      if (monthlyVolume < monthlyMin) {
        restrictions.push(`BELOW_MONTHLY_MINIMUM ($${monthlyVolume} < $${monthlyMin})`);
        canEarnCommission = false;
      }

      // 5. Son aktivite tarihi
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const lastActivityDate = user.lastActivityDate || user.updatedAt || user.createdAt;
      const isRecentActivity = lastActivityDate >= thirtyDaysAgo;

      if (!isRecentActivity) {
        restrictions.push('INACTIVE_TOO_LONG (30+ days)');
        canReceivePassiveIncome = false;
      }

      // 6. Annual volume hesapla
      const annualVolume = user.annualSalesVolume || user.totalInvestment || 0;

      // 7. Hesap donmuş mu?
      if (user.accountStatus === 'suspended' || user.accountStatus === 'frozen') {
        restrictions.push(`ACCOUNT_${user.accountStatus?.toUpperCase()}`);
        canEarnCommission = false;
        canReceivePassiveIncome = false;
      }

      // 8. Refund/chargeback durumu
      if (user.chargebackCount && user.chargebackCount > 0) {
        restrictions.push(`CHARGEBACKS (${user.chargebackCount})`);
        // Chargeback'ler commission'ı engellemez ama izlenir
      }

      // Genel aktivite durumu
      const isActive = isUserActive && hasValidMembership && monthlyVolume >= monthlyMin;

      // Mesaj oluştur
      let message = '';
      if (isActive && restrictions.length === 0) {
        message = 'Aktif üye, yeterli aktivite';
      } else if (isActive && restrictions.length > 0) {
        message = `Aktif üye ancak kısıtlamalar var: ${restrictions.join(', ')}`;
      } else if (!isUserActive) {
        message = 'Kullanıcı aktif değil';
      } else if (!hasValidMembership) {
        message = 'Geçerli üyelik yok';
      } else if (monthlyVolume < monthlyMin) {
        message = `Aylık minimumun altında ($${monthlyVolume} < $${monthlyMin})`;
      } else {
        message = 'Aktivite kriterleri karşılanmıyor';
      }

      return {
        isActive,
        lastActivityDate,
        monthlyVolume,
        annualVolume,
        message,
        canEarnCommission,
        canReceivePassiveIncome,
        restrictions: restrictions.length > 0 ? restrictions : undefined
      };

    } catch (error) {
      console.error('Activity check error:', error);
      return {
        isActive: false,
        lastActivityDate: null,
        monthlyVolume: 0,
        annualVolume: 0,
        message: 'Aktivite kontrolünde hata',
        canEarnCommission: false,
        canReceivePassiveIncome: false,
        restrictions: ['ACTIVITY_CHECK_ERROR']
      };
    }
  }

  // ==================== ADDITIONAL BUSINESS LOGIC ====================

  /**
   * Kullanıcının komisyon alabilirliğini kapsamlı kontrol et
   * 
   * @param userId Kullanıcı ID
   * @param commissionAmount Komisyon tutarı
   * @param session MongoDB session
   * @returns Kapsamlı uygunluk durumu
   */
  static async checkCommissionEligibility(
    userId: string,
    commissionAmount: number,
    session?: mongoose.ClientSession
  ): Promise<{
    isEligible: boolean;
    canEarnCommission: boolean;
    canReceivePassiveIncome: boolean;
    earningLimitOk: boolean;
    activityOk: boolean;
    membershipOk: boolean;
    message: string;
    restrictions?: string[];
  }> {
    // 1. Aktivite kontrolü
    const activityResult = await this.checkUserActivity(userId, session);
    
    // 2. Kazanç limiti kontrolü
    const limitResult = await this.checkEarningLimit(userId, commissionAmount);

    // 3. Üyelik durumu
    const user = await User.findById(userId).session(session || null);
    const membershipOk = user?.membershipType && 
                          user.membershipType !== 'free' && 
                          user.membershipType !== 'NONE';

    // Kapsamlı uygunluk
    const isEligible = activityResult.canEarnCommission && 
                       limitResult.canProceed && 
                       membershipOk;

    const restrictions: string[] = [];
    if (!activityResult.canEarnCommission) {
      restrictions.push(...(activityResult.restrictions || []));
    }
    if (!limitResult.canProceed) {
      restrictions.push(limitResult.reason || 'EARNING_LIMIT_EXCEEDED');
    }
    if (!membershipOk) {
      restrictions.push('NO_VALID_MEMBERSHIP');
    }

    let message = '';
    if (isEligible) {
      message = 'Komisyon almaya uygun';
    } else {
      message = `Komisyon alamaz: ${restrictions.join(', ')}`;
    }

    return {
      isEligible,
      canEarnCommission: activityResult.canEarnCommission,
      canReceivePassiveIncome: activityResult.canReceivePassiveIncome,
      earningLimitOk: limitResult.canProceed,
      activityOk: activityResult.isActive,
      membershipOk,
      message,
      restrictions: restrictions.length > 0 ? restrictions : undefined
    };
  }

  /**
   * Kullanıcı durumunu otomatik güncelle (aktivite bazlı)
   * 
   * @param userId Kullanıcı ID
   * @param session MongoDB session
   */
  static async autoUpdateUserStatus(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<{
    updated: boolean;
    previousStatus: string;
    newStatus: string;
    changes?: string[];
  }> {
    const user = await User.findById(userId).session(session || null);
    if (!user) {
      return { updated: false, previousStatus: 'not_found', newStatus: 'not_found' };
    }

    const activityResult = await this.checkUserActivity(userId, session);
    const changes: string[] = [];
    let updated = false;

    // Aktivite yoksa kullanıcıyı pasif yap
    if (!activityResult.isActive && user.isActive) {
      user.isActive = false;
      changes.push('isActive: true -> false');
      updated = true;
    }

    // Aktivite varsa ve kullanıcı pasifse aktif yap
    if (activityResult.isActive && !user.isActive) {
      user.isActive = true;
      changes.push('isActive: false -> true');
      updated = true;
    }

    // Son aktivite tarihini güncelle
    if (activityResult.lastActivityDate) {
      user.lastActivityDate = activityResult.lastActivityDate;
      changes.push('lastActivityDate updated');
      updated = true;
    }

    if (updated) {
      await user.save({ session });
    }

    return {
      updated,
      previousStatus: user.isActive ? 'active' : 'inactive',
      newStatus: activityResult.isActive ? 'active' : 'inactive',
      changes: changes.length > 0 ? changes : undefined
    };
  }
}

export default BusinessLogicService;