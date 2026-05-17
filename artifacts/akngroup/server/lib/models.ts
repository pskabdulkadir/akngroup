import mongoose, { Schema, Document, Model } from "mongoose";
import { User as IUser, CareerLevel as ICareerLevel, MembershipPackage as IMembershipPackage, PointsSystem as IPointsSystem, Wallet as IWallet } from "../../shared/mlm-types";

// Document interfaces that extend the base interfaces with Mongoose's Document
interface IUserDocument extends Omit<IUser, 'id'>, Document {}
interface ICareerLevelDocument extends Omit<ICareerLevel, 'id'>, Document {}
interface IMembershipPackageDocument extends Omit<IMembershipPackage, 'id'>, Document {}

// --- CareerLevel ---
const CareerLevelSchema = new Schema<ICareerLevelDocument>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: { type: String },
  minInvestment: { type: Number, default: 0 },
  minDirectReferrals: { type: Number, default: 0 },
  requiredTeamCiroTL: { type: Number, default: 0 },
  requiredUSD: { type: Number, default: 0 },
  requiredActivePeople: { type: Number, default: 0 },
  requiredDirectReferrals: { type: Number, default: 0 },
  maxLegContributionPercent: { type: Number, default: 100 },
  personalSalesPoints: { type: Number, default: 0 },
  teamSalesPoints: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  level: { type: Number, default: 1 },
  passiveIncomeRate: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  requirements: {
    personalSalesPoints: { type: Number, default: 0 },
    teamSalesPoints: { type: Number, default: 0 },
    directReferrals: { type: Number, default: 0 },
    minimumMonthlyPoints: { type: Number, default: 0 },
  },
  benefits: {
    directSalesCommission: { type: Number, default: 0 },
    teamBonusRate: { type: Number, default: 0 },
    monthlyBonus: { type: Number, default: 0 },
    rankBonus: { type: Number, default: 0 },
  },
});

// --- PointsSystem ---
const PointsSystemSchema = new Schema<IPointsSystem>({
  personalSalesPoints: { type: Number, default: 0 },
  teamSalesPoints: { type: Number, default: 0 },
  directReferrals: { type: Number, default: 0 },
  minimumMonthlyPoints: { type: Number, default: 0 },
  registrationPoints: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  lastPointUpdate: { type: Date },
});

// --- Wallet ---
const WalletSchema = new Schema<IWallet>({
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    sponsorBonus: { type: Number, default: 0 },
    careerBonus: { type: Number, default: 0 },
    passiveIncome: { type: Number, default: 0 },
    leadershipBonus: { type: Number, default: 0 },
});

// --- User ---
const UserSchema = new Schema<IUserDocument>({
  id: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user", "moderator", "member", "leader", "visitor"], default: "user" },
  membershipType: { type: String, enum: ["entry", "monthly", "yearly", "free", "standard", "elite", "vip"], default: "entry" },
  membershipStartDate: { type: Date, default: Date.now },
  pointsSystem: { type: PointsSystemSchema, default: {} },
  careerLevel: { type: CareerLevelSchema, required: true },
  cloneStoreEnabled: { type: Boolean, default: false },
  cloneStoreName: { type: String },
  cloneStoreDescription: { type: String },
  cloneStoreTheme: { type: String },
  previousUserId: { type: String },
  globalRank: { type: Number, unique: true, sparse: true },
  sponsorId: { type: String },
  isActive: { type: Boolean, default: false },
  wallet: { type: WalletSchema, required: true },
  kycStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  twoFactorEnabled: { type: Boolean, default: false },
  memberId: { type: String },
  lastActivityDate: { type: Date },
  monthlyActivityStreak: { type: Number, default: 0 },
  yearlyRenewalDate: { type: Date },
  nextRenewalWarning: { type: Date },
  monthlyActivityStatus: { type: String, enum: ["active", "inactive", "warning"] },
  totalInvestment: { type: Number, default: 0 },
  totalTeamCiroTL: { type: Number, default: 0 },
  legCirosTL: { type: Map, of: Number, default: {} },
  directReferrals: { type: Number, default: 0 },
  totalTeamSize: { type: Number, default: 0 },
  monthlySalesVolume: { type: Number, default: 0 },
  annualSalesVolume: { type: Number, default: 0 },
  referralCode: { type: String, required: true },
  lastLoginDate: { type: Date },
  lastPaymentDate: { type: Date },
  receiptFile: { type: String },
  receiptUploadedAt: { type: Date },
  receiptVerified: { type: Boolean, default: false },
  membershipEndDate: { type: Date },
  registrationDate: { type: Date, default: Date.now },
  daysSinceLastActivity: { type: Number, default: 0 },
  stripeAccountId: { type: String },
  stripeOnboardingComplete: { type: Boolean, default: false },
});

// User Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true });
UserSchema.index({ memberId: 1 });
UserSchema.index({ globalRank: 1 });
UserSchema.index({ sponsorId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// --- MembershipPackage ---
const MembershipPackageSchema = new Schema<IMembershipPackageDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  type: { type: String, enum: ["entry", "monthly", "yearly"], required: true },
  features: [{ type: String }],
  currency: { type: String, default: "USD" },
  bonusPercentage: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
});

// --- WalletTransaction ---
const WalletTransactionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['SPONSOR', 'CAREER', 'PASSIVE', 'LEADERSHIP', 'BONUS', 'COMMISSION', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'FEE', 'REFUND', 'deposit', 'withdrawal', 'transfer', 'commission', 'bonus', 'fee', 'refund', 'sponsor', 'career', 'passive', 'leadership'], required: true },
  status: { type: String, enum: ['PAID', 'HELD', 'BURNED', 'PENDING', 'pending', 'completed', 'approved', 'rejected', 'failed'], default: 'PENDING' },
  reference: { type: String, required: true, index: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  sourceUserId: { type: String },
  monthlyResetReleasedAt: { type: Date },
});

// WalletTransaction Indexes
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, type: 1 });
WalletTransactionSchema.index({ userId: 1, status: 1 });
WalletTransactionSchema.index({ type: 1, status: 1 });

// --- CommissionLog ---
const CommissionLogSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  totalAmount: { type: Number, required: true },
  transactionCount: { type: Number, default: 0 },
  processedAt: { type: Date, default: Date.now },
  processedBy: { type: String },
  details: { type: Schema.Types.Mixed },
});

// --- CommissionAudit ---
const CommissionAuditSchema = new Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, enum: ['CALCULATED', 'DISTRIBUTED', 'HELD', 'RELEASED', 'REFUNDED'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  performedBy: { type: String },
  transactionRef: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed },
});

// --- PassiveIncomePool ---
const PassiveIncomePoolSchema = new Schema({
  totalAmount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  lastDistributedAt: { type: Date },
  distributionHistory: [{
    distributedAt: Date,
    amount: Number,
    recipients: Number,
    method: { type: String, enum: ['equal', 'weighted_by_career', 'weighted_by_activity'], default: 'equal' }
  }],
  settings: {
    minimumActiveMembers: { type: Number, default: 10 },
    distributionFrequency: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'monthly' },
    percentage: { type: Number, default: 0.5 }
  }
});

// --- CompanyFund ---
const CompanyFundSchema = new Schema({
  totalAmount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  transactions: [{
    sourceUserId: String,
    amount: Number,
    reference: String,
    createdAt: { type: Date, default: Date.now }
  }],
  metadata: { type: Schema.Types.Mixed },
});

// --- MonolineSettings ---
const MonolineSettingsSchema = new Schema({
  isEnabled: { type: Boolean, default: true },
  productPrice: { type: Number, default: 20 },
  directSponsorBonus: {
    percentage: { type: Number, default: 15 },
    amount: { type: Number, default: 3 }
  },
  depthCommissions: {
    level1: { percentage: { type: Number, default: 12.5 }, amount: { type: Number, default: 2.5 } },
    level2: { percentage: { type: Number, default: 7.5 }, amount: { type: Number, default: 1.5 } },
    level3: { percentage: { type: Number, default: 5.0 }, amount: { type: Number, default: 1.0 } },
    level4: { percentage: { type: Number, default: 3.5 }, amount: { type: Number, default: 0.7 } },
    level5: { percentage: { type: Number, default: 2.5 }, amount: { type: Number, default: 0.5 } },
    level6: { percentage: { type: Number, default: 2.0 }, amount: { type: Number, default: 0.4 } },
    level7: { percentage: { type: Number, default: 1.5 }, amount: { type: Number, default: 0.3 } },
  },
  passiveIncomePool: {
    percentage: { type: Number, default: 0.5 },
    amount: { type: Number, default: 0.1 },
    distribution: { type: String, enum: ['equal', 'weighted_by_career', 'weighted_by_activity'], default: 'equal' }
  },
  companyFund: {
    percentage: { type: Number, default: 45 },
    amount: { type: Number, default: 9 }
  },
  membershipRequirements: {
    initialPurchase: {
      minimumAmount: { type: Number, default: 100 },
      minimumUnits: { type: Number, default: 5 }
    },
    monthlyActivity: {
      minimumAmount: { type: Number, default: 20 },
      minimumUnits: { type: Number, default: 1 }
    },
    annualActivity: {
      minimumAmount: { type: Number, default: 200 },
      minimumUnits: { type: Number, default: 10 }
    }
  },
  activityRequirements: {
    monthly: { amount: { type: Number, default: 20 }, units: { type: Number, default: 1 } },
    annual: { amount: { type: Number, default: 200 }, units: { type: Number, default: 10 } },
    initial: { amount: { type: Number, default: 100 }, units: { type: Number, default: 5 } }
  },
  levelRequirements: [{ type: Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String,
});

// ==========================================
// NEW MODELS FOR DIRECT MONGOOSE MIGRATION
// ==========================================

// --- Product ---
const ProductSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDigital: { type: Boolean, default: false },
  downloadUrl: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// --- ClonePage ---
const ClonePageSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  isActive: { type: Boolean, default: true },
  visitCount: { type: Number, default: 0 },
  conversionCount: { type: Number, default: 0 },
  customizations: {
    customMessage: { type: String },
    theme: { type: String },
    branding: { type: Schema.Types.Mixed }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// --- SystemSettings ---
const SystemSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String },
});

// --- PasswordReset ---
const PasswordResetSchema = new Schema({
  userId: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, enum: ['phone', 'email'], default: 'phone' },
  createdAt: { type: Date, default: Date.now },
});

// --- MonolineCommission ---
const MonolineCommissionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  recipientId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, default: 'monoline' },
  sourceUserId: { type: String, required: true },
  level: { type: Number },
  description: { type: String },
  reference: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

// --- Announcement ---
const AnnouncementSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'general' },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

// --- MemberLog ---
const MemberLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

// --- MemberActivity ---
const MemberActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  activityType: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

// --- AdminLog ---
const AdminLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  adminId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  targetUserId: { type: String },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

// --- ProductPurchase ---
const ProductPurchaseSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  referralCode: { type: String },
  commissionDistributed: { type: Boolean, default: false },
  commissionDistributedAt: { type: Date },
  date: { type: Date, default: Date.now },
});

// --- PaymentRequest ---
const PaymentRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  proofFile: { type: String },
  adminNote: { type: String },
  processedBy: { type: String },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// --- RealTimeTransaction ---
const RealTimeTransactionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  description: { type: String },
  reference: { type: String },
  timestamps: {
    created: { type: Date, default: Date.now },
    completed: { type: Date }
  },
});

// --- MemberSession ---
const MemberSessionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  memberId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionToken: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// --- SystemDocument ---
const SystemDocumentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: "general" },
  type: { type: String, default: "document" },
  isActive: { type: Boolean, default: true },
  accessLevel: { type: String, default: "all" },
  tags: [{ type: String }],
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  fileContent: { type: String },
  uploadedBy: { type: String },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// --- HatimProgress ---
const HatimProgressSchema = new Schema({
  userId: { type: String, required: true, index: true },
  currentPage: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  lastReadAt: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  history: [{
    page: Number,
    date: { type: Date, default: Date.now }
  }]
});

// --- DuaRequest ---
const DuaRequestSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "Genel" },
  participantCount: { type: Number, default: 0 },
  participants: [{ type: String }], // User IDs
  targetCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

// --- ZoomTraining ---
const ZoomTrainingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  zoomLink: { type: String, required: true },
  meetingId: { type: String },
  password: { type: String },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
  notificationSent: { type: Boolean, default: false },
  authorizedHosts: [{ type: String }],
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// --- Notification ---
const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  type: { type: String, enum: ['zoom_training', 'payment_approved', 'commission_received', 'system'], default: 'system' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Export all models
export const UserModel: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
export const CareerLevelModel: Model<ICareerLevelDocument> =
  mongoose.models.CareerLevel || mongoose.model<ICareerLevelDocument>("CareerLevel", CareerLevelSchema);
export const MembershipPackageModel: Model<IMembershipPackageDocument> =
  mongoose.models.MembershipPackage || mongoose.model<IMembershipPackageDocument>("MembershipPackage", MembershipPackageSchema);

export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);
export const CommissionLog = mongoose.models.CommissionLog || mongoose.model('CommissionLog', CommissionLogSchema);
export const CommissionAudit = mongoose.models.CommissionAudit || mongoose.model('CommissionAudit', CommissionAuditSchema);
export const PassiveIncomePool = mongoose.models.PassiveIncomePool || mongoose.model('PassiveIncomePool', PassiveIncomePoolSchema);
export const CompanyFund = mongoose.models.CompanyFund || mongoose.model('CompanyFund', CompanyFundSchema);
export const MonolineSettings = mongoose.models.MonolineSettings || mongoose.model('MonolineSettings', MonolineSettingsSchema);

// New models for direct Mongoose migration
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const ClonePage = mongoose.models.ClonePage || mongoose.model('ClonePage', ClonePageSchema);
export const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);
export const MonolineCommission = mongoose.models.MonolineCommission || mongoose.model('MonolineCommission', MonolineCommissionSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
export const MemberLog = mongoose.models.MemberLog || mongoose.model('MemberLog', MemberLogSchema);
export const MemberActivity = mongoose.models.MemberActivity || mongoose.model('MemberActivity', MemberActivitySchema);
export const AdminLog = mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);
export const ProductPurchase = mongoose.models.ProductPurchase || mongoose.model('ProductPurchase', ProductPurchaseSchema);
export const PaymentRequest = mongoose.models.PaymentRequest || mongoose.model('PaymentRequest', PaymentRequestSchema);
export const RealTimeTransaction = mongoose.models.RealTimeTransaction || mongoose.model('RealTimeTransaction', RealTimeTransactionSchema);
export const MemberSession = mongoose.models.MemberSession || mongoose.model('MemberSession', MemberSessionSchema);
export const SystemDocument = mongoose.models.SystemDocument || mongoose.model('SystemDocument', SystemDocumentSchema);
export const HatimProgress = mongoose.models.HatimProgress || mongoose.model('HatimProgress', HatimProgressSchema);
export const DuaRequest = mongoose.models.DuaRequest || mongoose.model('DuaRequest', DuaRequestSchema);

// --- PanelContent ---
const PanelContentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  panel: { type: String, enum: ['manevi', 'zahiri', 'batini'], required: true, index: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String }, // For short descriptions
  details: { type: Schema.Types.Mixed }, // For complex data
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PanelContent = mongoose.models.PanelContent || mongoose.model('PanelContent', PanelContentSchema);

// --- PendingPlacement ---
const PendingPlacementSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sponsorId: { type: String, required: true, index: true },
  newUserId: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'placed', 'expired'], default: 'pending' },
  newUserData: {
    fullName: String,
    email: String,
    phone: String,
    membershipType: String
  },
  updatedAt: { type: Date, default: Date.now }
});

export const PendingPlacement = mongoose.models.PendingPlacement || mongoose.model('PendingPlacement', PendingPlacementSchema);

export const ZoomTraining = mongoose.models.ZoomTraining || mongoose.model('ZoomTraining', ZoomTrainingSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Aliases
export const User = UserModel;