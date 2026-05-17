import { User, MembershipPackage } from "../../shared/mlm-types";
import { hashPassword, generateReferralCode } from "./utils.js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import mongoose from "mongoose";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_DIR = path.join(DATA_DIR, "users");
const INDEX_DIR = path.join(DATA_DIR, "index");
const DB_FILE = path.join(process.cwd(), "database.json");
const BUCKET_COUNT = 1024; // number of shard buckets for user files

export const mlmDb = {
  // lightweight in-memory indices (not full user objects)
  userIds: [] as string[],
  packages: [] as MembershipPackage[],
  indices: {
    referral: {} as Record<string, string>, // referralCode -> userId
    phone: {} as Record<string, string>, // phone -> userId
    sponsor: {} as Record<string, string[]>, // sponsorId -> [userId]
    email: {} as Record<string, string>, // email -> userId
    memberId: {} as Record<string, string>, // memberId -> userId
  },
  // placeholders for functions implemented later in file
  loadIndices: async () => { },
  saveIndices: async () => { },
  getUserFilePath: (id: string) => ({ file: '', dir: '' }),
  rebuildIndices: async () => { },

  // Mock for lowdb compatibility to satisfy mlm-automation-service.ts
  db: {
    read: async () => {
      try {
        // CRITICAL CHECK FOR PRODUCTION
        if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
          console.error("🚨 CRITICAL ERROR: MongoDB connection string is missing in PRODUCTION environment!");
          console.error("🚨 Unlike local development, file system storage (LowDB) is NOT persistent on cloud platforms like Render.");
          console.error("🚨 Please set MONGODB_URI or DATABASE_URL in your environment variables.");
          throw new Error("MongoDB connection required for production deployment.");
        }

        // 1. Try Loading from Mongo First (Cloud Persistence)
        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri) {
          console.log("☁️ Loading data from MongoDB (Cloud Persistence)...");
          const { UserModel, MembershipPackageModel, WalletTransaction, MonolineSettings, PendingPlacement } = await import("./models"); // Lazy import

          // Reconstruct LowDB state from Mongo
          const users = await UserModel.find({}).lean();
          const packages = await MembershipPackageModel.find({}).lean();
          const transactions = await WalletTransaction.find({}).lean();
          // ... load other collections as needed

          if (users.length > 0) {
            mlmDb.db.data = {
              users: users.map(u => ({ ...u, id: u.id || u._id.toString() })),
              // Map other data...
              products: [], // Products usually need model too, keeping empty safe for now if not model
              paymentRequests: [],
              clonePages: [],
              monolineTransactions: [],
              transactions: transactions.map(t => ({ ...t, id: t.id || t._id.toString() })),
              settings: {
                monolineParams: {
                  entryFee: 100, distributionRate: 0.7, levels: 10
                },
                systemSettings: {
                  maxCapacity: 1000,
                  autoPlacement: true,
                  registrationEnabled: true,
                  maintenanceMode: false
                },
                commissionSettings: {
                  sponsorBonusRate: 0.1,
                  careerBonusRate: 0.05,
                  passiveIncomeRate: 0.01,
                  systemFundRate: 0.05
                }
              }
            };
            mlmDb.userIds = mlmDb.db.data.users.map((u: any) => u.id);
            console.log(`✅ Loaded ${users.length} users from MongoDB.`);
            return; // START WITH MONGO DATA
          }
        }

        // 2. Fallback to Local File
        const data = await fs.readFile(DB_FILE, "utf-8");
        const json = JSON.parse(data);
        mlmDb.db.data = json;
        mlmDb.userIds = (json.users || []).map((u: any) => u.id).filter(Boolean);
        console.log(`📂 Local Database loaded: ${mlmDb.userIds.length} users`);
      } catch (error) {
        if ((error as any).message?.includes("MongoDB connection required")) {
          throw error;
        }
        console.log("📂 Database start fresh (No local file or Mongo empty)");
        mlmDb.db.data = { users: [], products: [], transactions: [], settings: {} };
      }
    },
    write: async () => {
      try {
        await fs.writeFile(DB_FILE, JSON.stringify(mlmDb.db.data, null, 2));
        console.log("💾 Database saved successfully");
      } catch (error) {
        console.error("❌ Database write error:", error);
        throw error;
      }
    },
    data: {
      users: [] as any[],
      products: [] as any[],
      paymentRequests: [] as any[],
      clonePages: [] as any[],
      walletTransactions: [] as any[],
      productPurchases: [] as any[],
      adminLogs: [] as any[],
      memberLogs: [] as any[],
      memberActivities: [] as any[],
      announcements: [] as any[],
      realTimeTransactions: [] as any[],
      monolineSettings: undefined,
      monolineCommissions: [],
      passiveIncomePool: { totalAmount: 0, lastUpdated: new Date() },
      companyFund: { totalAmount: 0, lastUpdated: new Date(), transactions: [] },
      passiveIncomeDistributions: [],
      transactions: [] as any[],
      settings: {
        systemSettings: {
          maxCapacity: 1000000,
          autoPlacement: true,
          registrationEnabled: true,
          maintenanceMode: false,
        },
        commissionSettings: {
          sponsorBonusRate: 10,
          careerBonusRate: 25,
          passiveIncomeRate: 5,
          systemFundRate: 60,
        },
      }
    }
  },

  async init() {
    // Ensure storage dirs exist
    await ensureDirs();

    // Connect to Mongoose explicitly if URI is provided
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (mongoUri && mongoose.connection.readyState === 0) {
        console.log("🔄 Connecting to MongoDB (Mongoose)...");
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose connected successfully");
      }
    } catch (error) {
      console.error("❌ Mongoose connection failed:", error);
      // Continue execution, don't block app startup, but warn loudly
    }

    // Load indices if any
    await this.loadIndices();

    // Migrate legacy single-file DB if present
    await this.db.read();
    if (this.db.data && Array.isArray(this.db.data.users) && this.db.data.users.length > 0) {
      // Deduplicate legacy users by id (keep last occurrence)
      const dedupMap: Record<string, any> = {};
      for (const u of this.db.data.users) {
        if (u && u.id) dedupMap[u.id] = u;
      }
      this.db.data.users = Object.values(dedupMap);
      // migrate users into sharded files if indices are empty
      if (Object.keys(this.indices.referral).length === 0) {
        console.log("🔁 Migrating legacy database.json users into sharded store...");
        for (const u of this.db.data.users) {
          try { await writeUserFile(u.id, u); updateIndicesForUser(u); } catch (e) { /* ignore */ }
        }
        await this.saveIndices();
        console.log("✅ Migration complete.");
      }
    }

    // If seed requested and no users, create default admin and seeds
    if (process.env.RUN_SEED === "true" && this.userIds.length === 0) {
      console.log("⚙️  Varsayılan Admin kullanıcısı oluşturuluyor...");
      const adminUser: any = {
        id: "admin-001",
        fullName: "Abdulkadir Kan",
        email: "psikologabdulkadirkan@gmail.com",
        password: await hashPassword("Abdulkadir1983"),
        role: "admin",
        isActive: true,
        wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
        careerLevel: { id: "1", name: "Nefs-i Emmare" },
        referralCode: "ADMIN001",
        sponsorId: null,
        memberId: "ADMIN001"
      };

      await this.addUser(adminUser);
      console.log("✅ Admin kullanıcısı hazır: psikologabdulkadirkan@gmail.com");

      // 10 Gerçek Kullanıcı Ekle (Başlangıç Üyeleri)
      console.log("🌱 Gerçek kullanıcılar (Sultan 1-10) oluşturuluyor...");
      let lastUserId = adminUser.id;

      for (let i = 1; i <= 10; i++) {
        const user: any = {
          id: `user-${i}`,
          fullName: `Sultan ${i}`,
          email: `sultan${i}@example.com`,
          password: await hashPassword("Password123!"),
          role: "user",
          isActive: true,
          wallet: { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
          careerLevel: { id: "1", name: "Nefs-i Emmare" },
          referralCode: generateReferralCode(8),
          sponsorId: lastUserId, // Seed verisi için zincirleme. Gerçekte Sponsor ve Yerleşim (Parent) farklı olabilir.
          memberId: `MEM-${1000 + i}`,
          phone: `555000000${i}`,
          registrationDate: new Date()
        };

        await this.addUser(user);
        lastUserId = user.id;
      }
      console.log("✅ 10 Gerçek kullanıcı başarıyla eklendi.");

      // İlk verileri kaydet
      await this.db.write();
    }

    // Initial sync
    this.syncAllToMongo().catch(e => console.error("Initial sync error:", e));
  },

  // User Methods
  async addUser(user: User) {
    // Idempotent: check by id, email, phone or referral
    if (!user.id) user.id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    // check id file
    const existing = await getUserByIdInternal(user.id);
    if (existing) return existing;

    // check by referral/email/phone via indices
    if (user.referralCode && this.indices.referral[user.referralCode]) {
      return await getUserByIdInternal(this.indices.referral[user.referralCode]);
    }
    if ((user as any).email) {
      // try find by email via legacy DB list
      const legacy = (this.db.data.users || []).find((u: any) => u.email === (user as any).email);
      if (legacy) {
        // Merge provided fields into legacy record to preserve membershipType/isActive
        Object.assign(legacy, user);
        // persist into sharded file and indices
        await writeUserFile(legacy.id, legacy);
        updateIndicesForUser(legacy);
        if (!this.userIds.includes(legacy.id)) this.userIds.push(legacy.id);
        // update legacy array entry
        this.db.data.users = this.db.data.users || [];
        const idx = this.db.data.users.findIndex((u: any) => u.id === legacy.id);
        if (idx === -1) this.db.data.users.push(legacy);
        else this.db.data.users[idx] = legacy;
        await this.saveIndices();
        await this.db.write();

        // SYNC TO MONGODB
        await this.syncUserToMongo(legacy);

        return legacy;
      }
    }

    // write user file and update indices
    await writeUserFile(user.id, user);
    updateIndicesForUser(user);
    this.userIds.push(user.id);
    // keep legacy array for compatibility
    this.db.data.users = this.db.data.users || [];
    this.db.data.users.push(user);
    await this.saveIndices();
    await this.db.write();

    // SYNC TO MONGODB
    await this.syncUserToMongo(user);

    return user as any;
  },
  async getUsers() { return Promise.all(this.userIds.slice(0, 100).map((id: string) => getUserByIdInternal(id))); },
  async getAllUsers() { return Promise.all(this.userIds.map((id: string) => getUserByIdInternal(id))); },
  async getUserByEmail(email: string) {
    if (!email) return null;
    const key = (email || '').toLowerCase();
    const id = this.indices.email && this.indices.email[key];
    if (id) return await getUserByIdInternal(id);
    // fallback to legacy array
    const legacy = (this.db.data.users || []).find((u: any) => (u.email || '').toLowerCase() === key);
    if (legacy) return legacy;
    // final fallback: scan userIds (slow)
    for (const uid of this.userIds) {
      const u = await getUserByIdInternal(uid);
      if (u && (u.email || '').toLowerCase() === key) return u;
    }
    return null;
  },
  async getUser(id: string) { return getUserByIdInternal(id); },
  async getUserById(id: string) { return getUserByIdInternal(id); },
  async getUserByReferralCode(code: string) { const id = this.indices.referral[code]; return id ? getUserByIdInternal(id) : null; },
  async getUserByPhone(phone: string) { const id = this.indices.phone[phone] || this.indices.phone[phone.replace(/^\\+/, '')]; return id ? getUserByIdInternal(id) : null; },
  async getUserByMemberId(memberId: string) {
    if (!memberId) return null;
    const id = this.indices.memberId && this.indices.memberId[memberId];
    if (id) return await getUserByIdInternal(id);
    // fallback legacy
    const legacy = (this.db.data.users || []).find((u: any) => u.memberId === memberId);
    if (legacy) return legacy;
    // final fallback: scan
    for (const uid of this.userIds) {
      const u = await getUserByIdInternal(uid);
      if (u && u.memberId === memberId) return u;
    }
    return null;
  },
  async updateUser(id: string, updates: any) {
    const user = await getUserByIdInternal(id);
    if (user) {
      Object.assign(user, updates);
      await writeUserFile(id, user);
      // update legacy array
      const dbUser = (this.db.data.users || []).find((u: any) => u.id === id);
      if (dbUser) Object.assign(dbUser, updates);
      await this.db.write();
      updateIndicesForUser(user);
      await this.saveIndices();

      // SYNC TO MONGODB
      await this.syncUserToMongo(user);

      return user;
    }
    return null;
  },
  // Password reset helpers (simple in-memory/data-file backed)
  async createPasswordReset(userId: string, phone: string, code: string, expiresAt: any) {
    this.db.data.passwordResets = this.db.data.passwordResets || [];
    const expires = typeof expiresAt === 'string' ? expiresAt : (expiresAt as any)?.toString?.() || new Date(expiresAt).toISOString();
    const entry = { id: `pr-${Date.now()}`, userId, phone, code, expiresAt: expires };
    this.db.data.passwordResets.push(entry);
    await this.db.write();
    return entry;
  },
  async verifyPasswordReset(phone: string, code: string) {
    const resets = this.db.data.passwordResets || [];
    const found = resets.find((r: any) => r.phone === phone && r.code === code);
    if (!found) return { valid: false, reason: 'not_found' } as any;
    const now = new Date();
    const expires = new Date(found.expiresAt);
    if (expires < now) return { valid: false, reason: 'expired' } as any;
    return { valid: true, userId: found.userId } as any;
  },
  async consumePasswordReset(phone: string, code: string) {
    this.db.data.passwordResets = (this.db.data.passwordResets || []).filter((r: any) => !(r.phone === phone && r.code === code));
    await this.db.write();
    return true;
  },

  // Email Password Reset Helpers
  async createEmailPasswordReset(userId: string, email: string, code: string, expiresAt: any) {
    this.db.data.passwordResets = this.db.data.passwordResets || [];
    const expires = typeof expiresAt === 'string' ? expiresAt : (expiresAt as any)?.toString?.() || new Date(expiresAt).toISOString();
    // We store email in the 'phone' field or add a new field. To keep it clean, let's look for an entry with 'email' field.
    // Actually, let's just use the same collection but different field.
    const entry = { id: `pr-${Date.now()}`, userId, email, code, expiresAt: expires, type: 'email' };
    this.db.data.passwordResets.push(entry);
    await this.db.write();
    return entry;
  },
  async verifyEmailPasswordReset(email: string, code: string) {
    const resets = this.db.data.passwordResets || [];
    const found = resets.find((r: any) => r.email === email && r.code === code);
    if (!found) return { valid: false, reason: 'not_found' } as any;
    const now = new Date();
    const expires = new Date(found.expiresAt);
    if (expires < now) return { valid: false, reason: 'expired' } as any;
    return { valid: true, userId: found.userId } as any;
  },
  async consumeEmailPasswordReset(email: string, code: string) {
    this.db.data.passwordResets = (this.db.data.passwordResets || []).filter((r: any) => !(r.email === email && r.code === code));
    await this.db.write();
    return true;
  },

  // createUser: convenience wrapper for addUser with some defaults
  async createUser(data: any) {
    const newUser: any = {
      id: data.id || `user-${Date.now()}`,
      fullName: data.fullName || data.name || "Unnamed",
      email: data.email,
      phone: data.phone || "",
      password: data.password || "",
      role: data.role || "member",
      membershipType: data.membershipType || 'free',
      sponsorId: data.sponsorId || null,
      referralCode: data.referralCode || generateReferralCode(6),
      isActive: data.isActive ?? true,
      wallet: data.wallet || { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
      careerLevel: data.careerLevel || { id: "1", name: "Nefs-i Emmare" },
      memberId: data.memberId || `M${Math.floor(Math.random() * 100000)}`,
      registrationDate: data.registrationDate || new Date(),
    };
    return await this.addUser(newUser as any);
  },



  async deleteUser(id: string) {
    // Remove from indices, delete file, update legacy list and userIds
    try {
      // remove legacy array entry
      this.db.data.users = (this.db.data.users || []).filter((u: any) => u.id !== id);
      // remove from userIds
      this.userIds = (this.userIds || []).filter((uid: string) => uid !== id);
      // remove from indices
      try {
        // referral
        for (const k of Object.keys(this.indices.referral || {})) {
          if (this.indices.referral[k] === id) delete this.indices.referral[k];
        }
        // phone
        for (const k of Object.keys(this.indices.phone || {})) {
          if (this.indices.phone[k] === id) delete this.indices.phone[k];
        }
        // sponsor lists
        for (const k of Object.keys(this.indices.sponsor || {})) {
          this.indices.sponsor[k] = (this.indices.sponsor[k] || []).filter((x: string) => x !== id);
          if ((this.indices.sponsor[k] || []).length === 0) delete this.indices.sponsor[k];
        }
      } catch (e) {
        console.warn('Index error during deletion:', e);
      }

      // delete file
      const p = userFilePath(id);
      try { 
        await fs.unlink(p.file); 
      } catch (e) { 
        console.warn('File unlink error:', e);
      }

      await this.saveIndices();
      await this.db.write();

      // SYNC DELETE TO MONGODB
      try {
        if (mongoose.connection.readyState === 1) {
          const { User: MongoUser } = await import('./models');
          await MongoUser.deleteOne({ id });
        }
      } catch (e) {
        console.error("Error deleting user from MongoDB:", e);
      }

      return true;
    } catch (e) {
      return false;
    }
  },

  // Helper to sync a user object to MongoDB
  async syncUserToMongo(user: any) {
    try {
      const { User: MongoUser } = await import('./models');

      // Prevent hanging if not connected
      if (mongoose.connection.readyState !== 1) return;


      // Map LowDB user to Mongoose Schema structure
      const mongoUserData = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        password: user.password,
        role: user.role,
        membershipType: user.membershipType,
        membershipStartDate: user.membershipStartDate,
        careerLevel: user.careerLevel,
        wallet: user.wallet || { balance: 0, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
        isActive: user.isActive,
        sponsorId: user.sponsorId,
        referralCode: user.referralCode,
        memberId: user.memberId,
        registrationDate: user.registrationDate,
        totalInvestment: user.totalInvestment,
        directReferrals: user.directReferrals,
        totalTeamSize: user.totalTeamSize,
        monthlySalesVolume: user.monthlySalesVolume,
        annualSalesVolume: user.annualSalesVolume,
        lastLoginDate: user.lastLoginDate,
        receiptFile: user.receiptFile,
        receiptUploadedAt: user.receiptUploadedAt,
        receiptVerified: user.receiptVerified
      };

      await MongoUser.findOneAndUpdate(
        { id: user.id },
        { $set: mongoUserData },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.warn(`⚠️ Failed to sync user ${user.id} to MongoDB:`, error);
      // Don't throw, allow LowDB operation to proceed
    }
  },

  // Bulk sync all users from LowDB to MongoDB
  async syncAllToMongo() {
    console.log("🔄 Starting full synchronization to MongoDB...");
    const users = await this.getAllUsers();
    let count = 0;
    for (const user of users) {
      if (user) {
        await this.syncUserToMongo(user);
        count++;
      }
    }
    console.log(`✅ Synced ${count} users to MongoDB.`);
  },

  // Auth & Session
  async createMemberSession(data: any) { return "session-" + Date.now(); },
  async endMemberSession(sessionId: string) { return true; },
  async createMemberLog(data: any) {
    const log = { id: "log-" + Date.now(), ...data, timestamp: new Date() };
    this.db.data.memberLogs = this.db.data.memberLogs || [];
    this.db.data.memberLogs.push(log);
    await this.db.write();
  },
  async createMemberActivity(data: any) {
    const activity = { id: "act-" + Date.now(), ...data, timestamp: new Date() };
    this.db.data.memberActivities = this.db.data.memberActivities || [];
    this.db.data.memberActivities.push(activity);
    await this.db.write();
  },
  async createAdminLog(data: any) {
    const log = { id: "log-" + Date.now(), ...data, timestamp: new Date() };
    this.db.data.adminLogs = this.db.data.adminLogs || [];
    this.db.data.adminLogs.push(log);
    await this.db.write();
  },
  async getAdminLogs(criteria: any) {
    const logs = this.db.data.adminLogs || [];
    return { logs: logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), total: logs.length };
  },
  async getMemberLogs(criteria: any) {
    const logs = this.db.data.memberLogs || [];
    return { logs: logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), total: logs.length };
  },
  async getMemberActivities(criteria: any) {
    const activities = this.db.data.memberActivities || [];
    return { activities: activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), total: activities.length };
  },
  async getMemberSessions(criteria: any) { return { sessions: [], total: 0 }; },
  async getMemberTrackingStats(memberId: string) { return {}; },

  // Products
  async getAllProducts() { return this.db.data.products || []; },
  async getProductById(id: string) { return this.db.data.products?.find((p: any) => p.id === id); },
  async adminGetAllProducts() { return this.db.data.products || []; },
  async adminCreateProduct(data: any) {
    try {
      // Gerekli alanları kontrol et
      if (!data.name || !data.description || !data.price || !data.image || !data.category) {
        return {
          success: false,
          error: "Gerekli alanlar eksik: name, description, price, image, category"
        };
      }

      // Kategori "new" ise veya boşsa hata dön
      if (data.category === "new" || !data.category.trim()) {
        return {
          success: false,
          error: "Lütfen bir kategori seçin veya yeni kategori adı girin"
        };
      }

      // Image URL validasyonu
      if (!data.image.startsWith('http')) {
        return {
          success: false,
          error: "Ürün resmi geçerli bir URL olmalıdır (http ile başlamalı)"
        };
      }

      const product = {
        id: "prod-" + Date.now(),
        ...data,
        isActive: true, // YENİ ÜRÜNLER HER ZAMAN AKTIF OLARAK OLUŞTURULUR
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rating: 0,
        reviews: 0,
      };

      this.db.data.products = this.db.data.products || [];
      this.db.data.products.push(product);
      await this.db.write();

      console.log(`✅ Ürün başarıyla oluşturuldu: ${product.name} (ID: ${product.id})`);
      return { success: true, product, message: "Ürün başarıyla oluşturuldu" };
    } catch (error) {
      console.error("Product creation error:", error);
      return {
        success: false,
        error: "Ürün oluşturulurken hata oluştu: " + error.message
      };
    }
  },
  async adminUpdateProduct(id: string, data: any) {
    try {
      const products = this.db.data.products || [];
      const product = products.find((p: any) => p.id === id);

      if (!product) {
        return { success: false, error: "Ürün bulunamadı" };
      }

      // Kategori "new" ise hata dön
      if (data.category === "new") {
        return {
          success: false,
          error: "Lütfen bir kategori seçin veya yeni kategori adı girin"
        };
      }

      // Image URL validasyonu
      if (data.image && !data.image.startsWith('http')) {
        return {
          success: false,
          error: "Ürün resmi geçerli bir URL olmalıdır (http ile başlamalı)"
        };
      }

      Object.assign(product, data, {
        updatedAt: new Date().toISOString()
      });
      await this.db.write();

      return { success: true, product, message: "Ürün başarıyla güncellendi" };
    } catch (error) {
      return {
        success: false,
        error: "Ürün güncellenirken hata oluştu: " + error.message
      };
    }
  },
  async adminDeleteProduct(id: string) {
    try {
      const products = this.db.data.products || [];
      const index = products.findIndex((p: any) => p.id === id);

      if (index === -1) {
        return { success: false, error: "Ürün bulunamadı" };
      }

      products.splice(index, 1);
      await this.db.write();

      return { success: true, message: "Ürün başarıyla silindi" };
    } catch (error) {
      return {
        success: false,
        error: "Ürün silinirken hata oluştu: " + error.message
      };
    }
  },
  async getProductSalesStats() { return {}; },
  async createProductPurchase(data: any) {
    const purchase = { id: "purch-" + Date.now(), ...data, date: new Date() };
    this.db.data.productPurchases = this.db.data.productPurchases || [];
    this.db.data.productPurchases.push(purchase);
    await this.db.write();
    return { success: true, purchase };
  },
  async getUserProductPurchases(userId: string) { return (this.db.data.productPurchases || []).filter((p: any) => p.userId === userId); },
  async getProductPurchaseById(id: string) { return null; },
  async updateProductPurchase(id: string, data: any) { return true; },
  async distributeProductCommissions(purchaseId: string) {
    try {
      // Get the purchase record
      const purchase = (this.db.data.productPurchases || []).find((p: any) => p.id === purchaseId);
      if (!purchase || purchase.commissionDistributed) {
        return { success: false, error: "Satın alma bulunamadı veya komisyon dağıtıldı" };
      }

      // Find sponsor by referral code
      const sponsor = await this.getUserByReferralCode(purchase.referralCode);
      if (!sponsor) {
        console.warn(`Sponsor not found for referral code: ${purchase.referralCode}`);
        return { success: false, error: "Sponsor bulunamadı" };
      }

      // Calculate commissions based on dynamic career level
      const { mongoDb } = await import("./mongo-database.js");
      const careerLevels = await mongoDb.getCareerLevels();
      const sponsorLevelName = (sponsor.careerLevel as any)?.name || sponsor.careerLevel || 'Emmare';
      const careerData = careerLevels.find(l => l.name.toLowerCase() === sponsorLevelName.toLowerCase());
      
      const purchaseAmount = purchase.totalAmount || purchase.purchaseAmount || 0;
      const ratePercent = careerData?.benefits?.directSalesCommission || careerData?.commissionRate || 15;
      const sponsorCommission = purchaseAmount * (ratePercent / 100);

      // Update sponsor wallet
      if (sponsor.wallet) {
        sponsor.wallet.balance = (sponsor.wallet.balance || 0) + sponsorCommission;
        sponsor.wallet.totalEarnings = (sponsor.wallet.totalEarnings || 0) + sponsorCommission;
        sponsor.wallet.sponsorBonus = (sponsor.wallet.sponsorBonus || 0) + sponsorCommission;
      }

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

      // Save sponsor wallet update
      await this.updateUser(sponsor.id, { wallet: sponsor.wallet });

      // Save transaction
      this.db.data.transactions = this.db.data.transactions || [];
      this.db.data.transactions.push(transaction);

      // Mark purchase as commission distributed
      const purchaseIndex = (this.db.data.productPurchases || []).findIndex((p: any) => p.id === purchaseId);
      if (purchaseIndex >= 0) {
        this.db.data.productPurchases[purchaseIndex].commissionDistributed = true;
        this.db.data.productPurchases[purchaseIndex].commissionDistributedAt = new Date().toISOString();
      }

      await this.db.write();

      console.log(`✅ Komisyon başarıyla dağıtıldı: ${sponsor.fullName} - ${sponsorCommission}$ (Ref: ${purchaseId})`);
      return { success: true, commission: sponsorCommission, sponsorId: sponsor.id };
    } catch (error) {
      console.error("Error distributing commissions:", error);
      return { success: false, error: error instanceof Error ? error.message : "Komisyon dağılımı başarısız" };
    }
  },

  // Wallet & Transactions
  async createTransaction(transaction: any) {
    this.db.data.transactions = this.db.data.transactions || [];
    this.db.data.transactions.push(transaction);
    await this.db.write(); // İşlemi kaydet
  },
  async getRealTimeTransactions(criteria: any) {
    const transactions = this.db.data.transactions || [];
    return { transactions, total: transactions.length };
  },
  async createRealTimeTransaction(data: any) {
    this.db.data.realTimeTransactions = this.db.data.realTimeTransactions || [];
    const tx = { id: `rt-${Date.now()}`, ...data, status: 'pending', timestamps: { created: new Date() } };
    this.db.data.realTimeTransactions.push(tx);
    await this.db.write();
    return { success: true, transaction: tx, transactionId: tx.id };
  },
  async findAvailablePositions(rootUserId: string, depthLimit: number = 5) {
    // Use sponsor index to find children quickly
    const positions: any[] = [];
    const stack = [rootUserId];
    while (stack.length && positions.length < 10) {
      const id = stack.shift() as string;
      const childrenIds = this.indices.sponsor[id] || [];
      for (const childId of childrenIds) {
        positions.push({ parentId: id, userId: childId });
        stack.push(childId);
      }
    }
    return positions;
  },
  async getPlacementStats(userId: string) {
    // basic stats for placement using sponsor index
    const directs = this.indices.sponsor[userId] || [];
    return { directCount: directs.length, totalTeam: await this.getTotalTeamSize(userId) };
  },
  async enhancedAutoPlacement(userId: string, sponsorId: string, opts: any) {
    // Placeholder that returns the sponsorId as placement
    return { success: true, placedAt: sponsorId };
  },
  async getDetailedLegStats(userId: string) {
    // Scan all users for left/right child references (no index available)
    const all = await this.getAllUsers();
    const left = (all || []).filter(u => u.leftChild === userId).length;
    const right = (all || []).filter(u => u.rightChild === userId).length;
    return { leftLeg: left, rightLeg: right };
  },
  async getTransactionStats(userId: string, days: number) { return {}; },
  async getUserWalletBalances(userId: string) {
    const user = await this.getUserById(userId);
    return user ? [{ currency: 'TRY', amount: user.wallet.balance }] : [];
  },

  // Team Placement Methods
  async getPendingPlacements(sponsorId: string) {
    const { PendingPlacement } = await import("./models");
    return await PendingPlacement.find({ sponsorId, status: "pending" }).lean();
  },

  async createPendingPlacement(data: any) {
    const { PendingPlacement } = await import("./models");
    const placement = new PendingPlacement({
      ...data,
      id: data.id || `placement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationDate: new Date(),
      status: "pending"
    });
    return await placement.save();
  },

  async updatePlacementStatus(placementId: string, status: string) {
    const { PendingPlacement } = await import("./models");
    return await PendingPlacement.findOneAndUpdate(
      { id: placementId },
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );
  },
  async initializeUserWallet(userId: string) { return true; },
  async getUserWalletTransactions(userId: string, limit: number, offset: number) {
    const txs = (this.db.data.walletTransactions || []).filter((t: any) => t.userId === userId);
    return { transactions: txs, total: txs.length };
  },
  async createWalletTransaction(data: any) {
    const tx = { id: "tx-" + Date.now(), ...data, date: new Date() };
    this.db.data.walletTransactions = this.db.data.walletTransactions || [];
    this.db.data.walletTransactions.push(tx);
    await this.db.write();
    return tx;
  },
  async getUserWalletBalance(userId: string, currency: string) {
    const user = await this.getUserById(userId);
    return { available: user?.wallet.balance || 0, frozen: 0 };
  },
  async updateWalletBalance(userId: string, currency: string, amount: number, type: string) {
    const user = await this.getUserById(userId);
    if (user) {
      if (type === 'set') user.wallet.balance = amount;
      else if (type === 'add') user.wallet.balance += amount;
      else if (type === 'subtract') user.wallet.balance -= amount;
      await this.updateUser(userId, { wallet: user.wallet });
      return true;
    }
    return false;
  },
  async getAllWalletTransactions(limit: number, offset: number) {
    const txs = this.db.data.walletTransactions || [];
    return { transactions: txs, total: txs.length };
  },
  async getPendingWalletTransactions() {
    return (this.db.data.walletTransactions || []).filter((t: any) => t.status === 'pending');
  },
  async processDepositRequest(id: string, adminId: string, action: string, note: string) {
    const tx = (this.db.data.walletTransactions || []).find((t: any) => t.id === id);
    if (!tx) return { success: false, message: "İşlem bulunamadı" };

    tx.status = action === 'approve' ? 'completed' : 'rejected';
    tx.adminNote = note;
    tx.processedBy = adminId;
    tx.processedAt = new Date();

    if (action === 'approve') {
      await this.updateWalletBalance(tx.userId, 'TRY', tx.amount, 'add');
    }
    await this.db.write();
    return { success: true, transaction: tx };
  },
  async processWithdrawalRequest(id: string, adminId: string, action: string, note: string) {
    const tx = (this.db.data.walletTransactions || []).find((t: any) => t.id === id);
    if (!tx) return { success: false, message: "İşlem bulunamadı" };

    tx.status = action === 'approve' ? 'completed' : 'rejected';
    tx.adminNote = note;
    tx.processedBy = adminId;
    tx.processedAt = new Date();

    if (action === 'reject') {
      // Reddedilirse bakiyeyi iade et (çekim talebinde düşüldüğü varsayılır)
      await this.updateWalletBalance(tx.userId, 'TRY', tx.amount, 'add');
    }
    await this.db.write();
    return { success: true, transaction: tx };
  },
  async completeWithdrawal(id: string, adminId: string) { return {}; },
  async getAdminBankDetails() { return []; },
  async getCryptoRates() { return null; },
  async updateCryptoRates(rates: any) { return true; },

  // Network & MLM
  async getDirectReferrals(userId: string) {
    const ids = this.indices.sponsor[userId] || [];
    return Promise.all(ids.map((id: string) => getUserByIdInternal(id)));
  },
  async getTotalTeamSize(userId: string): Promise<number> {
    const directs = this.indices.sponsor[userId] || [];
    let count = directs.length;
    for (const directId of directs) {
      count += await this.getTotalTeamSize(directId);
    }
    return count;
  },
  async getNetworkTree(userId: string, depth: number): Promise<any> {
    const user = await getUserByIdInternal(userId);
    if (!user || depth < 0) return null;
    const directs = this.indices.sponsor[userId] || [];
    const children = await Promise.all(directs.map((d: string) => this.getNetworkTree(d, depth - 1)));
    return {
      user,
      children: children.filter((c: any) => c !== null)
    };
  },
  async getBinaryNetworkStats(userId: string) { return { leftVolume: 0, rightVolume: 0 }; },
  async getSettings() { return this.db.data.settings; },
  async updateSettings(settings: any) {
    this.db.data.settings = settings;
    await this.db.write(); // Ayarları kaydet
    return settings;
  },
  async getPerformanceStatus() { return {}; },
  async optimizeForScale() { return true; },
  async checkSystemCapacity() { return { canAddUser: true }; },
  async batchUpdateUsers(updates: any[]) { return []; },
  async adminCreateUser(data: any) {
    try {
      const { fullName, email, phone, password, role = "member", sponsorId, isActive = true, membershipType = "entry", initialBalance = 0 } = data;

      // Validation
      if (!fullName || !email || !phone || !password) {
        return { success: false, error: "Tüm gerekli alanlar doldurulmalıdır." };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: "Geçerli bir email adresi girin." };
      }

      // Check if email already exists
      const existingUser = (this.db.data.users || []).find((u: any) => u.email === email);
      if (existingUser) {
        return { success: false, error: "Bu email adresi zaten kayıtlıdır." };
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate memberId
      const memberId = `ak${String(Date.now()).slice(-7)}`;

      const user = {
        id: "user-" + Date.now(),
        memberId,
        fullName,
        email,
        phone,
        password: hashedPassword,
        role,
        sponsorId: sponsorId || null,
        isActive,
        membershipType,
        careerLevel: { name: "Ziyaretçi", level: 0, commissionRate: 0, passiveIncomeRate: 0, bonus: 0 },
        wallet: { balance: initialBalance, totalEarnings: 0, sponsorBonus: 0, careerBonus: 0, passiveIncome: 0, leadershipBonus: 0 },
        kycStatus: "pending",
        twoFactorEnabled: false,
        registrationDate: new Date().toISOString(),
        lastLoginDate: null,
        directReferrals: 0,
        totalTeamSize: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to database
      this.db.data.users = this.db.data.users || [];
      this.db.data.users.push(user);

      // Update indices
      this.indices.email[email] = user.id;
      this.indices.phone[phone] = user.id;
      this.indices.memberId[memberId] = user.id;
      this.userIds.push(user.id);

      await this.db.write();

      return { success: true, user: { ...user, password: undefined }, message: `${fullName} başarıyla oluşturuldu (ID: ${memberId})` };
    } catch (error) {
      console.error("Admin create user error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Kullanıcı oluşturulurken hata oluştu." };
    }
  },
  async adminUpdateUser(id: string, data: any, adminId: string) {
    try {
      const user = await getUserByIdInternal(id);
      if (!user) {
        return { success: false, error: "Kullanıcı bulunamadı." };
      }

      // Update allowed fields
      const { fullName, email, phone, role, isActive, careerLevel, walletBalance, kycStatus, membershipType, twoFactorEnabled } = data;

      if (fullName) user.fullName = fullName;
      if (email && email !== user.email) {
        // Check if new email exists
        const existing = (this.db.data.users || []).find((u: any) => u.email === email && u.id !== id);
        if (existing) return { success: false, error: "Bu email adresi zaten kullanılıyor." };
        delete this.indices.email[user.email];
        this.indices.email[email] = id;
        user.email = email;
      }
      if (phone && phone !== user.phone) {
        delete this.indices.phone[user.phone];
        this.indices.phone[phone] = id;
        user.phone = phone;
      }
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      if (careerLevel) user.careerLevel.name = careerLevel;
      if (walletBalance !== undefined) user.wallet.balance = walletBalance;
      if (kycStatus) user.kycStatus = kycStatus;
      if (membershipType) user.membershipType = membershipType;
      if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

      user.updatedAt = new Date().toISOString();

      await writeUserFile(id, user);
      const dbUser = (this.db.data.users || []).find((u: any) => u.id === id);
      if (dbUser) Object.assign(dbUser, user);
      await this.db.write();

      return { success: true, user: { ...user, password: undefined }, message: `${user.fullName} başarıyla güncellendi.` };
    } catch (error) {
      console.error("Admin update user error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Kullanıcı güncellenirken hata oluştu." };
    }
  },
  async adminDeleteUser(id: string, adminId: string, transferTo?: string) {
    try {
      const user = await getUserByIdInternal(id);
      if (!user) {
        return { success: false, error: "Kullanıcı bulunamadı." };
      }

      // Cannot delete admin
      if (user.role === "admin") {
        return { success: false, error: "Admin kullanıcı silinemez." };
      }

      // Remove from indices
      delete this.indices.email[user.email];
      delete this.indices.phone[user.phone];
      delete this.indices.memberId[user.memberId];
      delete this.indices.referral[user.referralCode];
      this.userIds = this.userIds.filter(uid => uid !== id);

      // Remove from users array
      this.db.data.users = (this.db.data.users || []).filter((u: any) => u.id !== id);

      // Remove user file if exists
      try {
        const filePath = path.join(process.cwd(), "data", "users", String(Number(id.split('-')[1]) % 1000), `${id}.json`);
        await fs.unlink(filePath);
      } catch (e) {
        // File might not exist, that's ok
      }

      await this.db.write();

      return { success: true, message: `${user.fullName} başarıyla silindi.` };
    } catch (error) {
      console.error("Admin delete user error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Kullanıcı silinirken hata oluştu." };
    }
  },
  async adminMoveUser(userId: string, newParentId: string, position: string) {
    try {
      const user = await getUserByIdInternal(userId);
      const newParent = await getUserByIdInternal(newParentId);

      if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
      if (!newParent) return { success: false, error: "Yeni ebeveyn bulunamadı." };

      // Update placement
      if (position === "left") {
        user.leftChild = newParentId;
      } else if (position === "right") {
        user.rightChild = newParentId;
      } else {
        return { success: false, error: "Geçersiz pozisyon." };
      }

      user.updatedAt = new Date().toISOString();
      await this.updateUser(userId, user);

      return { success: true, message: `${user.fullName} başarıyla taşındı.` };
    } catch (error) {
      console.error("Admin move user error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Kullanıcı taşınırken hata oluştu." };
    }
  },
  async adminPlaceUserInBinary(userId: string, parentId: string, position: string) {
    try {
      const user = await getUserByIdInternal(userId);
      const parent = await getUserByIdInternal(parentId);

      if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
      if (!parent) return { success: false, error: "Ebeveyn kullanıcı bulunamadı." };

      if (position !== "left" && position !== "right") {
        return { success: false, error: "Pozisyon 'left' veya 'right' olmalıdır." };
      }

      // Check if position is already occupied
      if (position === "left" && parent.leftChild) {
        return { success: false, error: "Sol pozisyon zaten dolu. Önce mevcut kullanıcıyı taşıyın." };
      }
      if (position === "right" && parent.rightChild) {
        return { success: false, error: "Sağ pozisyon zaten dolu. Önce mevcut kullanıcıyı taşıyın." };
      }

      // Update parent's child reference
      if (position === "left") {
        parent.leftChild = userId;
      } else {
        parent.rightChild = userId;
      }

      // Update user's sponsor
      user.sponsorId = parentId;

      parent.updatedAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      await this.updateUser(parentId, parent);
      await this.updateUser(userId, user);

      return { success: true, message: `${user.fullName} başarıyla yerleştirildi.` };
    } catch (error) {
      console.error("Admin place user in binary error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Kullanıcı yerleştirilirken hata oluştu." };
    }
  },
  async adminSearchUsers(criteria: any) {
    try {
      const { query, role, status } = criteria;
      let users = [...(this.db.data.users || [])];

      if (query) {
        const q = query.toLowerCase();
        users = users.filter((u: any) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.memberId?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
        );
      }

      if (role && role !== "all") {
        users = users.filter((u: any) => u.role === role);
      }

      if (status === "active") {
        users = users.filter((u: any) => u.isActive);
      } else if (status === "inactive") {
        users = users.filter((u: any) => !u.isActive);
      }

      return { users: users.map((u: any) => ({ ...u, password: undefined })), total: users.length };
    } catch (error) {
      console.error("Admin search users error:", error);
      return { users: [], total: 0, error: error instanceof Error ? error.message : "Arama yapılırken hata oluştu." };
    }
  },

  // Payment Requests
  async createPaymentRequest(data: any) {
    const req = { id: "pay-" + Date.now(), ...data };
    this.db.data.paymentRequests = this.db.data.paymentRequests || [];
    this.db.data.paymentRequests.push(req);
    await this.db.write(); // Ödeme isteğini kaydet
    return req;
  },
  async updatePaymentRequest(id: string, updates: any) { return { ...updates, id }; },

  // Clone Pages
  async getClonePageBySlug(slug: string) { return this.db.data.clonePages?.find((p: any) => p.slug === slug); },
  async createClonePage(userId: string, name: string, slug: string) {
    const page = { userId, name, slug, isActive: true, visitCount: 0, conversionCount: 0 };
    this.db.data.clonePages = this.db.data.clonePages || [];
    this.db.data.clonePages.push(page);
    await this.db.write(); // Clone sayfayı kaydet
    return page;
  },
  async getUserCloneStoreData(userId: string) {
    return this.db.data.clonePages?.find((p: any) => p.userId === userId) || null;
  },
  async updateUserCloneStore(userId: string, data: any) {
    const page = this.db.data.clonePages?.find((p: any) => p.userId === userId);
    if (page) {
      Object.assign(page, data);
      await this.db.write();
      return page;
    }
    return null;
  },

  // Monoline
  async getMonolineSettings() { return this.db.data.monolineSettings; },
  async updateMonolineSettings(settings: any) { this.db.data.monolineSettings = settings; return settings; },
  async addToPassiveIncomePool(amount: number) {
    this.db.data.passiveIncomePool = this.db.data.passiveIncomePool || { totalAmount: 0, lastUpdated: new Date() };
    this.db.data.passiveIncomePool.totalAmount = (this.db.data.passiveIncomePool.totalAmount || 0) + amount;
    this.db.data.passiveIncomePool.lastUpdated = new Date();
    await this.db.write();
  },
  async getPassiveIncomePoolAmount() {
    this.db.data.passiveIncomePool = this.db.data.passiveIncomePool || { totalAmount: 0, lastUpdated: new Date() };
    return this.db.data.passiveIncomePool.totalAmount;
  },

  async addToCompanyFund(amount: number) {
    this.db.data.companyFund = this.db.data.companyFund || { totalAmount: 0, lastUpdated: new Date(), transactions: [] };
    this.db.data.companyFund.totalAmount = (this.db.data.companyFund.totalAmount || 0) + amount;
    this.db.data.companyFund.lastUpdated = new Date();
    await this.db.write();
    return true;
  },

  async createCompanyFundTransaction(data: any) {
    this.db.data.companyFund = this.db.data.companyFund || { totalAmount: 0, lastUpdated: new Date(), transactions: [] };
    const tx = { id: `cf-${Date.now()}`, ...data, date: new Date() };
    this.db.data.companyFund.transactions = this.db.data.companyFund.transactions || [];
    this.db.data.companyFund.transactions.push(tx);
    await this.db.write();
    return tx;
  },

  async createMonolineCommissionTransactions(transactions: any[]) {
    // Store commission records
    this.db.data.monolineCommissions = this.db.data.monolineCommissions || [];
    const recordedTransactions = transactions.map(t => ({
      id: `mct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...t,
      createdAt: new Date(),
      status: t.status || 'pending'
    }));
    this.db.data.monolineCommissions.push(...recordedTransactions);

    // Apply to wallets and create transaction records
    for (const t of transactions) {
      if (t.recipientId && typeof t.amount === 'number' && t.amount > 0) {
        const user = await getUserByIdInternal(t.recipientId);
        if (user) {
          // Initialize wallet if not present
          user.wallet = user.wallet || {
            balance: 0,
            totalEarnings: 0,
            sponsorBonus: 0,
            careerBonus: 0,
            passiveIncome: 0,
            leadershipBonus: 0
          };

          // Update wallet amounts
          user.wallet.balance = (user.wallet.balance || 0) + t.amount;
          user.wallet.totalEarnings = (user.wallet.totalEarnings || 0) + t.amount;

          // Persist updated user file
          await writeUserFile(user.id, user);

          // Create wallet transaction record for audit
          this.db.data.walletTransactions = this.db.data.walletTransactions || [];
          this.db.data.walletTransactions.push({
            id: `wtx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: user.id,
            amount: t.amount,
            type: t.type || 'commission',
            reference: t.reference || `MONO-${Date.now()}`,
            description: t.description || 'Monoline commission',
            status: 'completed',
            date: new Date()
          });
        }
      }
    }

    await this.db.write();
    return { success: true, transactionCount: recordedTransactions.length };
  },

  async resetPassiveIncomePool() {
    this.db.data.passiveIncomePool = { totalAmount: 0, lastUpdated: new Date() };
    await this.db.write();
    return true;
  },

  async createPassiveIncomeDistribution(data: any) {
    this.db.data.passiveIncomeDistributions = this.db.data.passiveIncomeDistributions || [];
    const entry = { id: `pid-${Date.now()}`, ...data, createdAt: new Date() };
    this.db.data.passiveIncomeDistributions.push(entry);
    await this.db.write();
    return entry;
  },

  async getUserMonolineCommissions(userId: string, period: string) {
    this.db.data.monolineCommissions = this.db.data.monolineCommissions || [];
    return (this.db.data.monolineCommissions || []).filter((c: any) => c.recipientId === userId);
  },

  async calculateAndDistributeCommissions(amount: number, userId: string) {
    // Simple distributor: direct sponsor 10%, next 4 levels 5/3/2/1%, rest to company fund
    const percentages = [0.10, 0.05, 0.03, 0.02, 0.01];
    const chain: any[] = [];
    // build sponsor chain by following sponsorId using sharded reads
    let current = await getUserByIdInternal(userId);
    for (let i = 0; i < 10 && current; i++) {
      if (!current.sponsorId) break;
      const sponsor = await getUserByIdInternal(current.sponsorId);
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
        transactions.push({ recipientId: recipient.id, amount: amt, type: 'monoline', sourceUserId: userId, level: i + 1, description: `Commission level ${i + 1}` });
      }
    }
    const companyShare = Math.round((amount - distributed) * 100) / 100;
    if (companyShare > 0) {
      await this.addToCompanyFund(companyShare);
      await this.createCompanyFundTransaction({ amount: companyShare, note: 'Residual commission to company fund', sourceUserId: userId });
    }

    await this.createMonolineCommissionTransactions(transactions);
    return { success: true, totalDistributed: distributed, companyShare };
  },

  // Broadcast & Announcements
  async getCurrentLiveBroadcast() { return null; },
  async updateLiveBroadcast(id: string, data: any) { return data; },
  async createLiveBroadcast(data: any) { return data; },
  async getAnnouncements() { return this.db.data.announcements || []; },
  async createAnnouncement(data: any) {
    const announcement = { id: "ann-" + Date.now(), ...data, createdAt: new Date() };
    this.db.data.announcements = this.db.data.announcements || [];
    this.db.data.announcements.push(announcement);
    await this.db.write();
    return announcement;
  },

  // Activity
  async getUserActivityStats(userId: string) { return {}; },
  async updateUserActivity(userId: string) { return true; },
  async getAllUsersWithActivity() {
    const all = await this.getAllUsers();
    return (all || []).map((u: any) => ({ ...u, activityStats: {} }));
  },
  async batchUpdateActivity(userIds: string[]) { return true; },
  async updateUserRole(userId: string, role: string) { return this.updateUser(userId, { role }); },
  async updateUserCareerLevel(userId: string, level: any) { return this.updateUser(userId, { careerLevel: level }); },
  async updateUserStatus(userId: string, isActive: boolean) { return this.updateUser(userId, { isActive }); },

  // Packages
  async addPackage(pkg: MembershipPackage) {
    this.packages.push(pkg);
  },

  async getPackages() {
    return this.packages;
  },
};

// --- Storage helper functions for sharded user files & indices ---
function hashToBucket(id: string) {
  const h = crypto.createHash('sha1').update(id).digest();
  const n = h.readUInt32BE(0);
  return n % BUCKET_COUNT;
}

function userFilePath(id: string) {
  const bucket = hashToBucket(id);
  const dir = path.join(USERS_DIR, String(bucket));
  return { dir, file: path.join(dir, `${id}.json`) };
}

async function ensureDirs() {
  await fs.mkdir(USERS_DIR, { recursive: true });
  await fs.mkdir(INDEX_DIR, { recursive: true });
  // also create bucket directories
  for (let i = 0; i < Math.min(BUCKET_COUNT, 256); i++) {
    await fs.mkdir(path.join(USERS_DIR, String(i)), { recursive: true }).catch(() => { });
  }
}

async function writeUserFile(id: string, data: any) {
  const { dir, file } = userFilePath(id);
  await fs.mkdir(dir, { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

async function readUserFile(id: string) {
  const { file } = userFilePath(id);
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function getUserByIdInternal(id: string) {
  // Try index lookup first
  if (!id) return null;
  try {
    const u = await readUserFile(id);
    if (u) return u;
  } catch (e) {
    console.warn('User file read error:', e);
  }
  // fallback to legacy DB array
  return (mlmDb.db.data.users || []).find((x: any) => x.id === id) || null;
}

async function loadJsonIfExists(p: string) {
  try {
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch (e) { return null; }
}

mlmDb.loadIndices = async function () {
  const ref = await loadJsonIfExists(path.join(INDEX_DIR, 'referral.json')) || {};
  const phone = await loadJsonIfExists(path.join(INDEX_DIR, 'phone.json')) || {};
  const sponsor = await loadJsonIfExists(path.join(INDEX_DIR, 'sponsor.json')) || {};
  const email = await loadJsonIfExists(path.join(INDEX_DIR, 'email.json')) || {};
  const memberId = await loadJsonIfExists(path.join(INDEX_DIR, 'memberId.json')) || {};
  this.indices.referral = ref;
  this.indices.phone = phone;
  this.indices.sponsor = sponsor;
  this.indices.email = email;
  this.indices.memberId = memberId;
  this.userIds = Object.values(ref);
};

mlmDb.saveIndices = async function () {
  await fs.writeFile(path.join(INDEX_DIR, 'referral.json'), JSON.stringify(this.indices.referral || {}, null, 2));
  await fs.writeFile(path.join(INDEX_DIR, 'phone.json'), JSON.stringify(this.indices.phone || {}, null, 2));
  await fs.writeFile(path.join(INDEX_DIR, 'sponsor.json'), JSON.stringify(this.indices.sponsor || {}, null, 2));
  await fs.writeFile(path.join(INDEX_DIR, 'email.json'), JSON.stringify(this.indices.email || {}, null, 2));
  await fs.writeFile(path.join(INDEX_DIR, 'memberId.json'), JSON.stringify(this.indices.memberId || {}, null, 2));
};

// Rebuild indices from sharded user files (useful for migration or recovery)
mlmDb.rebuildIndices = async function () {
  this.indices = { referral: {}, phone: {}, sponsor: {} } as any;
  this.userIds = [];
  // iterate buckets
  for (let b = 0; b < BUCKET_COUNT; b++) {
    const dir = path.join(USERS_DIR, String(b));
    let files: string[] = [];
    try { files = await fs.readdir(dir); } catch (e) { continue; }
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(dir, f), 'utf-8');
        const u = JSON.parse(raw);
        updateIndicesForUser(u);
        this.userIds.push(u.id);
      } catch (e) {
        console.warn('Error reading bucket file:', e);
      }
    }
  }
  await this.saveIndices();
};

function updateIndicesForUser(user: any) {
  try {
    if (user.referralCode) mlmDb.indices.referral[user.referralCode] = user.id;
    if (user.phone) mlmDb.indices.phone[user.phone] = user.id;
    if (user.email) mlmDb.indices.email[(user.email || '').toLowerCase()] = user.id;
    if (user.memberId) mlmDb.indices.memberId[user.memberId] = user.id;
    if (user.sponsorId) {
      mlmDb.indices.sponsor[user.sponsorId] = mlmDb.indices.sponsor[user.sponsorId] || [];
      if (!mlmDb.indices.sponsor[user.sponsorId].includes(user.id)) mlmDb.indices.sponsor[user.sponsorId].push(user.id);
    }
  } catch (e) { /* ignore */ }
}

// Backwards compatibility helpers
mlmDb.getUserFilePath = userFilePath;

export class MLMDatabase {
  static getInstance() {
    return mlmDb;
  }
}
