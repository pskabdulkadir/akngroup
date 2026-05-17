import { Router } from "express";
import { mlmDb } from "../lib/mlm-database";
import { verifyAccessToken, sanitizeUserData } from "../lib/utils";

const router = Router();

// Middleware for authentication
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme başlığı gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token gereklidir.",
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await mlmDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Geçersiz token.",
    });
  }
};

// Middleware for admin authentication
const requireAdmin = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin yetkisi gereklidir.",
      });
    }
    next();
  });
};

// ===== REAL-TIME TRANSACTION ROUTES =====

// Create new transaction
router.post("/create", requireAuth, async (req: any, res) => {
  try {
    const {
      type,
      subType,
      amount,
      currency = "TRY",
      description,
      metadata = {},
      targetUserId, // For transfers
    } = req.body;

    // Validation
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        error: "Transaction tipi, miktar ve açıklama gereklidir.",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Miktar pozitif olmalıdır.",
      });
    }

    // Special handling for transfers
    if (type === "transfer" && targetUserId) {
      const targetUser = await mlmDb.getUserById(targetUserId);
      if (!targetUser) {
        return res.status(400).json({
          success: false,
          error: "Hedef kullanıcı bulunamadı.",
        });
      }
      metadata.targetUserId = targetUserId;
      metadata.sourceUserId = req.user.id;
    }

    // Create transaction
    const result = await mlmDb.createRealTimeTransaction({
      userId: req.user.id,
      type,
      subType,
      amount: parseFloat(amount),
      currency,
      description,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      requireApproval: type === "withdrawal" && amount > 1000, // Auto-require approval for large withdrawals
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // For transfers, create corresponding transaction for target user
    if (type === "transfer" && targetUserId) {
      await mlmDb.createRealTimeTransaction({
        userId: targetUserId,
        type: "transfer",
        subType: "incoming",
        amount: parseFloat(amount),
        currency,
        description: `Transfer from ${req.user.fullName}`,
        metadata: {
          sourceUserId: req.user.id,
          targetUserId,
          relatedTransactionId: result.transactionId,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({
      success: false,
      error: "Transaction oluşturulurken sunucu hatası oluştu.",
    });
  }
});

// Get user transactions
router.get("/my-transactions", requireAuth, async (req: any, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const criteria: any = {
      userId: req.user.id,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (type) criteria.type = type;
    if (status) criteria.status = status;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mlmDb.getRealTimeTransactions(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    return res.status(500).json({
      success: false,
      error: "Transactionlar yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get transaction details
router.get("/:transactionId", requireAuth, async (req: any, res) => {
  try {
    const { transactionId } = req.params;

    const transactions = await mlmDb.getRealTimeTransactions({
      limit: 1000, // Get all to search
    });

    const transaction = transactions.transactions.find(
      (t) => t.transactionId === transactionId,
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction bulunamadı.",
      });
    }

    // Check if user can access this transaction
    if (transaction.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Bu transactiona erişim yetkiniz yok.",
      });
    }

    return res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Get transaction details error:", error);
    return res.status(500).json({
      success: false,
      error: "Transaction detayları yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get transaction statistics
router.get("/stats/summary", requireAuth, async (req: any, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await mlmDb.getTransactionStats(
      req.user.id,
      parseInt(days as string),
    );

    return res.json({
      success: true,
      stats,
      period: {
        days: parseInt(days as string),
        from: new Date(
          Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000,
        ),
        to: new Date(),
      },
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Transaction istatistikleri yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Cancel pending transaction
router.post("/:transactionId/cancel", requireAuth, async (req: any, res) => {
  try {
    const { transactionId } = req.params;

    const transactions = await mlmDb.getRealTimeTransactions({
      limit: 1000,
    });

    const transaction = transactions.transactions.find(
      (t) => t.transactionId === transactionId,
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction bulunamadı.",
      });
    }

    // Check if user can cancel this transaction
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Bu transactiona erişim yetkiniz yok.",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Sadece bekleyen transactionlar iptal edilebilir.",
      });
    }

    // Update transaction status
    await mlmDb.db.read();
    const transactionIndex = mlmDb.db.data.realTimeTransactions?.findIndex(
      (t) => t.transactionId === transactionId,
    );

    if (transactionIndex !== undefined && transactionIndex >= 0) {
      mlmDb.db.data.realTimeTransactions![transactionIndex].status =
        "cancelled";
      mlmDb.db.data.realTimeTransactions![transactionIndex].timestamps.failed =
        new Date();
      mlmDb.db.data.realTimeTransactions![transactionIndex].notes =
        "Kullanıcı tarafından iptal edildi";
      await mlmDb.db.write();
    }

    // Create activity log
    await mlmDb.createMemberActivity({
      memberId: req.user.memberId,
      userId: req.user.id,
      activityType: "TRANSACTION",
      description: `Transaction cancelled: ${transaction.amount} ${transaction.currency}`,
      data: {
        transactionId,
        type: transaction.type,
        amount: transaction.amount,
        status: "cancelled",
      },
    });

    return res.json({
      success: true,
      message: "Transaction başarıyla iptal edildi.",
    });
  } catch (error) {
    console.error("Cancel transaction error:", error);
    return res.status(500).json({
      success: false,
      error: "Transaction iptal edilirken sunucu hatası oluştu.",
    });
  }
});

// ===== ADMIN TRANSACTION MANAGEMENT ROUTES =====

// Get all transactions (admin only)
router.get("/admin/all", requireAdmin, async (req: any, res) => {
  try {
    const {
      userId,
      type,
      status,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const criteria: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (userId) criteria.userId = userId;
    if (type) criteria.type = type;
    if (status) criteria.status = status;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mlmDb.getRealTimeTransactions(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Admin get all transactions error:", error);
    return res.status(500).json({
      success: false,
      error: "Transactionlar yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get system transaction statistics (admin only)
router.get("/admin/stats", requireAdmin, async (req: any, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await mlmDb.getTransactionStats(
      undefined, // All users
      parseInt(days as string),
    );

    return res.json({
      success: true,
      stats,
      period: {
        days: parseInt(days as string),
        from: new Date(
          Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000,
        ),
        to: new Date(),
      },
    });
  } catch (error) {
    console.error("Get admin transaction stats error:", error);
    return res.status(500).json({
      success: false,
      error:
        "Sistem transaction istatistikleri yüklenirken sunucu hatası oluştu.",
    });
  }
});

export default router;
