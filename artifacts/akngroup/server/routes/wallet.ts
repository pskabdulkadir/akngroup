import { Router } from "express";
import { mongoDb } from "../lib/mongo-database";
import LoggerService, { LogContext } from "../lib/logger";
import { StripeService } from "../lib/stripe-service";
import {
  verifyAccessToken,
  sanitizeUserData,
} from "../lib/utils";
import { User } from "../lib/User";
import { PACKAGE_LIMITS } from "../lib/earning-limits";
import { CurrencyType, WalletTransactionType, PaymentMethodType } from "../../shared/mlm-types";

const router = Router();

// Authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme başlığı gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token gereklidir.",
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz veya süresi dolmuş token.",
      });
    }

    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Geçersiz token.",
    });
  }
};

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin yetkisi gereklidir.",
      });
    }
    next();
  });
};

// Get user wallet balances
router.get("/balances", requireAuth, async (req: any, res) => {
  try {
    let balances = await mongoDb.getUserWalletBalances(req.userId);
    
    // Ensure wallet is initialized
    if (!balances || balances.balance === undefined) {
      await mongoDb.initializeUserWallet(req.userId);
      balances = await mongoDb.getUserWalletBalances(req.userId);
    }

    return res.json({
      success: true,
      balances
    });
  } catch (error) {
    LoggerService.error("Get balances error", { error, context: LogContext.TRANSACTION, userId: req.userId });
    return res.status(500).json({
      success: false,
      error: "Bakiye bilgileri alınırken hata oluştu."
    });
  }
});

// Get user earning limits
router.get("/limits", requireAuth, async (req: any, res) => {
  try {
    // Fetch from MongoDB as that's where the new system stores earnings
    const user = await User.findOne({ _id: req.userId });

    if (!user) {
       return res.status(404).json({ error: "User not found in commission system" });
    }

    const packageType = user.package || 'NONE';
    // @ts-ignore
    const limits = PACKAGE_LIMITS[packageType] || PACKAGE_LIMITS['NONE'];

    res.json({
      success: true,
      package: packageType,
      daily: {
        current: user.wallet.dailyEarnings || 0,
        limit: limits.daily,
        remaining: Math.max(0, limits.daily - (user.wallet.dailyEarnings || 0))
      },
      monthly: {
        current: user.wallet.monthlyEarnings || 0,
        limit: limits.monthly,
        remaining: Math.max(0, limits.monthly - (user.wallet.monthlyEarnings || 0))
      }
    });
  } catch (error) {
    console.error("Get limits error:", error);
    res.status(500).json({ error: "Failed to get earning limits" });
  }
});

// Get user wallet transactions
router.get("/transactions", requireAuth, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await mongoDb.getUserWalletTransactions(req.userId, limit, offset);

    // Ensure transactions is always an array
    const transactions = Array.isArray(result) ? result : (result?.transactions || []);

    return res.json({
      success: true,
      transactions: transactions.map((t: any) => ({
        id: t.id || `tx-${Date.now()}`,
        userId: t.userId,
        amount: t.amount || 0,
        type: t.type || 'unknown',
        reference: t.reference || '',
        description: t.description || '',
        status: t.status || 'pending',
        date: t.date || t.createdAt || new Date().toISOString(),
        currency: t.currency || 'TRY',
        fee: t.fee || 0,
        fromAddress: t.fromAddress || '',
        toAddress: t.toAddress || ''
      })),
      total: Array.isArray(result) ? result.length : (result?.total || 0)
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem geçmişi alınırken hata oluştu."
    });
  }
});

// Create deposit request
router.post("/deposit", requireAuth, async (req: any, res) => {
  try {
    const { currency, amount, paymentMethod, reference, transactionHash, notes } = req.body;

    // Validation
    if (!currency || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Geçerli para birimi ve tutar gereklidir."
      });
    }

    const validCurrencies: CurrencyType[] = ['TRY', 'USD', 'EUR', 'BTC'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz para birimi."
      });
    }

    if (currency === 'BTC' && !transactionHash) {
      return res.status(400).json({
        success: false,
        error: "Bitcoin için transaction hash gereklidir."
      });
    }

    if (currency !== 'BTC' && !reference) {
      return res.status(400).json({
        success: false,
        error: "Banka havalesi için referans numarası gereklidir."
      });
    }

    // Create transaction
    const transaction = await mongoDb.createWalletTransaction({
      userId: req.userId,
      memberId: req.user.memberId,
      type: 'deposit',
      currency,
      amount: parseFloat(amount),
      description: `${currency} para yatırma - ${paymentMethod}`,
      paymentMethod: paymentMethod || (currency === 'BTC' ? 'crypto' : 'bank_transfer'),
      reference,
      transactionHash,
      adminNote: notes
    });

    LoggerService.info(`Deposit request created: ${req.user.fullName} - ${amount} ${currency}`, { 
      context: LogContext.TRANSACTION, 
      userId: req.userId,
      amount,
      currency
    });

    return res.json({
      success: true,
      message: "Para yatırma talebi başarıyla oluşturuldu.",
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    LoggerService.error("Deposit error", { error, context: LogContext.TRANSACTION, userId: req.userId });
    return res.status(500).json({
      success: false,
      error: "Para yatırma talebi oluşturulurken hata oluştu."
    });
  }
});

// Create withdrawal request
router.post("/withdraw", requireAuth, async (req: any, res) => {
  try {
    const { currency, amount, method, bankAccount, cryptoAddress, notes } = req.body;

    // Validation
    if (!currency || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Geçerli para birimi ve tutar gereklidir."
      });
    }

    const validCurrencies: CurrencyType[] = ['TRY', 'USD', 'EUR', 'BTC'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz para birimi."
      });
    }

    // Check KYC status - usually required for traditional bank check/crypto
    if (req.user.kycStatus !== 'approved' && method !== 'stripe') {
      return res.status(403).json({
        success: false,
        error: "Para çekme işlemi için KYC onayı gereklidir."
      });
    }

    // Check balance
    const balance = await mongoDb.getUserWalletBalance(req.userId, currency);
    if ((balance.available || 0) < amount) {
      return res.status(400).json({
        success: false,
        error: "Yetersiz bakiye."
      });
    }

    // Stripe Connect Payout (Instant)
    if (method === 'stripe') {
      const dbUser = await User.findById(req.userId);
      if (!dbUser?.stripeAccountId || !dbUser?.stripeOnboardingComplete) {
        return res.status(400).json({
          success: false,
          error: "Stripe hesabınız bağlı değil veya onboarding tamamlanmamış."
        });
      }

      try {
        const transfer = await StripeService.transferToConnectedAccount(
          amount,
          dbUser.stripeAccountId,
          `Payout for ${dbUser.fullName} (${dbUser.memberId})`
        );

        // Deduct from wallet immediately
        await mongoDb.updateWalletBalance(req.userId, currency, amount, 'subtract');

        // Create completed transaction
        const transaction = await mongoDb.createWalletTransaction({
          userId: req.userId,
          memberId: req.user.memberId,
          type: 'withdrawal',
          currency,
          amount: parseFloat(amount),
          description: `Stripe Connect Payout: ${transfer.id}`,
          paymentMethod: 'stripe',
          status: 'completed',
          reference: transfer.id
        });

        LoggerService.info(`Stripe payout successful for user ${req.userId}: ${amount} ${currency}`, {
          context: LogContext.TRANSACTION,
          userId: req.userId,
          transactionId: transaction.id
        });

        return res.json({
          success: true,
          message: "Ödeme başarıyla Stripe hesabınıza gönderildi ve tamamlandı.",
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            createdAt: transaction.createdAt
          }
        });
      } catch (stripeError: any) {
        LoggerService.error("Stripe Payout Error", { error: stripeError, userId: req.userId });
        return res.status(500).json({
          success: false,
          error: `Stripe transferi sırasında hata oluştu: ${stripeError.message}`
        });
      }
    }

    // Validate withdrawal details for traditional methods
    if (currency === 'BTC' && !cryptoAddress) {
      return res.status(400).json({
        success: false,
        error: "Bitcoin çekimi için cüzdan adresi gereklidir."
      });
    }

    if (currency !== 'BTC' && method === 'bank_transfer' && (!bankAccount?.iban || !bankAccount?.accountHolder)) {
      return res.status(400).json({
        success: false,
        error: "Banka hesap bilgileri eksik."
      });
    }

    // Create traditional pending transaction
    const transaction = await mongoDb.createWalletTransaction({
      userId: req.userId,
      memberId: req.user.memberId,
      type: 'withdrawal',
      currency,
      amount: parseFloat(amount),
      description: `${currency} para çekme (${method})`,
      paymentMethod: method || (currency === 'BTC' ? 'crypto' : 'bank_transfer'),
      bankAccount,
      cryptoAddress,
      adminNote: notes
    });

    console.log(`💸 Withdrawal request created: ${req.user.fullName} - ${amount} ${currency} (${method})`);

    return res.json({
      success: true,
      message: "Para çekme talebi başarıyla oluşturuldu.",
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return res.status(500).json({
      success: false,
      error: "Para çekme talebi oluşturulurken hata oluştu."
    });
  }
});

// Transfer between users
router.post("/transfer", requireAuth, async (req: any, res) => {
  try {
    const { targetMemberId, amount, currency = 'TRY', description } = req.body || {};

    if (!targetMemberId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Hedef üye ve geçerli tutar gereklidir." });
    }

    const validCurrencies: CurrencyType[] = ['TRY', 'USD', 'EUR', 'BTC'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ success: false, error: "Geçersiz para birimi." });
    }

    // Find target user
    const targetUser = await mongoDb.getUserByMemberId(targetMemberId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: "Hedef kullanıcı bulunamadı." });
    }

    if (targetUser.id === req.userId) {
      return res.status(400).json({ success: false, error: "Kendinize transfer yapamazsınız." });
    }

    // Check sender balance
    const senderBalance = await mongoDb.getUserWalletBalance(req.userId, currency);
    const amt = parseFloat(amount);
    if ((senderBalance.available || 0) < amt) {
      return res.status(400).json({ success: false, error: "Yetersiz bakiye." });
    }

    // Deduct from sender safely
    await mongoDb.updateWalletBalance(req.userId, currency, amt, 'subtract');

    // Add to receiver
    await mongoDb.updateWalletBalance(targetUser.id, currency, amt, 'add');

    // Record transactions
    const senderTx = await mongoDb.createWalletTransaction({
      userId: req.userId,
      memberId: req.user.memberId,
      type: 'transfer',
      currency,
      amount: amt,
      description: description ? `Transfer (çıkan): ${description} -> ${targetMemberId}` : `Transfer (çıkan): ${targetMemberId}`,
      status: 'completed'
    });

    const receiverTx = await mongoDb.createWalletTransaction({
      userId: targetUser.id,
      memberId: targetUser.memberId,
      type: 'transfer',
      currency,
      amount: amt,
      description: description ? `Transfer (gelen): ${description} <- ${req.user.memberId}` : `Transfer (gelen): ${req.user.memberId}`,
      status: 'completed'
    });

    console.log(`🔄 Transfer: ${req.user.fullName} (${req.user.memberId}) -> ${targetUser.fullName} (${targetUser.memberId}) : ${amt} ${currency}`);

    return res.json({
      success: true,
      message: 'Transfer başarıyla gerçekleştirildi.',
      transfer: {
        amount: amt,
        currency,
        from: req.user.memberId,
        to: targetMemberId,
        senderTransactionId: senderTx.id,
        receiverTransactionId: receiverTx.id,
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({ success: false, error: 'Transfer sırasında hata oluştu.' });
  }
});

// Get crypto rates
router.get("/crypto/rates", async (req, res) => {
  try {
    // Try to get rates from database first
    let rates = await mongoDb.getCryptoRates();
    
    if (!rates) {
      // Fallback rates (in a real app, this would call CoinGecko API)
      rates = {
        btc_try: 2850000, // ~$42,000 * 67 TRY/USD
        btc_usd: 42000,
        btc_eur: 38500,
        usd_try: 67,
        eur_try: 73,
        lastUpdated: new Date(),
        source: 'fallback'
      };
      
      // Save fallback rates
      await mongoDb.updateCryptoRates(rates);
    }

    return res.json(rates);
  } catch (error) {
    console.error("Get crypto rates error:", error);
    return res.status(500).json({
      btc_try: 2850000,
      btc_usd: 42000,
      btc_eur: 38500,
      usd_try: 67,
      eur_try: 73,
      lastUpdated: new Date(),
      source: 'emergency_fallback'
    });
  }
});

// ===========================
// ADMIN ROUTES
// ===========================

// Get all pending transactions for admin
router.get("/admin/pending", requireAdmin, async (req: any, res) => {
  try {
    const pendingTransactions = await mongoDb.getPendingWalletTransactions();
    
    // Enrich with user data
    const enrichedTransactions = await Promise.all(
      pendingTransactions.map(async (transaction) => {
        const user = await mongoDb.getUserById(transaction.userId);
        return {
          ...transaction,
          userFullName: user?.fullName || 'Unknown User',
          userEmail: user?.email || 'Unknown Email'
        };
      })
    );

    return res.json({
      success: true,
      transactions: enrichedTransactions
    });
  } catch (error) {
    console.error("Get pending transactions error:", error);
    return res.status(500).json({
      success: false,
      error: "Bekleyen işlemler alınırken hata oluştu."
    });
  }
});

// Get all wallet transactions for admin
router.get("/admin/transactions", requireAdmin, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const result = await mongoDb.getAllWalletTransactions(limit, offset);
    
    // Enrich with user data
    const enrichedTransactions = await Promise.all(
      result.transactions.map(async (transaction: any) => {
        const user = await mongoDb.getUserById(transaction.userId);
        return {
          ...transaction,
          userFullName: user?.fullName || 'Unknown User',
          userEmail: user?.email || 'Unknown Email'
        };
      })
    );

    return res.json({
      success: true,
      transactions: enrichedTransactions,
      total: result.total
    });
  } catch (error) {
    console.error("Get admin transactions error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlemler alınırken hata oluştu."
    });
  }
});

// Process deposit (approve/reject)
router.put("/admin/deposits/:transactionId", requireAdmin, async (req: any, res) => {
  try {
    const { transactionId } = req.params;
    const { action, adminNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz işlem."
      });
    }

    const transaction = await mongoDb.processDepositRequest(
      transactionId,
      req.userId,
      action,
      adminNote
    );

    console.log(`💰 Deposit ${action}d by admin ${req.user.fullName}: ${(transaction as any).amount} ${(transaction as any).currency}`);

    return res.json({
      success: true,
      message: `Para yatırma talebi ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`,
      transaction
    });
  } catch (error) {
    console.error("Process deposit error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem gerçekleştirilirken hata oluştu."
    });
  }
});

// Process withdrawal (approve/reject)
router.put("/admin/withdrawals/:transactionId", requireAdmin, async (req: any, res) => {
  try {
    const { transactionId } = req.params;
    const { action, adminNote } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz işlem."
      });
    }

    const transaction = await mongoDb.processWithdrawalRequest(
      transactionId,
      req.userId,
      action,
      adminNote
    );

    console.log(`💸 Withdrawal ${action}d by admin ${req.user.fullName}: ${(transaction as any).amount} ${(transaction as any).currency}`);

    return res.json({
      success: true,
      message: `Para çekme talebi ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`,
      transaction
    });
  } catch (error) {
    console.error("Process withdrawal error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem gerçekleştirilirken hata oluştu."
    });
  }
});

// Complete withdrawal (mark as completed after actual transfer)
router.put("/admin/withdrawals/:transactionId/complete", requireAdmin, async (req: any, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await mongoDb.completeWithdrawal(transactionId, req.userId);

    console.log(`✅ Withdrawal completed by admin ${req.user.fullName}: ${(transaction as any).amount} ${(transaction as any).currency}`);

    return res.json({
      success: true,
      message: "Para çekme işlemi tamamlandı.",
      transaction
    });
  } catch (error) {
    console.error("Complete withdrawal error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem tamamlanırken hata oluştu."
    });
  }
});

// Update crypto rates
router.post("/admin/rates", requireAdmin, async (req: any, res) => {
  try {
    const { btc_try, btc_usd, btc_eur, usd_try, eur_try } = req.body;

    await mongoDb.updateCryptoRates({
      btc_try: parseFloat(btc_try),
      btc_usd: parseFloat(btc_usd),
      btc_eur: parseFloat(btc_eur),
      usd_try: parseFloat(usd_try),
      eur_try: parseFloat(eur_try)
    });

    console.log(`💱 Crypto rates updated by admin ${req.user.fullName}`);

    return res.json({
      success: true,
      message: "Kripto para kurları güncellendi."
    });
  } catch (error) {
    console.error("Update crypto rates error:", error);
    return res.status(500).json({
      success: false,
      error: "Kurlar güncellenirken hata oluştu."
    });
  }
});

// Get admin bank details
router.get("/admin/bank-details", requireAdmin, async (req: any, res) => {
  try {
    const bankDetails = await mongoDb.getAdminBankDetails();

    return res.json({
      success: true,
      bankDetails
    });
  } catch (error) {
    console.error("Get bank details error:", error);
    return res.status(500).json({
      success: false,
      error: "Banka bilgileri alınırken hata oluştu."
    });
  }
});

export default router;
