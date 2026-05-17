import { connectDB, disconnectDB } from "./db";
import { UserModel, MembershipPackageModel } from "./models";
import { User as IUser, MembershipPackage as IMembershipPackage } from "../../shared/mlm-types";
import { hashPassword } from "./utils";

const seed = async () => {
  await connectDB();

  const adminPassword = await hashPassword("admin123");

  // --- Default Users ---
  const defaultUsers: IUser[] = [
    {
      id: "admin-001",
      name: "Admin User",
      fullName: "Admin User",
      email: "admin@example.com",
      phone: "+905555555555",
      password: adminPassword,
      role: "admin",
      membershipType: "entry",
      package: "entry",
      referralCode: "ADMIN001",
      isActive: true,
      membershipStartDate: new Date(),
      registrationDate: new Date(),
      pointsSystem: { personalSalesPoints: 0, teamSalesPoints: 0, directReferrals: 0, minimumMonthlyPoints: 0, registrationPoints: 0, totalPoints: 0, monthlyPoints: 0 },
      careerLevel: {
        id: "1",
        name: "Entry",
        displayName: "Giriş Seviyesi",
        description: "Yeni üye seviyesi",
        minInvestment: 0,
        minDirectReferrals: 0,
        personalSalesPoints: 0,
        teamSalesPoints: 0,
        commissionRate: 0,
        order: 1,
        isActive: true,
        level: 1,
        passiveIncomeRate: 0,
        bonus: 0,
        requirements: {
          personalSalesPoints: 0,
          teamSalesPoints: 0,
          directReferrals: 0,
          minimumMonthlyPoints: 0
        },
        benefits: {
          directSalesCommission: 0,
          teamBonusRate: 0,
          monthlyBonus: 0,
          rankBonus: 0
        }
      },
      cloneStoreEnabled: true,
      cloneStoreName: "Admin Store",
      cloneStoreDescription: "Admin store description",
      cloneStoreTheme: "default",
      totalInvestment: 0,
      directReferrals: 0,
      totalTeamSize: 0,
      daysSinceLastActivity: 0,
      wallet: {
        balance: 0,
        totalEarnings: 0,
        sponsorBonus: 0,
        careerBonus: 0,
        passiveIncome: 0,
        leadershipBonus: 0
      }
    },
  ];

  // --- Default Packages ---
  const defaultPackages: IMembershipPackage[] = [
    {
      id: "entry",
      name: "Entry Package",
      description: "Başlangıç paketi",
      price: 0,
      duration: 30,
      durationDays: 30,
      type: "entry",
      features: ["Feature1", "Feature2"],
      currency: "USD",
      bonusPercentage: 0,
      commissionRate: 0,
    },
    {
      id: "monthly",
      name: "Monthly Package",
      description: "Aylık paket",
      price: 50,
      duration: 30,
      durationDays: 30,
      type: "monthly",
      features: ["Feature1", "Feature2"],
      currency: "USD",
      bonusPercentage: 5,
      commissionRate: 10,
    },
  ];

  await UserModel.deleteMany({});
  await MembershipPackageModel.deleteMany({});

  await UserModel.create(defaultUsers);
  await MembershipPackageModel.create(defaultPackages);

  console.log("✅ Seed tamamlandı!");
  await disconnectDB();
};

seed().catch((err) => {
  console.error("❌ Seed hatası:", err);
  disconnectDB();
});