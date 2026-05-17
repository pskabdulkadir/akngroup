import express from 'express';
import { PointsCareerService } from '../lib/points-career-service';
import { mongoDb } from '../lib/mongo-database';

const router = express.Router();

// Get career levels configuration
router.get('/career-levels', async (req, res) => {
  try {
    const careerLevels = await mongoDb.getCareerLevels();
    
    res.json({
      success: true,
      careerLevels,
      totalLevels: careerLevels.length
    });
    
  } catch (error) {
    console.error('Error getting career levels:', error);
    res.status(500).json({
      error: 'Failed to get career levels',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's career status and progress
router.get('/career-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await mongoDb.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const careerLevels = await mongoDb.getCareerLevels();
    const careerProgress = PointsCareerService.getCareerProgress(user, careerLevels);
    const bonuses = PointsCareerService.calculateCareerBonuses(user, careerLevels);

    // Check for potential upgrade
    const upgradeCheck = PointsCareerService.checkCareerLevelUpgrade(user, careerLevels);

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        memberId: user.memberId
      },
      pointsSystem: user.pointsSystem,
      careerProgress,
      bonuses,
      upgradeAvailable: upgradeCheck.shouldUpgrade,
      newLevelAvailable: upgradeCheck.newLevel,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting career status:', error);
    res.status(500).json({
      error: 'Failed to get career status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Award points for a sale
router.post('/award-sale-points', async (req, res) => {
  try {
    const { buyerUserId, saleAmount, saleType = 'product' } = req.body;
    
    if (!buyerUserId || !saleAmount) {
      return res.status(400).json({
        error: 'Buyer ID and sale amount are required'
      });
    }

    const allUsers = await mongoDb.getAllUsers();
    
    // Award points
    const result = await PointsCareerService.awardSalePoints(
      buyerUserId,
      saleAmount,
      saleType,
      allUsers
    );

    // Update users in database
    for (const user of result.updatedUsers) {
      await mongoDb.updateUser(user.id, user);
    }

    // Log point transactions
    console.log('💰 Points awarded for sale:', {
      buyerUserId,
      saleAmount,
      saleType,
      transactionsCount: result.transactions.length,
      totalPointsAwarded: result.transactions.reduce((sum, t) => sum + t.points, 0)
    });

    res.json({
      success: true,
      transactions: result.transactions,
      totalPointsAwarded: result.transactions.reduce((sum, t) => sum + t.points, 0),
      affectedUsers: result.transactions.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error awarding sale points:', error);
    res.status(500).json({
      error: 'Failed to award sale points',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Award points for registration
router.post('/award-registration-points', async (req, res) => {
  try {
    const { sponsorUserId, newUserId } = req.body;
    
    if (!sponsorUserId || !newUserId) {
      return res.status(400).json({
        error: 'Sponsor ID and new user ID are required'
      });
    }

    const allUsers = await mongoDb.getAllUsers();
    
    // Award registration points
    const result = await PointsCareerService.awardRegistrationPoints(
      sponsorUserId,
      newUserId,
      allUsers
    );

    // Update users in database
    for (const user of result.updatedUsers) {
      await mongoDb.updateUser(user.id, user);
    }

    console.log('👥 Registration points awarded:', {
      sponsorUserId,
      newUserId,
      pointsAwarded: result.transactions[0]?.points || 0
    });

    res.json({
      success: true,
      transactions: result.transactions,
      pointsAwarded: result.transactions[0]?.points || 0,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error awarding registration points:', error);
    res.status(500).json({
      error: 'Failed to award registration points',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check and process career upgrades
router.post('/check-career-upgrade/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await mongoDb.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const careerLevels = await mongoDb.getCareerLevels();
    const upgradeCheck = PointsCareerService.checkCareerLevelUpgrade(user, careerLevels);

    if (upgradeCheck.shouldUpgrade && upgradeCheck.newLevel) {
      // Update user's career level
      const updatedUser = {
        ...user,
        careerLevel: {
          name: upgradeCheck.newLevel.name,
          commissionRate: upgradeCheck.newLevel.benefits.directSalesCommission
        }
      };

      await mongoDb.updateUser(userId, updatedUser);

      // Calculate rank bonus for upgrade
      const rankBonus = upgradeCheck.newLevel.benefits.rankBonus;
      if (rankBonus > 0) {
        updatedUser.wallet.balance += rankBonus;
        updatedUser.wallet.totalEarnings += rankBonus;
        updatedUser.wallet.leadershipBonus += rankBonus;
        await mongoDb.updateUser(userId, updatedUser);
      }

      console.log('🚀 Career upgrade processed:', {
        userId,
        oldLevel: upgradeCheck.oldLevel.name,
        newLevel: upgradeCheck.newLevel.name,
        rankBonus
      });

      res.json({
        success: true,
        upgraded: true,
        oldLevel: upgradeCheck.oldLevel,
        newLevel: upgradeCheck.newLevel,
        rankBonus,
        message: `Tebrikler! ${upgradeCheck.newLevel.displayName} seviyesine terfi ettiniz!`,
        timestamp: new Date()
      });
    } else {
      res.json({
        success: true,
        upgraded: false,
        currentLevel: upgradeCheck.oldLevel,
        message: 'Henüz yeni seviye için gerekli şartları karşılamıyorsunuz.',
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error('Error checking career upgrade:', error);
    res.status(500).json({
      error: 'Failed to check career upgrade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin: Get point transactions
router.get('/admin/transactions', async (req, res) => {
  try {
    const transactions = await mongoDb.getPendingWalletTransactions();
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Admin: Save career level
router.post('/admin/career-levels', async (req, res) => {
  try {
    const levelData = req.body;
    const savedLevel = await mongoDb.saveCareerLevel(levelData);
    res.json({ success: true, level: savedLevel });
  } catch (error) {
    console.error('Error saving career level:', error);
    res.status(500).json({ error: 'Failed to save career level' });
  }
});

// Admin: Update career level configuration
router.put('/admin/career-levels/:levelId', async (req, res) => {
  try {
    const { levelId } = req.params;
    const updatedLevel = { ...req.body, id: levelId };
    
    const savedLevel = await mongoDb.saveCareerLevel(updatedLevel);

    res.json({
      success: true,
      message: `Kariyer seviyesi ${levelId} başarıyla güncellendi`,
      level: savedLevel,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error updating career level:', error);
    res.status(500).json({
      error: 'Failed to update career level',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin: Delete career level
router.delete('/admin/career-levels/:levelId', async (req, res) => {
  try {
    const { levelId } = req.params;
    await mongoDb.deleteCareerLevel(levelId);
    res.json({ success: true, message: 'Career level deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete career level' });
  }
});

// Admin: Get points leaderboard
router.get('/admin/leaderboard', async (req, res) => {
  try {
    const allUsers = await mongoDb.getAllUsers();

    // Sort users by total points
    const leaderboard = allUsers
      .filter(user => user.pointsSystem)
      .map(user => ({
        id: user.id,
        memberId: user.memberId,
        fullName: user.fullName,
        careerLevel: user.careerLevel?.name || 'Emmare',
        personalPoints: user.pointsSystem?.personalSalesPoints || 0,
        teamPoints: user.pointsSystem?.teamSalesPoints || 0,
        totalPoints: (user.pointsSystem?.personalSalesPoints || 0) + (user.pointsSystem?.teamSalesPoints || 0),
        registrationPoints: user.pointsSystem?.registrationPoints || 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      success: true,
      leaderboard,
      totalUsers: leaderboard.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Calculate and distribute monthly bonuses (Admin only)
router.post('/calculate-bonuses', async (req, res) => {
  try {
    console.log('🔄 Starting career bonus calculation...');

    const allUsers = await mongoDb.getAllUsers();
    const careerLevels = await mongoDb.getCareerLevels();

    console.log(`📊 Processing ${allUsers.length} users with ${careerLevels.length} career levels`);

    let totalBonusesDistributed = 0;
    let usersWithBonuses = 0;
    let processedUsers = 0;

    // Calculate bonuses for each user
    for (const user of allUsers) {
      try {
        processedUsers++;

        // Ensure user has wallet structure
        if (!user.wallet) {
          user.wallet = {
            balance: 0,
            totalEarnings: 0,
            sponsorBonus: 0,
            careerBonus: 0,
            passiveIncome: 0,
            leadershipBonus: 0
          };
        }

        const bonuses = PointsCareerService.calculateCareerBonuses(user, careerLevels);

        if (bonuses.totalBonus > 0) {
          const updatedUser = {
            ...user,
            wallet: {
              ...user.wallet,
              balance: (user.wallet.balance || 0) + bonuses.totalBonus,
              totalEarnings: (user.wallet.totalEarnings || 0) + bonuses.totalBonus,
              leadershipBonus: (user.wallet.leadershipBonus || 0) + bonuses.totalBonus
            }
          };

          await mongoDb.updateUser(user.id, updatedUser);
          totalBonusesDistributed += bonuses.totalBonus;
          usersWithBonuses++;

          console.log(`💰 Bonus awarded to ${user.fullName}: $${bonuses.totalBonus}`);
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.id}:`, userError);
        // Continue processing other users
      }
    }

    console.log('💎 Monthly bonuses calculated and distributed:', {
      totalBonusesDistributed,
      usersWithBonuses,
      processedUsers,
      timestamp: new Date()
    });

    res.json({
      success: true,
      totalBonusesDistributed,
      usersWithBonuses,
      processedUsers,
      averageBonus: usersWithBonuses > 0 ? totalBonusesDistributed / usersWithBonuses : 0,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error calculating bonuses:', error);
    res.status(500).json({
      error: 'Failed to calculate bonuses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset monthly points (Admin only - to be called at month start)
router.post('/reset-monthly-points', async (req, res) => {
  try {
    const allUsers = await mongoDb.getAllUsers();
    
    const updatedUsers = PointsCareerService.resetMonthlyPoints(allUsers);
    
    // Update all users in database
    for (const user of updatedUsers) {
      await mongoDb.updateUser(user.id, user);
    }

    console.log('🔄 Monthly points reset for all users:', {
      totalUsers: updatedUsers.length,
      timestamp: new Date()
    });

    res.json({
      success: true,
      totalUsers: updatedUsers.length,
      message: 'Tüm kullanıcıların aylık puanları sıfırlandı.',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error resetting monthly points:', error);
    res.status(500).json({
      error: 'Failed to reset monthly points',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get points leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'total', limit = 50 } = req.query;
    
    const allUsers = await mongoDb.getAllUsers();

    // Sort users based on requested point type
    let sortedUsers = [...allUsers];
    
    switch (type) {
      case 'personal':
        sortedUsers.sort((a, b) => (b.pointsSystem?.personalSalesPoints || 0) - (a.pointsSystem?.personalSalesPoints || 0));
        break;
      case 'team':
        sortedUsers.sort((a, b) => (b.pointsSystem?.teamSalesPoints || 0) - (a.pointsSystem?.teamSalesPoints || 0));
        break;
      case 'monthly':
        sortedUsers.sort((a, b) => (b.pointsSystem?.monthlyPoints || 0) - (a.pointsSystem?.monthlyPoints || 0));
        break;
      default: {
        const getTotal = (u: any) => (u.pointsSystem?.personalSalesPoints || 0) + (u.pointsSystem?.teamSalesPoints || 0);
        sortedUsers.sort((a, b) => getTotal(b) - getTotal(a));
      }
    }

    const leaderboard = sortedUsers.slice(0, parseInt(limit as string)).map((user, index) => ({
      rank: index + 1,
      id: user.id,
      fullName: user.fullName,
      memberId: user.memberId,
      careerLevel: user.careerLevel,
      pointsSystem: user.pointsSystem,
      totalEarnings: user.wallet?.totalEarnings || 0
    }));

    res.json({
      success: true,
      leaderboard,
      type,
      totalUsers: allUsers.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
