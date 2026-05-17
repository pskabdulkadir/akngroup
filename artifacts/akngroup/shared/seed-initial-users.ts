import { mlmDb } from "../server/lib/mlm-database";
import { User, MembershipPackage, CareerLevel } from "./mlm-types";
import { hashPassword, generateReferralCode } from "./utils";

export async function seedInitialData() {
  console.log("Seeding initial packages...");

  const packages: MembershipPackage[] = [
    { id: "pkg_basic", name: "Basic", price: 50, description: "Basic Package", duration: 30, durationDays: 30, type: "monthly", features: [], currency: "USD", bonusPercentage: 0, commissionRate: 0 },
    { id: "pkg_pro", name: "Pro", price: 150, description: "Pro Package", duration: 30, durationDays: 30, type: "monthly", features: [], currency: "USD", bonusPercentage: 0, commissionRate: 0 },
  ];

  for (const pkg of packages) {
    await mlmDb.addPackage(pkg);
  }

  console.log("Seeding initial users...");

  const defaultCareerLevel: CareerLevel = {
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
  };

  const users: User[] = [
    {
      id: "user1",
      name: "Admin User",
      fullName: "Admin User",
      email: "admin@example.com",
      password: hashPassword("admin123"),
      referralCode: "ADMIN001", // Added referralCode
      sponsorId: undefined,
      isActive: true, // Added isActive
      phone: "1234567890",
      membershipType: "premium",
      package: "Basic",
      role: "admin",
      wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
      pointsSystem: { personalSalesPoints: 0, teamSalesPoints: 0, directReferrals: 0, minimumMonthlyPoints: 0, registrationPoints: 0, totalPoints: 0, monthlyPoints: 0 },
      careerLevel: defaultCareerLevel,
      totalTeamSize: 0,
      totalInvestment: 0,
      directReferrals: 0
    },
    {
      id: "user2",
      name: "John Doe",
      fullName: "John Doe",
      email: "john@example.com",
      password: hashPassword("john123"),
      referralCode: "USER001", // Added referralCode
      sponsorId: "user1",
      isActive: true, // Added isActive
      phone: "0987654321",
      membershipType: "basic",
      package: "Pro",
      role: "user",
      wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
      pointsSystem: { personalSalesPoints: 0, teamSalesPoints: 0, directReferrals: 0, minimumMonthlyPoints: 0, registrationPoints: 0, totalPoints: 0, monthlyPoints: 0 },
      careerLevel: defaultCareerLevel,
      totalTeamSize: 0,
      totalInvestment: 0,
      directReferrals: 0
    },
  ];

  for (const user of users) {
    await mlmDb.addUser(user);
  }

  console.log("Seeding finished!");
}