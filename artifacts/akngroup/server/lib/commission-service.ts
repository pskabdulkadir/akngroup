import mongoose from 'mongoose';
import { User, MembershipPackage } from '../../shared/mlm-types';
import {
  calculateSponsorBonus,
  getCareerLevel,
  calculatePassiveIncome,
  careerLevels,
  calculateActiveFee,
  distributeIncome,
  CareerLevel
} from '../../shared/mlmRules';

export interface CommissionCalculation {
  userId: string;
  type: 'sponsor' | 'career' | 'leadership' | 'passive';
  amount: number;
  percentage: number;
  sourceUserId?: string;
  sourcePackage?: string;
  level: number;
  timestamp: Date;
}

export interface BonusCalculation {
  userId: string;
  type: 'package' | 'team' | 'performance' | 'monthly';
  amount: number;
  percentage: number;
  sourceAmount: number;
  details: string;
  timestamp: Date;
}

export class CommissionService {
  // Real-time commission calculation when a package is purchased
  static async calculatePackagePurchaseCommissions(
    purchasingUser: User,
    membershipPackage: MembershipPackage,
    allUsers: User[]
  ): Promise<CommissionCalculation[]> {
    const commissions: CommissionCalculation[] = [];
    const packageAmount = membershipPackage.price;

    // Fetch dynamic career levels for the calculation
    const { mongoDb } = await import('./mongo-database');
    const careerLevels = await mongoDb.getCareerLevels();

    // 1. Direct Sponsor Commission
    if (purchasingUser.sponsorId) {
      const sponsor = allUsers.find(u => u.id === purchasingUser.sponsorId);
      if (sponsor && sponsor.isActive) {
        // Find career level data from DB config
        const userCareerName = (sponsor.careerLevel as any)?.name || sponsor.careerLevel || 'Emmare';
        const careerData = careerLevels.find(l => 
          l.name.toLowerCase() === userCareerName.toLowerCase() || 
          l.id === userCareerName
        );

        // Use commission rate from career level benefits, fallback to rules
        const ratePercent = careerData?.benefits?.directSalesCommission || careerData?.commissionRate || 15;
        const sponsorCommission = packageAmount * (ratePercent / 100);

        commissions.push({
          userId: sponsor.id,
          type: 'sponsor',
          amount: sponsorCommission,
          percentage: ratePercent,
          sourceUserId: purchasingUser.id,
          sourcePackage: membershipPackage.id,
          level: 1,
          timestamp: new Date()
        });
      }
    }

    // 2. Career Level Commissions (Multi-level)
    const sponsorChain = this.getSponsorChain(purchasingUser, allUsers, 6).slice(1); // Up to 5 levels above direct sponsor
    
    sponsorChain.forEach((sponsor, index) => {
      const userCareerName = (sponsor.careerLevel as any)?.name || sponsor.careerLevel || 'Emmare';
      const careerData = careerLevels.find(l => 
        l.name.toLowerCase() === userCareerName.toLowerCase() || 
        l.id === userCareerName
      );

      // Use team bonus rate from career level benefits
      // If index is 0 (2nd level in chain), it's level 2 commission etc.
      // We can use a default progression if not specified, 
      // but the user wants "belirlenen yüzdelik oranları" (the determined percentages)
      const ratePercent = careerData?.benefits?.teamBonusRate || (5 - index > 0 ? 5 - index : 1);
      const careerCommission = packageAmount * (ratePercent / 100);
      
      commissions.push({
        userId: sponsor.id,
        type: 'career',
        amount: careerCommission,
        percentage: ratePercent,
        sourceUserId: purchasingUser.id,
        sourcePackage: membershipPackage.id,
        level: index + 2, // Level 2+ (level 1 is direct sponsor)
        timestamp: new Date()
      });
    });

    return commissions;
  }

  // Real-time team placement bonus calculation
  static async calculateTeamPlacementBonuses(
    sponsorUser: User,
    newUser: User,
    position: 'left' | 'right' | 'auto',
    allUsers: User[]
  ): Promise<BonusCalculation[]> {
    const bonuses: BonusCalculation[] = [];

    // 1. Direct placement bonus
    const placementBonus = 10; // $10 for each direct placement
    bonuses.push({
      userId: sponsorUser.id,
      type: 'team',
      amount: placementBonus,
      percentage: 0,
      sourceAmount: 0,
      details: `New team member placement: ${newUser.fullName}`,
      timestamp: new Date()
    });

    // 2. Binary matching bonus - PERMANENTLY REMOVED FOR MONOLINE MODEL
    // Binary logic (Left/Right/Pair) is strictly prohibited in this architecture.
    // Only Monoline depth and Sponsor bonuses are active.
    // ...

    // 3. Team performance bonus for upline
    const uplineBonus = this.calculateUplineTeamBonus(sponsorUser, allUsers);
    if (uplineBonus.length > 0) {
      bonuses.push(...uplineBonus);
    }

    return bonuses;
  }

  // Calculate monthly performance bonuses
  static async calculateMonthlyPerformanceBonuses(
    user: User,
    allUsers: User[]
  ): Promise<BonusCalculation[]> {
    const bonuses: BonusCalculation[] = [];
    
    // Team size bonus
    const teamSize = this.getTeamSize(user, allUsers);
    if (teamSize >= 10) {
      const teamBonus = Math.floor(teamSize / 10) * 25; // $25 for every 10 team members
      bonuses.push({
        userId: user.id,
        type: 'performance',
        amount: teamBonus,
        percentage: 0,
        sourceAmount: teamSize,
        details: `Team size bonus: ${teamSize} members`,
        timestamp: new Date()
      });
    }

    // Leadership bonus for strong performers
    const totalTeamEarnings = this.getTeamTotalEarnings(user, allUsers);
    if (totalTeamEarnings >= 1000) {
      const leadershipBonus = totalTeamEarnings * 0.02; // 2% of team earnings
      bonuses.push({
        userId: user.id,
        type: 'performance',
        amount: leadershipBonus,
        percentage: 2,
        sourceAmount: totalTeamEarnings,
        details: `Leadership bonus: 2% of team earnings`,
        timestamp: new Date()
      });
    }

    return bonuses;
  }

  // Apply commissions and bonuses to user wallets in real-time
  static async applyCommissionsToWallet(
    commissions: CommissionCalculation[],
    bonuses: BonusCalculation[]
  ): Promise<boolean> {
    // DEPRECATED: Use applyWalletTransactions() instead.
    const { applyWalletTransactions } = await import('./wallet-transaction.service');
    
    const transactions = [
      ...commissions.map(c => ({
        userId: c.userId,
        amount: c.amount,
        type: c.type,
        reference: `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Commission: ${c.type} (Level ${c.level})`
      })),
      ...bonuses.map(b => ({
        userId: b.userId,
        amount: b.amount,
        type: b.type,
        reference: `BONUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: b.details
      }))
    ];

    await applyWalletTransactions(transactions);
    return true;
  }

  // Helper methods
  private static getSponsorChain(user: User, allUsers: User[], levels: number): User[] {
    const chain: User[] = [];
    let currentUser = user;
    const visited = new Set<string>();
    
    for (let i = 0; i < levels; i++) {
      if (!currentUser.sponsorId) break;
      if (visited.has(currentUser.sponsorId)) break; // Loop protection
      
      const sponsor = allUsers.find(u => u.id === currentUser.sponsorId);
      if (!sponsor) break;
      
      visited.add(sponsor.id);
      chain.push(sponsor);
      currentUser = sponsor;
    }
    
    return chain;
  }

  private static calculateUplineTeamBonus(sponsor: User, allUsers: User[]): BonusCalculation[] {
    const bonuses: BonusCalculation[] = [];
    const sponsorChain = this.getSponsorChain(sponsor, allUsers, 3);
    
    sponsorChain.forEach((uplineSponsor, index) => {
      const bonus = 5 - index; // $5, $4, $3 for levels
      bonuses.push({
        userId: uplineSponsor.id,
        type: 'team',
        amount: bonus,
        percentage: 0,
        sourceAmount: 0,
        details: `Upline team growth bonus (Level ${index + 2})`,
        timestamp: new Date()
      });
    });
    
    return bonuses;
  }

  private static getTeamSize(user: User, allUsers: User[]): number {
    // Recursive team size calculation
    const directReferrals = allUsers.filter(u => u.sponsorId === user.id);
    let size = directReferrals.length;
    for (const referral of directReferrals) {
      size += this.getTeamSize(referral, allUsers);
    }
    return size;
  }

  private static getTeamTotalEarnings(user: User, allUsers: User[]): number {
    // Recursive team earnings calculation
    const directReferrals = allUsers.filter(u => u.sponsorId === user.id);
    let earnings = directReferrals.reduce((sum, member) => sum + member.wallet.totalEarnings, 0);
    for (const referral of directReferrals) {
      earnings += this.getTeamTotalEarnings(referral, allUsers);
    }
    return earnings;
  }
}

export default CommissionService;
