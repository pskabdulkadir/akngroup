import express, { Router } from 'express';
import mongoose from 'mongoose';
import { MonolineCommissionService } from '../lib/monoline-commission-service';
import { MonolineSettings, PassiveIncomePool, CompanyFund, User, CommissionAudit, WalletTransaction } from '../lib/models';
import { applyWalletTransactions } from '../lib/wallet-transaction.service';

const router = Router();

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    // In production, verify token and check admin role
    req.user = { role: 'admin' }; // Simplified for now
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════════════════════
// SETTINGS ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Get monoline settings (Admin)
router.get('/admin/settings', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let settings = await MonolineSettings.findOne().session(session);

    if (!settings) {
      const defaultStructure = MonolineCommissionService.getDefaultCommissionStructure();
      settings = await MonolineSettings.create([{
        isEnabled: true,
        productPrice: defaultStructure.productPrice,
        commissionStructure: defaultStructure,
        membershipRequirements: {},
        passiveIncomeSettings: {},
        activityRequirements: {},
        levelRequirements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }], { session });
    }

    await session.commitTransaction();

    res.json({
      success: true,
      settings: {
        isEnabled: settings.isEnabled,
        productPrice: settings.productPrice,
        directSponsorBonus: settings.directSponsorBonus,
        depthCommissions: settings.depthCommissions,
        passiveIncomePool: settings.passiveIncomePool,
        companyFund: settings.companyFund,
        membershipRequirements: settings.membershipRequirements,
        activityRequirements: settings.activityRequirements,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error getting monoline settings:', error);
    res.status(500).json({
      error: 'Failed to get monoline settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// Admin: Distribute passive income to all active members
router.post('/admin/distribute-passive-income', requireAdmin, async (req, res) => {
  try {
    const result = await MonolineCommissionService.distributePassivePool();
    
    if (result.success) {
      res.json({
        success: true,
        distribution: {
          totalDistributed: result.distributedAmount,
          recipients: result.recipientsCount,
          sharePerMember: result.sharePerMember
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Havuzda dağıtılacak tutar bulunamadı veya aktif üye yok.'
      });
    }
  } catch (error) {
    console.error('Error distributing passive income:', error);
    res.status(500).json({
      success: false,
      error: 'Pasif dağıtım hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

// Update monoline settings (Admin)
router.put('/admin/settings', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: 'Settings are required' });
    }

    const updated = await MonolineSettings.findOneAndUpdate(
      {},
      {
        ...settings,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'system'
      },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();

    console.log('💎 Monoline settings updated');

    res.json({
      success: true,
      settings: updated,
      message: 'Monoline settings updated successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating monoline settings:', error);
    res.status(500).json({
      error: 'Failed to update monoline settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// ═══════════════════════════════════════════════════════════
// SALE & COMMISSION ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Process product sale and calculate commissions
router.post('/sale', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buyerId, productPrice, productId } = req.body;

    if (!buyerId || !productPrice) {
      return res.status(400).json({
        error: 'Buyer ID and product price are required'
      });
    }

    // Get settings
    const settings = await MonolineSettings.findOne().session(session);

    // Calculate commissions (using Mongoose session)
    const commissionStructure = settings?.commissionStructure || MonolineCommissionService.getDefaultCommissionStructure();
    const calc = await MonolineCommissionService.calculateMonolineCommissions(
      buyerId,
      productPrice,
      undefined, // Let it fetch from DB
      commissionStructure,
      session
    );

    // Create transactions (Mongoose)
    const transactions = calc.transactions.map(t => ({
      userId: t.userId,
      amount: t.amount,
      type: 'CAREER',
      reference: t.reference,
      description: t.description
    }));

    if (transactions.length > 0) {
      await applyWalletTransactions(transactions);
    }

    // Update passive pool
    if (calc.passivePoolAmount > 0) {
      await PassiveIncomePool.updateOne(
        {},
        {
          $inc: { totalAmount: calc.passivePoolAmount },
          lastUpdated: new Date()
        },
        { upsert: true, session }
      );
    }

    // Update company fund
    if (calc.companyFundAmount > 0) {
      await CompanyFund.updateOne(
        {},
        {
          $inc: { totalAmount: calc.companyFundAmount },
          $push: {
            transactions: {
              sourceUserId: buyerId,
              amount: calc.companyFundAmount,
              reference: `SALE-${Date.now()}`,
              createdAt: new Date()
            }
          },
          lastUpdated: new Date()
        },
        { upsert: true, session }
      );
    }

    // Audit log
    await CommissionAudit.create([{
      userId: buyerId,
      action: 'DISTRIBUTED',
      amount: calc.totalDistributed,
      reason: `Sale commission - Product ${productId || 'N/A'}`,
      performedBy: 'system',
      transactionRef: `SALE-${Date.now()}`,
      timestamp: new Date(),
      metadata: { calc }
    }], { session });

    await session.commitTransaction();

    console.log('💰 Monoline sale processed:', {
      buyerId,
      productPrice,
      distributed: calc.totalDistributed
    });

    res.json({
      success: true,
      sale: { buyerId, productPrice },
      commissions: {
        totalDistributed: calc.totalDistributed,
        transactionCount: transactions.length,
        passivePoolAmount: calc.passivePoolAmount,
        companyFundAmount: calc.companyFundAmount
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing monoline sale:', error);
    res.status(500).json({
      error: 'Failed to process sale',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// ═══════════════════════════════════════════════════════════
// PASSIVE DISTRIBUTION ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Distribute passive income pool (Admin)
router.post('/admin/distribute-passive-income', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { method = 'equal' } = req.body;

    // Get pool
    const pool = await PassiveIncomePool.findOne().session(session);
    if (!pool || pool.totalAmount <= 0) {
      return res.status(400).json({ error: 'Passive income pool is empty' });
    }

    // Get active users
    const activeUsers = await User.find({
      isActive: true,
      membershipType: { $nin: ['free', 'NONE'] }
    }).session(session);

    if (activeUsers.length === 0) {
      return res.status(400).json({ error: 'No active users for distribution' });
    }

    // Calculate distribution
    const distribution = await MonolineCommissionService.calculatePassiveIncomeDistribution(
      pool.totalAmount,
      activeUsers as any,
      method as any,
      session
    );

    // Create transactions
    const transactions = distribution.recipients
      .filter(r => r.amount > 0)
      .map(r => ({
        userId: r.userId,
        amount: r.amount,
        type: 'PASSIVE',
        reference: `PASSIVE-${Date.now()}-${r.userId}`,
        description: `Passive income distribution (${method})`
      }));

    if (transactions.length > 0) {
      await applyWalletTransactions(transactions);
    }

    // Deduct from pool
    await PassiveIncomePool.updateOne(
      {},
      {
        totalAmount: 0,
        lastDistributedAt: new Date(),
        $push: {
          distributionHistory: {
            distributedAt: new Date(),
            amount: pool.totalAmount,
            recipients: activeUsers.length,
            method
          }
        }
      },
      { session }
    );

    // Audit
    await CommissionAudit.create([{
      userId: 'system',
      action: 'DISTRIBUTED',
      amount: pool.totalAmount,
      reason: `Passive distribution to ${activeUsers.length} members (${method})`,
      performedBy: req.user?.id || 'admin',
      timestamp: new Date(),
      metadata: { method, recipientCount: activeUsers.length }
    }], { session });

    await session.commitTransaction();

    console.log(`✅ Distributed $${pool.totalAmount} to ${activeUsers.length} users (${method})`);

    res.json({
      success: true,
      distribution: {
        totalDistributed: pool.totalAmount,
        recipients: activeUsers.length,
        method,
        amountPerMember: pool.totalAmount / activeUsers.length
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error distributing passive income:', error);
    res.status(500).json({
      error: 'Failed to distribute passive income',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// ═══════════════════════════════════════════════════════════
// STATS & REPORTS ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Get monoline network statistics
router.get('/stats', async (req, res) => {
  try {
    let stats;
    let pool;
    let fund;

    try {
      // Mongoose'dan verileri çekmeyi dene
      stats = await MonolineCommissionService.getMonolineNetworkStats();
      pool = await PassiveIncomePool.findOne();
      fund = await CompanyFund.findOne();
    } catch (mongoError) {
      // Mongoose bağlı değilse, fallback kullan
      console.warn('⚠️ Mongoose istatistikleri alınamadı, fallback kullanılıyor:', (mongoError as any)?.message);
      stats = {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        activePercentage: '0',
        totalSales: 0,
        totalTeamSize: 0,
        averageSalesPerMember: 0
      };
      pool = null;
      fund = null;
    }

    res.json({
      success: true,
      network: stats,
      funds: {
        passiveIncomePool: pool?.totalAmount || 0,
        companyFund: fund?.totalAmount || 0
      }
    });
  } catch (error) {
    console.error('📊 Monoline istatistikleri alınırken hata:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler alınamadı',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

// Get user's monoline commissions
router.get('/user/:userId/commissions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);

    const commissions = await WalletTransaction.find({
      userId,
      type: 'CAREER',
      status: 'PAID'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await WalletTransaction.countDocuments({
      userId,
      type: 'CAREER'
    });

    const totalAmount = commissions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      success: true,
      data: commissions,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      },
      summary: {
        totalCommissions: commissions.length,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error getting user commissions:', error);
    res.status(500).json({
      error: 'Failed to get user commissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin: Test commission calculation
router.post('/admin/test-commission', requireAdmin, async (req, res) => {
  try {
    const { buyerId, productPrice } = req.body;

    if (!buyerId || !productPrice) {
      return res.status(400).json({ error: 'buyerId and productPrice required' });
    }

    const result = await MonolineCommissionService.simulateSalesTransaction(buyerId, productPrice);

    res.json({
      success: true,
      simulation: result
    });
  } catch (error) {
    console.error('Error in test commission:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
