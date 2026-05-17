import "dotenv/config";
import mongoose from "mongoose";
import { mlmDb } from "../lib/mlm-database";
import { hashPassword, generateReferralCode } from "../lib/utils";
import { User, Role, CareerLevel } from "../../shared/mlm-types";

// --- AYARLAR ---
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/kutbulzaman";

// --- DEFAULT CAREER LEVEL ---
const defaultCareerLevel: CareerLevel = {
  id: "1",
  name: "Nefs-i Emmare",
  displayName: "Entry",
  description: "Giriş seviyesi",
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

// --- EVENT LISTENER MANTIĞI ---
async function onUserRegistered(user: User) {
  console.log(`   ⚡ Event Tetiklendi: ${user.fullName}`);

  // 1. Satın Alma İşlemi ($100)
  await mlmDb.createTransaction({
    userId: user.id,
    type: "purchase",
    amount: 100,
    description: "Initial purchase $100 (Seeder)",
    status: "completed",
  });

  // 2. Yıllık Aktivite ($200)
  await mlmDb.updateUser(user.id, {
    annualSalesVolume: (user.annualSalesVolume || 0) + 200,
    monthlySalesVolume: (user.monthlySalesVolume || 0) + 200,
    isActive: true,
    totalInvestment: (user.totalInvestment || 0) + 100,
  });

  await mlmDb.createTransaction({
    userId: user.id,
    type: "system_fee",
    amount: 0,
    description: "Annual activity check: $200 volume added",
    status: "completed",
  });

  // 3. PV ve Bonus Hesaplama
  const pv = 100;
  const bonusRate = 0.10;
  const bonus = pv * bonusRate;

  // 4. Monoline Sponsor Bonus
  let currentSponsorId = user.sponsorId;
  let depth = 1;

  while (currentSponsorId) {
    const sponsor = await mlmDb.getUserById(currentSponsorId);
    if (!sponsor) break;

    console.log(`      💰 [Seviye ${depth}] Sponsor Bonusu: ${sponsor.fullName} kazanıyor -> $${bonus}`);

    const newBalance = (sponsor.wallet.balance || 0) + bonus;
    const newSponsorBonus = (sponsor.wallet.sponsorBonus || 0) + bonus;
    const newTotalEarnings = (sponsor.wallet.totalEarnings || 0) + bonus;

    await mlmDb.updateUser(sponsor.id, {
      wallet: {
        ...sponsor.wallet,
        balance: newBalance,
        sponsorBonus: newSponsorBonus,
        totalEarnings: newTotalEarnings,
      },
    });

    await mlmDb.createTransaction({
      userId: sponsor.id,
      type: "bonus",
      amount: bonus,
      description: `Monoline Bonus from ${user.fullName} (Level ${depth})`,
      status: "completed",
    });

    currentSponsorId = sponsor.sponsorId;
    depth++;
  }
}

// --- SEEDER ---
async function seed() {
  console.log("🌱 Seeding başlatılıyor...");

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log("✅ DB Bağlandı");
    }

    // 1. İlk Kullanıcı: Abdulkadir Kan
    const adminEmail = "abdulkadir@example.com";
    let firstUser = await mlmDb.getUserByEmail(adminEmail);

    if (!firstUser) {
      console.log("👤 Abdulkadir Kan oluşturuluyor...");
      firstUser = await mlmDb.createUser({
        fullName: "Abdulkadir Kan",
        email: adminEmail,
        phone: "5550000000",
        password: hashPassword("Password123!"),
        role: "admin" as Role,
        sponsorId: null,
        referralCode: generateReferralCode("Abdulkadir Kan"),
        isActive: true,
        wallet: {
          balance: 0,
          totalEarnings: 0,
          sponsorBonus: 0,
          careerBonus: 0,
          passiveIncome: 0,
          leadershipBonus: 0,
        },
        careerLevel: defaultCareerLevel,
      });

      await onUserRegistered(firstUser);
    } else {
      console.log("ℹ️ Abdulkadir Kan zaten mevcut.");
    }

    // 2. Sonraki 10 Kullanıcı
    let lastUserId = firstUser.id;

    for (let i = 1; i <= 10; i++) {
      const email = `sultan${i}@example.com`;
      let user = await mlmDb.getUserByEmail(email);

      if (!user) {
        console.log(`👤 Sultan ${i} oluşturuluyor...`);
        user = await mlmDb.createUser({
          fullName: `Sultan ${i}`,
          email,
          phone: `555000000${i}`,
          password: hashPassword("Password123!"),
          role: "member" as Role,
          sponsorId: lastUserId,
          referralCode: generateReferralCode(`Sultan ${i}`),
          isActive: true,
          wallet: {
            balance: 0,
            totalEarnings: 0,
            sponsorBonus: 0,
            careerBonus: 0,
            passiveIncome: 0,
            leadershipBonus: 0,
          },
          careerLevel: defaultCareerLevel,
        });

        await onUserRegistered(user);

        lastUserId = user.id;
      } else {
        console.log(`ℹ️ Sultan ${i} zaten mevcut.`);
        lastUserId = user.id;
      }
    }

    console.log("\n✅ Seeding tamamlandı! Admin panelinden kontrol edebilirsiniz.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding hatası:", error);
    process.exit(1);
  }
}
// Auto-run guard: only execute when explicitly enabled
if (process.env.RUN_SEED === "true") {
  seed();
}
