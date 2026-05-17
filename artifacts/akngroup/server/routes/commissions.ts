import express from 'express';
import CommissionService from '../lib/commission-service';
import { MLMDatabase } from '../lib/mlm-database';

const router = express.Router();

// Real-time commission calculation for package purchase
router.post('/calculate-package-commissions', async (req, res) => {
  try {
    const { userId, packageId } = req.body;
    
    if (!userId || !packageId) {
      return res.status(400).json({ 
        error: 'User ID and Package ID are required' 
      });
    }

    // Get database instance
    const db = MLMDatabase.getInstance();
    
    // Get all users and the specific package
    const allUsers = await db.getAllUsers();
    const purchasingUser = allUsers.find(u => u.id === userId);
    
    if (!purchasingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // For demo purposes, create a sample package if not found
    const membershipPackage = {
      id: packageId,
      name: 'Selected Package',
      price: 100,
      currency: 'USD' as const,
      description: 'Membership package',
      features: ['Feature 1', 'Feature 2'],
      bonusPercentage: 10,
      commissionRate: 5,
      isActive: true,
      duration: 1,
      durationDays: 30,
      type: 'basic',
      createdAt: new Date(),
      updatedAt: new Date(),
      displayOrder: 1
    };

    // Calculate commissions in real-time
    const commissions = await CommissionService.calculatePackagePurchaseCommissions(
      purchasingUser,
      membershipPackage,
      allUsers
    );

    // Apply commissions to all affected users
    let updatedUsers = allUsers;
    for (const commission of commissions) {
      await CommissionService.applyCommissionsToWallet([
        commission,
      ], []);
    }

    // Update users in database
    for (const user of updatedUsers) {
      await db.updateUser(user.id, user);
    }

    // Log commission calculations
    const commissionLog = {
      id: Date.now().toString(),
      userId,
      packageId,
      commissions,
      totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      timestamp: new Date(),
      status: 'processed'
    };

    console.log('💰 Real-time commission calculated:', commissionLog);

    res.json({
      success: true,
      commissions,
      totalCommissionsCalculated: commissions.length,
      totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Commission calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate commissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time team placement bonus calculation
router.post('/calculate-placement-bonuses', async (req, res) => {
  try {
    const { sponsorId, newUserId, position } = req.body;
    
    if (!sponsorId || !newUserId || !position) {
      return res.status(400).json({ 
        error: 'Sponsor ID, new user ID, and position are required' 
      });
    }

    const db = MLMDatabase.getInstance();
    const allUsers = await db.getAllUsers();
    
    const sponsorUser = allUsers.find(u => u.id === sponsorId);
    const newUser = allUsers.find(u => u.id === newUserId);
    
    if (!sponsorUser || !newUser) {
      return res.status(404).json({ 
        error: 'Sponsor or new user not found' 
      });
    }

    // Calculate placement bonuses in real-time
    const bonuses = await CommissionService.calculateTeamPlacementBonuses(
      sponsorUser,
      newUser,
      position,
      allUsers
    );

    // Apply bonuses to affected users
    let updatedUsers = allUsers;
    for (const bonus of bonuses) {
      await CommissionService.applyCommissionsToWallet([], [bonus]);
    }

    // Update users in database
    for (const user of updatedUsers) {
      await db.updateUser(user.id, user);
    }

    // Update team structure
    const updatedSponsor = updatedUsers.find(u => u.id === sponsorId);
    if (updatedSponsor) {
      if (position === 'left') {
        updatedSponsor.leftChild = newUserId;
      } else if (position === 'right') {
        updatedSponsor.rightChild = newUserId;
      }
      await db.updateUser(sponsorId, updatedSponsor);
    }

    // Update new user's sponsor info
    const updatedNewUser = updatedUsers.find(u => u.id === newUserId);
    if (updatedNewUser) {
      updatedNewUser.sponsorId = sponsorId;
      await db.updateUser(newUserId, updatedNewUser);
    }

    // Update pending placement status
    try {
      const placements = await db.getPendingPlacements(sponsorId);
      const placement = placements.find((p: any) => p.newUserId === newUserId);
      if (placement) {
        await db.updatePlacementStatus(placement.id, 'placed');
      }
    } catch (e) {
      console.error("Error updating placement status:", e);
    }

    console.log('👥 Real-time placement bonus calculated:', bonuses);

    res.json({
      success: true,
      bonuses,
      totalBonusesCalculated: bonuses.length,
      totalAmount: bonuses.reduce((sum, b) => sum + b.amount, 0),
      placementPosition: position,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Placement bonus calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate placement bonuses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate monthly performance bonuses
router.post('/calculate-monthly-bonuses', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    const db = MLMDatabase.getInstance();
    const allUsers = await db.getAllUsers();
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Calculate monthly performance bonuses
    const bonuses = await CommissionService.calculateMonthlyPerformanceBonuses(user, allUsers);

    // Apply bonuses to user wallet (CommissionService returns boolean)
    await CommissionService.applyCommissionsToWallet([], bonuses);

    // Refresh user from DB (applyWalletTransactions may have updated balances)
    const refreshedUser = await db.getUserById(userId);
    if (refreshedUser) {
      await db.updateUser(userId, refreshedUser);
    }

    console.log('📈 Monthly performance bonus calculated:', bonuses);

    res.json({
      success: true,
      bonuses,
      totalAmount: bonuses.reduce((sum, b) => sum + b.amount, 0),
      calculationDate: new Date()
    });

  } catch (error) {
    console.error('Monthly bonus calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate monthly bonuses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user commission history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const db = MLMDatabase.getInstance();
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // For demo purposes, generate sample commission history
    const commissionHistory = Array.from({ length: parseInt(limit as string) }, (_, index) => ({
      id: `comm_${Date.now()}_${index}`,
      type: ['sponsor', 'career', 'leadership', 'passive'][index % 4],
      amount: Math.random() * 50 + 10,
      percentage: [10, 5, 3, 15][index % 4],
      sourceUser: `User ${index + 1}`,
      timestamp: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
      status: 'completed'
    }));

    res.json({
      success: true,
      commissions: commissionHistory,
      totalCommissions: user.wallet.totalEarnings,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: commissionHistory.length
      }
    });

  } catch (error) {
    console.error('Commission history error:', error);
    res.status(500).json({ 
      error: 'Failed to get commission history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
