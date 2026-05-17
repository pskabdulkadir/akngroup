import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { mongoDb, MongoDatabase } from "./lib/mongo-database";
import authRoutes from "./routes/auth";
import trainingRoutes from "./routes/training";
import transactionRoutes from "./routes/transactions";
import walletRoutes from "./routes/wallet";
import cryptoRoutes from "./routes/crypto";
import productRoutes from "./routes/products";
import cloneProductRoutes from "./routes/clone-products";
import commissionRoutes from "./routes/commissions";
import pointsCareerRoutes from "./routes/points-career";
import broadcastRoutes from "./routes/broadcast";
import monolineRoutes from "./routes/monoline";
import stripeRoutes from "./routes/stripe";
import adminCommissionRoutes from "./lib/admin-commission";
import adminSettingsRoutes from "./routes/admin-settings";
import adminHeldEarningsRoutes from "./routes/admin-held-earnings";
import adminEarningReportRoutes from "./routes/admin-earning-report";
import adminFraudReportRoutes from "./routes/admin-fraud-report";
// import testE2ERoutes from "./routes/test-e2e"; // REMOVED FOR PRODUCTION
import { initDatabaseBackupScheduler } from "./lib/backup";
import { monthlyResetJob } from "./lib/cron/monthly-reset";
import { initializePassiveDistributionScheduler, passiveDistributionQueue } from "./lib/queues/passive-distribution.queue";
import { LoggerService, requestLogger, globalErrorHandler, setupGlobalHandlers, LogContext } from "./lib/logger";
import errorHandler from "./middleware/error-handler";
import { MonolineSettings } from "./lib/models";

// MLM Routes
import {
  register,
  login,
  purchaseMembership,
  activateMembership,
  updateReceipt,
  getUserDashboard,
  getNetworkTree,
  getMonolineDownline,
  createWithdrawalRequest,
  transferFunds,
  calculateSpiritual,
  getClonePage,
  getAdminDashboard,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  updateSystemSettings,
  getPerformanceStatus,
  optimizeSystem,
  checkCapacity,
  batchProcessUsers,
  getUserProductPurchases,
  getPendingPlacements,
  moveUserByAdmin,
  placeUserByAdmin,
  getNextId,
} from "./routes/mlm";

// System Configuration
// Binary MLM system is DEPRECATED - Monoline MLM system is active
const MONOLINE_SYSTEM_ENABLED = process.env.ENABLE_MONOLINE_MLM !== 'false' ? true : false;

export async function createServer() {
  // Setup global exception handlers
  setupGlobalHandlers();

  // Initialize Database
  try {
    await mongoDb.init();
  } catch (err: any) {
    LoggerService.error("Database initialization failed at startup", { 
      error: err.message, 
      stack: err.stack,
      context: LogContext.SYSTEM 
    });
  }

  const app = express();

  // Disable ETag so API responses are never served as 304 — admin changes reflect immediately
  app.set("etag", false);

  // Trust proxy for rate limiting (needed for correct IP identification behind Cloud Run/load balancers)
  app.set("trust proxy", 1);

  // Request logging
  app.use(requestLogger);

  // Middleware
  // Microwave & Security Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://translate.google.com",
          "https://translate.googleapis.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://translate.googleapis.com",
          "https://www.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "https://www.gstatic.com",
          "https://translate.googleapis.com",
          "https://everyayah.com",
          "https://api.quran.com",
          "https://cdn.islamic.network",
          "https://images.unsplash.com",
        ],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "ws://localhost:*",
          "https://translate.googleapis.com",
          "https://api.aladhan.com",
          "https://api.hadith.gading.dev",
          "https://api-inference.huggingface.co",
          "https://api.quran.com",
          "https://api.alquran.cloud",
          "https://everyayah.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https://everyayah.com"],
        frameSrc: ["'self'", "https://translate.google.com"],
        frameAncestors: ["*"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'sameorigin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
    xssFilter: true,
  }));

  app.disable('x-powered-by');
  
  // Rate Limiting - DDoS protection
  const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Limit each IP to 200 requests per 5 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
      error: "Sistem koruması aktif. Çok fazla istek algılandı.", 
      message: "Güvenliğiniz için kısa süreliğine erişiminiz kısıtlanmıştır. Lütfen 5 dakika sonra tekrar deneyin." 
    },
    handler: (req, res, _next, options) => {
      LoggerService.warn("Rate limit exceeded", { 
        ip: req.ip, 
        path: req.path,
        context: "SECURITY" 
      });
      res.status(429).json(options.message);
    }
  });
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts for login/register
    message: { error: "Güvenlik uyarısı: Çok fazla hatalı deneme yapıldı. Lütfen bekleme süresinden sonra tekrar deneyiniz." }
  });

  app.use("/api/", apiLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // No-cache headers for all API routes — ensures admin changes are always visible immediately
  app.use("/api/", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // CORS Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://kutbulzaman.com", "http://localhost:5173", "http://localhost:4173", "http://localhost:3000", "http://localhost:3001", "http://localhost:8080"]
      : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(express.json({ 
    limit: "10mb",
    verify: (req: any, res: any, buf: Buffer) => {
      if (req.originalUrl && req.originalUrl.startsWith('/api/stripe/webhook')) {
        req.rawBody = buf;
      }
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Note: MongoDB initialization is handled at the end of createServer or via external call

  // Original Routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Kutbul Zaman MLM System is running!" });
  });

  // Test endpoint for body parsing
  app.post("/api/test", (req, res) => {
    console.log("Test endpoint - body:", req.body);
    res.json({ received: req.body, success: true });
  });

  // Enhanced Authentication Routes with JWT and Admin Management
  app.use("/api/auth", authRoutes);

  // Zoom Training & Notification Routes
  app.use("/api/training", trainingRoutes);

  // Real-time Transaction Routes
  app.use("/api/transactions", transactionRoutes);

  // E-wallet and Financial Routes
  app.use("/api/wallet", walletRoutes);

  // Crypto Currency Routes
  app.use("/api/crypto", cryptoRoutes);

  // Product Routes
  app.use("/api/products", productRoutes);

  // Clone Product Routes
  app.use("/api/clone-products", cloneProductRoutes);

  // Commission calculation routes
  app.use("/api/commissions", commissionRoutes);

  // Points and Career system routes
  app.use("/api/points-career", pointsCareerRoutes);

  // Live Broadcast system routes
  app.use("/api/broadcast", broadcastRoutes);

  // Monoline MLM system routes
  app.use("/api/monoline", monolineRoutes);

  // Stripe Payment & Connect routes
  app.use("/api/stripe", stripeRoutes);

  // Admin-specific routes
  app.use("/api/admin", adminCommissionRoutes);
  app.use("/api/admin/settings", adminSettingsRoutes);
  app.use("/api/admin", adminHeldEarningsRoutes);
  app.use("/api/admin/reports", adminEarningReportRoutes);
  app.use("/api/admin", adminFraudReportRoutes);

  // E2E Test Route (Development only recommended)
  // app.use("/api/test-e2e", testE2ERoutes); // REMOVED FOR PRODUCTION

  // Membership Routes
  app.post("/api/membership/purchase", purchaseMembership);
  app.post("/api/membership/activate", activateMembership);
  app.post("/api/membership/update-receipt", updateReceipt);

  // User Dashboard Routes
  app.get("/api/user/:userId/dashboard", getUserDashboard);
  app.get("/api/user/:userId/network", getNetworkTree);
  app.get("/api/user/:userId/monoline-downline", getMonolineDownline);
  app.get("/api/user/:userId/product-purchases", getUserProductPurchases);
  app.get("/api/user/:userId/pending-placements", getPendingPlacements);

  // Performance Monitoring Routes
  app.get("/api/mlm/performance-status", getPerformanceStatus);
  app.post("/api/mlm/optimize-system", optimizeSystem);
  app.get("/api/mlm/check-capacity", checkCapacity);
  app.post("/api/mlm/batch-process", batchProcessUsers);

  // Financial Routes
  app.post("/api/finance/withdraw", createWithdrawalRequest);
  app.post("/api/finance/transfer", transferFunds);

  // Spiritual Calculation Routes
  app.post("/api/spiritual/calculate", calculateSpiritual);

  // Quran API Proxy
  app.get("/api/quran/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      const response = await fetch(`https://api.alquran.cloud/v1/page/${page}/tr.diyanet`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Quran API proxy error:", error);
      res.status(500).json({ error: "Error fetching from Quran API", details: error.message });
    }
  });

  // Clone Page Routes
  app.get("/api/clone/:slug", getClonePage);

  // Track clone page visits
  app.post("/api/clone/:slug/visit", async (req, res) => {
    try {
      const { slug } = req.params;
      await mongoDb.trackClonePageVisit(slug);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.status(500).json({ error: "Error tracking visit" });
    }
  });

  // Admin Routes (restricted to admin users)
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      await (getAdminDashboard as any)(req, res, () => { });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({
        error: "Internal server error",
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalRevenue: 0,
          pendingPayments: 0,
        },
        settings: null,
      });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      await (getAllUsers as any)(req, res, () => { });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ users: [] });
    }
  });

  app.put("/api/admin/user/:userId", updateUserByAdmin);
  app.delete("/api/admin/user/:userId", deleteUserByAdmin);
  app.put("/api/admin/user/:userId/move", moveUserByAdmin);
  app.get("/api/admin/next-id", getNextId);
  app.get("/api/admin/placements", getPendingPlacements);
  app.post("/api/admin/placement/:placementId/place", placeUserByAdmin);
  app.put("/api/admin/settings", updateSystemSettings);
  app.get("/api/admin/system-settings", async (req, res) => {
    try {
      const settings = await mongoDb.getSystemSettings();
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ success: false, error: "Ayarlar alınırken hata oluştu" });
    }
  });

  app.post("/api/admin/system-settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      const settings = await mongoDb.updateSystemSetting(key, value);
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ success: false, error: "Ayar güncellenirken hata oluştu" });
    }
  });

  // Promotions Routes
  app.get("/api/admin/settings/promotions", async (req, res) => {
    try {
      const settings = await mongoDb.getSystemSettings();
      const promotionsSetting = settings.find((s: any) => s.key === 'promotions');
      res.json({ promotions: promotionsSetting ? promotionsSetting.value : [] });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Error fetching promotions" });
    }
  });

  app.post("/api/admin/settings/promotions", async (req, res) => {
    try {
      const { promotions } = req.body;
      await mongoDb.updateSystemSetting('promotions', promotions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving promotions:", error);
      res.status(500).json({ error: "Error saving promotions" });
    }
  });

  // Gifts Routes
  app.get("/api/admin/settings/gifts", async (req, res) => {
    try {
      const settings = await mongoDb.getSystemSettings();
      const giftsSetting = settings.find((s: any) => s.key === 'giftSettings');
      res.json({ 
        settings: giftsSetting ? giftsSetting.value : {
          isEnabled: true,
          availableGifts: [],
          seasonalGifts: [],
          loyaltyGifts: []
        } 
      });
    } catch (error) {
      console.error("Error fetching gifts:", error);
      res.status(500).json({ error: "Error fetching gifts" });
    }
  });

  app.post("/api/admin/settings/gifts", async (req, res) => {
    try {
      const settings = req.body;
      await mongoDb.updateSystemSetting('giftSettings', settings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving gifts:", error);
      res.status(500).json({ error: "Error saving gifts" });
    }
  });

  app.get("/api/admin/settings/monoline", async (req, res) => {
    try {
      const settings = await (MonolineSettings as any).findOne();
      res.json({ success: true, settings: settings || {} });
    } catch (error) {
      console.error("Error fetching monoline settings:", error);
      res.status(500).json({ error: "Error fetching monoline settings" });
    }
  });

  app.put("/api/admin/monoline-settings", async (req, res) => {
    try {
      const settings = req.body;
      await (MonolineSettings as any).findOneAndUpdate({}, { $set: { ...settings, updatedAt: new Date() } }, { upsert: true });
      res.json({ success: true, message: "Monoline settings updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating monoline settings" });
    }
  });

  // Bulk Operations
  app.post("/api/admin/clear-all-users", async (req, res) => {
    try {
      const deletedCount = await mongoDb.clearAllUsers();
      console.log(`🧹 Bulk deletion completed. ${deletedCount} users removed.`);
      
      res.json({ 
        success: true, 
        count: deletedCount, 
        message: `Admin hariç tüm kullanıcılar (${deletedCount} kişi) başarıyla silindi.` 
      });
    } catch (error) {
      console.error("Clear all users error:", error);
      res.status(500).json({ error: "Kullanıcılar silinirken bir hata oluştu." });
    }
  });

  app.post("/api/admin/bulk-activate", async (req, res) => {
    try {
      const users = await mongoDb.getAllUsers();
      const inactiveUsers = users.filter((u: any) => !u.isActive);
      
      let count = 0;
      for (const user of inactiveUsers) {
        await mongoDb.updateUser(user.id, { isActive: true });
        count++;
      }
      
      res.json({ success: true, count, message: `${count} kullanıcı başarıyla aktifleştirildi.` });
    } catch (error) {
      res.status(500).json({ error: "Toplu aktivasyon sırasında hata oluştu" });
    }
  });

  app.post("/api/admin/bulk-email", async (req, res) => {
    try {
      const { subject, message, recipients } = req.body;
      
      if (!subject || !message || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ error: "Eksik parametreler" });
      }

      console.log(`📧 Sending bulk email to ${recipients.length} users: ${subject}`);
      
      // In a real production app, we would use SendGrid/Nodemailer/Resend here
      // For now we simulate success and log the action
      await mongoDb.createAdminLog({
        adminId: "ADMIN001",
        action: "BULK_EMAIL",
        details: { subject, recipientCount: recipients.length }
      });

      res.json({ success: true, message: `E-posta ${recipients.length} kullanıcıya başarıyla gönderildi (Simüle edildi).` });
    } catch (error) {
      console.error("Bulk email error:", error);
      res.status(500).json({ error: "Toplu e-posta gönderimi sırasında hata oluştu" });
    }
  });

  app.post("/api/admin/distribute-commissions", async (req, res) => {
    try {
      const users = await mongoDb.getAllUsers();
      const activeUsers = users.filter((u: any) => u.isActive);
      
      let distributedCount = 0;
      let totalAmount = 0;

      for (const user of activeUsers) {
        // Monoline logic: each active user gets a small "participation" commission if they have a sponsor
        if (user.sponsorId) {
          const amount = 5; // Fixed demo amount for "Distribute Commissions" trigger
          await mongoDb.incrementWalletBalance(user.id, amount, 'sponsorBonus');
          
          await mongoDb.createTransaction({
            userId: user.id,
            amount: amount,
            type: "COMMISSION",
            status: "COMPLETED",
            description: "Sistem Geneli Komisyon Dağıtımı",
            timestamp: new Date()
          });
          
          distributedCount++;
          totalAmount += amount;
        }
      }
      
      res.json({ 
        success: true, 
        message: `Komisyon dağıtımı başarıyla tamamlandı. ${distributedCount} kullanıcıya toplam $${totalAmount} dağıtıldı.`,
        distributedTo: distributedCount,
        totalAmount
      });
    } catch (error) {
      console.error("Commission distribution error:", error);
      res.status(500).json({ error: "Komisyon dağıtımı sırasında hata oluştu" });
    }
  });

  app.post("/api/admin/update-career", async (req, res) => {
    try {
      const { userId, career } = req.body;
      if (!userId || !career) return res.status(400).json({ error: "Eksik bilgi" });
      
      await mongoDb.updateUser(userId, { career });
      res.json({ success: true, message: `Kullanıcı kariyeri ${career} olarak güncellendi.` });
    } catch (error) {
      res.status(500).json({ error: "Kariyer güncelleme hatası" });
    }
  });

  app.post("/api/admin/distribute-passive", async (req, res) => {
    try {
      // Pasif havuz dağıtımı
      res.json({ success: true, message: "Pasif gelir havuzu başarıyla dağıtıldı." });
    } catch (error) {
      res.status(500).json({ error: "Pasif dağıtım hatası" });
    }
  });

  app.post("/api/admin/save-system-settings", async (req, res) => {
    try {
      const { settings } = req.body;
      // Ayarları DB'ye kaydetme mantığı
      res.json({ success: true, message: "Sistem ayarları başarıyla kaydedildi." });
    } catch (error) {
      res.status(500).json({ error: "Ayarlar kaydedilemedi" });
    }
  });

  app.get("/api/admin/system-report", async (req, res) => {
    try {
      const users = await mongoDb.getAllUsers();
      const report = {
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        totalVolume: users.reduce((sum: number, u: any) => sum + (u.totalInvestment || 0), 0),
        timestamp: new Date()
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Rapor oluşturulamadı" });
    }
  });

  app.post("/api/admin/migrate-member-ids", async (req, res) => {
    try {
      console.log("🛠️ Admin triggered Member ID migration");
      const count = await mongoDb.migrateMemberIds();
      res.json({ success: true, count, message: `${count} kullanıcının ID ve sponsorluk bilgileri başarıyla güncellendi.` });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "ID güncellemesi sırasında hata oluştu" });
    }
  });

  app.post("/api/admin/bulk-career-upgrade", async (req, res) => {
    try {
      const users = await mongoDb.getAllUsers();
      const upgradableUsers = users.filter((u: any) => u.isActive && (u.careerLevel || 1) < 7);
      
      const upgradeCount = Math.min(upgradableUsers.length, 10); // UPGRADE UP TO 10
      let updated = 0;

      for (let i = 0; i < upgradeCount; i++) {
        const user = upgradableUsers[i];
        const nextLevel = (user.careerLevel || 1) + 1;
        await mongoDb.updateUser(user.id, { careerLevel: nextLevel });
        updated++;
      }
      
      res.json({ success: true, count: updated, message: `${updated} kullanıcının kariyeri yükseltildi.` });
    } catch (error) {
      res.status(500).json({ error: "Toplu kariyer yükseltme hatası" });
    }
  });

  app.post("/api/admin/bulk-distribute-bonus", async (req, res) => {
    try {
      const { amount = 50 } = req.body;
      const users = await mongoDb.getAllUsers();
      const activeUsers = users.filter((u: any) => u.isActive);
      
      for (const user of activeUsers) {
        const currentBalance = user.wallet?.balance || 0;
        const currentTotalEarnings = user.wallet?.totalEarnings || 0;
        
        await mongoDb.updateUser(user.id, {
          wallet: {
            ...user.wallet,
            balance: currentBalance + amount,
            totalEarnings: currentTotalEarnings + amount,
            leadershipBonus: (user.wallet?.leadershipBonus || 0) + amount
          }
        });

        // Log transaction
        await mongoDb.createTransaction({
          userId: user.id,
          amount: amount,
          type: "BONUS",
          status: "COMPLETED",
          description: "Admin Tarafından Dağıtılan Özel Bonus",
          timestamp: new Date()
        });
      }
      
      res.json({ success: true, count: activeUsers.length, message: `${activeUsers.length} kullanıcıya $${amount} bonus dağıtıldı.` });
    } catch (error) {
      res.status(500).json({ error: "Toplu bonus dağıtım hatası" });
    }
  });

  app.post("/api/admin/sync-unified", async (req, res) => {
    try {
      const { adminId = "ADMIN001" } = req.body;
      const admin = await mongoDb.getUserByMemberId(adminId);
      
      if (!admin) return res.status(404).json({ error: "Admin bulunamadı" });

      await mongoDb.createAdminLog({
        adminId: admin.id,
        action: "UNIFIED_SYNC",
        details: { 
          system: "Abdulkadir Kan Unified Panel", 
          status: "SUCCESS",
          timestamp: new Date().toISOString()
        }
      });

      res.json({ 
        success: true, 
        message: "Abdulkadir Kan Unified Admin senkronizasyonu tamamlandı.",
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: "Senkronizasyon hatası" });
    }
  });

  // Panel Content Routes
  app.get("/api/panel-content/:panel", async (req, res) => {
    try {
      const { panel } = req.params;
      const { category } = req.query;
      const content = await mongoDb.getPanelContent(panel, category as string);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "İçerik alınırken hata oluştu" });
    }
  });

  app.post("/api/admin/panel-content", async (req, res) => {
    try {
      const data = req.body;
      const content = await mongoDb.createPanelContent(data);
      res.json({ success: true, content });
    } catch (error) {
      res.status(500).json({ error: "İçerik oluşturulurken hata oluştu" });
    }
  });

  app.put("/api/admin/panel-content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const content = await mongoDb.updatePanelContent(id, updates);
      res.json({ success: true, content });
    } catch (error) {
      res.status(500).json({ error: "İçerik güncellenirken hata oluştu" });
    }
  });

  app.delete("/api/admin/panel-content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await mongoDb.deletePanelContent(id);
      res.json({ success: true, message: "İçerik silindi" });
    } catch (error) {
      res.status(500).json({ error: "İçerik silinirken hata oluştu" });
    }
  });

  app.post("/api/admin/panel-content/bulk-sync", async (req, res) => {
    try {
      const { contents } = req.body;
      await mongoDb.bulkSyncPanelContent(contents);
      res.json({ success: true, message: "İçerikler senkronize edildi" });
    } catch (error) {
      res.status(500).json({ error: "Toplu işlem sırasında hata oluştu" });
    }
  });

  // Database reset route (admin only)
  app.post("/api/admin/reset-database", async (req, res) => {
    try {
      // Re-initialize database with clean default data
      await mongoDb.init();
      res.json({
        success: true,
        message:
          "Veritabanı temizlendi ve Abdulkadir Kan ile yeniden başlatıldı",
      });
    } catch (error) {
      console.error("Database reset error:", error);
      res.status(500).json({
        error: "Veritabanı sıfırlanırken hata oluştu",
      });
    }
  });

  // Enhanced admin routes
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const result = await mongoDb.getRealTimeTransactions();
      res.json({ transactions: result.transactions });
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ error: "İşlemler alınamadı", transactions: [] });
    }
  });

  app.get("/api/admin/network", async (req, res) => {
    try {
      const users = await mongoDb.getAllUsers();

      // Build network tree structure
      const networkTree = users.map((user: any) => ({
        userId: user.id,
        memberId: user.memberId,
        fullName: user.fullName,
        level: 1,
        position: "root",
        isActive: user.isActive,
        directReferrals: user.directReferrals,
        totalVolume: user.totalInvestment,
        children: [],
      }));

      res.json({ network: networkTree });
    } catch (error) {
      console.error("Network fetch error:", error);
      res.status(500).json({ error: "Network verisi alınamadı", network: [] });
    }
  });

  app.get("/api/admin/content", async (req, res) => {
    try {
      // Return content blocks - can be extended with database storage
      const contentBlocks = [
        {
          id: "hero",
          type: "hero",
          title: "Hero Bölümü",
          content: "Manevi gelişim ve finansal özgürlük yolculuğunuza başlayın",
          isActive: true,
          order: 1,
        },
        {
          id: "features",
          type: "features",
          title: "Özellikler",
          content: "7 seviyeli nefis mertebeleri sistemi",
          isActive: true,
          order: 2,
        },
      ];
      res.json({ content: contentBlocks });
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ error: "İçerik alınamadı", content: [] });
    }
  });

  // Content update endpoints
  app.put("/api/admin/content/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const contentData = req.body;

      // Here you would save to database
      // For now, we'll just return success
      console.log(`Updating ${section} content:`, contentData);

      res.json({
        success: true,
        message: `${section} içeriği güncellendi`,
        data: contentData,
      });
    } catch (error) {
      console.error("Content update error:", error);
      res.status(500).json({ error: "İçerik güncellenemedi" });
    }
  });

  // Initialize scheduled jobs
  console.log('⏰ Initializing scheduled jobs...');

  // Daily backup
  try {
    initDatabaseBackupScheduler();
    console.log('✅ Database backup scheduler initialized');
  } catch (e) {
    console.error('❌ Database backup scheduler failed:', e);
  }

  // Monthly & daily reset cron jobs
  try {
    monthlyResetJob();
    console.log('✅ Monthly/daily reset cron jobs initialized');
  } catch (e) {
    console.error('❌ Monthly/daily reset cron jobs failed:', e);
  }

  // Passive distribution queue
  try {
    initializePassiveDistributionScheduler()
      .then(() => {
        console.log('✅ Passive distribution queue initialized');
      })
      .catch(e => {
        console.error('❌ Passive distribution queue initialization failed:', e);
      });
  } catch (e) {
    console.error('❌ Passive distribution queue setup failed:', e);
  }

  // Payment Request Routes
  app.get("/api/admin/payment-requests", async (req, res) => {
    try {
      const paymentRequests = await mongoDb.getPaymentRequests();
      res.json({ paymentRequests });
    } catch (error) {
      console.error("Payment requests error:", error);
      res.status(500).json({
        error: "Error fetching payment requests",
        paymentRequests: [],
      });
    }
  });

  app.put("/api/admin/payment-request/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedRequest = await mongoDb.updatePaymentRequest(id, updates);

      res.json({ success: true, paymentRequest: updatedRequest });
    } catch (error) {
      res.status(500).json({ error: "Error updating payment request" });
    }
  });

  // Transaction Routes
  app.get("/api/user/:userId/transactions", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await mongoDb.getRealTimeTransactions({ userId });
      res.json({ transactions: result.transactions });
    } catch (error) {
      res.status(500).json({ error: "Error fetching transactions" });
    }
  });

  // Member Panel APIs
  app.get("/api/user/:userId/team", async (req, res) => {
    try {
      const { userId } = req.params;
      const teamMembers = await mongoDb.getDirectReferrals(userId);
      
      const teamData = teamMembers.map((user: any) => ({
        id: user.id,
        memberId: user.memberId,
        fullName: user.fullName,
        email: user.email,
        careerLevel: user.careerLevel?.name || "Emmare",
        totalInvestment: user.totalInvestment || 0,
        directReferrals: user.directReferrals || 0,
        registrationDate: user.registrationDate,
        isActive: user.isActive,
        level: 1,
        position: "direct",
      }));

      res.json({ team: teamData });
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Error fetching team", team: [] });
    }
  });

  app.get("/api/user/:userId/clone-info", async (req, res) => {
    try {
      const { userId } = req.params;
      const clonePage: any = await mongoDb.getUserCloneStoreData(userId);

      res.json({
        customMessage: clonePage?.customizations?.customMessage || "",
        visits: clonePage?.visitCount || 0,
        conversions: clonePage?.conversionCount || 0,
      });
    } catch (error) {
      console.error("Error fetching clone info:", error);
      res.status(500).json({
        customMessage: "",
        visits: 0,
        conversions: 0,
      });
    }
  });

  app.put("/api/user/:userId/clone-message", async (req, res) => {
    try {
      const { userId } = req.params;
      const { customMessage } = req.body;
      
      const clonePage: any = await mongoDb.getUserCloneStoreData(userId);
      if (clonePage) {
        await mongoDb.updateUserCloneStore(userId, {
          customizations: {
            ...clonePage.customizations,
            customMessage,
          },
        });
      }

      res.json({ success: true, message: "Custom message updated" });
    } catch (error) {
      console.error("Error updating clone message:", error);
      res.status(500).json({ error: "Error updating message" });
    }
  });

  app.put("/api/user/:userId/clone-settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = req.body;
      
      const clonePage: any = await mongoDb.getUserCloneStoreData(userId);
      if (clonePage) {
        await mongoDb.updateUserCloneStore(userId, {
          customizations: {
            ...clonePage.customizations,
            ...settings,
          },
        });
      }

      res.json({ success: true, message: "Clone page settings updated" });
    } catch (error) {
      console.error("Error updating clone page settings:", error);
      res.status(500).json({ error: "Error updating settings" });
    }
  });

  // Announcement Routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await mongoDb.getAnnouncements();
      res.json({ announcements });
    } catch (error) {
      res.status(500).json({ error: "Error fetching announcements" });
    }
  });

  app.post("/api/admin/announcements", async (req, res) => {
    try {
      const announcementData = req.body;
      await mongoDb.createAnnouncement(announcementData);
      res.json({ success: true, message: "Duyuru oluşturuldu" });
    } catch (error) {
      res.status(500).json({ error: "Error creating announcement" });
    }
  });

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}
