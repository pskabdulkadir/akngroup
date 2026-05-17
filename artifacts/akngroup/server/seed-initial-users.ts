import { mlmDb as db } from "./lib/mlm-database.js";

/* --------------------------------------------------
   Yardımcı Güvenli Kontroller
-------------------------------------------------- */

async function userExistsByEmail(email: string) {
  if (typeof db.getUserByEmail === "function") {
    return await db.getUserByEmail(email);
  }

  const users = await db.getAllUsers?.();
  return users?.find((u: any) => u.email === email);
}

/* --------------------------------------------------
   Event (safe)
-------------------------------------------------- */
function onUserRegistered(user: any) {
  if (!user) return;
  console.log(`   ⚡ Event Tetiklendi: ${user.fullName}`);
}

/* --------------------------------------------------
   ADMIN SEED
-------------------------------------------------- */
async function seedAdmin() {
  const adminEmail = "psikologabdulkadirkan@gmail.com";

  const existingAdmin = await userExistsByEmail(adminEmail);
  if (existingAdmin) {
    console.log("🛡️ Admin zaten mevcut, atlandı");
    return existingAdmin;
  }

  const adminUser = {
    id: "admin-001",
    memberId: "ADMIN001",
    name: "Admin",
    fullName: "Abdulkadir Kan",
    email: adminEmail,
    phone: "05000000000",
    password: "admin123",
    role: "admin",
    referralCode: "ADMIN001",
    sponsorId: null,
    isActive: true,
    registrationDate: new Date(),
    membershipType: "lifetime",
    membershipStartDate: new Date(),
    wallet: { balance: 0 },
  };

  console.log("👤 Admin oluşturuluyor...");
  const created = await db.addUser(adminUser as any);
  onUserRegistered(created);

  return created;
}

/* --------------------------------------------------
   TEST USERS SEED (SULTAN 1–10)
-------------------------------------------------- */
async function seedTestUsers(admin: any) {
  for (let i = 1; i <= 10; i++) {
    const email = `sultan${i}@test.com`;

    const exists = await userExistsByEmail(email);
    if (exists) {
      console.log(`⏭️ Sultan ${i} zaten var, geçildi`);
      continue;
    }

    const user = {
      id: `user-seed-${i}`,
      memberId: `SULTAN${i}`,
      name: `Sultan ${i}`,
      fullName: `Sultan ${i}`,
      email,
      phone: `050000000${i}`,
      password: "123456",
      role: "member",
      referralCode: `SULTAN${i}`,
      sponsorId: admin.id,
      isActive: true,
      registrationDate: new Date(),
      membershipType: "monthly",
      membershipStartDate: new Date(),
      wallet: { balance: 0 },
    };

    console.log(`👤 Sultan ${i} oluşturuluyor...`);
    const created = await db.addUser(user as any);
    onUserRegistered(created);
  }
}

/* --------------------------------------------------
   MAIN SEED
-------------------------------------------------- */
export async function seed() {
  try {
    console.log("🌱 Seeding başlatılıyor...");
    await db.init();
    console.log("✅ DB Bağlandı");

    const admin = await seedAdmin();
    await seedTestUsers(admin);

    console.log("\n✅ Seeding tamamlandı! Duplicate oluşmadı.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding hatası:", err);
    process.exit(1);
  }
}
/* --------------------------------------------------
  AUTO RUN (guarded)
  Only run automatically when RUN_SEED environment variable is set to "true"
-------------------------------------------------- */
if (process.env.RUN_SEED === "true") {
  seed();
}