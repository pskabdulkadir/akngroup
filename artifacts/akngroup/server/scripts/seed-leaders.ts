import mongoose from "mongoose";
import "dotenv/config";
import { User, MonolineSettings } from "../lib/models.js";
import { hashPasswordBcrypt } from "../lib/utils.js";
import { mongoDb } from "../lib/mongo-database.js";

async function seedLeaders() {
  try {
    console.log("🔄 Starting Leader Seeding...");
    
    // 1. Connect to MongoDB
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        mongoUri = "mongodb://127.0.0.1:27017/kutbulzaman";
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 2. Find Admin (The one whose ID will be used as sponsor)
    const adminUser = await User.findOne({ email: "psikologabdulkadirkan@gmail.com" });
    if (!adminUser) {
      console.error("❌ Admin user not found! Please ensure default seeds have run.");
      process.exit(1);
    }
    console.log(`👤 Admin Found: ${adminUser.fullName} (${adminUser.id})`);

    // 3. Shift existing users' globalRank by 20
    const shiftResult = await User.updateMany(
      { globalRank: { $exists: true } },
      { $inc: { globalRank: 20 } }
    );
    console.log(`📊 Shifting existing users: ${shiftResult.modifiedCount} users shifted.`);

    // Get the user who was previously at rank 1 (now rank 21)
    const formerFirstUser = await User.findOne({ globalRank: 21 });

    const leaderIds: string[] = [];
    let previousId: string | null = null;
    const defaultPasswordHash = await hashPasswordBcrypt("123456_degistir");

    // 4. Create 20 leaders
    for (let i = 1; i <= 20; i++) {
      const leaderName = `Lider_${String(i).padStart(2, '0')}`;
      const leaderEmail = `leader${i}@kutbulzaman.com`;
      const memberId = `LDR-${String(i).padStart(3, '0')}`;
      
      // Use mongoDb.createUser wrapper but with manual overrides for exact requirements
      const leaderData = {
        id: `ldr-${Date.now()}-${i}`,
        fullName: leaderName,
        email: leaderEmail,
        password: defaultPasswordHash,
        role: "leader",
        isActive: true,
        memberId: memberId,
        referralCode: memberId,
        sponsorId: adminUser.id,
        globalRank: i,
        previousUserId: previousId,
        careerLevel: {
          id: "1",
          name: "Emmare",
          displayName: "Emmare",
          level: 1,
        },
        wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 }
      };

      const newUser = new User(leaderData);
      await newUser.save();
      
      leaderIds.push(newUser.id);
      previousId = newUser.id;
      
      console.log(`✅ Created ${leaderName} (Rank: ${i})`);
    }

    // 5. Connect the former first user to the last leader (Lider_20)
    if (formerFirstUser) {
      await User.updateOne({ id: formerFirstUser.id }, { $set: { previousUserId: previousId } });
      console.log(`🔗 Connected former first user (${formerFirstUser.email}) to Lider_20`);
    }

    console.log("🚀 20 Lider Koltuğu Başarıyla Rezerve Edildi");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed leaders error:", error);
    process.exit(1);
  }
}

seedLeaders();
