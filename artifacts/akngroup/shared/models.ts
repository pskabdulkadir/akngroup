import mongoose, { Schema, Document, Model } from "mongoose";
import { User as IUser, CareerLevel as ICareerLevel, MembershipPackage as IMembershipPackage, PointsSystem as IPointsSystem } from "./mlm-types";

// --- CareerLevel ---
const CareerLevelSchema = new Schema<ICareerLevel>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: { type: String },
  minInvestment: { type: Number, default: 0 },
  minDirectReferrals: { type: Number, default: 0 },
  personalSalesPoints: { type: Number, default: 0 },
  teamSalesPoints: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0 },
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
});

// --- PointsSystem ---
const PointsSystemSchema = new Schema<IPointsSystem>({
  personalSalesPoints: { type: Number, default: 0 },
  teamSalesPoints: { type: Number, default: 0 },
  directReferrals: { type: Number, default: 0 },
  minimumMonthlyPoints: { type: Number, default: 0 },
});

const WalletSchema = new Schema({
  balance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  sponsorBonus: { type: Number, default: 0 },
  careerBonus: { type: Number, default: 0 },
});

// --- User ---
const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user", "moderator"], default: "user" },
  membershipType: { type: String, enum: ["entry", "monthly", "yearly"], default: "entry" },
  membershipStartDate: { type: Date, default: Date.now },
  pointsSystem: { type: PointsSystemSchema, required: false },
  careerLevel: { type: CareerLevelSchema, required: false },
  cloneStoreEnabled: { type: Boolean, default: false },
  cloneStoreName: { type: String },
  cloneStoreDescription: { type: String },
  cloneStoreTheme: { type: String },
  leftChild: { type: String },
  rightChild: { type: String },
  sponsorId: { type: String },
  isActive: { type: Boolean, default: false },
  wallet: { type: WalletSchema, default: {} },
  kycStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  twoFactorEnabled: { type: Boolean, default: false },
  memberId: { type: String },
  lastActivityDate: { type: Date },
  monthlyActivityStreak: { type: Number, default: 0 },
  yearlyRenewalDate: { type: Date },
  nextRenewalWarning: { type: Date },
  monthlyActivityStatus: { type: String },
  totalInvestment: { type: Number, default: 0 },
  directReferrals: { type: Number, default: 0 },
  totalTeamSize: { type: Number, default: 0 },
  monthlySalesVolume: { type: Number, default: 0 },
  annualSalesVolume: { type: Number, default: 0 },
  referralCode: { type: String },
  lastLoginDate: { type: Date },
  lastPaymentDate: { type: Date },
  receiptFile: { type: String },
  receiptUploadedAt: { type: Date },
  receiptVerified: { type: Boolean, default: false },
  membershipEndDate: { type: Date },
});

// --- MembershipPackage ---
const MembershipPackageSchema = new Schema<IMembershipPackage>({
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

export const UserModel: Model<IUser & Document> = mongoose.models.User || mongoose.model("User", UserSchema);
export const CareerLevelModel: Model<ICareerLevel & Document> =
  mongoose.models.CareerLevel || mongoose.model("CareerLevel", CareerLevelSchema);
export const MembershipPackageModel: Model<IMembershipPackage & Document> =
  mongoose.models.MembershipPackage || mongoose.model("MembershipPackage", MembershipPackageSchema);