export type CareerLevelName =
  | 'Emmare'
  | 'Levvame'
  | 'Mülhime'
  | 'Mutmainne'
  | 'Râziye'
  | 'Mardiyye'
  | 'Safiye';

export interface CareerLevel {
  id: string;
  name: CareerLevelName;
  displayName: string;
  description: string;
  minInvestment: number;
  minDirectReferrals: number;
  personalSalesPoints: number;
  teamSalesPoints: number;
  commissionRate: number;
  order: number;
  isActive: boolean;
  level: number;
  passiveIncomeRate: number;
  bonus: number;
  requirements: {
    personalSalesPoints: number;
    teamSalesPoints: number;
    directReferrals: number;
    minimumMonthlyPoints: number;
  };
  benefits: {
    directSalesCommission: number;
    teamBonusRate: number;
    monthlyBonus: number;
    rankBonus: number;
  };
}

export interface PointsSystem {
  personalSalesPoints: number;
  teamSalesPoints: number;
  directReferrals: number;
  minimumMonthlyPoints: number;
  registrationPoints: number;
  totalPoints: number;
  monthlyPoints: number;
  lastPointUpdate?: Date;
}

export interface Wallet {
  balance: number;
  totalEarnings: number;
  sponsorBonus: number;
  careerBonus: number;
  passiveIncome: number;
  leadershipBonus: number;
}

export type WalletTxType = 'deposit' | 'withdrawal' | 'transfer' | 'commission' | 'bonus' | 'fee' | 'refund';

export interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  password: string;
  referralCode: string;
  sponsorId?: string;
  isActive: boolean;

  // Standard membership field
  membershipType: string;

  // Extended fields for compatibility
  phone: string;
  role: string;
  membershipStartDate?: Date;
  registrationDate?: Date;

  // Deprecated: use membershipType instead
  package?: string;
  pointsSystem: PointsSystem;
  careerLevel: CareerLevel;
  cloneStoreEnabled?: boolean;
  cloneStoreName?: string;
  cloneStoreDescription?: string;
  cloneStoreTheme?: string;
  daysSinceLastActivity?: number;
  wallet: Wallet;
  kycStatus?: string;
  twoFactorEnabled?: boolean;
  memberId?: string;
  lastActivityDate?: Date;
  monthlyActivityStreak?: number;
  yearlyRenewalDate?: Date;
  nextRenewalWarning?: Date;
  monthlyActivityStatus?: string;
  totalInvestment: number;
  directReferrals: number;
  totalTeamSize: number;
  monthlySalesVolume?: number;
  annualSalesVolume?: number;
  lastLoginDate?: Date;
  lastPaymentDate?: Date;
  receiptFile?: string;
  receiptUploadedAt?: Date;
  receiptVerified?: boolean;
  membershipEndDate?: Date;
  previousUserId?: string;
  globalRank?: number;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  leftChild?: string;
  rightChild?: string;
}

export interface MembershipPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  durationDays: number;
  type: string;
  features?: string[];
  currency: string;
  bonusPercentage: number;
  commissionRate: number;
}

export interface Transaction {
    id: string;
    userId: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    date: Date;
    referenceId?: string;
}

export interface PendingPlacement {
  id: string;
  sponsorId: string;
  newUserId: string;
  registrationDate: Date | string;
  status: 'pending' | 'placed' | 'expired';
  newUserData: {
    fullName: string;
    email: string;
    phone?: string;
    membershipType?: string;
  };
  updatedAt?: Date | string;
}

// Monoline types
export interface MonolineCommissionStructure {
  productPrice: number;
  directSponsorBonus: { percentage: number; amount: number };
  depthCommissions: {
    level1: { percentage: number; amount: number };
    level2: { percentage: number; amount: number };
    level3: { percentage: number; amount: number };
    level4: { percentage: number; amount: number };
    level5: { percentage: number; amount: number };
    level6: { percentage: number; amount: number };
    level7: { percentage: number; amount: number };
    totalPercentage: number;
    totalAmount: number;
  };
  passiveIncomePool: { percentage: number; amount: number; distribution: string };
  companyFund: { percentage: number; amount: number };
}

export interface MonolineMLMSettings {
  isEnabled: boolean;
  productPrice: number;
  commissionStructure: MonolineCommissionStructure;
  membershipRequirements: any;
  passiveIncomeSettings: any;
  activityRequirements: any;
  levelRequirements: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MonolineCommissionTransaction {
  id?: string;
  userId: string;
  amount: number;
  type: string;
  reference?: string;
  description?: string;
  recipientId?: string;
  createdAt: Date;
  status?: 'pending' | 'processed' | 'inactive' | 'failed';
  processedAt?: Date;
  saleId?: string;
  commissionType?: string;
  level?: number;
}

export interface PassiveIncomeDistribution {
    id: string;
    totalPool: number;
    activeMembers: number;
    amountPerMember: number;
    distributionDate: Date;
    recipients: any[];
    method?: 'equal' | 'weighted_by_career' | 'weighted_by_activity';
}

export const MEMBERSHIP_PACKAGES: MembershipPackage[] = [
  {
    id: "standard",
    name: "Standart",
    price: 100,
    description: "3 derinlikten prim alır.",
    duration: 1,
    durationDays: 30,
    type: "standard",
    currency: "USD",
    bonusPercentage: 5,
    commissionRate: 5
  },
  {
    id: "elite",
    name: "Elit",
    price: 500,
    description: "7 derinlikten prim alır + Seyri Sülük içeriklerine tam erişim.",
    duration: 1,
    durationDays: 30,
    type: "elite",
    currency: "USD",
    bonusPercentage: 10,
    commissionRate: 10
  },
  {
    id: "vip",
    name: "VIP (Küresel Derinlik)",
    price: 1000,
    description: "Sınırsız derinlikten prim alır + Tüm içeriklere tam erişim.",
    duration: 1,
    durationDays: 30,
    type: "vip",
    currency: "USD",
    bonusPercentage: 15,
    commissionRate: 15
  }
];

export function getCareerLevel(input: number | { totalInvestment?: number; teamSize?: number; directReferrals?: number }): CareerLevel {
  const totalInvestment = typeof input === 'number' ? input : input.totalInvestment || 0;
  const teamSize = typeof input === 'number' ? 0 : input.teamSize || 0;

  let levelName: CareerLevelName = 'Emmare';
  let level = 1;

  if (totalInvestment >= 25000 && teamSize >= 3) {
    levelName = 'Safiye';
    level = 7;
  } else if (totalInvestment >= 10000 && teamSize >= 50) {
    levelName = 'Mardiyye';
    level = 6;
  } else if (totalInvestment >= 5000 && teamSize >= 2) {
    levelName = 'Râziye';
    level = 5;
  } else if (totalInvestment >= 3000 && teamSize >= 10) {
    levelName = 'Mutmainne';
    level = 4;
  } else if (totalInvestment >= 1500 && teamSize >= 4) {
    levelName = 'Mülhime';
    level = 3;
  } else if (totalInvestment >= 500 && teamSize >= 2) {
    levelName = 'Levvame';
    level = 2;
  }

  return {
    id: String(level),
    name: levelName,
    displayName: levelName,
    description: `${levelName} mertebesi`,
    minInvestment: 0, // Requirements are handled in logic
    minDirectReferrals: 0,
    personalSalesPoints: 0,
    teamSalesPoints: 0,
    commissionRate: 2 + level,
    order: level,
    isActive: true,
    level,
    passiveIncomeRate: level > 1 ? (level - 1) * 0.5 : 0,
    bonus: 0,
    requirements: {
      personalSalesPoints: 0,
      teamSalesPoints: 0,
      directReferrals: 0,
      minimumMonthlyPoints: 0,
    },
    benefits: {
      directSalesCommission: 0,
      teamBonusRate: 0,
      monthlyBonus: 0,
      rankBonus: 0,
    },
  };
}

export type Role = 'admin' | 'member' | 'leader' | 'visitor' | 'user';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  originalPrice?: number;
  category?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

export interface ProductPurchase {
  id: string;
  productId: string;
  userId?: string;
  buyerId?: string;
  buyerEmail?: string;
  amount: number;
  purchaseAmount?: number;
  referralCode?: string;
  sponsorId?: string;
  status?: string;
  paymentMethod?: string;
  shippingAddress?: ShippingAddress | any;
  purchaseDate?: Date;
  commissionDistributed?: boolean;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  addressType?: 'home' | 'work' | 'other';
}

export interface ProductCommission {
  id: string;
  purchaseId: string;
  amount: number;
  recipientId: string;
}

export interface LiveBroadcast {
  id: string;
  title: string;
  startAt?: Date;
  endAt?: Date | null;
  endTime?: Date | null;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'scheduled';
  streamUrl?: string;
  adminId?: string;
  startTime?: Date;
  description?: string;
  platform?: string;
  viewerCount?: number;
  createdAt?: Date;
  lastUpdated?: Date;
}

export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'BTC' | 'ETH';
export type WalletTransactionType = 'deposit' | 'withdrawal' | 'commission' | 'transfer';
export type PaymentMethodType = 'bank' | 'crypto' | 'pos' | 'manual';

// small helper exported to satisfy some imports; real implementation belongs to service layer
export function calculateCommissions(amount: number) {
  return { total: amount, breakdown: [] };
}
