import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import { hashPassword, generateReferralCode } from "./utils.js";
import {
  User,
  Product,
  ClonePage,
  SystemSettings,
  PasswordReset,
  MonolineCommission,
  Announcement,
  MemberLog,
  MemberActivity,
  AdminLog,
  ProductPurchase,
  PaymentRequest,
  RealTimeTransaction,
  WalletTransaction,
  PassiveIncomePool,
  CompanyFund,
  MonolineSettings,
  MemberSession,
  SystemDocument,
  HatimProgress,
  DuaRequest,
  PanelContent,
  PendingPlacement,
  CareerLevelModel,
} from "./models.js";
import { User as IUser } from "../../shared/mlm-types";
import { PointsCareerService } from "./points-career-service";
import { pgPersistence } from "./pg-persistence";

export const mongoDb = {
  async init() {
    try {
      let mongoUri = process.env.MONGODB_URI?.trim();

      if (mongoUri && mongoUri.startsWith("MONGODB_URI=")) {
        mongoUri = mongoUri.replace(/^MONGODB_URI=/, "");
      }

      const isPlaceholder = mongoUri && (
        mongoUri.includes("username:password") || 
        mongoUri.includes("<password>") ||
        (mongoUri.includes("cluster.mongodb.net") && (mongoUri.includes("username") || mongoUri.includes("password")))
      );
      
      const isLocal = !mongoUri ||
        mongoUri.includes("localhost") ||
        mongoUri.includes("127.0.0.1") ||
        mongoUri.includes("example") ||
        mongoUri.includes("0.0.0.0") ||
        isPlaceholder;

      const startInMemory = async () => {
        console.log("🔄 Attempting to start In-Memory MongoDB...");
        try {
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create({
            instance: {
              dbName: "kutbulzaman"
            }
          });
          const uri = mongod.getUri();
          console.log(`✅ In-Memory MongoDB Started: ${uri}`);
          process.env.MONGODB_URI = uri;
          process.env.USE_REDIS = "false";
          return uri;
        } catch (error) {
          console.error("❌ Failed to start In-Memory MongoDB:", error);
          return null;
        }
      };

      if (isLocal && process.env.NODE_ENV !== "production") {
        console.warn("⚠️ No valid remote MongoDB found or placeholder detected. URI:", isPlaceholder ? "[PLACEHOLDER]" : (mongoUri || "none"));
        const inMemoryUri = await startInMemory();
        if (inMemoryUri) mongoUri = inMemoryUri;
      }

      if (!mongoUri) {
        console.warn("⚠️ MONGODB_URI not found. Using local default.");
        mongoUri = "mongodb://127.0.0.1:27017/kutbulzaman";
      }

      const connectWithRetry = async (uri: string) => {
        console.log("🔄 Connecting to MongoDB...");
        try {
          await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000, 
            connectTimeoutMS: 5000,
          });
          console.log("✅ MongoDB connected successfully");
          return true;
        } catch (error) {
          console.error("❌ Mongoose connection failed:", error instanceof Error ? error.message : String(error));
          return false;
        }
      };

      if (mongoose.connection.readyState === 0) {
        let connected = await connectWithRetry(mongoUri);
        
        // If remote fails and we're not in production, try in-memory as a last resort
        if (!connected && !isLocal && process.env.NODE_ENV !== "production") {
          console.warn("🔄 Remote connection failed. Falling back to In-Memory MongoDB...");
          const inMemoryUri = await startInMemory();
          if (inMemoryUri) {
            connected = await connectWithRetry(inMemoryUri);
          }
        }

        if (!connected) {
          console.error("❌ All MongoDB connection attempts failed.");
          return this;
        }
      }

      // Initialize PostgreSQL persistence layer & restore data
      await pgPersistence.init();
      if (pgPersistence.enabled) {
        console.log("🔄 Loading persisted data from PostgreSQL...");
        const pgUsers = await pgPersistence.loadAllUsers();
        for (const u of pgUsers) {
          await User.findOneAndUpdate({ id: u.id }, { $setOnInsert: u }, { upsert: true, setDefaultsOnInsert: true }).catch(() => {});
        }
        const pgTxs = await pgPersistence.loadAllWalletTransactions();
        for (const tx of pgTxs) {
          const ref = tx.reference || tx.id;
          if (ref) await WalletTransaction.findOneAndUpdate({ $or: [{ reference: ref }, { id: ref }] }, { $setOnInsert: tx }, { upsert: true, setDefaultsOnInsert: true }).catch(() => {});
        }
        const pgPayments = await pgPersistence.loadAllPaymentRequests();
        for (const p of pgPayments) {
          if (p.id) await PaymentRequest.findOneAndUpdate({ id: p.id }, { $setOnInsert: p }, { upsert: true, setDefaultsOnInsert: true }).catch(() => {});
        }
        const pgProducts = await pgPersistence.loadAllProducts();
        for (const prod of pgProducts) {
          if (prod.id) await Product.findOneAndUpdate({ id: prod.id }, { $setOnInsert: prod }, { upsert: true, setDefaultsOnInsert: true }).catch(() => {});
        }
        console.log(`✅ Restored from PostgreSQL: ${pgUsers.length} users, ${pgTxs.length} transactions, ${pgProducts.length} products`);
      }

      // Initialize default settings if not exists
      await this.initializeDefaultSettings();

      // Create admin user if requested
      if (process.env.RUN_SEED === "true") {
        await this.createSeedData();
      }

      // Migrate legacy data if it exists
      await this.migrateLegacyData();

      return this;
    } catch (error) {
      console.error("❌ MongoDB initialization failed:", error);
      return this;
    }
  },

  async migrateLegacyData() {
    try {
      const dbPath = path.join(process.cwd(), "database.json");
      try {
        await fs.access(dbPath);
      } catch {
        return; // No legacy database to migrate
      }

      console.log("📂 Migration: Found legacy database.json. Starting migration...");
      const dbData = JSON.parse(await fs.readFile(dbPath, "utf-8"));

      // Migrate Users
      if (dbData.users && Array.isArray(dbData.users)) {
        for (const userData of dbData.users) {
          const exists = await User.findOne({ email: userData.email });
          if (!exists) {
            // Remove sensitive fields if they cause issues, though createUser handles it
            await this.createUser(userData);
            console.log(`✅ Migrated user: ${userData.email}`);
          }
        }
      }

      // Rename file to prevent re-migration
      await fs.rename(dbPath, `${dbPath}.bak`);
      console.log("📁 Migration: Legacy database renamed to database.json.bak");
    } catch (error) {
      console.error("❌ Migration error:", error);
    }
  },

  async initializeDefaultSettings() {
    const defaultSettings = [
      {
        key: "systemSettings",
        value: {
          maxCapacity: 1000000,
          autoPlacement: true,
          registrationEnabled: true,
          maintenanceMode: false,
        },
        description: "Sistem genel ayarları",
      },
      {
        key: "commissionSettings",
        value: {
          sponsorBonusRate: 10,
          careerBonusRate: 25,
          passiveIncomeRate: 5,
          systemFundRate: 60,
        },
        description: "Komisyon dağıtım ayarları",
      },
    ];

    for (const setting of defaultSettings) {
      await SystemSettings.findOneAndUpdate(
        { key: setting.key },
        { $set: setting },
        { upsert: true, new: true }
      );
    }

    // Initialize MonolineSettings (force update to $100 product price)
    await MonolineSettings.findOneAndUpdate(
      {},
      {
        $set: {
          isEnabled: true,
          productPrice: 100,
          directSponsorBonus: {
            percentage: 15,
            amount: 15,
          },
          depthCommissions: {
            level1: { percentage: 12.5, amount: 12.5 },
            level2: { percentage: 7.5,  amount: 7.5  },
            level3: { percentage: 5.0,  amount: 5.0  },
            level4: { percentage: 3.5,  amount: 3.5  },
            level5: { percentage: 2.5,  amount: 2.5  },
            level6: { percentage: 2.0,  amount: 2.0  },
            level7: { percentage: 1.5,  amount: 1.5  },
          },
          passiveIncomePool: {
            percentage: 0.5,
            amount: 0.5,
            distribution: "equal",
          },
          companyFund: {
            percentage: 50,
            amount: 50,
          },
        }
      },
      { upsert: true, new: true }
    );

    // Initialize PassiveIncomePool if not exists
    const existingPool = await PassiveIncomePool.findOne();
    if (!existingPool) {
      await PassiveIncomePool.create({
        totalAmount: 0,
        settings: {
          minimumActiveMembers: 10,
          distributionFrequency: "monthly",
          percentage: 0.5,
        },
      });
    }

    // Initialize CompanyFund if not exists
    const existingFund = await CompanyFund.findOne();
    if (!existingFund) {
      await CompanyFund.create({
        totalAmount: 0,
        transactions: [],
      });
    }
  },

  async createSeedData() {
    // Check if Sultan seed users already exist
    const sultanUsersSeeded = await User.findOne({ email: "sultan1@akngroup.com" }).lean();
    const userCount = await User.countDocuments();
    if (userCount === 0 || !sultanUsersSeeded) {
      console.log("⚙️  Creating default admin and seed users...");

      // Create admin user (skip if already exists)
      let adminUser = await User.findOne({ email: "psikologabdulkadirkan@gmail.com" }).lean();
      if (!adminUser) {
        adminUser = await this.createUser({
          fullName: "Abdulkadir Kan",
          email: "psikologabdulkadirkan@gmail.com",
          password: await hashPassword("Abdulkadir1983"),
          role: "admin",
          isActive: true,
          memberId: "ak000001",
          referralCode: "ak000001",
          careerLevel: {
            id: "1",
            name: "Emmare",
            displayName: "Emmare",
            level: 1,
          },
          wallet: {
            balance: 0,
            totalEarnings: 0,
            sponsorBonus: 0,
            careerBonus: 0,
            passiveIncome: 0,
            leadershipBonus: 0,
          },
        });
        console.log("✅ Admin user created: psikologabdulkadirkan@gmail.com (ak000001)");
      } else {
        console.log("ℹ️  Admin user already exists, skipping creation");
      }

      // Remove any previously seeded non-Sultan or old users (keep admin)
      await User.deleteMany({
        email: { $ne: "psikologabdulkadirkan@gmail.com" },
        role: { $ne: "admin" }
      });
      console.log("🗑️  Old seed users removed");

      // Create 20 Sultan users:
      // - sponsorId = adminUser.id (ALL are direct referrals of Abdulkadir Kan)
      // - monoline chain: admin → Sultan 1 → Sultan 2 → ... → Sultan 20 (auto-built by createUser)
      const adminId = (adminUser as any).id;
      for (let i = 1; i <= 20; i++) {
        const email = `sultan${i}@akngroup.com`;
        const existing = await User.findOne({ email }).lean();
        if (existing) continue;
        await this.createUser({
          fullName: `Sultan ${i}`,
          email,
          phone: `5550000${String(i).padStart(3, "0")}`,
          password: await hashPassword("Sultan2024!"),
          role: "user",
          isActive: true,
          sponsorId: adminId,
          careerLevel: { id: "1", name: "Emmare", displayName: "Emmare", level: 1 },
          wallet: {
            balance: 0,
            totalEarnings: 0,
            sponsorBonus: 0,
            careerBonus: 0,
            passiveIncome: 0,
            leadershipBonus: 0,
          },
          totalInvestment: 100,
          directReferrals: 0,
          registrationDate: new Date(Date.now() - (20 - i) * 86400000),
        });
      }
      console.log("✅ 20 Sultan seed users created (all direct to Abdulkadir Kan, monoline chain)");
    }

    // MIGRATION: ensure all existing products have inStock field set
    await Product.updateMany(
      { inStock: { $exists: false } },
      { $set: { inStock: true } }
    ).catch(() => {});

    // PRODUCT SEEDING — delete old products and create 6 fresh ones with YouTube links
    const existingProductCount = await Product.countDocuments();
    if (existingProductCount === 0 || !(await Product.findOne({ downloadUrl: /youtu\.be/ }))) {
      await Product.deleteMany({});
      console.log("🗑️  Old products removed");

      const products = [
        {
          name: "Manevi Rehber – Bölüm 1",
          description: "Manevi yolculuğunuzun temellerini atan ilk rehber video içeriği. Satın alma sonrası anında izleyebilirsiniz.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/aN61MtyDt98",
          image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
        {
          name: "Manevi Rehber – Bölüm 2",
          description: "Nefs terbiyesi ve iç huzura ulaşma yolları üzerine ikinci rehber içerik.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/1aXGofxNysE",
          image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
        {
          name: "Manevi Rehber – Bölüm 3",
          description: "Derinleşme ve farkındalık çalışmaları üzerine üçüncü rehber içerik.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/q7BmFRHCq1U",
          image: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
        {
          name: "Manevi Rehber – Bölüm 4",
          description: "İleri seviye manevi pratikler ve günlük zikir programları.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/2HIKXwS6P3M",
          image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
        {
          name: "Manevi Rehber – Bölüm 5",
          description: "Ruhsal denge ve kalp temizliği üzerine beşinci rehber içerik.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/LzN7Wd9_FgE",
          image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
        {
          name: "Manevi Rehber – Bölüm 6",
          description: "Tamamlayıcı manevi eğitim: özet ve ileri pratikler.",
          price: 100,
          category: "Video İçerik",
          isDigital: true,
          inStock: true,
          downloadUrl: "https://youtu.be/EfKIvgUtWEg",
          image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=500",
          stock: 9999,
          isActive: true
        },
      ];

      for (const prodData of products) {
        await this.adminCreateProduct(prodData as any);
        console.log(`🆕 Product added: ${prodData.name}`);
      }
    }
    console.log("✅ Seed products check completed");
  },

  // User Methods
  async getUserWalletBalance(userId: string, currency: string = 'USD') {
    const user = await this.getUserById(userId);
    return { available: user?.wallet?.balance || 0, frozen: 0 };
  },

  async getUserWalletBalances(userId: string) {
    const user = await this.getUserById(userId);
    return user?.wallet || {
      balance: 0,
      totalEarnings: 0,
      sponsorBonus: 0,
      careerBonus: 0,
      passiveIncome: 0,
      leadershipBonus: 0,
    };
  },

  async getPendingWalletTransactions() {
    return await WalletTransaction.find({ 
      status: { $in: ['pending', 'PENDING'] } 
    }).lean();
  },

  async initializeUserWallet(userId: string) {
    return await this.updateUser(userId, {
      wallet: {
        balance: 0,
        totalEarnings: 0,
        sponsorBonus: 0,
        careerBonus: 0,
        passiveIncome: 0,
        leadershipBonus: 0,
      }
    });
  },

  async getAdminBankDetails() {
    return {
      bankName: "Kutbul Zaman Bank",
      accountHolder: "Abdulkadir Kan",
      iban: "TR00 0000 0000 0000 0000 0000 00",
      description: "Lütfen ödeme açıklamasında Member ID nizi belirtin."
    };
  },

  async getCryptoRates() {
    // Mock rates for now, can be integrated with external API later
    return {
      BTC: 65000,
      ETH: 3500,
      USDT: 1.0,
      updatedAt: new Date()
    };
  },

  async updateCryptoRates(rates: any) {
    // In a real app, store this in a settings collection
    return true;
  },

  async updateWalletBalance(userId: string, currency: string, amount: number, type: string) {
    if (type === 'set') {
      return await this.updateUser(userId, { 'wallet.balance': amount } as any);
    }
    
    // For add/subtract/freeze, we use our atomic helper
    const increment = type === 'subtract' || type === 'freeze' ? -amount : amount;
    return await this.incrementWalletBalance(userId, increment, 'balance');
  },

  async getAllWalletTransactions(limit: number = 100, offset: number = 0) {
    const transactions = await WalletTransaction.find({}).sort({ date: -1 }).limit(limit).skip(offset).lean();
    const total = await WalletTransaction.countDocuments();
    return { transactions, total };
  },

  async getUserWalletTransactions(userId: string, limit: number = 100, offset: number = 0) {
    const transactions = await WalletTransaction.find({ userId }).sort({ date: -1 }).limit(limit).skip(offset).lean();
    const total = await WalletTransaction.countDocuments({ userId });
    return { transactions, total };
  },

  async completeWithdrawal(id: string, adminId: string) {
    const tx = await WalletTransaction.findOneAndUpdate(
      { id, type: 'withdrawal' },
      { $set: { status: 'completed', updatedAt: new Date(), processedBy: adminId } },
      { new: true, lean: true }
    );
    return tx;
  },

  async updateTransactionStatus(id: string, status: string) {
    return await WalletTransaction.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date() } },
      { new: true, lean: true }
    );
  },

  async getProductSalesStats() {
    // In a real app, aggregate from a Purchases collection
    return {
      totalSales: 0,
      totalRevenue: 0,
      topProducts: [],
      recentPurchases: []
    };
  },

  async createUser(data: Partial<IUser> & { password?: string }) {
    const userId = data.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Generate sequential memberId if not provided
    let memberId = data.memberId;
    if (!memberId || !memberId.startsWith('ak')) {
      memberId = await this.getNextMemberId();
    }

    // Reference ID (referralCode) MUST be the same as memberId
    const referralCode = memberId;

    // Find the last user in the global monoline chain
    const lastUser = await User.findOne({ globalRank: { $exists: true } }).sort({ globalRank: -1 }).lean();
    const globalRank = lastUser ? (lastUser.globalRank || 0) + 1 : 1;
    const previousUserId = lastUser ? lastUser.id : null;

    const userData = {
      id: userId,
      fullName: data.fullName || "Unnamed",
      email: data.email,
      phone: data.phone || "",
      password: data.password || "",
      role: data.role || "user",
      membershipType: data.membershipType || "entry",
      membershipStartDate: data.membershipStartDate || new Date(),
      careerLevel: data.careerLevel || {
        id: "1",
        name: "Emmare",
        displayName: "Emmare",
        level: 1,
      },
      wallet: data.wallet || {
        balance: 0,
        totalEarnings: 0,
        sponsorBonus: 0,
        careerBonus: 0,
        passiveIncome: 0,
        leadershipBonus: 0,
      },
      isActive: data.isActive ?? true,
      sponsorId: data.sponsorId || null,
      previousUserId,
      globalRank,
      referralCode,
      memberId,
      kycStatus: data.kycStatus || "pending",
      twoFactorEnabled: data.twoFactorEnabled ?? false,
      registrationDate: data.registrationDate || new Date(),
      totalInvestment: data.totalInvestment || 0,
      directReferrals: data.directReferrals || 0,
      totalTeamSize: data.totalTeamSize || 0,
    };

    const user = new User(userData);
    await user.save();
    const userObj = user.toObject();
    pgPersistence.saveUser(userObj).catch(() => {});
    return userObj;
  },

  async getUserById(id: string) {
    if (!id) return null;
    return await User.findOne({ 
      $or: [
        { id: id },
        { memberId: id },
        { referralCode: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    }).lean();
  },

  async getUserByEmail(email: string) {
    if (!email) return null;
    return await User.findOne({ email: email.toLowerCase() }).lean();
  },

  async getUserByReferralCode(code: string) {
    return await User.findOne({ referralCode: code }).lean();
  },

  async getUserByPhone(phone: string) {
    return await User.findOne({ phone }).lean();
  },

  async getUserByMemberId(memberId: string) {
    return await User.findOne({ memberId }).lean();
  },

  async updateUser(id: string, updates: Partial<IUser> | any) {
    if (!id) return null;
    
    // Normalize careerLevel if it's a number/ID
    if (updates.careerLevel && (typeof updates.careerLevel === 'number' || typeof updates.careerLevel === 'string')) {
      const allLevels = PointsCareerService.getDefaultCareerLevels();
      const levelIdOrNum = updates.careerLevel.toString();
      const foundLevel = allLevels.find(l => 
        l.level.toString() === levelIdOrNum || 
        l.id.toString() === levelIdOrNum || 
        l.name.toLowerCase() === levelIdOrNum.toLowerCase()
      );
      if (foundLevel) {
        updates.careerLevel = foundLevel;
      }
    }

    const updated = await User.findOneAndUpdate(
      { 
        $or: [
          { id: id },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
        ]
      },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, lean: true }
    );
    if (updated) pgPersistence.saveUser(updated).catch(() => {});
    return updated;
  },

  async incrementWalletBalance(userId: string, amount: number, type: keyof IUser['wallet'] = 'balance') {
    if (!userId) return null;
    const update: any = { $inc: {}, $set: { updatedAt: new Date() } };
    update.$inc[`wallet.${type}`] = amount;
    
    // If we're adding to balance, also add to totalEarnings
    if (type === 'balance') {
      update.$inc['wallet.totalEarnings'] = amount;
    }

    return await User.findOneAndUpdate(
      { 
        $or: [
          { id: userId },
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : [])
        ]
      },
      update,
      { new: true, lean: true }
    );
  },

  async deleteUser(id: string) {
    if (!id) return false;
    
    // 1. Get the user first to know their identities
    const user = await User.findOne({ 
      $or: [
        { id: id },
        { memberId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    }).lean();

    if (!user) {
      console.warn(`⚠️ User to delete not found: ${id}`);
      return false;
    }

    const userId = user.id;
    const mongoId = user._id;
    const memberId = user.memberId;

    console.log(`🗑️ Deleting user: ${user.fullName} (ID: ${userId}, MongoID: ${mongoId}, MemberID: ${memberId})`);

    // 2. Delete all related data across all possible identifiers used in collections
    const deleteOperations = [
      User.deleteOne({ _id: mongoId }),
      MemberSession.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      WalletTransaction.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      MemberLog.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      MemberActivity.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      MonolineCommission.deleteMany({ recipientId: { $in: [userId, mongoId.toString()] } }),
      MonolineCommission.deleteMany({ sourceUserId: { $in: [userId, mongoId.toString()] } }),
      ProductPurchase.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      PaymentRequest.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      RealTimeTransaction.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      HatimProgress.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      DuaRequest.deleteMany({ userId: { $in: [userId, mongoId.toString()] } }),
      PendingPlacement.deleteMany({ sponsorId: userId }),
      PendingPlacement.deleteMany({ newUserId: userId }),
    ];

    if (userId) {
      deleteOperations.push(User.deleteOne({ id: userId }));
    }

    await Promise.all(deleteOperations);

    console.log(`✅ User ${user.fullName} and all associated data deleted.`);
    return true;
  },

  async createMemberSession(data: {
    memberId: string;
    userId: string;
    sessionToken: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = new MemberSession({
      id: sessionId,
      ...data,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await session.save();
    return sessionId;
  },

  async endMemberSession(sessionId: string) {
    await MemberSession.findOneAndUpdate(
      { id: sessionId },
      { $set: { isActive: false, endedAt: new Date() } }
    );
    return true;
  },

  async clearAllUsers() {
    const adminEmail = "psikologabdulkadirkan@gmail.com";
    const adminMemberId = "ak000001";
    
    // Find the admin to be safe
    const admin = await User.findOne({ email: adminEmail }).lean();
    
    const filter = {
      $and: [
        { email: { $ne: adminEmail } },
        { memberId: { $ne: adminMemberId } }
      ]
    };

    // Get IDs of users to be deleted for multi-collection cleanup
    const usersToDelete = await User.find(filter).select('id').lean();
    const userIds = usersToDelete.map(u => u.id);

    // Delete all users EXCEPT the admin email, or the ak000001 ID
    const result = await User.deleteMany(filter);
    
    // Clear related data for these users
    if (userIds.length > 0) {
      await Promise.all([
        MemberSession.deleteMany({ userId: { $in: userIds } }),
        WalletTransaction.deleteMany({ userId: { $in: userIds } }),
        MemberLog.deleteMany({ userId: { $in: userIds } }),
        MemberActivity.deleteMany({ userId: { $in: userIds } }),
        MonolineCommission.deleteMany({ recipientId: { $in: userIds } }),
        MonolineCommission.deleteMany({ sourceUserId: { $in: userIds } }),
        ProductPurchase.deleteMany({ userId: { $in: userIds } }),
        PaymentRequest.deleteMany({ userId: { $in: userIds } }),
        RealTimeTransaction.deleteMany({ userId: { $in: userIds } }),
        HatimProgress.deleteMany({ userId: { $in: userIds } }),
        DuaRequest.deleteMany({ userId: { $in: userIds } }),
        PendingPlacement.deleteMany({ sponsorId: { $in: userIds } }),
        PendingPlacement.deleteMany({ newUserId: { $in: userIds } }),
      ]);
    } else if (!admin) {
      // If no admin and no users found (should not happen normally), clear all sessions just in case
      await MemberSession.deleteMany({});
    }

    return result.deletedCount;
  },

  async getAllUsers() {
    return await User.find({}).lean();
  },

  async getUsers(limit: number = 100, skip: number = 0) {
    return await User.find({}).limit(limit).skip(skip).lean();
  },

  // Career Level Methods
  async getCareerLevels() {
    const levels = await CareerLevelModel.find({}).sort({ order: 1 }).lean();
    if (levels.length === 0) {
      // Initialize with defaults if empty
      const defaults = PointsCareerService.getDefaultCareerLevels();
      for (const level of defaults) {
        await CareerLevelModel.create(level);
      }
      return defaults;
    }
    return levels;
  },

  async saveCareerLevel(levelData: any) {
    const id = levelData.id || `level-${Date.now()}`;
    return await CareerLevelModel.findOneAndUpdate(
      { id },
      { $set: { ...levelData, id } },
      { upsert: true, new: true, lean: true }
    );
  },

  async deleteCareerLevel(id: string) {
    return await CareerLevelModel.deleteOne({ id });
  },

  // Legacy searchUsers...
  async searchUsers(query: string, role?: string, status?: string) {
    let filter: any = {};

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { memberId: { $regex: query, $options: "i" } },
        { phone: { $regex: query } },
      ];
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    return await User.find(filter).lean();
  },

  async adminSearchUsers(criteria: any) {
    const {
      search,
      role,
      isActive,
      limit = 50,
      offset = 0,
      sortBy = "registrationDate",
      sortOrder = "desc",
    } = criteria;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;

    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await User.countDocuments(filter);

    return { users, total };
  },

  async migrateMemberIds() {
    console.log("🚀 Starting Member ID and Sponsorship migration...");
    // Sort by registration date to maintain sequential order
    const users = await User.find({}).sort({ registrationDate: 1 }).lean();
    let updatedCount = 0;

    // Phase 1: Assign new memberId and referralCode
    console.log("🔄 Phase 1: Assigning new sequential IDs...");
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const newId = `ak${(i + 1).toString().padStart(6, '0')}`;
        
        await User.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    memberId: newId,
                    referralCode: newId,
                    updatedAt: new Date()
                } 
            }
        );
        updatedCount++;
    }

    // Phase 2: Update sponsorId references to use the new akXXXXXX format
    console.log("🔄 Phase 2: Updating sponsorship references...");
    const allUsers = await User.find({}).lean();
    const idToMemberIdMap = new Map();
    
    // Create a robust mapping for both internal ID and existing member ID
    allUsers.forEach(u => {
        if (u.id) idToMemberIdMap.set(u.id, u.memberId);
        if (u.memberId) idToMemberIdMap.set(u.memberId, u.memberId);
        if (u._id) idToMemberIdMap.set(u._id.toString(), u.memberId);
    });

    for (const user of allUsers) {
        if (user.sponsorId && idToMemberIdMap.has(user.sponsorId)) {
            const newSponsorMemberId = idToMemberIdMap.get(user.sponsorId);
            // Only update if it's different from current
            if (user.sponsorId !== newSponsorMemberId) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { sponsorId: newSponsorMemberId } }
                );
            }
        }
    }

    console.log(`✅ Member ID migration completed. Updated ${updatedCount} users.`);
    return updatedCount;
  },

  // Auth & Session
  async createPasswordReset(userId: string, phone: string, code: string, expiresAt: Date | string) {
    const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const reset = new PasswordReset({
      userId,
      phone,
      code,
      expiresAt: expires,
      type: 'phone',
    });
    await reset.save();
    return reset.toObject();
  },

  async verifyPasswordReset(phone: string, code: string) {
    const reset = await PasswordReset.findOne({ phone, code, type: 'phone' });
    if (!reset) return { valid: false, reason: 'not_found' };
    if (new Date() > reset.expiresAt) return { valid: false, reason: 'expired' };
    return { valid: true, userId: reset.userId };
  },

  async consumePasswordReset(phone: string, code: string) {
    await PasswordReset.deleteMany({ phone, code, type: 'phone' });
    return true;
  },

  async createEmailPasswordReset(userId: string, email: string, code: string, expiresAt: Date | string) {
    const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const reset = new PasswordReset({
      userId,
      email,
      code,
      expiresAt: expires,
      type: 'email',
    });
    await reset.save();
    return reset.toObject();
  },

  async verifyEmailPasswordReset(email: string, code: string) {
    const reset = await PasswordReset.findOne({ email, code, type: 'email' });
    if (!reset) return { valid: false, reason: 'not_found' };
    if (new Date() > reset.expiresAt) return { valid: false, reason: 'expired' };
    return { valid: true, userId: reset.userId };
  },

  async consumeEmailPasswordReset(email: string, code: string) {
    await PasswordReset.deleteMany({ email, code, type: 'email' });
    return true;
  },

  // Logs & Activities
  async createMemberLog(data: { userId: string; action: string; details?: any }) {
    const log = new MemberLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      timestamp: new Date(),
    });
    await log.save();
    return log.toObject();
  },

  async createMemberActivity(data: { userId: string; activityType: string; details?: any }) {
    const activity = new MemberActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      timestamp: new Date(),
    });
    await activity.save();
    return activity.toObject();
  },

  async createAdminLog(data: { adminId: string; action: string; targetUserId?: string; details?: any }) {
    const log = new AdminLog({
      id: `admin-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      timestamp: new Date(),
    });
    await log.save();
    return log.toObject();
  },

  async getAdminLogs(criteria?: any) {
    const filter = criteria?.adminId ? { adminId: criteria.adminId } : {};
    const logs = await AdminLog.find(filter).sort({ timestamp: -1 }).lean();
    return { logs, total: logs.length };
  },

  async getMemberLogs(criteria?: any) {
    const filter = criteria?.userId ? { userId: criteria.userId } : {};
    const logs = await MemberLog.find(filter).sort({ timestamp: -1 }).lean();
    return { logs, total: logs.length };
  },

  async getMemberActivities(criteria?: any) {
    const filter = criteria?.userId ? { userId: criteria.userId } : {};
    const activities = await MemberActivity.find(filter).sort({ timestamp: -1 }).lean();
    return { activities, total: activities.length };
  },

  // Products
  async getAllProducts() {
    try {
      console.log("🔍 Fetching all products from database...");
      const products = await Product.find({ 
        $or: [
          { isActive: true },
          { isActive: { $exists: false } },
          { isActive: null }
        ]
      }).sort({ createdAt: -1 }).lean();
      console.log(`📦 Found ${products.length} products`);
      // Ensure inStock defaults to true when field is missing
      return products.map((p: any) => ({
        ...p,
        inStock: p.inStock !== undefined ? p.inStock : true,
      }));
    } catch (error) {
      console.error("Error in getAllProducts:", error);
      return [];
    }
  },

  async getProductById(id: string) {
    return await Product.findOne({ id }).lean();
  },

  async adminGetAllProducts() {
    const products = await Product.find({}).lean();
    return products.map((p: any) => ({
      ...p,
      inStock: p.inStock !== undefined ? p.inStock : true,
    }));
  },

  async adminCreateProduct(data: {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isDigital?: boolean;
    downloadUrl?: string;
    stock?: number;
  }) {
    try {
      if (!data.name || !data.description || !data.price || !data.image || !data.category) {
        return {
          success: false,
          error: "Gerekli alanlar eksik: name, description, price, image, category",
        };
      }

      if (data.category === "new" || !data.category.trim()) {
        return {
          success: false,
          error: "Lütfen bir kategori seçin veya yeni kategori adı girin",
        };
      }

      if (!data.image.startsWith('http')) {
        return {
          success: false,
          error: "Ürün resmi geçerli bir URL olmalıdır (http ile başlamalı)",
        };
      }

      const productId = `prod-${Date.now()}`;
      const product = new Product({
        id: productId,
        ...data,
        isActive: true,
        rating: 0,
        reviews: 0,
        stock: data.stock || 0,
      });

      await product.save();
      const productObj = product.toObject();
      pgPersistence.saveProduct(productObj).catch(() => {});
      console.log(`✅ Ürün başarıyla oluşturuldu: ${data.name} (ID: ${productId})`);
      return { success: true, product: productObj, message: "Ürün başarıyla oluşturuldu" };
    } catch (error) {
      console.error("Product creation error:", error);
      return {
        success: false,
        error: "Ürün oluşturulurken hata oluştu: " + (error as Error).message,
      };
    }
  },

  async adminUpdateProduct(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isDigital: boolean;
    downloadUrl: string;
    isActive: boolean;
    inStock: boolean;
    stock: number;
  }>) {
    try {
      // Check existence first
      const existing = await Product.collection.findOne({ id });
      if (!existing) {
        return { success: false, error: "Ürün bulunamadı" };
      }

      if (data.category === "new") {
        return { success: false, error: "Lütfen bir kategori seçin veya yeni kategori adı girin" };
      }

      if (data.image && !data.image.startsWith('http')) {
        return { success: false, error: "Ürün resmi geçerli bir URL olmalıdır (http ile başlamalı)" };
      }

      // Build update payload from allowed fields only
      const allowed = [
        "name", "description", "price", "image", "category",
        "isDigital", "downloadUrl", "isActive", "inStock", "stock",
      ] as const;
      const setFields: Record<string, unknown> = { updatedAt: new Date() };
      for (const key of allowed) {
        if ((data as any)[key] !== undefined) {
          setFields[key] = (data as any)[key];
        }
      }

      // Use native MongoDB collection to bypass all Mongoose virtual/id conflicts
      await Product.collection.updateOne(
        { id },
        { $set: setFields }
      );

      // Fetch fresh from MongoDB after update
      const updated = await Product.collection.findOne({ id });
      if (!updated) {
        return { success: false, error: "Güncelleme sonrası ürün okunamadı" };
      }

      pgPersistence.saveProduct(updated as any).catch(() => {});
      return { success: true, product: updated, message: "Ürün başarıyla güncellendi" };
    } catch (error) {
      return {
        success: false,
        error: "Ürün güncellenirken hata oluştu: " + (error as Error).message,
      };
    }
  },

  async adminDeleteProduct(id: string) {
    try {
      const result = await Product.collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return { success: false, error: "Ürün bulunamadı" };
      }
      pgPersistence.deleteProduct(id).catch(() => {});
      return { success: true, message: "Ürün başarıyla silindi" };
    } catch (error) {
      return {
        success: false,
        error: "Ürün silinirken hata oluştu: " + (error as Error).message,
      };
    }
  },

  // Product Purchases
  async createProductPurchase(data: {
    userId: string;
    productId: string;
    quantity?: number;
    totalAmount: number;
    referralCode?: string;
  }) {
    const purchase = new ProductPurchase({
      id: `purch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      quantity: data.quantity || 1,
      date: new Date(),
    });
    await purchase.save();
    return { success: true, purchase: purchase.toObject() };
  },

  async getUserProductPurchases(userId: string) {
    return await ProductPurchase.find({ userId }).sort({ date: -1 }).lean();
  },

  async getProductPurchaseById(id: string) {
    return await ProductPurchase.findOne({ id }).lean();
  },

  async updateProductPurchase(id: string, updates: Partial<any>) {
    return await ProductPurchase.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, lean: true }
    );
  },

  async distributeProductCommissions(purchaseId: string) {
    try {
      const purchase = await ProductPurchase.findOne({ id: purchaseId });
      if (!purchase || purchase.commissionDistributed) {
        return { success: false, error: "Satın alma bulunamadı veya komisyon dağıtıldı" };
      }

      const sponsor = await this.getUserByReferralCode(purchase.referralCode);
      if (!sponsor) {
        console.warn(`Sponsor not found for referral code: ${purchase.referralCode}`);
        return { success: false, error: "Sponsor bulunamadı" };
      }

      const purchaseAmount = purchase.totalAmount || 0;
      
      // Calculate dynamic commission based on sponsor's career level
      const careerLevels = await this.getCareerLevels();
      const sponsorLevelName = (sponsor.careerLevel as any)?.name || sponsor.careerLevel || 'Emmare';
      const careerData = careerLevels.find(l => l.name.toLowerCase() === sponsorLevelName.toLowerCase());
      
      const ratePercent = careerData?.benefits?.directSalesCommission || careerData?.commissionRate || 15;
      const sponsorCommission = purchaseAmount * (ratePercent / 100);

      // Update sponsor wallet
      const newBalance = (sponsor.wallet?.balance || 0) + sponsorCommission;
      const newTotalEarnings = (sponsor.wallet?.totalEarnings || 0) + sponsorCommission;
      const newSponsorBonus = (sponsor.wallet?.sponsorBonus || 0) + sponsorCommission;

      await this.updateUser(sponsor.id, {
        wallet: {
          ...sponsor.wallet,
          balance: newBalance,
          totalEarnings: newTotalEarnings,
          sponsorBonus: newSponsorBonus,
        },
      });

      // Create transaction record
      const transaction = {
        id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: sponsor.id,
        type: "commission",
        amount: sponsorCommission,
        description: `Ürün satın alma komisyonu - ${purchaseId}`,
        status: "completed",
        date: new Date().toISOString(),
        referenceId: purchaseId,
        adminNote: `Product purchase commission (15%)`,
      };

      await this.createTransaction(transaction);

      // Mark purchase as commission distributed
      await this.updateProductPurchase(purchaseId, {
        commissionDistributed: true,
        commissionDistributedAt: new Date(),
      });

      console.log(`✅ Komisyon başarıyla dağıtıldı: ${sponsor.fullName} - ${sponsorCommission}$ (Ref: ${purchaseId})`);
      return { success: true, commission: sponsorCommission, sponsorId: sponsor.id };
    } catch (error) {
      console.error("Error distributing commissions:", error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Social Media Settings
  async getSocialMediaLinks() {
    const setting = await SystemSettings.findOne({ key: "social_media_links" }).lean();
    return setting?.value || {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      tiktok: "",
      whatsapp: ""
    };
  },

  async saveSocialMediaLinks(links: any) {
    return await SystemSettings.findOneAndUpdate(
      { key: "social_media_links" },
      { $set: { value: links, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  // Spiritual Content Management
  async getSpiritualContent() {
    const setting = await SystemSettings.findOne({ key: "spiritual_content" }).lean();
    if (!setting?.value) {
      return {
        hadiths: [],
        sunnahs: [],
        quotes: [],
        quranPlaylist: ""
      };
    }
    return setting.value;
  },

  async updateSpiritualContent(content: any) {
    return await SystemSettings.findOneAndUpdate(
      { key: "spiritual_content" },
      { $set: { value: content, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  async deleteSpiritualItem(type: 'hadiths' | 'sunnahs' | 'quotes', id: string) {
    const content = await this.getSpiritualContent();
    content[type] = content[type].filter((item: any) => String(item.id) !== String(id));
    return await this.updateSpiritualContent(content);
  },

  async deleteTestUsers() {
    const filter = {
      $or: [
        { email: { $regex: "@example\\.com$", $options: "i" } },
        { fullName: { $regex: "test", $options: "i" } },
        { email: { $regex: "^test", $options: "i" } }
      ],
      role: { $ne: "admin" } // Güvenlik önlemi: Gerçek adminleri kazara silmemek için
    };
    const result = await User.deleteMany(filter);
    return result.deletedCount;
  },

  async addHadith(hadith: any) {
    const content = await this.getSpiritualContent();
    content.hadiths.push({
      id: `hadith-${Date.now()}`,
      ...hadith,
      createdAt: new Date()
    });
    return await this.updateSpiritualContent(content);
  },

  // Document Management
  async getSystemDocuments() {
    return await SystemDocument.find({}).sort({ updatedAt: -1 }).lean();
  },

  async createSystemDocument(data: any) {
    const doc = new SystemDocument({
      ...data,
      id: data.id || `doc-${Date.now()}`,
      updatedAt: new Date()
    });
    await doc.save();
    return doc.toObject();
  },

  async updateSystemDocument(id: string, updates: any) {
    return await SystemDocument.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, lean: true }
    );
  },

  async deleteSystemDocument(id: string) {
    const result = await SystemDocument.deleteOne({ id });
    return result.deletedCount === 1;
  },

  // Hatim Progress Methods
  async getHatimProgress(userId: string) {
    let progress = await HatimProgress.findOne({ userId }).lean();
    if (!progress) {
      // Create initial progress if not found
      progress = {
        userId,
        currentPage: 1,
        progress: 0,
        lastReadAt: new Date(),
        isCompleted: false,
        history: []
      };
      await HatimProgress.create(progress);
    }
    return progress;
  },

  async updateHatimProgress(userId: string, page: number) {
    const progressPerc = Math.round((page / 604) * 100);
    const isCompleted = page >= 604;
    
    return await HatimProgress.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          currentPage: page, 
          progress: progressPerc, 
          isCompleted,
          lastReadAt: new Date() 
        },
        $push: { 
          history: { 
            $each: [{ page, date: new Date() }],
            $slice: -10 // Keep last 10 updates
          } 
        }
      },
      { upsert: true, new: true, lean: true }
    );
  },

  // Dua Kardeşliği (Dua Brotherhood) Methods
  async getDuaRequests(activeOnly = true) {
    const filter = activeOnly ? { isActive: true } : {};
    return await DuaRequest.find(filter).sort({ createdAt: -1 }).lean();
  },

  async createDuaRequest(userId: string, data: any) {
    const newDua = new DuaRequest({
      id: `dua-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title: data.title,
      content: data.content,
      category: data.category || "Genel",
      targetCount: data.targetCount || 0,
    });
    await newDua.save();
    return newDua.toObject();
  },

  async joinDua(duaId: string, userId: string) {
    const dua = await DuaRequest.findOne({ id: duaId });
    if (!dua) return { success: false, message: "Dua bulunamadı" };
    
    if (dua.participants.includes(userId)) {
      return { success: false, message: "Zaten katıldınız" };
    }

    dua.participants.push(userId);
    dua.participantCount = dua.participants.length;
    
    if (dua.targetCount > 0 && dua.participantCount >= dua.targetCount) {
      dua.isCompleted = true;
    }

    await dua.save();
    return { success: true, dua: dua.toObject() };
  },

  async deleteDuaRequest(duaId: string, userId: string, isAdmin = false) {
    const filter = isAdmin ? { id: duaId } : { id: duaId, userId };
    const result = await DuaRequest.deleteOne(filter);
    return result.deletedCount === 1;
  },

  // Promotions & Gifts
  async getPromotionSettings() {
    const setting = await SystemSettings.findOne({ key: "promotions" }).lean();
    return setting?.value || [];
  },

  async savePromotions(promotions: any[]) {
    return await SystemSettings.findOneAndUpdate(
      { key: "promotions" },
      { $set: { value: promotions, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  async getGiftSettings() {
    const setting = await SystemSettings.findOne({ key: "gift_settings" }).lean();
    return setting?.value || {
      welcomeBonus: 0,
      firstDepositBonus: 0,
      achievementRewards: [],
      seasonalCampaigns: []
    };
  },

  async saveGiftSettings(settings: any) {
    return await SystemSettings.findOneAndUpdate(
      { key: "gift_settings" },
      { $set: { value: settings, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  // Wallet & Transactions
  async createWalletTransaction(transaction: any) {
    return this.createTransaction(transaction);
  },

  async createTransaction(transaction: any) {
    const tx = new WalletTransaction({
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await tx.save();
    const txObj = tx.toObject();
    pgPersistence.saveWalletTransaction(txObj).catch(() => {});
    return txObj;
  },

  async getRealTimeTransactions(criteria?: any) {
    try {
      const filter = criteria?.userId ? { userId: criteria.userId } : {};
      
      // Try fetching from both collections if applicable, or preferred collection
      // For real-time display, RealTimeTransaction is usually better suited for string IDs
      let transactions = await RealTimeTransaction.find(filter).sort({ 'timestamps.created': -1 }).lean();
      
      // If we need WalletTransaction too, we must be careful with ObjectId casting
      try {
        const walletFilter: any = {};
        if (criteria?.userId) {
          // Only add userId to filter if it's a valid ObjectId hex string (24 chars) or if we use string IDs
          // Since we are changing WalletTransaction to use String IDs, we can just use it
          walletFilter.userId = criteria.userId;
        }
        const walletTxs = await WalletTransaction.find(walletFilter).sort({ createdAt: -1 }).lean();
        
        // Merge and sort
        const merged = [...transactions, ...walletTxs].sort((a, b) => {
          const dateA = a.timestamps?.created || a.createdAt || 0;
          const dateB = b.timestamps?.created || b.createdAt || 0;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        
        return { transactions: merged, total: merged.length };
      } catch (e) {
        console.error("WalletTransaction query failed:", e);
        return { transactions, total: transactions.length };
      }
    } catch (error) {
      console.error("error in getRealTimeTransactions:", error);
      return { transactions: [], total: 0 };
    }
  },

  async createRealTimeTransaction(data: {
    userId: string;
    amount: number;
    type: string;
    description?: string;
    reference?: string;
  }) {
    const tx = new RealTimeTransaction({
      id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      status: 'pending',
      timestamps: {
        created: new Date(),
      },
    });
    await tx.save();
    return { success: true, transaction: tx.toObject(), transactionId: tx.id };
  },

  async processDepositRequest(id: string, adminId: string, action: string, note: string) {
    const tx = await WalletTransaction.findOne({ id });
    if (!tx) return { success: false, message: "İşlem bulunamadı" };

    tx.status = action === 'approve' ? 'completed' : 'rejected';
    tx.adminNote = note;
    tx.processedBy = adminId;
    tx.processedAt = new Date();
    await tx.save();

    if (action === 'approve') {
      await this.incrementWalletBalance(tx.userId, tx.amount);
    }

    return { success: true, transaction: tx.toObject() };
  },

  async processWithdrawalRequest(id: string, adminId: string, action: string, note: string) {
    const tx = await WalletTransaction.findOne({ id });
    if (!tx) return { success: false, message: "İşlem bulunamadı" };

    tx.status = action === 'approve' ? 'completed' : 'rejected';
    tx.adminNote = note;
    tx.processedBy = adminId;
    tx.processedAt = new Date();
    await tx.save();

    if (action === 'reject') {
      await this.incrementWalletBalance(tx.userId, tx.amount);
    }

    return { success: true, transaction: tx.toObject() };
  },

  // Network & MLM
  async getDirectReferrals(userId: string) {
    return await User.find({ sponsorId: userId }).lean();
  },

  async getTotalTeamSize(userId: string): Promise<number> {
    const directs = await this.getDirectReferrals(userId);
    let count = directs.length;
    for (const direct of directs) {
      count += await this.getTotalTeamSize(direct.id);
    }
    return count;
  },

  async getNetworkTree(userId: string, depth: number) {
    const user = await this.getUserById(userId);
    if (!user || depth < 0) return null;

    const directs = await this.getDirectReferrals(userId);
    const children = await Promise.all(
      directs.map(d => this.getNetworkTree(d.id, depth - 1))
    );

    return {
      user,
      children: children.filter(c => c !== null),
    };
  },

  // Monoline downline: returns the next `depth` members below this user by globalRank.
  // This is the correct approach for monoline systems where all users share the same sponsor.
  async getMonolineDownline(userId: string, depth: number = 7) {
    const user = await this.getUserById(userId);
    if (!user) return { user: null, downline: [] };

    const userRank = user.globalRank || 0;
    const downline = await User.find({
      globalRank: { $gt: userRank, $lte: userRank + depth },
    }).sort({ globalRank: 1 }).lean();

    return { user, downline };
  },

  // Settings
  async getSettings() {
    const settings = await SystemSettings.find({}).lean();
    const settingsObj: any = {};
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value;
    }
    return settingsObj;
  },

  async getSystemSettings() {
    const settings = await SystemSettings.find({}).lean();
    return settings.map(s => ({ key: s.key, value: s.value }));
  },

  async updateSystemSetting(key: string, value: any) {
    return await SystemSettings.findOneAndUpdate(
      { key },
      { $set: { value, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  async updateSettings(settings: any) {
    const updatePromises = Object.entries(settings).map(([key, value]) =>
      SystemSettings.findOneAndUpdate(
        { key },
        { $set: { value, updatedAt: new Date() } },
        { upsert: true, new: true }
      )
    );
    await Promise.all(updatePromises);
    return this.getSettings();
  },

  // Monoline
  async getMonolineSettings() {
    return await MonolineSettings.findOne().lean();
  },

  async updateMonolineSettings(settings: any) {
    return await MonolineSettings.findOneAndUpdate(
      {},
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true, new: true, lean: true }
    );
  },

  async addToPassiveIncomePool(amount: number) {
    const pool = await PassiveIncomePool.findOne();
    if (!pool) {
      await PassiveIncomePool.create({ totalAmount: amount });
    } else {
      await PassiveIncomePool.findOneAndUpdate(
        {},
        {
          $inc: { totalAmount: amount },
          lastUpdated: new Date(),
        }
      );
    }
    return true;
  },

  async getPassiveIncomePoolAmount() {
    const pool = await PassiveIncomePool.findOne();
    return pool?.totalAmount || 0;
  },

  async addToCompanyFund(amount: number) {
    const fund = await CompanyFund.findOne();
    if (!fund) {
      await CompanyFund.create({
        totalAmount: amount,
        transactions: [{ amount, createdAt: new Date() }],
      });
    } else {
      await CompanyFund.findOneAndUpdate(
        {},
        {
          $inc: { totalAmount: amount },
          lastUpdated: new Date(),
          $push: { transactions: { amount, createdAt: new Date() } },
        }
      );
    }
    return true;
  },

  async createCompanyFundTransaction(data: { amount: number; note?: string; sourceUserId?: string }) {
    const fund = await CompanyFund.findOne();
    if (fund) {
      fund.transactions.push({
        amount: data.amount,
        sourceUserId: data.sourceUserId,
        reference: `cf-tx-${Date.now()}`,
        createdAt: new Date(),
      });
      await fund.save();
      return fund.transactions[fund.transactions.length - 1];
    }
    return null;
  },

  async createMonolineCommissionTransactions(transactions: any[]) {
    const recordedTransactions = transactions.map(t => ({
      id: `mct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...t,
      createdAt: new Date(),
      status: t.status || 'pending',
    }));

    await MonolineCommission.insertMany(recordedTransactions);

    // Apply to wallets
    for (const t of transactions) {
      if (t.recipientId && typeof t.amount === 'number' && t.amount > 0) {
        await this.incrementWalletBalance(t.recipientId, t.amount, 'balance');

        // Create wallet transaction record
        await this.createWalletTransaction({
          userId: t.recipientId,
          amount: t.amount,
          type: t.type || "commission",
          reference: `MONO-${Date.now()}`,
          description: t.description || "Monoline commission",
          status: "completed",
        });
      }
    }

    return { success: true, transactionCount: recordedTransactions.length };
  },

  async resetPassiveIncomePool() {
    await PassiveIncomePool.findOneAndUpdate(
      {},
      { $set: { totalAmount: 0, lastUpdated: new Date() } }
    );
    return true;
  },

  async createPassiveIncomeDistribution(data: any) {
    const entry = { id: `pid-${Date.now()}`, ...data, createdAt: new Date() };
    // Store in a dedicated collection or as a document
    return entry;
  },

  async getUserMonolineCommissions(userId: string) {
    return await MonolineCommission.find({ recipientId: userId }).sort({ createdAt: -1 }).lean();
  },

  async calculateAndDistributeCommissions(amount: number, userId: string) {
    const percentages = [0.10, 0.05, 0.03, 0.02, 0.01];
    const chain: any[] = [];

    let current = await this.getUserById(userId);
    for (let i = 0; i < 10 && current; i++) {
      if (!current.sponsorId) break;
      const sponsor = await this.getUserById(current.sponsorId);
      if (!sponsor) break;
      chain.push(sponsor);
      current = sponsor;
    }

    const transactions: any[] = [];
    let distributed = 0;

    for (let i = 0; i < percentages.length; i++) {
      const recipient = chain[i];
      if (recipient) {
        const amt = Math.round(amount * percentages[i] * 100) / 100;
        distributed += amt;
        transactions.push({
          recipientId: recipient.id,
          amount: amt,
          type: 'monoline',
          sourceUserId: userId,
          level: i + 1,
          description: `Commission level ${i + 1}`,
        });
      }
    }

    const companyShare = Math.round((amount - distributed) * 100) / 100;
    if (companyShare > 0) {
      await this.addToCompanyFund(companyShare);
      await this.createCompanyFundTransaction({
        amount: companyShare,
        note: 'Residual commission to company fund',
        sourceUserId: userId,
      });
    }

    await this.createMonolineCommissionTransactions(transactions);
    return { success: true, totalDistributed: distributed, companyShare };
  },

  // Clone Pages
  async getClonePageBySlug(slug: string) {
    return await ClonePage.findOne({ slug }).lean();
  },

  async createClonePage(userId: string, name: string, slug: string) {
    const page = new ClonePage({
      userId,
      name,
      slug,
      isActive: true,
      visitCount: 0,
      conversionCount: 0,
    });
    await page.save();
    return page.toObject();
  },

  async getUserCloneStoreData(userId: string) {
    return await ClonePage.findOne({ userId }).lean();
  },

  async updateUserCloneStore(userId: string, data: any) {
    return await ClonePage.findOneAndUpdate(
      { userId },
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, lean: true }
    );
  },

  async trackClonePageVisit(slug: string) {
    await ClonePage.findOneAndUpdate(
      { slug },
      { $inc: { visitCount: 1 }, updatedAt: new Date() }
    );
  },

  // Payment Requests
  async createPaymentRequest(data: {
    userId: string;
    amount: number;
    method: string;
    proofFile?: string;
  }) {
    const request = new PaymentRequest({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      status: 'pending',
    });
    await request.save();
    const reqObj = request.toObject();
    pgPersistence.savePaymentRequest(reqObj).catch(() => {});
    return reqObj;
  },

  async updatePaymentRequest(id: string, updates: any) {
    const updated = await PaymentRequest.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, lean: true }
    );
    if (updated) pgPersistence.savePaymentRequest(updated).catch(() => {});
    return updated;
  },

  async getPaymentRequests() {
    return await PaymentRequest.find({}).sort({ createdAt: -1 }).lean();
  },

  // Announcements
  async getAnnouncements() {
    return await Announcement.find({ isActive: true }).sort({ priority: -1, createdAt: -1 }).lean();
  },

  async createAnnouncement(data: { title: string; content: string; type?: string; priority?: number }) {
    const announcement = new Announcement({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...data,
      isActive: true,
      createdAt: new Date(),
    });
    await announcement.save();
    return announcement.toObject();
  },

  // Panel Content Methods
  async getPanelContent(panel: string, category?: string) {
    const filter: any = { panel };
    if (category) filter.category = category;
    return await PanelContent.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  },

  async createPanelContent(data: any) {
    const panel = data.panel || 'general';
    const id = data.id || `pc-${panel}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const panelContent = new PanelContent({
      ...data,
      id
    });
    await panelContent.save();
    return panelContent.toObject();
  },

  async updatePanelContent(id: string, updates: any) {
    return await PanelContent.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, lean: true }
    );
  },

  async deletePanelContent(id: string) {
    return await PanelContent.deleteOne({ id });
  },

  async bulkSyncPanelContent(contents: any[]) {
    // This can be used to seed or update in bulk
    for (const content of contents) {
      const id = content.id || `pc-${content.panel}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await PanelContent.findOneAndUpdate(
        { id },
        { $set: { ...content, id, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    return true;
  },

  // Admin User Management
  async getMemberSessions(criteria: any = {}) {
    const { limit = 50, offset = 0, userId } = criteria;
    const filter: any = {};
    if (userId) filter.userId = userId;
    const sessions = await MemberSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    const total = await MemberSession.countDocuments(filter);
    return { sessions, total };
  },

  async getMemberTrackingStats(memberId: string) {
    return { lastActive: new Date(), loginCount: 1 };
  },

  // User Methods
  async getNextMemberId(): Promise<string> {
    try {
      const lastUser = await User.findOne({ memberId: /^ak\d{6}$/ }).sort({ memberId: -1 }).lean();
      if (!lastUser || !lastUser.memberId) {
        return "ak000001";
      }
      const lastNumber = parseInt(lastUser.memberId.replace("ak", ""));
      const nextNumber = lastNumber + 1;
      return `ak${String(nextNumber).padStart(6, '0')}`;
    } catch (error) {
      console.error("Error generating next member ID:", error);
      return `ak${String(Date.now()).slice(-6)}`;
    }
  },

  async adminCreateUser(data: any) {
    try {
      const { fullName, email, phone, password, role = "user", sponsorId, isActive = true, membershipType = "entry", initialBalance = 0 } = data;

      if (!fullName || !email || !phone || !password) {
        return { success: false, error: "Tüm gerekli alanlar doldurulmalıdır." };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: "Geçerli bir email adresi girin." };
      }

      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: "Bu email adresi zaten kayıtlıdır." };
      }

      const hashedPassword = await hashPassword(password);
      const memberId = await this.getNextMemberId();

      // createUser already handles globalRank and previousUserId logic
      const user = await this.createUser({
        fullName,
        email,
        phone,
        password: hashedPassword,
        role,
        sponsorId,
        isActive,
        membershipType,
        memberId,
        referralCode: memberId, // Using memberId as initial referral code too
        careerLevel: data.careerLevel || {
          id: "1",
          name: "Ziyaretçi",
          displayName: "Ziyaretçi",
          level: 0,
        },
        wallet: {
          balance: initialBalance,
          totalEarnings: 0,
          sponsorBonus: 0,
          careerBonus: 0,
          passiveIncome: 0,
          leadershipBonus: 0,
        },
        kycStatus: "pending",
        twoFactorEnabled: false,
      });

      return {
        success: true,
        user: { ...user, password: undefined },
        message: `${fullName} başarıyla oluşturuldu (ID: ${memberId})`,
      };
    } catch (error) {
      console.error("Admin create user error:", error);
      return {
        success: false,
        error: (error as Error).message || "Kullanıcı oluşturulurken hata oluştu.",
      };
    }
  },

  async adminMoveUser(userId: string, newSponsorId: string, adminId: string) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: "Kullanıcı bulunamadı." };
      }

      const newSponsor = await this.getUserById(newSponsorId);
      if (!newSponsor && newSponsorId !== "root") {
        return { success: false, error: "Yeni sponsor bulunamadı." };
      }

      // Prevent moving under self or children (cycle detection would be better but simple check for now)
      if (userId === newSponsorId) {
        return { success: false, error: "Kullanıcıyı kendisinin altına taşıyamazsınız." };
      }

      const oldSponsorId = user.sponsorId;
      await this.updateUser(userId, { sponsorId: newSponsorId === "root" ? undefined : newSponsorId });

      await this.createAdminLog({
        adminId,
        action: "MOVE_USER",
        targetUserId: userId,
        details: {
          oldSponsorId,
          newSponsorId,
          reason: "Admin reassignment"
        }
      });

      return { 
        success: true, 
        message: `${user.fullName} başarıyla yeni sponsorun (${newSponsor?.fullName || 'Sistem'}) altına taşındı.` 
      };
    } catch (error) {
      console.error("Admin move user error:", error);
      return { success: false, error: "Kullanıcı taşınırken hata oluştu." };
    }
  },

  async adminUpdateUser(id: string, data: any, adminId: string) {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        return { success: false, error: "Kullanıcı bulunamadı." };
      }

      const { fullName, email, phone, role, isActive, careerLevel, walletBalance, kycStatus, membershipType, twoFactorEnabled } = data;

      if (fullName) user.fullName = fullName;
      if (email && email !== user.email) {
        const existing = await this.getUserByEmail(email);
        if (existing && existing.id !== id) {
          return { success: false, error: "Bu email adresi zaten kullanılıyor." };
        }
        user.email = email;
      }
      if (phone && phone !== user.phone) {
        user.phone = phone;
      }
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      if (careerLevel) user.careerLevel = { ...user.careerLevel, name: careerLevel };
      if (walletBalance !== undefined && user.wallet) {
        user.wallet.balance = walletBalance;
      }
      if (kycStatus) user.kycStatus = kycStatus;
      if (membershipType) user.membershipType = membershipType;
      if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

      const updated = await this.updateUser(id, user);
      return {
        success: true,
        user: { ...updated, password: undefined },
        message: `${user.fullName} başarıyla güncellendi.`,
      };
    } catch (error) {
      console.error("Admin update user error:", error);
      return {
        success: false,
        error: (error as Error).message || "Kullanıcı güncellenirken hata oluştu.",
      };
    }
  },

  async adminDeleteUser(id: string, adminId: string, transferTo?: string) {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        return { success: false, error: "Kullanıcı bulunamadı." };
      }

      if (user.role === "admin") {
        return { success: false, error: "Admin kullanıcı silinemez." };
      }

      await this.deleteUser(id);
      return { success: true, message: `${user.fullName} başarıyla silindi.` };
    } catch (error) {
      console.error("Admin delete user error:", error);
      return {
        success: false,
        error: (error as Error).message || "Kullanıcı silinirken hata oluştu.",
      };
    }
  },

  // Performance & Stats
  async getPerformanceStatus() {
    return {};
  },

  async optimizeForScale() {
    return true;
  },

  async checkSystemCapacity() {
    return { canAddUser: true };
  },

  async batchUpdateUsers(updates: any[]) {
    const promises = updates.map(update =>
      this.updateUser(update.id, update.updates)
    );
    return await Promise.all(promises);
  },

  async getAllUsersWithActivity() {
    return await User.find({}).sort({ lastActivityDate: -1 }).lean();
  },

  async batchUpdateActivity(userIds: string[]) {
    return await User.updateMany(
      { id: { $in: userIds } },
      { $set: { lastActivityDate: new Date() } }
    );
  },

  async updateUserActivity(userId: string) {
    return await User.findOneAndUpdate(
      { id: userId },
      { $set: { lastActivityDate: new Date() } },
      { new: true }
    );
  },

  async getUserActivityStats(userId: string) {
    return { lastActivity: new Date(), streak: 0 };
  },

  // Team Placement Methods
  async getPendingPlacements(sponsorId: string) {
    return await PendingPlacement.find({ sponsorId, status: "pending" }).lean();
  },

  async createPendingPlacement(data: any) {
    const placement = new PendingPlacement({
      ...data,
      id: data.id || `placement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationDate: new Date(),
      status: "pending"
    });
    return await placement.save();
  },

  async updatePlacementStatus(placementId: string, status: string) {
    return await PendingPlacement.findOneAndUpdate(
      { id: placementId },
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );
  },

  // Export models for direct access
  User,
  Product,
  ClonePage,
  SystemSettings,
  MonolineCommission,
  WalletTransaction,
  MemberLog,
  MemberActivity,
  AdminLog,
  PaymentRequest,
  SystemDocument,
};

export class MongoDatabase {
  static getInstance() {
    return mongoDb;
  }
}