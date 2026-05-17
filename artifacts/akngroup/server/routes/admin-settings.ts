import { Router } from 'express';
import mongoose from 'mongoose';
import { MonolineSettings, CommissionAudit, User } from '../lib/models';
import { mongoDb } from '../lib/mongo-database';
import { verifyAccessToken } from '../lib/utils';

const router = Router();

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- MONOLINE SETTINGS ---

// Get all monoline settings
router.get('/monoline', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const settings = await MonolineSettings.findOne().session(session);

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Settings not found'
      });
    }

    res.json({
      success: true,
      settings: {
        id: settings._id,
        isEnabled: settings.isEnabled,
        productPrice: settings.productPrice,
        directSponsorBonus: settings.directSponsorBonus,
        depthCommissions: settings.depthCommissions,
        passiveIncomePool: settings.passiveIncomePool,
        companyFund: settings.companyFund,
        membershipRequirements: settings.membershipRequirements,
        activityRequirements: settings.activityRequirements,
        levelRequirements: settings.levelRequirements,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy
      }
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// Update monoline settings
router.put('/monoline', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { updates } = req.body;

    if (!updates) {
      return res.status(400).json({
        success: false,
        error: 'Updates are required'
      });
    }

    // Perform update
    const updated = await MonolineSettings.findOneAndUpdate(
      {},
      {
        ...updates,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'admin'
      },
      { new: true, upsert: false, session }
    );

    // Audit log
    await CommissionAudit.create([{
      userId: req.user?.id || 'admin',
      action: 'DISTRIBUTED',
      amount: 0,
      reason: 'Monoline settings updated',
      performedBy: req.user?.id || 'admin',
      timestamp: new Date(),
      metadata: {
        settingsUpdated: Object.keys(updates),
        changes: updates
      }
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// --- SOCIAL MEDIA SETTINGS ---

// Get social media links
router.get('/social-media', requireAdmin, async (req, res) => {
  try {
    const links = await mongoDb.getSocialMediaLinks();
    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sosyal medya linkleri alınamadı' });
  }
});

// Save social media links
router.post('/social-media', requireAdmin, async (req, res) => {
  try {
    const links = req.body;
    await mongoDb.saveSocialMediaLinks(links);
    res.json({ success: true, message: 'Sosyal medya linkleri kaydedildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sosyal medya linkleri kaydedilemedi' });
  }
});

// --- PROMOTIONS & GIFTS ---

router.get('/promotions', requireAdmin, async (req, res) => {
  try {
    const promotions = await mongoDb.getPromotionSettings();
    res.json({ success: true, promotions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Promosyonlar alınamadı' });
  }
});

router.post('/promotions', requireAdmin, async (req, res) => {
  try {
    const { promotions } = req.body;
    await mongoDb.savePromotions(promotions);
    res.json({ success: true, message: 'Promosyonlar kaydedildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Promosyonlar kaydedilemedi' });
  }
});

router.get('/gifts', requireAdmin, async (req, res) => {
  try {
    const settings = await mongoDb.getGiftSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hediye ayarları alınamadı' });
  }
});

router.post('/gifts', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    await mongoDb.saveGiftSettings(settings);
    res.json({ success: true, message: 'Hediye ayarları kaydedildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hediye ayarları kaydedilemedi' });
  }
});

// Reset settings to defaults
router.post('/reset-to-defaults', requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const defaultSettings = {
      isEnabled: true,
      productPrice: 20,
      directSponsorBonus: { percentage: 15, amount: 3 },
      depthCommissions: {
        level1: { percentage: 12.5, amount: 2.5 },
        level2: { percentage: 7.5, amount: 1.5 },
        level3: { percentage: 5.0, amount: 1.0 },
        level4: { percentage: 3.5, amount: 0.7 },
        level5: { percentage: 2.5, amount: 0.5 },
        level6: { percentage: 2.0, amount: 0.4 },
        level7: { percentage: 1.5, amount: 0.3 }
      },
      passiveIncomePool: { percentage: 0.5, amount: 0.1, distribution: 'equal' },
      companyFund: { percentage: 45, amount: 9 },
      membershipRequirements: {
        initialPurchase: { minimumAmount: 100, minimumUnits: 5 },
        monthlyActivity: { minimumAmount: 20, minimumUnits: 1 },
        annualActivity: { minimumAmount: 200, minimumUnits: 10 }
      },
      activityRequirements: {
        monthly: { amount: 20, units: 1 },
        annual: { amount: 200, units: 10 },
        initial: { amount: 100, units: 5 }
      }
    };

    const updated = await MonolineSettings.findOneAndUpdate(
      {},
      {
        ...defaultSettings,
        updatedAt: new Date(),
        updatedBy: req.user?.id || 'admin'
      },
      { new: true, upsert: false, session }
    );

    // Audit
    await CommissionAudit.create([{
      userId: req.user?.id || 'admin',
      action: 'DISTRIBUTED',
      amount: 0,
      reason: 'Monoline settings reset to defaults',
      performedBy: req.user?.id || 'admin',
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      settings: updated
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    session.endSession();
  }
});

// Get settings history (audit trail)
router.get('/history', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = ((parseInt(page as string) || 1) - 1) * parseInt(limit as string);

    const history = await CommissionAudit.find({
      reason: /Monoline settings/
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await CommissionAudit.countDocuments({
      reason: /Monoline settings/
    });

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
