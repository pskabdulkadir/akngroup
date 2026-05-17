import { User } from '../../shared/mlm-types';
import {
  calculateSponsorBonus,
  CareerLevel,
} from '../../shared/mlmRules';
import { mongoDb } from './mongo-database';
import PointsCareerService from './points-career-service';

export class MLMAutomationService {
  /**
   * Automatically update user career levels based on current metrics
   */
  static async updateUserCareerLevels(users: User[]): Promise<User[]> {
    const updatedUsers: User[] = [];
    const careerLevels = await mongoDb.getCareerLevels();

    for (const user of users) {
      if (!user.isActive) continue;
      
      const upgradeCheck = PointsCareerService.checkCareerLevelUpgrade(user, careerLevels);
      
      if (upgradeCheck.shouldUpgrade && upgradeCheck.newLevel) {
        // Career level changed - update and log
        user.careerLevel = upgradeCheck.newLevel as any;
        updatedUsers.push(user);
      }
    }
    
    return updatedUsers;
  }

  /**
   * Calculate and distribute passive income based on dynamic career level rates
   */
  static async distributePassiveIncome(users: User[]): Promise<{
    distributions: Array<{ userId: string; amount: number; reason: string }>;
    totalDistributed: number;
  }> {
    const careerLevels = await mongoDb.getCareerLevels();
    const distributions: Array<{ userId: string; amount: number; reason: string }> = [];
    let totalDistributed = 0;

    // Filter users who might be eligible for passive income (career > entry)
    const eligibleSponsors = users.filter(u => u.isActive && (u.careerLevel as any)?.level > 1);

    for (const sponsor of eligibleSponsors) {
      const sponsorLevelName = (sponsor.careerLevel as any)?.name;
      const levelData = careerLevels.find(l => l.name.toLowerCase() === sponsorLevelName?.toLowerCase());
      
      if (!levelData || !levelData.passiveIncomeRate || levelData.passiveIncomeRate <= 0) continue;

      // Group users by sponsor to calculate passive income from direct downline
      const downlineUsers = users.filter(u => u.sponsorId === sponsor.id);
      
      // Sum total investment of downline
      const totalDownlineInvestment = downlineUsers.reduce((sum, u) => sum + (u.totalInvestment || 0), 0);
      
      if (totalDownlineInvestment > 0) {
        const passiveAmount = totalDownlineInvestment * (levelData.passiveIncomeRate / 100);

        if (passiveAmount > 0) {
          distributions.push({
            userId: sponsor.id,
            amount: passiveAmount,
            reason: `Passive income: ${sponsorLevelName} (%${levelData.passiveIncomeRate}) - ${downlineUsers.length} direkt üye`
          });
          totalDistributed += passiveAmount;
        }
      }
    }

    return { distributions, totalDistributed };
  }

  /**
   * Check and enforce activity requirements
   */
  static async enforceActivityRequirements(users: User[]): Promise<{
    deactivatedUsers: string[];
    warningUsers: string[];
  }> {
    const deactivatedUsers: string[] = [];
    const warningUsers: string[] = [];
    const now = new Date();

    for (const user of users) {
      // Activity is checked via monthlySalesVolume in some parts, or manual expiry dates
      // If membershipEndDate exists, use it
      if (user.isActive && user.membershipEndDate) {
        const membershipEnd = new Date(user.membershipEndDate);
        const daysUntilExpiry = Math.floor((membershipEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          deactivatedUsers.push(user.id);
        } else if (daysUntilExpiry <= 7) {
          warningUsers.push(user.id);
        }
      }
    }

    return { deactivatedUsers, warningUsers };
  }

  /**
   * Run complete MLM automation cycle using MongoDB
   */
  static async runAutomationCycle(): Promise<{
    success: boolean;
    careerUpdates: number;
    passiveDistributions: number;
    activityEnforcements: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let careerUpdates = 0;
    let passiveDistributions = 0;
    let activityEnforcements = 0;

    try {
      const users = await mongoDb.getAllUsers() as User[];

      // 1. Update career levels
      const updatedCareerUsers = await this.updateUserCareerLevels(users);
      for (const u of updatedCareerUsers) {
        try {
          await mongoDb.updateUser(u.id, { careerLevel: u.careerLevel });
          console.log(`🚀 Automation: Career Upgrade for ${u.fullName} -> ${(u.careerLevel as any).name}`);
          careerUpdates++;
        } catch (err) {
          errors.push(`Career update error for ${u.id}: ${err}`);
        }
      }

      // 2. Enforce activity requirements
      const activityCheck = await this.enforceActivityRequirements(users);
      for (const userId of activityCheck.deactivatedUsers) {
        try {
          await mongoDb.updateUser(userId, { isActive: false, monthlyActivityStatus: 'inactive' });
          activityEnforcements++;
        } catch (err) {
          errors.push(`Deactivation error for ${userId}: ${err}`);
        }
      }

      // 3. Distribute passive income
      const passiveIncome = await this.distributePassiveIncome(users);
      for (const dist of passiveIncome.distributions) {
        try {
          // Use wallet transaction service for persistence and visibility
          const { applyWalletTransactions } = await import('./wallet-transaction.service');
          await applyWalletTransactions([{
            userId: dist.userId,
            amount: dist.amount,
            type: 'PASSIVE',
            reference: `PASSIVE-${new Date().toISOString().slice(0, 10)}-${dist.userId}`,
            description: dist.reason
          }]);
          passiveDistributions++;
        } catch (err) {
          errors.push(`Passive income error for ${dist.userId}: ${err}`);
        }
      }

      return {
        success: true,
        careerUpdates,
        passiveDistributions,
        activityEnforcements,
        errors
      };
    } catch (error) {
      console.error("MLM Automation Cycle Error:", error);
      errors.push((error as any).message || 'Unknown error');
      return {
        success: false,
        careerUpdates: 0,
        passiveDistributions: 0,
        activityEnforcements: 0,
        errors
      };
    }
  }
}
