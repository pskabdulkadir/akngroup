export type CareerLevel =
  | 'Emmare'
  | 'Levvame'
  | 'Mülhime'
  | 'Mutmainne'
  | 'Raziye'
  | 'Mardiye'
  | 'Safiye';

// Exchange rate and point values
export const BASE_EXCHANGE_RATE = 34.5; // (1 USD = 34.5 TL approximately)
export const ENTRY_PACKAGE_PRICE_TL = 1000;
export const ENTRY_PACKAGE_PRICE_USD = 29;
export const PV_PER_TL = 0.1; // 1000 TL = 100 PV
export const BV_PER_TL = 0.029; // 1000 TL = 29 BV (USD based for commissions)

export const ACTIVE_FEES = {
  monthly: 1000, // TL
  yearly: 10000, // TL
};

export function isActiveMember(activeUntil: Date): boolean {
  return activeUntil && activeUntil > new Date();
}

export const careerLevels: Record<CareerLevel, {
  requiredTeamCiroTL: number;
  requiredUSD: number;
  requiredActivePeople: number;
  requiredDirectReferrals: number;
  bonusPercent: number;
  maxLegContributionPercent: number; // 60/40 rule
}> = {
  Emmare:     { requiredTeamCiroTL: 5000,   requiredUSD: 145,   requiredActivePeople: 5,   requiredDirectReferrals: 0,  bonusPercent: 2,   maxLegContributionPercent: 100 },
  Levvame:    { requiredTeamCiroTL: 10000,  requiredUSD: 290,   requiredActivePeople: 10,  requiredDirectReferrals: 2,  bonusPercent: 3,   maxLegContributionPercent: 60 },
  Mülhime:    { requiredTeamCiroTL: 25000,  requiredUSD: 725,   requiredActivePeople: 25,  requiredDirectReferrals: 3,  bonusPercent: 4,   maxLegContributionPercent: 60 },
  Mutmainne:  { requiredTeamCiroTL: 75000,  requiredUSD: 2175,  requiredActivePeople: 75,  requiredDirectReferrals: 4,  bonusPercent: 5,   maxLegContributionPercent: 60 },
  Raziye:     { requiredTeamCiroTL: 150000, requiredUSD: 4350,  requiredActivePeople: 150, requiredDirectReferrals: 5,  bonusPercent: 6,   maxLegContributionPercent: 60 },
  Mardiye:    { requiredTeamCiroTL: 300000, requiredUSD: 8700,  requiredActivePeople: 300, requiredDirectReferrals: 7,  bonusPercent: 8,   maxLegContributionPercent: 60 },
  Safiye:     { requiredTeamCiroTL: 750000, requiredUSD: 21750, requiredActivePeople: 750, requiredDirectReferrals: 10, bonusPercent: 12,  maxLegContributionPercent: 60 },
};

export function getCareerLevel(user: {
  teamSize: number;
  totalTeamCiroTL: number;
  directReferrals: number;
  legCirosTL?: Record<string, number>; // Ciro from each direct leg
}): CareerLevel {
  const levels = Object.entries(careerLevels);
  
  for (let i = levels.length - 1; i >= 0; i--) {
    const [level, req] = levels[i] as [CareerLevel, any];
    
    // Apply 60/40 rule (Max Leg Contribution)
    let effectiveCiro = user.totalTeamCiroTL;
    if (user.legCirosTL && req.maxLegContributionPercent < 100) {
      const maxAllowedFromOneLeg = req.requiredTeamCiroTL * (req.maxLegContributionPercent / 100);
      effectiveCiro = 0;
      
      // We sum up ciros but cap each leg's contribution to the requirement
      Object.values(user.legCirosTL).forEach(legCiro => {
        effectiveCiro += Math.min(legCiro, maxAllowedFromOneLeg);
      });

      // Special case: if total of capped legs is less than required, but user has many legs, 
      // the logic above handles it. But we should also ensure total doesn't exceed requirement 
      // just in case of weird math.
    }

    if (
      effectiveCiro >= req.requiredTeamCiroTL && 
      user.teamSize >= req.requiredActivePeople && 
      user.directReferrals >= req.requiredDirectReferrals
    ) {
      return level as CareerLevel;
    }
  }
  return 'Emmare';
}

export function calculateSponsorBonus(amount: number): number {
  return amount * 0.15; // 15% Sponsor Bonus (Direct Cash - 4.35$ for 29$)
}

export function calculatePassivePoolContribution(amount: number): number {
  return amount * 0.10; // 10% Pool Distribution (2.90$ for 29$)
}

export function calculateUnilevelCommission(amount: number): number {
  return amount * 0.135; // 13.5% Depth Prim (Unilevel - 3.92$ for 29$)
}

export const passiveRates: Record<CareerLevel, number> = {
  Emmare: 0,
  Levvame: 0.5,
  Mülhime: 1,
  Mutmainne: 1.5,
  Raziye: 2,
  Mardiye: 3,
  Safiye: 4,
};

export function calculatePassiveIncome(upline: {
  career: CareerLevel;
}, downlineInvestment: number): number {
  const rate = passiveRates[upline.career] || 0;
  return downlineInvestment * (rate / 100);
}

// Automation helpers for system processing
export function shouldUpdateCareerLevel(user: {
  teamSize: number;
  totalInvestment: number;
  currentCareer: CareerLevel;
}): boolean {
  const newLevel = getCareerLevel({ teamSize: user.teamSize, totalInvestment: user.totalInvestment });
  return newLevel !== user.currentCareer;
}

export function calculateCommissionFromInvestment(investment: number, careerLevel: CareerLevel): number {
  const bonusPercent = careerLevels[careerLevel]?.bonusPercent || 0;
  return investment * (bonusPercent / 100);
}

export function calculateMonthlyActiveRequirement(): number {
  return ACTIVE_FEES.monthly;
}

export function calculateYearlyActiveRequirement(): number {
  return ACTIVE_FEES.yearly;
}

export function isQualifiedForPassiveIncome(careerLevel: CareerLevel): boolean {
  return passiveRates[careerLevel] > 0;
}

export function getNextCareerLevelRequirements(currentLevel: CareerLevel): {
  requiredActivePeople: number;
  requiredUSD: number;
  bonusPercent: number;
  requiredDirectReferrals: number;
} | null {
  const levels: CareerLevel[] = ['Emmare', 'Levvame', 'Mülhime', 'Mutmainne', 'Raziye', 'Mardiye', 'Safiye'];
  const currentIndex = levels.indexOf(currentLevel);

  if (currentIndex === -1 || currentIndex >= levels.length - 1) {
    return null;
  }

  const nextLevel = levels[currentIndex + 1];
  const rule = careerLevels[nextLevel];
  
  return {
    requiredActivePeople: rule.requiredActivePeople,
    requiredUSD: rule.requiredUSD,
    bonusPercent: rule.bonusPercent,
    requiredDirectReferrals: rule.requiredDirectReferrals
  };
}
