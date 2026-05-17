import { User, CareerLevel, Transaction, PointsSystem } from '../../shared/mlm-types';
import { careerLevels, CareerLevel as CareerLevelName, getCareerLevel as calculateCareerLevel } from '../../shared/mlmRules';

export interface PointTransaction {
  id: string;
  userId: string;
  type: string;
  points: number;
  source: {
    type: string;
    sourceId?: string;
    description: string;
    amount?: number;
  };
  timestamp: Date;
}

export interface CareerProgress {
  currentLevel: CareerLevel;
  nextLevel?: CareerLevel;
  progress: any;
  canUpgrade: boolean;
  nextLevelRequirements?: string[];
}

export class PointsCareerService {
  // Default career levels configuration merged from mlmRules
  static getDefaultCareerLevels(): CareerLevel[] {
    const levels: CareerLevelName[] = ['Emmare', 'Levvame', 'Mülhime', 'Mutmainne', 'Raziye', 'Mardiye', 'Safiye'];
    
    return levels.map((name, index) => {
      const rule = careerLevels[name];
      const level = index + 1;
      
      return {
        id: name.toLowerCase(),
        name: name as any,
        displayName: `Nefs-i ${name}`,
        description: `${name} mertebesi`,
        minInvestment: rule.requiredUSD,
        minDirectReferrals: rule.requiredDirectReferrals,
        personalSalesPoints: Math.floor(rule.requiredUSD * 0.1), // Heuristic
        teamSalesPoints: rule.requiredUSD,
        commissionRate: rule.bonusPercent,
        level: level,
        passiveIncomeRate: level > 1 ? (level - 1) * 0.5 : 0,
        bonus: rule.requiredUSD * 0.1, // Example rank bonus
        requirements: {
          personalSalesPoints: Math.floor(rule.requiredUSD * 0.1),
          teamSalesPoints: rule.requiredUSD,
          directReferrals: rule.requiredDirectReferrals,
          minimumMonthlyPoints: Math.floor(rule.requiredUSD * 0.05)
        },
        benefits: {
          directSalesCommission: rule.bonusPercent,
          teamBonusRate: Math.max(1, index),
          monthlyBonus: rule.requiredUSD * 0.05,
          rankBonus: rule.requiredUSD * 0.1
        },
        order: level,
        isActive: true
      };
    });
  }

  // Calculate points for different activities (1 dollar = 1 point)
  static calculatePointsForSale(saleAmount: number, saleType: 'product' | 'membership'): number {
    // 1 dollar = 1 point for all sales
    return Math.floor(saleAmount);
  }

  static calculateTeamSalesPoints(saleAmount: number, level: number): number {
    // Base 1 dollar = 1 point, decreasing by level
    const levelMultipliers = [1.0, 0.5, 0.3, 0.2, 0.1];
    const multiplier = levelMultipliers[level - 1] || 0;
    return Math.floor(saleAmount * multiplier);
  }

  static getRegistrationPoints(): number {
    return 50; // Fixed 50 points for each direct registration
  }

  // Award points for a sale
  static async awardSalePoints(
    buyerUserId: string,
    saleAmount: number,
    saleType: 'product' | 'membership',
    allUsers: User[]
  ): Promise<{ transactions: PointTransaction[], updatedUsers: User[] }> {
    const transactions: PointTransaction[] = [];
    let updatedUsers = [...allUsers];

    const buyer = updatedUsers.find(u => u.id === buyerUserId);
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    // 1. Award personal sales points to buyer
    const personalPoints = this.calculatePointsForSale(saleAmount, saleType);
    transactions.push({
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: buyerUserId,
      type: 'personal_sales',
      points: personalPoints,
      source: {
        type: 'sale',
        description: `${saleType === 'membership' ? 'Üyelik paketi' : 'Ürün'} satışı: $${saleAmount}`,
        amount: saleAmount
      },
      timestamp: new Date()
    });

    // Update buyer's points
    updatedUsers = updatedUsers.map(u => {
      if (u.id === buyerUserId) {
        return {
          ...u,
          monthlySalesVolume: (u.monthlySalesVolume || 0) + saleAmount,
          totalTeamCiroTL: (u.totalTeamCiroTL || 0) + saleAmount,
          pointsSystem: {
            ...u.pointsSystem,
            personalSalesPoints: u.pointsSystem.personalSalesPoints + personalPoints,
            totalPoints: u.pointsSystem.totalPoints + personalPoints,
            monthlyPoints: u.pointsSystem.monthlyPoints + personalPoints,
            lastPointUpdate: new Date()
          }
        };
      }
      return u;
    });

    // 2. Award team sales points to upline
    const uplineChain = this.getUplineChain(buyer, updatedUsers, 5);
    uplineChain.forEach((uplineUser, index) => {
      const level = index + 1;
      const teamPoints = this.calculateTeamSalesPoints(saleAmount, level);

      if (teamPoints > 0) {
        transactions.push({
          id: `team_sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: uplineUser.id,
          type: 'team_sales',
          points: teamPoints,
          source: {
            type: 'sale',
            sourceId: buyerUserId,
            description: `${level}. seviye ekip satışı: $${saleAmount}`,
            amount: saleAmount
          },
          timestamp: new Date()
        });

        // Update upline user's points and leg volumes
        updatedUsers = updatedUsers.map(u => {
          if (u.id === uplineUser.id) {
            // Identify which "leg" (direct referral) this sale belongs to
            // The leg is the direct referral of uplineUser that is an ancestor of buyer (or is buyer)
            let legUserId = buyerUserId;
            let current = buyer;
            while (current.sponsorId && current.sponsorId !== uplineUser.id) {
              const parent = updatedUsers.find(x => x.id === current.sponsorId);
              if (!parent) break;
              current = parent;
              legUserId = current.id;
            }

            const currentLegCiros = u.legCirosTL || {};
            const newLegCiros = {
              ...currentLegCiros,
              [legUserId]: (currentLegCiros[legUserId] || 0) + saleAmount
            };

            return {
              ...u,
              totalTeamCiroTL: (u.totalTeamCiroTL || 0) + saleAmount,
              legCirosTL: newLegCiros,
              pointsSystem: {
                ...u.pointsSystem,
                teamSalesPoints: u.pointsSystem.teamSalesPoints + teamPoints,
                totalPoints: u.pointsSystem.totalPoints + teamPoints,
                monthlyPoints: u.pointsSystem.monthlyPoints + teamPoints,
                lastPointUpdate: new Date()
              }
            };
          }
          return u;
        });
      }
    });

    return { transactions, updatedUsers };
  }

  // Award points for registration
  static async awardRegistrationPoints(
    sponsorUserId: string,
    newUserId: string,
    allUsers: User[]
  ): Promise<{ transactions: PointTransaction[], updatedUsers: User[] }> {
    const transactions: PointTransaction[] = [];
    let updatedUsers = [...allUsers];

    const sponsor = updatedUsers.find(u => u.id === sponsorUserId);
    const newUser = updatedUsers.find(u => u.id === newUserId);

    if (!sponsor || !newUser) {
      throw new Error('Sponsor or new user not found');
    }

    const registrationPoints = this.getRegistrationPoints();

    transactions.push({
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: sponsorUserId,
      type: 'registration',
      points: registrationPoints,
      source: {
        type: 'registration',
        sourceId: newUserId,
        description: `Yeni üye kaydı: ${newUser.fullName}`,
      },
      timestamp: new Date()
    });

    // Update sponsor's points
    updatedUsers = updatedUsers.map(u => {
      if (u.id === sponsorUserId) {
        return {
          ...u,
          pointsSystem: {
            ...u.pointsSystem,
            registrationPoints: u.pointsSystem.registrationPoints + registrationPoints,
            totalPoints: u.pointsSystem.totalPoints + registrationPoints,
            monthlyPoints: u.pointsSystem.monthlyPoints + registrationPoints,
            lastPointUpdate: new Date()
          }
        };
      }
      return u;
    });

    return { transactions, updatedUsers };
  }

  // Check and update career levels
  static checkCareerLevelUpgrade(user: User, careerLevels: CareerLevel[]): {
    shouldUpgrade: boolean;
    newLevel?: CareerLevel;
    oldLevel: CareerLevel;
  } {
    const currentLevel = user.careerLevel;
    const sortedLevels = careerLevels.sort((a, b) => a.order - b.order);

    // Find next available level
    const currentLevelIndex = sortedLevels.findIndex(l => l.id === currentLevel.name);

    for (let i = currentLevelIndex + 1; i < sortedLevels.length; i++) {
      const nextLevel = sortedLevels[i];

      if (this.meetsRequirements(user, nextLevel)) {
        return {
          shouldUpgrade: true,
          newLevel: nextLevel,
          oldLevel: currentLevel
        };
      }
    }

    return {
      shouldUpgrade: false,
      oldLevel: currentLevel
    };
  }

  // Check if user meets requirements for a level
  static meetsRequirements(user: User, level: CareerLevel): boolean {
    const points = user.pointsSystem;
    const req = level.requirements || (level as any); // Handle both types

    // 60/40 Rule implementation
    const requiredCiro = req.requiredTeamCiroTL || req.teamSalesPoints || 0;
    const maxLegPercent = req.maxLegContributionPercent || 100;
    const maxAllowedFromOneLeg = requiredCiro * (maxLegPercent / 100);

    let effectiveCiro = 0;
    if (user.legCirosTL && maxLegPercent < 100) {
      // Calculate effective ciro by capping each leg
      // user.legCirosTL is a Map in JS/TS if from Mongoose, or object
      const legCiros = user.legCirosTL;
      const legValues = legCiros instanceof Map ? Array.from(legCiros.values()) : Object.values(legCiros || {});
      
      legValues.forEach((ciro: any) => {
        effectiveCiro += Math.min(Number(ciro), maxAllowedFromOneLeg);
      });
      
      // Also add personal ciro if it counts (usually it does towards the "rest" of the 40% if not from a main leg)
      // For now, let's just focus on team legs as requested
    } else {
      effectiveCiro = user.totalTeamCiroTL || points.teamSalesPoints || 0;
    }

    const minDirectReferrals = req.requiredDirectReferrals || req.directReferrals || 0;
    const minActivePeople = req.requiredActivePeople || req.teamSalesPoints / 100 || 0; // fallback

    return (
      effectiveCiro >= requiredCiro &&
      user.directReferrals >= minDirectReferrals &&
      user.totalTeamSize >= minActivePeople &&
      points.personalSalesPoints >= (req.personalSalesPoints || 0)
    );
  }

  // Get career progress for a user
  static getCareerProgress(user: User, careerLevels: CareerLevel[]): CareerProgress {
    const currentLevel = careerLevels.find(l => l.name === user.careerLevel.name) || careerLevels[0];
    const sortedLevels = careerLevels.sort((a, b) => a.order - b.order);
    const currentIndex = sortedLevels.findIndex(l => l.id === currentLevel.id);
    const nextLevel = currentIndex < sortedLevels.length - 1 ? sortedLevels[currentIndex + 1] : undefined;

    const progress = {
      personalSalesPoints: {
        current: user.pointsSystem.personalSalesPoints,
        required: nextLevel?.requirements.personalSalesPoints || 0,
        percentage: nextLevel ? Math.min(100, (user.pointsSystem.personalSalesPoints / nextLevel.requirements.personalSalesPoints) * 100) : 100
      },
      teamSalesPoints: {
        current: user.pointsSystem.teamSalesPoints,
        required: nextLevel?.requirements.teamSalesPoints || 0,
        percentage: nextLevel ? Math.min(100, (user.pointsSystem.teamSalesPoints / nextLevel.requirements.teamSalesPoints) * 100) : 100
      },
      directReferrals: {
        current: user.directReferrals,
        required: nextLevel?.requirements.directReferrals || 0,
        percentage: nextLevel ? Math.min(100, (user.directReferrals / nextLevel.requirements.directReferrals) * 100) : 100
      },
      monthlyPoints: {
        current: user.pointsSystem.monthlyPoints,
        required: nextLevel?.requirements.minimumMonthlyPoints || 0,
        percentage: nextLevel ? Math.min(100, (user.pointsSystem.monthlyPoints / nextLevel.requirements.minimumMonthlyPoints) * 100) : 100
      }
    };

    const canUpgrade = nextLevel ? this.meetsRequirements(user, nextLevel) : false;

    return {
      currentLevel,
      nextLevel,
      progress,
      canUpgrade,
      nextLevelRequirements: nextLevel ? [
        `${nextLevel.requirements.personalSalesPoints} Kişisel Satış Puanı`,
        `${nextLevel.requirements.teamSalesPoints} Ekip Satış Puanı`,
        `${nextLevel.requirements.directReferrals} Doğrudan Referans`,
        `${nextLevel.requirements.minimumMonthlyPoints} Aylık Puan`
      ] : undefined
    };
  }

  // Calculate bonuses based on career level
  static calculateCareerBonuses(user: User, careerLevels: CareerLevel[]): {
    monthlyBonus: number;
    rankBonus: number;
    totalBonus: number;
  } {
    try {
      // Safely get user's career level
      const userCareerName = user.careerLevel?.name || user.careerLevel || 'emmare';
      const userLevel = careerLevels.find(l => l.name === userCareerName) || careerLevels[0];

      if (!userLevel) {
        return {
          monthlyBonus: 0,
          rankBonus: 0,
          totalBonus: 0
        };
      }

      const monthlyBonus = userLevel.benefits?.monthlyBonus || 0;
      const rankBonus = userLevel.benefits?.rankBonus || 0;

      return {
        monthlyBonus,
        rankBonus,
        totalBonus: monthlyBonus + rankBonus
      };
    } catch (error) {
      console.error('Error calculating career bonuses for user:', user.id, error);
      return {
        monthlyBonus: 0,
        rankBonus: 0,
        totalBonus: 0
      };
    }
  }

  // Reset monthly points (to be called at the beginning of each month)
  static resetMonthlyPoints(users: User[]): User[] {
    return users.map(user => ({
      ...user,
      pointsSystem: {
        ...user.pointsSystem,
        monthlyPoints: 0,
        lastPointUpdate: new Date()
      }
    }));
  }

  // Helper method to get upline chain
  private static getUplineChain(user: User, allUsers: User[], maxLevels: number): User[] {
    const chain: User[] = [];
    let currentUser = user;
    const visitedIds = new Set<string>();
    visitedIds.add(currentUser.id);

    for (let i = 0; i < maxLevels; i++) {
      if (!currentUser.sponsorId) break;

      const sponsor = allUsers.find(u => u.id === currentUser.sponsorId);
      if (!sponsor) break;

      // Circular dependency check
      if (visitedIds.has(sponsor.id)) {
        console.warn(`Circular dependency detected in upline chain for user ${user.id} at sponsor ${sponsor.id}`);
        break;
      }

      visitedIds.add(sponsor.id);
      chain.push(sponsor);
      currentUser = sponsor;
    }

    return chain;
  }
}

export default PointsCareerService;
