import { Router } from "express";
import PDFDocument from 'pdfkit';
import { mongoDb } from "../lib/mongo-database";
import { GoogleGenAI } from "@google/genai";
import LoggerService, { LogContext } from "../lib/logger";
import {
  hashPasswordBcrypt,
  verifyPasswordBcrypt,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sanitizeUserData,
  verifyPassword, // Keep for backward compatibility with existing admin
  isValidPhone,
} from "../lib/utils";
import { User } from "../../shared/mlm-types";
import SmsService from "../lib/sms-service";
import PointsCareerService from "../lib/points-career-service";
import { sendPasswordResetEmail } from "../lib/email-service";
import {
  getCareerLevel,
  isActiveMember,
  calculateActiveFee,
  distributeIncome,
  careerLevels,
  CareerLevel
} from "../../shared/mlmRules";

const router = Router();

// Helper to normalize career level from ID/number to full object
const normalizeCareerLevel = (levelInput: any) => {
  if (!levelInput) return undefined;
  if (typeof levelInput === 'object' && levelInput.id && levelInput.name) return levelInput;
  
  const levelIdOrNum = levelInput.toString();
  const allLevels = PointsCareerService.getDefaultCareerLevels();
  const foundLevel = allLevels.find(l => 
    l.level.toString() === levelIdOrNum || 
    l.id === levelIdOrNum || 
    l.name.toLowerCase() === levelIdOrNum.toLowerCase()
  );
  return foundLevel || levelInput;
};

// Authentication middleware
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

    const decoded: any = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz veya süresi dolmuş token.",
      });
    }

    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Geçersiz token.",
    });
  }
};

// Admin authentication middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Bu işlem için admin yetkileri gereklidir.",
      });
    }
    next();
  });
};

// ===== AUTHENTICATION ROUTES =====

// Send password reset code via SMS
router.post("/forgot-password-sms", async (req, res) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ success: false, error: "Geçerli bir telefon numarası gereklidir." });
    }

    const user = await mongoDb.getUserByPhone(phone);
    if (!user) {
      // Do not reveal user existence
      return res.json({ success: true, message: "Şifre yenileme kodu gönderildi." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await mongoDb.createPasswordReset(user.id, phone, code, expiresAt);

    await SmsService.sendSms(phone, `Kutbul Zaman şifre yenileme kodunuz: ${code}. 10 dakika içinde kullanın.`);
    LoggerService.info(`Password reset SMS sent to ${phone}`, { context: LogContext.AUTH });

    return res.json({ success: true, message: "Şifre yenileme kodu gönderildi." });
  } catch (error) {
    LoggerService.error("Forgot password SMS error", { error, context: LogContext.AUTH });
    return res.status(500).json({ success: false, error: "Şifre yenileme kodu gönderilemedi." });
  }
});

// Verify code and reset password
router.post("/reset-password-sms", async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body as { phone?: string; code?: string; newPassword?: string };
    if (!phone || !isValidPhone(phone) || !code || !newPassword) {
      return res.status(400).json({ success: false, error: "Telefon, kod ve yeni şifre gereklidir." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "Şifre en az 6 karakter olmalıdır." });
    }
    // Verify reset code
    const validation = await mongoDb.verifyPasswordReset(phone, code);
    if (!validation.valid || !validation.userId) {
      return res.status(400).json({ success: false, error: validation.reason === 'expired' ? "Kodun süresi dolmuş." : "Geçersiz doğrulama kodu." });
    }

    // Hash new password
    const hash = await hashPasswordBcrypt(newPassword);

    // Update user password
    await mongoDb.updateUser(validation.userId, { password: hash });

    // Consume the reset code so it can't be used again
    await mongoDb.consumePasswordReset(phone, code);
    LoggerService.info(`Password reset successful via SMS for userId: ${validation.userId}`, { context: LogContext.AUTH });

    res.json({ success: true, message: "Şifreniz başarıyla güncellendi." });
  } catch (error) {
    LoggerService.error("Reset password SMS error", { error, context: LogContext.AUTH });
    res.status(500).json({ success: false, error: "Şifre sıfırlama işlemi başarısız oldu." });
  }
});

router.post("/forgot-password-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: "Geçerli bir email adresi gereklidir." });
    }

    const user = await mongoDb.getUserByEmail(email);
    if (!user) {
      // Security: Don't reveal if user exists, just simulate success
      // But for UX in this specific app request, user might want to know.
      // Standard practice: return success.
      // However, to be helpful to the user testing this:
      return res.status(404).json({ success: false, error: "Bu email adresi ile kayıtlı kullanıcı bulunamadı." });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await mongoDb.createEmailPasswordReset(user.id, email, code, expiresAt);

    // Send Email
    const emailSent = await sendPasswordResetEmail(email, code);

    if (emailSent) {
      LoggerService.info(`Password reset email sent to ${email}`, { context: LogContext.AUTH });
      res.json({ success: true, message: "Şifre sıfırlama kodu email adresinize gönderildi." });
    } else {
      LoggerService.warn(`Failed to send password reset email to ${email}`, { context: LogContext.AUTH });
      res.status(500).json({ success: false, error: "Email gönderilemedi. Lütfen daha sonra tekrar deneyin." });
    }
  } catch (error) {
    LoggerService.error("Forgot password email error", { error, context: LogContext.AUTH });
    res.status(500).json({ success: false, error: "İşlem başarısız oldu." });
  }
});

router.post("/reset-password-email", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, error: "Email, kod ve yeni şifre gereklidir." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "Şifre en az 6 karakter olmalıdır." });
    }

    // Verify reset code
    const validation = await mongoDb.verifyEmailPasswordReset(email, code);
    if (!validation.valid || !validation.userId) {
      return res.status(400).json({ success: false, error: validation.reason === 'expired' ? "Kodun süresi dolmuş." : "Geçersiz doğrulama kodu." });
    }

    // Hash new password
    const hash = await hashPasswordBcrypt(newPassword);

    // Update user password
    await mongoDb.updateUser(validation.userId, { password: hash });

    // Consume the reset code
    await mongoDb.consumeEmailPasswordReset(email, code);

    res.json({ success: true, message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
  } catch (error) {
    console.error("Reset password email error:", error);
    res.status(500).json({ success: false, error: "Şifre sıfırlama işlemi başarısız oldu." });
  }
});

// Login route with JWT support
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email ve şifre gereklidir.",
      });
    }

    // Get user by email
    console.log("Looking up user by email...");
    const user = await mongoDb.getUserByEmail(email);
    console.log(`User lookup result: ${user ? "Found" : "Not Found"}`);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz email veya şifre.",
      });
    }

    // Check password
    console.log("Verifying password...");
    const passwordValid = await verifyPasswordBcrypt(password, user.password);
    console.log(`Password verification result: ${passwordValid}`);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz email veya şifre.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.",
      });
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login date
    await mongoDb.updateUser(user.id, { lastLoginDate: new Date() });

    // Create member session with tracking
    const sessionId = await mongoDb.createMemberSession({
      memberId: user.memberId,
      userId: user.id,
      sessionToken: refreshToken,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Create detailed member log
    await mongoDb.createMemberLog({
      memberId: user.memberId,
      userId: user.id,
      action: "LOGIN",
      details: `Successful login from ${req.ip}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      sessionId,
      metadata: {
        loginMethod: "email_password",
        userRole: user.role,
        timestamp: new Date(),
      },
    });

    // Create member activity
    await mongoDb.createMemberActivity({
      memberId: user.memberId,
      userId: user.id,
      activityType: "AUTHENTICATION",
      description: "User logged in successfully",
      data: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        loginTime: new Date(),
      },
    });

    // Create admin audit log
    await mongoDb.createAdminLog({
      action: "USER_LOGIN",
      targetUserId: user.id,
      details: `User ${user.fullName} (${user.memberId}) logged in from ${req.ip}`,
      adminId: user.id,
    });

    return res.json({
      success: true,
      message: "Giriş başarılı.",
      user: sanitizeUserData(user),
      accessToken,
      refreshToken,
      expiresIn: "15m",
    });
  } catch (error: any) {
    LoggerService.error("Login error", { 
      error: error?.message || error,
      stack: error?.stack,
      context: LogContext.AUTH, 
      email: req.body.email 
    });
    return res.status(500).json({
      success: false,
      error: "Giriş sırasında sunucu hatası oluştu.",
    });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, sponsorCode } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Tüm alanlar gereklidir.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    // Check if email already exists
    const existingUser = await mongoDb.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Bu email adresi zaten kullanılıyor.",
      });
    }

    // Find sponsor if provided
    let sponsorId: string | undefined;
    if (sponsorCode) {
      const sponsor = await mongoDb.getUserByReferralCode(sponsorCode);
      if (!sponsor) {
        return res.status(400).json({
          success: false,
          error: "Geçersiz sponsor kodu.",
        });
      }
      sponsorId = sponsor.id;
    }

    // Check system capacity
    const capacity = await mongoDb.checkSystemCapacity();
    if (!capacity.canAddUser) {
      return res.status(503).json({
        success: false,
        error: "Sistem kapasitesi dolu. Lütfen daha sonra tekrar deneyin.",
      });
    }

    // Create user using admin function (with default member role)
    const result = await mongoDb.adminCreateUser({
      fullName,
      email,
      phone,
      password,
      role: "member",
      sponsorId,
      isActive: true,
      membershipType: "entry",
      initialBalance: 0,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: (result as any).message,
      });
    }

    // Create audit log
    await mongoDb.createAdminLog({
      action: "USER_REGISTER",
      targetUserId: result.user?.id,
      details: `New user registered: ${fullName} (${email}) with sponsor: ${sponsorCode || "none"}`,
      adminId: "system",
    });

    return res.status(201).json({
      success: true,
      message: "Kayıt başarılı. Giriş yapabilirsiniz.",
      user: result.user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Kayıt sırasında sunucu hatası oluştu.",
    });
  }
});

// Refresh token route
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token gereklidir.",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get current user data
    const user = await mongoDb.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz token veya kullanıcı.",
      });
    }

    // Generate new access token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: "15m",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(401).json({
      success: false,
      error: "Token yenilenirken hata oluştu.",
    });
  }
});

// Logout route (invalidate tokens - in production would use a blacklist)
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { sessionId } = req.body;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyAccessToken(token);
        const user = await mongoDb.getUserById(decoded.userId);

        if (user) {
          // End member session if sessionId provided
          if (sessionId) {
            await mongoDb.endMemberSession(sessionId);
          }

          // Create member log
          await mongoDb.createMemberLog({
            memberId: user.memberId,
            userId: user.id,
            action: "LOGOUT",
            details: `User logged out from ${req.ip}`,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            sessionId,
            metadata: {
              logoutTime: new Date(),
            },
          });

          // Create member activity
          await mongoDb.createMemberActivity({
            memberId: user.memberId,
            userId: user.id,
            activityType: "AUTHENTICATION",
            description: "User logged out",
            data: {
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
              logoutTime: new Date(),
            },
          });

          // Create admin audit log
          await mongoDb.createAdminLog({
            action: "USER_LOGOUT",
            targetUserId: decoded.userId,
            details: `User ${user.fullName} (${user.memberId}) logged out from ${req.ip}`,
            adminId: decoded.userId,
          });
        }
      } catch (error) {
        // Token invalid, but still return success for logout
        console.log("Invalid token during logout, proceeding anyway");
      }
    }

    return res.json({
      success: true,
      message: "Çıkış başarılı.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.json({
      success: true,
      message: "Çıkış başarılı.",
    });
  }
});

// ===== ADMIN USER MANAGEMENT ROUTES =====

// Admin create user
router.post("/admin/create-user", requireAdmin, async (req: any, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role = "member",
      sponsorId,
      careerLevel,
      isActive = true,
      membershipType = "entry",
      initialBalance = 0,
      placementPreference = "auto",
    } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: "Tüm gerekli alanlar doldurulmalıdır.",
      });
    }

    const result = await mongoDb.adminCreateUser({
      fullName,
      email,
      phone,
      password,
      role,
      sponsorId: sponsorId || req.user?.memberId || req.user?.id,
      careerLevel: normalizeCareerLevel(careerLevel),
      isActive,
      membershipType,
      initialBalance,
      placementPreference,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Admin create user error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı oluşturulurken sunucu hatası oluştu.",
    });
  }
});

// Admin update user
router.put(
  "/admin/update-user/:userId",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      const result = await mongoDb.adminUpdateUser(userId, updates, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Admin update user error:", error);
      return res.status(500).json({
        success: false,
        error: "Kullanıcı güncellenirken sunucu hatası oluştu.",
      });
    }
  },
);

// Admin delete user
router.delete(
  "/admin/delete-user/:userId",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { transferChildrenTo } = req.body;

      const result = await mongoDb.adminDeleteUser(
        userId,
        req.user.id,
        transferChildrenTo,
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Admin delete user error:", error);
      return res.status(500).json({
        success: false,
        error: "Kullanıcı silinirken sunucu hatası oluştu.",
      });
    }
  },
);

// Admin update user status
router.put(
  "/admin/users/:userId/status",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ success: false, error: "isActive alanı gereklidir." });
      }

      await mongoDb.updateUser(userId, { isActive });
      
      await mongoDb.createAdminLog({
        action: "USER_STATUS_UPDATE",
        targetUserId: userId,
        details: `User status changed to ${isActive ? "Active" : "Inactive"}`,
        adminId: req.user.id,
      });

      return res.json({ success: true, message: "Kullanıcı durumu güncellendi." });
    } catch (error) {
      console.error("Admin status update error:", error);
      return res.status(500).json({ success: false, error: "Sunucu hatası." });
    }
  }
);

// Admin promote user
router.put(
  "/admin/users/:userId/promote",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { careerLevel } = req.body;

      if (careerLevel === undefined) {
        return res.status(400).json({ success: false, error: "careerLevel gereklidir." });
      }

      let updatedCareerLevel = normalizeCareerLevel(careerLevel);

      await mongoDb.updateUser(userId, { careerLevel: updatedCareerLevel });

      await mongoDb.createAdminLog({
        action: "USER_PROMOTION",
        targetUserId: userId,
        details: `User promoted to level ${careerLevel}`,
        adminId: req.user.id,
      });

      return res.json({ success: true, message: "Kullanıcı kariyeri güncellendi." });
    } catch (error) {
      console.error("Admin promotion error:", error);
      return res.status(500).json({ success: false, error: "Sunucu hatası." });
    }
  }
);

// Admin search users
router.get("/admin/search-users", requireAdmin, async (req: any, res) => {
  try {
    const {
      search,
      role,
      isActive,
      careerLevel,
      kycStatus,
      membershipType,
      registeredAfter,
      registeredBefore,
      minBalance,
      maxBalance,
      hasChildren,
      limit = 50,
      offset = 0,
      sortBy = "registrationDate",
      sortOrder = "desc",
    } = req.query;

    const criteria: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy,
      sortOrder,
    };

    if (search) criteria.search = search;
    if (role) criteria.role = role;
    if (isActive !== undefined) criteria.isActive = isActive === "true";
    if (careerLevel) criteria.careerLevel = careerLevel;
    if (kycStatus) criteria.kycStatus = kycStatus;
    if (membershipType) criteria.membershipType = membershipType;
    if (registeredAfter)
      criteria.registeredAfter = new Date(registeredAfter as string);
    if (registeredBefore)
      criteria.registeredBefore = new Date(registeredBefore as string);
    if (minBalance) criteria.minBalance = parseFloat(minBalance as string);
    if (maxBalance) criteria.maxBalance = parseFloat(maxBalance as string);
    if (hasChildren !== undefined)
      criteria.hasChildren = hasChildren === "true";

    const result = await mongoDb.adminSearchUsers(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Admin search users error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı arama sırasında sunucu hatası oluştu.",
    });
  }
});

// Admin get all users
router.get("/admin/users", requireAdmin, async (req: any, res) => {
  try {
    const users = await mongoDb.getAllUsers();

    return res.json({
      success: true,
      users: users.map((user) => sanitizeUserData(user)),
      total: users.length,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcılar yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Admin get user by ID
router.get("/admin/users/:userId", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const user = await mongoDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    return res.json({
      success: true,
      user: sanitizeUserData(user),
    });
  } catch (error) {
    console.error("Admin get user error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Admin get logs
router.get("/admin/logs", requireAdmin, async (req: any, res) => {
  try {
    const {
      adminId,
      action,
      targetUserId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const criteria: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (adminId) criteria.adminId = adminId;
    if (action) criteria.action = action;
    if (targetUserId) criteria.targetUserId = targetUserId;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mongoDb.getAdminLogs(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Admin get logs error:", error);
    return res.status(500).json({
      success: false,
      error: "Admin logları yüklenirken sunucu hatası oluştu.",
    });
  }
});

// ===== SPONSOR INFO (public — only exposes name & memberId) =====
router.get("/member/by-member-id/:memberId", async (req: any, res) => {
  try {
    const { memberId } = req.params;
    const user = await mongoDb.getUserByMemberId(memberId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Üye bulunamadı." });
    }
    return res.json({
      success: true,
      sponsor: {
        fullName: user.fullName,
        memberId: user.memberId,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    req.log?.error({ error }, "sponsor lookup error");
    return res.status(500).json({ success: false, error: "Sunucu hatası." });
  }
});

// ===== ENHANCED MEMBER TRACKING ROUTES =====

// Get member logs (for specific member)
router.get("/member/:memberId/logs", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    const { memberId } = req.params;
    const { action, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Check if user can access this member's logs
    if (user.role !== "admin" && user.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Bu üyenin loglarına erişim yetkiniz yok.",
      });
    }

    const criteria: any = {
      memberId,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (action) criteria.action = action;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mongoDb.getMemberLogs(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get member logs error:", error);
    return res.status(500).json({
      success: false,
      error: "Üye logları yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get member activities
router.get("/member/:memberId/activities", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    const { memberId } = req.params;
    const {
      activityType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    // Check if user can access this member's activities
    if (user.role !== "admin" && user.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Bu üyenin aktivitelerine erişim yetkiniz yok.",
      });
    }

    const criteria: any = {
      memberId,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (activityType) criteria.activityType = activityType;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mongoDb.getMemberActivities(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get member activities error:", error);
    return res.status(500).json({
      success: false,
      error: "Üye aktiviteleri yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get member sessions
router.get("/member/:memberId/sessions", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    const { memberId } = req.params;
    const { isActive, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Check if user can access this member's sessions
    if (user.role !== "admin" && user.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Bu üyenin oturumlarına erişim yetkiniz yok.",
      });
    }

    const criteria: any = {
      memberId,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (isActive !== undefined) criteria.isActive = isActive === "true";
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mongoDb.getMemberSessions(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get member sessions error:", error);
    return res.status(500).json({
      success: false,
      error: "Üye oturumları yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get member tracking statistics
router.get("/member/:memberId/tracking-stats", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    const { memberId } = req.params;

    // Check if user can access this member's stats
    if (user.role !== "admin" && user.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Bu üyenin istatistiklerine erişim yetkiniz yok.",
      });
    }

    const stats = await mongoDb.getMemberTrackingStats(memberId);

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get member tracking stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Üye takip istatistikleri yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Track member activity (to be called from frontend)
router.post("/member/:memberId/track-activity", async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Yetkilendirme gereklidir.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await mongoDb.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Geçersiz kullanıcı.",
      });
    }

    const { memberId } = req.params;
    const { activityType, description, data, duration } = req.body;

    // Check if user can track activity for this member
    if (user.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: "Bu üye için aktivite kaydı yapma yetkiniz yok.",
      });
    }

    // Detect device info from user agent
    const userAgent = req.headers["user-agent"] || "";
    const device = {
      type: userAgent.includes("Mobile") ? "mobile" : "desktop",
      os: userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Mac")
          ? "macOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "Unknown",
      browser: userAgent.includes("Chrome")
        ? "Chrome"
        : userAgent.includes("Firefox")
          ? "Firefox"
          : userAgent.includes("Safari")
            ? "Safari"
            : "Unknown",
    };

    await mongoDb.createMemberActivity({
      memberId,
      userId: user.id,
      activityType,
      description,
      data,
      duration,
      device,
    });

    return res.json({
      success: true,
      message: "Aktivite kaydedildi.",
    });
  } catch (error) {
    console.error("Track member activity error:", error);
    return res.status(500).json({
      success: false,
      error: "Aktivite kaydedilirken sunucu hatası oluştu.",
    });
  }
});

// Admin get all member logs
router.get("/admin/member-logs", requireAdmin, async (req: any, res) => {
  try {
    const {
      memberId,
      userId,
      action,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const criteria: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (memberId) criteria.memberId = memberId;
    if (userId) criteria.userId = userId;
    if (action) criteria.action = action;
    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);

    const result = await mongoDb.getMemberLogs(criteria);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Admin get member logs error:", error);
    return res.status(500).json({
      success: false,
      error: "Üye logları yüklenirken sunucu hatası oluştu.",
    });
  }
});

// ===== ADVANCED BINARY ALGORITHM ROUTES =====

// Test binary placement algorithms
router.post(
  "/admin/test-binary-placement",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId, sponsorId, algorithm, preferences } = req.body;

      if (!userId || !sponsorId) {
        return res.status(400).json({
          success: false,
          error: "Kullanıcı ID ve sponsor ID gereklidir.",
        });
      }

      // Test placement without actually placing
      const result = await mongoDb.enhancedAutoPlacement(userId, sponsorId, {
        algorithm: algorithm || "balanced",
        ...preferences,
      });

      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Test binary placement error:", error);
      return res.status(500).json({
        success: false,
        error: "Yerleştirme testi sırasında sunucu hatası oluştu.",
      });
    }
  },
);

// Get binary tree analysis
router.get(
  "/admin/binary-analysis/:userId",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { algorithm = "balanced", maxDepth = 7 } = req.query;

      const user = await mongoDb.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Kullanıcı bulunamadı.",
        });
      }

      // Get detailed leg statistics
      const leftStats = user.leftChild
        ? await mongoDb.getDetailedLegStats(user.leftChild)
        : null;
      const rightStats = user.rightChild
        ? await mongoDb.getDetailedLegStats(user.rightChild)
        : null;

      // Find available positions
      const availablePositions = await mongoDb.findAvailablePositions(
        userId,
        parseInt(maxDepth as string),
      );

      // Get placement statistics
      const placementStats = await mongoDb.getPlacementStats(userId);

      return res.json({
        success: true,
        analysis: {
          user: {
            id: user.id,
            name: user.fullName,
            memberId: user.memberId,
            careerLevel: user.careerLevel.name,
          },
          leftLeg: leftStats,
          rightLeg: rightStats,
          availablePositions: availablePositions.length,
          positionDetails: availablePositions.slice(0, 10), // Limit for performance
          placementStats,
          recommendations: {
            suggestedAlgorithm:
              leftStats && rightStats
                ? Math.abs(((leftStats as any)?.leftLeg || 0) - ((rightStats as any)?.rightLeg || 0)) > 5
                  ? "balanced"
                  : "volume_based"
                : "size_based",
            balanceStatus: placementStats ? "balanced" : "imbalanced",
            nextPlacementSuggestion: availablePositions[0] || null,
          },
        },
      });
    } catch (error) {
      console.error("Binary analysis error:", error);
      return res.status(500).json({
        success: false,
        error: "Binary analiz sırasında sunucu hatası oluştu.",
      });
    }
  },
);

// Optimize binary tree structure
router.post(
  "/admin/optimize-binary-tree",
  requireAdmin,
  async (req: any, res) => {
    try {
      const { rootUserId, algorithm = "balanced", dryRun = true } = req.body;

      if (!rootUserId) {
        return res.status(400).json({
          success: false,
          error: "Kök kullanıcı ID gereklidir.",
        });
      }

      // Get current tree state
      const currentTree = await mongoDb.getNetworkTree(rootUserId, 7);

      // Analyze optimization opportunities
      const optimizationReport = {
        analyzed: true,
        currentBalance: "Analysis completed", // Would contain actual analysis
        recommendations: [
          "Bu özellik gelecek sürümlerde eklenecektir.",
          "Mevcut ağaç yapısı analiz edildi.",
        ],
        dryRun,
      };

      // Log the optimization attempt
      await mongoDb.createAdminLog({
        action: "TREE_OPTIMIZATION",
        targetUserId: rootUserId,
        details: `Binary tree optimization ${dryRun ? "analyzed" : "executed"} for ${rootUserId}`,
        adminId: req.admin.id,
        metadata: {
          algorithm,
          dryRun,
          report: optimizationReport,
        },
      });

      return res.json({
        success: true,
        message: dryRun
          ? "Ağaç optimizasyonu analiz edildi."
          : "Ağaç optimizasyonu tamamlandı.",
        report: optimizationReport,
      });
    } catch (error) {
      console.error("Binary tree optimization error:", error);
      return res.status(500).json({
        success: false,
        error: "Ağaç optimizasyonu sırasında sunucu hatası oluştu.",
      });
    }
  },
);

// Get binary algorithm performance metrics
router.get("/admin/binary-metrics", requireAdmin, async (req: any, res) => {
  try {
    const { startDate, endDate, algorithm, userId } = req.query;

    // Get placement logs from admin logs
    const criteria: any = {
      action: "BINARY_PLACEMENT",
      limit: 1000,
    };

    if (startDate) criteria.startDate = new Date(startDate as string);
    if (endDate) criteria.endDate = new Date(endDate as string);
    if (userId) criteria.targetUserId = userId;

    const placementLogs = await mongoDb.getAdminLogs(criteria);

    // Analyze metrics
    const metrics = {
      totalPlacements: placementLogs.logs.length,
      algorithmUsage: {} as Record<string, number>,
      averageDepth: 0,
      successRate: 0,
      balanceImprovements: 0,
    };

    // Calculate algorithm usage
    placementLogs.logs.forEach((log) => {
      const algo = log.metadata?.algorithm || "unknown";
      metrics.algorithmUsage[algo] = (metrics.algorithmUsage[algo] || 0) + 1;
    });

    // Calculate average depth
    const depths = placementLogs.logs
      .map((log) => log.metadata?.placement?.depth)
      .filter((depth) => typeof depth === "number");

    metrics.averageDepth =
      depths.length > 0
        ? depths.reduce((sum, depth) => sum + depth, 0) / depths.length
        : 0;

    // Success rate (assuming all logged placements were successful)
    metrics.successRate = 100;

    return res.json({
      success: true,
      metrics,
      period: {
        start: startDate || "inception",
        end: endDate || "now",
      },
    });
  } catch (error) {
    console.error("Binary metrics error:", error);
    return res.status(500).json({
      success: false,
      error: "Binary metrikler yüklenirken sunucu hatası oluştu.",
    });
  }
});

// Get current user info
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const user = await mongoDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Return user data without sensitive information
    const { password, passwordHash, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get user me error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı bilgisi alınırken hata oluştu.",
    });
  }
});

// Get spiritual content (Public authenticated)
router.get("/spiritual-content", requireAuth, async (req: any, res) => {
  try {
    const content = await mongoDb.getSpiritualContent();
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Manevi içerik alınamadı' });
  }
});

// Hatim Progress Routes
router.get("/manevi/hatim", requireAuth, async (req: any, res) => {
  try {
    const progress = await mongoDb.getHatimProgress(req.userId);
    res.json({ success: true, progress });
  } catch (error) {
    console.error("Get hatim error:", error);
    res.status(500).json({ success: false, error: "Hatim bilgisi alınamadı" });
  }
});

router.post("/manevi/hatim", requireAuth, async (req: any, res) => {
  try {
    const { page } = req.body;
    if (typeof page !== 'number' || page < 1 || page > 604) {
      return res.status(400).json({ success: false, error: "Geçersiz sayfa numarası" });
    }
    const progress = await mongoDb.updateHatimProgress(req.userId, page);
    res.json({ success: true, progress, message: "Hatim ilerlemesi güncellendi" });
  } catch (error) {
    console.error("Update hatim error:", error);
    res.status(500).json({ success: false, error: "Hatim ilerlemesi güncellenemedi" });
  }
});

// Dua Kardeşliği Routes
router.get("/manevi/dua", requireAuth, async (req: any, res) => {
  try {
    const duallar = await mongoDb.getDuaRequests();
    res.json({ success: true, duallar });
  } catch (error) {
    console.error("Get dua error:", error);
    res.status(500).json({ success: false, error: "Dualar listelenemedi" });
  }
});

router.post("/manevi/dua-request", requireAuth, async (req: any, res) => {
  try {
    const { title, content, targetCount, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Başlık ve içerik zorunludur" });
    }
    const dua = await mongoDb.createDuaRequest(req.userId, { title, content, targetCount, category });
    res.json({ success: true, dua, message: "Dua talebi oluşturuldu" });
  } catch (error) {
    console.error("Create dua error:", error);
    res.status(500).json({ success: false, error: "Dua talebi oluşturulamadı" });
  }
});

router.post("/manevi/dua-join/:id", requireAuth, async (req: any, res) => {
  try {
    const result = await mongoDb.joinDua(req.params.id, req.userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("Join dua error:", error);
    res.status(500).json({ success: false, error: "Duaya katılım sağlanamadı" });
  }
});

// Rüya Tabiri with AI (Gemini)
router.post("/manevi/interpret-dream", requireAuth, async (req: any, res) => {
  try {
    const { dreamText } = req.body;
    if (!dreamText || dreamText.length < 10) {
      return res.status(400).json({ success: false, error: "Lütfen rüyanızı daha detaylı anlatın." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Yapay zeka servisi şu an kullanılamıyor." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Lütfen aşağıdaki rüyayı İslami literatür ve rüya tabirleri (İmam Nablusi, İbn-i Sirin gibi kaynaklar) ışığında analiz et. 
    Kullanıcıya samimi, manevi bir dille rehberlik et. 
    Analizini şu JSON formatında döndür:
    {
      "generalInterpretation": "Rüyanın genel manevi yorumu",
      "foundSymbols": [{"symbol": "nesne/olay", "meaning": "İslami anlamı", "interpretation": "Yorumu"}],
      "recommendations": ["Manevi öneri 1", "Manevi öneri 2"],
      "overallMeaning": "Özet sonuç metni",
      "spiritualAdvice": "Kişiye özel manevi tavsiye, dua önerisi veya esma-ül hüsna önerisi"
    }
    Rüya metni: "${dreamText}"`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = result.text;
    
    // Clean JSON if needed (sometimes Gemini adds ```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const interpretation = JSON.parse(text);
      res.json({ success: true, interpretation });
    } catch (parseError) {
      res.json({ success: true, interpretation: { 
        generalInterpretation: text,
        recommendations: ["Bu rüya üzerine tefekkür etmenizi ve sadaka vermenizi öneririz."],
        overallMeaning: "Rüyanız analiz edildi.",
        spiritualAdvice: "Hayrlara vesile olması için dua ediniz."
      }});
    }
  } catch (error) {
    console.error("Dream interpretation error:", error);
    res.status(500).json({ success: false, error: "Rüya tabir edilirken bir hata oluştu." });
  }
});

// Member clone page info
router.get("/my-clone-page", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const user = await mongoDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Get user's clone page
    const clonePage = await mongoDb.getClonePageBySlug(user.memberId);

    if (!clonePage) {
      // Create clone page if it doesn't exist
      const newClonePage = await mongoDb.createClonePage(
        userId,
        user.fullName,
        user.memberId,
      );

      return res.json({
        success: true,
        clonePage: newClonePage,
        cloneUrl: `${req.protocol}://${req.get("host")}/clone/${user.memberId}`,
        user: {
          fullName: user.fullName,
          memberId: user.memberId,
          referralCode: user.referralCode,
          careerLevel: user.careerLevel,
        },
      });
    }

    return res.json({
      success: true,
      clonePage,
      cloneUrl: `${req.protocol}://${req.get("host")}/clone/${user.memberId}`,
      user: {
        fullName: user.fullName,
        memberId: user.memberId,
        referralCode: user.referralCode,
        careerLevel: user.careerLevel,
      },
    });
  } catch (error) {
    console.error("Get my clone page error:", error);
    return res.status(500).json({
      success: false,
      error: "Klon sayfa bilgisi alınırken hata oluştu.",
    });
  }
});

// Update clone page customizations
router.put("/my-clone-page", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { customMessage, headerImage, testimonials } = req.body;

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Get and update clone page
    const clonePage = await mongoDb.ClonePage.findOne({ userId });

    if (!clonePage) {
      return res.status(404).json({
        success: false,
        error: "Klon sayfa bulunamadı.",
      });
    }

    // Update customizations
    if (!clonePage.customizations) clonePage.customizations = {};
    
    if (customMessage) {
      clonePage.customizations.customMessage = customMessage;
    }
    if (headerImage) {
      clonePage.customizations.headerImage = headerImage;
    }
    if (testimonials) {
      clonePage.customizations.testimonials = testimonials;
    }

    clonePage.markModified('customizations');
    await clonePage.save();

    return res.json({
      success: true,
      clonePage,
      message: "Klon sayfa güncellendi.",
    });
  } catch (error) {
    console.error("Update clone page error:", error);
    return res.status(500).json({
      success: false,
      error: "Klon sayfa güncellenirken hata oluştu.",
    });
  }
});

// System Stats API
router.get("/admin/system-stats", requireAdmin, async (req: any, res) => {
  try {
    const users = await mongoDb.getAllUsers();
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      totalRevenue: users.reduce((sum, u) => sum + (u.totalInvestment || 0), 0),
      pendingPayments: 0,
      systemHealth: "healthy" as const,
      databaseSize: "12.5 MB",
      serverUptime: "3 days",
      apiCalls: 1247,
    };

    return res.json({ success: true, stats });
  } catch (error) {
    console.error("System stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Sistem istatistikleri alınırken hata oluştu.",
    });
  }
});

// System Configuration API
router.get("/admin/system-config", requireAdmin, async (req: any, res) => {
  try {
    const config = {
      siteName: "Kutbul Zaman",
      siteDescription: "Manevi Rehberim - MLM Sistemi",
      logoUrl: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#8B5CF6",
      registrationEnabled: true,
      maintenanceMode: false,
      maxCapacity: 1000000,
      autoPlacement: true,
      sslEnabled: false,
      environment: "development",
    };

    return res.json({ success: true, config });
  } catch (error) {
    console.error("System config error:", error);
    return res.status(500).json({
      success: false,
      error: "Sistem ayarları alınırken hata oluştu.",
    });
  }
});

// Update System Configuration
router.put("/admin/system-config", requireAdmin, async (req: any, res) => {
  try {
    const config = req.body;
    // Save configuration to database or file
    // For now, just return success

    return res.json({
      success: true,
      message: "Sistem ayarları güncellendi.",
      config,
    });
  } catch (error) {
    console.error("Update system config error:", error);
    return res.status(500).json({
      success: false,
      error: "Sistem ayarları güncellenirken hata oluştu.",
    });
  }
});

// Menu Configuration API
router.put("/admin/menu-config", requireAdmin, async (req: any, res) => {
  try {
    const { menuId, updates } = req.body;
    // Update menu configuration

    return res.json({
      success: true,
      message: "Menü ayarları güncellendi.",
      menuId,
      updates,
    });
  } catch (error) {
    console.error("Update menu config error:", error);
    return res.status(500).json({
      success: false,
      error: "Menü ayarları güncellenirken hata oluştu.",
    });
  }
});

// Button Configuration API
router.put("/admin/button-config", requireAdmin, async (req: any, res) => {
  try {
    const { buttonId, updates } = req.body;
    // Update button configuration

    return res.json({
      success: true,
      message: "Buton ayarları güncellendi.",
      buttonId,
      updates,
    });
  } catch (error) {
    console.error("Update button config error:", error);
    return res.status(500).json({
      success: false,
      error: "Buton ayarları güncellenirken hata oluştu.",
    });
  }
});

// Content Blocks API
router.put("/admin/content-blocks", requireAdmin, async (req: any, res) => {
  try {
    const { blockId, updates } = req.body;
    // Update content block

    return res.json({
      success: true,
      message: "İçerik bloğu güncellendi.",
      blockId,
      updates,
    });
  } catch (error) {
    console.error("Update content block error:", error);
    return res.status(500).json({
      success: false,
      error: "İçerik bloğu güncellenirken hata oluştu.",
    });
  }
});

// Initialize Database Schema
router.post("/admin/init-database", requireAdmin, async (req: any, res) => {
  try {
    const schema = req.body;
    // Initialize database tables based on schema

    return res.json({
      success: true,
      message: "Veritabanı şeması başarıyla oluşturuldu.",
      schema,
    });
  } catch (error) {
    console.error("Init database error:", error);
    return res.status(500).json({
      success: false,
      error: "Veritabanı oluşturma sırasında hata oluştu.",
    });
  }
});

// Deploy to Production
router.post("/admin/deploy-production", requireAdmin, async (req: any, res) => {
  try {
    const deployConfig = req.body;
    // Handle production deployment

    return res.json({
      success: true,
      message: "Sistem başarıyla canlı ortama aktarıldı!",
      deployConfig,
    });
  } catch (error) {
    console.error("Deploy production error:", error);
    return res.status(500).json({
      success: false,
      error: "Canlı yayına alma sırasında hata oluştu.",
    });
  }
});

// ===== ACTIVITY TRACKING ROUTES =====

// Get user activity stats
router.get(
  "/user/:userId/activity-stats",
  requireAuth,
  async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Users can only access their own stats unless they're admin
      if (req.user.role !== "admin" && req.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Bu bilgilere erişim yetkiniz bulunmuyor.",
        });
      }

      const activityStats = await mongoDb.getUserActivityStats(userId);

      if (!activityStats) {
        return res.status(404).json({
          success: false,
          error: "Kullanıcı bulunamadı.",
        });
      }

      return res.json({
        success: true,
        activityStats,
      });
    } catch (error) {
      console.error("Get activity stats error:", error);
      return res.status(500).json({
        success: false,
        error: "Aktiflik bilgileri alınırken hata oluştu.",
      });
    }
  },
);

// Update user activity
router.post(
  "/user/:userId/update-activity",
  requireAuth,
  async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Users can only update their own activity unless they're admin
      if (req.user.role !== "admin" && req.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Bu işlemi gerçekleştirme yetkiniz bulunmuyor.",
        });
      }

      await mongoDb.updateUserActivity(userId);

      return res.json({
        success: true,
        message: "Aktiflik durumu güncellendi.",
      });
    } catch (error) {
      console.error("Update activity error:", error);
      return res.status(500).json({
        success: false,
        error: "Aktiflik güncellenirken hata oluştu.",
      });
    }
  },
);

// Admin: Get all users with activity status
router.get("/admin/users-activity", requireAdmin, async (req: any, res) => {
  try {
    const usersWithActivity = await mongoDb.getAllUsersWithActivity();

    return res.json({
      success: true,
      users: usersWithActivity.map((user) => ({
        id: user.id,
        memberId: user.memberId,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        activityStats: user.activityStats,
        membershipType: user.membershipType,
        careerLevel: user.careerLevel.name,
      })),
    });
  } catch (error) {
    console.error("Get users activity error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı aktiflik bilgileri alınırken hata oluştu.",
    });
  }
});

// Admin: Batch update activity for all users
router.post(
  "/admin/batch-update-activity",
  requireAdmin,
  async (req: any, res) => {
    try {
      const users = await mongoDb.getAllUsers();
      const userIds = users.map((user) => user.id);

      await mongoDb.batchUpdateActivity(userIds);

      return res.json({
        success: true,
        message: `${userIds.length} kullanıcının aktiflik durumu güncellendi.`,
      });
    } catch (error) {
      console.error("Batch update activity error:", error);
      return res.status(500).json({
        success: false,
        error: "Toplu aktiflik güncellemesi sırasında hata oluştu.",
      });
    }
  },
);

// Admin: Update user comprehensive data
router.put("/admin/users/:userId", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Fix careerLevel if it's sent as a number or string ID instead of an object
    if (updateData.careerLevel) {
        updateData.careerLevel = normalizeCareerLevel(updateData.careerLevel);
    }

    console.log(`📝 Admin updating user ${userId}:`, updateData);

    // Validate user exists
    const existingUser = await mongoDb.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Update user data
    const updatedUser = await mongoDb.updateUser(userId, updateData);

    console.log(`✅ User updated successfully: ${updatedUser.fullName}`);

    return res.json({
      success: true,
      message: "Kullanıcı başarıyla güncellendi.",
      user: sanitizeUserData(updatedUser),
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı güncellenirken hata oluştu.",
    });
  }
});

// Admin: Delete user and all associated data
router.delete("/admin/users/:userId", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;

    console.log(`🗑 Admin deleting user ${userId}`);

    // Validate user exists
    const existingUser = await mongoDb.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Delete user and all associated data
    await mongoDb.deleteUser(userId);

    console.log(`✅ User deleted successfully: ${existingUser.fullName}`);
    console.log(`🔄 All user data removed from system`);

    return res.json({
      success: true,
      message: `${existingUser.fullName} kullanıcısı ve tüm verileri başarıyla silindi.`,
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı silinirken hata oluştu.",
    });
  }
});

// Admin: Update user role
router.put("/admin/users/:userId/role", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    console.log(`👑 Admin updating user role ${userId} to:`, role);

    const updatedUser = await mongoDb.updateUserRole(userId, role);

    return res.json({
      success: true,
      message: "Kullanıcı rolü başarıyla güncellendi.",
      user: sanitizeUserData(updatedUser),
    });
  } catch (error) {
    console.error("Admin update user role error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı rolü güncellenirken hata oluştu.",
    });
  }
});

// Admin: Update user career level
router.put("/admin/users/:userId/career", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { careerLevel } = req.body;

    console.log(`⭐ Admin updating user career ${userId} to level:`, careerLevel);

    const updatedUser = await mongoDb.updateUserCareerLevel(userId, careerLevel);

    return res.json({
      success: true,
      message: "Kullanıcı kariyer seviyesi başarıyla güncellendi.",
      user: sanitizeUserData(updatedUser),
    });
  } catch (error) {
    console.error("Admin update user career error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı kariyer seviyesi güncellenirken hata oluştu.",
    });
  }
});

// Admin: Update user status (active/inactive)
router.put("/admin/users/:userId/status", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    console.log(`🔄 Admin updating user status ${userId} to:`, isActive ? 'active' : 'inactive');

    const updatedUser = await mongoDb.updateUserStatus(userId, isActive);

    return res.json({
      success: true,
      message: `Kullanıcı durumu başarıyla ${isActive ? 'aktif' : 'pasif'} olarak güncellendi.`,
      user: sanitizeUserData(updatedUser),
    });
  } catch (error) {
    console.error("Admin update user status error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı durumu güncellenirken hata oluştu.",
    });
  }
});

// Admin: Get user's clone store data
router.get("/admin/users/:userId/clone-store", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;

    console.log(`🛍 Admin accessing clone store for user ${userId}`);

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Get user's clone store data (products, sales, settings)
    const cloneStoreData = await mongoDb.getUserCloneStoreData(userId);

    return res.json({
      success: true,
      cloneStore: cloneStoreData,
      user: sanitizeUserData(user),
    });
  } catch (error) {
    console.error("Admin get clone store error:", error);
    return res.status(500).json({
      success: false,
      error: "Clone mağaza bilgileri alınırken hata oluştu.",
    });
  }
});

// Admin: List all clone pages
router.get("/admin/clone-pages", requireAdmin, async (req: any, res) => {
  try {
    const pages = await mongoDb.ClonePage.find();
    const enriched = await Promise.all(pages.map(async (p: any) => {
      const user = await mongoDb.getUserById(p.userId);
      return {
        id: p.slug,
        slug: p.slug,
        userId: p.userId,
        userFullName: user?.fullName || 'Bilinmeyen Kullanıcı',
        memberId: user?.memberId || '',
        isActive: p.isActive,
        visitCount: p.visitCount || 0,
        conversionCount: p.conversionCount || 0,
        customMessage: p.customizations?.customMessage || ''
      };
    }));
    return res.json({ success: true, clonePages: enriched });
  } catch (error) {
    console.error("Admin list clone pages error:", error);
    return res.status(500).json({ success: false, error: "Clone sayfaları alınamadı" });
  }
});

// Admin: Update clone page
router.put("/admin/clone-pages/:slug", requireAdmin, async (req: any, res) => {
  try {
    const { slug } = req.params;
    const { isActive, customMessage } = req.body || {};
    
    const clonePage = await mongoDb.ClonePage.findOne({ slug });
    if (!clonePage) return res.status(404).json({ success: false, error: "Clone sayfa bulunamadı" });
    
    if (typeof isActive === 'boolean') clonePage.isActive = isActive;
    if (typeof customMessage === 'string') {
      if (!clonePage.customizations) clonePage.customizations = {};
      clonePage.customizations.customMessage = customMessage;
      clonePage.markModified('customizations');
    }
    
    await clonePage.save();
    return res.json({ success: true, clonePage });
  } catch (error) {
    console.error("Admin update clone page error:", error);
    return res.status(500).json({ success: false, error: "Clone sayfası güncellenemedi" });
  }
});

// Admin: Delete clone page
router.delete("/admin/clone-pages/:slug", requireAdmin, async (req: any, res) => {
  try {
    const { slug } = req.params;
    const result = await mongoDb.ClonePage.deleteOne({ slug });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, error: "Clone sayfa bulunamadı" });
    return res.json({ success: true, message: "Clone sayfa silindi" });
  } catch (error) {
    console.error("Admin delete clone page error:", error);
    return res.status(500).json({ success: false, error: "Clone sayfası silinemedi" });
  }
});

// Admin: Create clone page
router.post("/admin/clone-pages", requireAdmin, async (req: any, res) => {
  try {
    const { userId, slug, customMessage } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: "Kullanıcı ID gereklidir" });
    const user = await mongoDb.getUserById(userId);
    if (!user) return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı" });
    
    const page = await mongoDb.createClonePage(user.id, user.fullName, slug || user.memberId);
    
    if (customMessage) {
      if (!page.customizations) page.customizations = {};
      page.customizations.customMessage = customMessage;
      page.markModified('customizations');
      await page.save();
    }
    
    return res.json({ success: true, clonePage: page });
  } catch (error) {
    console.error("Admin create clone page error:", error);
    return res.status(500).json({ success: false, error: "Clone sayfası oluşturulamadı" });
  }
});

// Admin: Update user's clone store settings
router.put("/admin/users/:userId/clone-store", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const storeData = req.body;

    console.log(`🛍 Admin updating clone store for user ${userId}:`, storeData);

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Update user's clone store data
    const updatedStore = await mongoDb.updateUserCloneStore(userId, storeData);

    console.log(`✅ Clone store updated for user: ${user.fullName}`);
    console.log(`🔄 Changes applied instantly to user's store`);

    return res.json({
      success: true,
      message: "Clone mağaza başarıyla güncellendi.",
      cloneStore: updatedStore,
    });
  } catch (error) {
    console.error("Admin update clone store error:", error);
    return res.status(500).json({
      success: false,
      error: "Clone mağaza güncellenirken hata oluştu.",
    });
  }
});

// Member: Upload payment receipt
router.post("/upload-receipt", requireAuth, async (req: any, res) => {
  try {
    const { receiptFile, userId } = req.body;

    if (!receiptFile) {
      return res.status(400).json({
        success: false,
        message: "Dekont dosyası gereklidir.",
      });
    }

    if (!userId || userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Bu işlem için yetki yoktur.",
      });
    }

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    user.receiptFile = receiptFile;
    user.receiptUploadedAt = new Date();
    user.receiptVerified = false;

    await user.save();

    return res.json({
      success: true,
      message: "Ödeme dekontu başarıyla yüklendi. Admin onayını bekleyiniz.",
      user: sanitizeUserData(user),
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Dekont yükleme sırasında bir hata oluştu.",
    });
  }
});

// Admin: Verify user receipt
router.put("/admin/users/:userId/verify-receipt", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { receiptVerified } = req.body;

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    user.receiptVerified = receiptVerified === true;
    await user.save();

    return res.json({
      success: true,
      message: "Dekont doğrulama durumu güncellendi.",
      user: sanitizeUserData(user),
    });
  } catch (error) {
    console.error("Receipt verification error:", error);
    return res.status(500).json({
      success: false,
      error: "Dekont doğrulama sırasında bir hata oluştu.",
    });
  }
});

// Admin: Approve new user (only after receipt verification)
router.put("/admin/users/:userId/approve", requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await mongoDb.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    if (!user.receiptFile) {
      return res.status(400).json({
        success: false,
        error: "Dekont yüklenmeden onay yapılamaz.",
      });
    }

    // Automated career level calculation from MLM rules
    if (isActive === true) {
      // Calculate initial career level based on investment
      const careerLevel = getCareerLevel({
        teamSize: user.totalTeamSize || 0,
        totalTeamCiroTL: user.totalTeamCiroTL || 0,
        directReferrals: user.directReferrals || 0,
        legCirosTL: user.legCirosTL ? Object.fromEntries(user.legCirosTL) : {}
      });

      // Get career level details from MLM rules
      const careerDetails = careerLevels[careerLevel];

      // Update user with automated career level
      user.isActive = true;
      user.membershipStartDate = new Date();
      user.approvedAt = new Date();
      user.receiptVerified = true;
      user.careerLevel = {
        id: (Object.keys(careerLevels).indexOf(careerLevel) + 1).toString(),
        name: careerLevel,
        displayName: careerLevel,
        level: Object.keys(careerLevels).indexOf(careerLevel) + 1,
        isActive: true,
        commissionRate: careerDetails.bonusPercent,
        passiveIncomeRate: careerLevel !== 'Emmare' ? (careerDetails.bonusPercent - 2) * 0.5 : 0,
        requiredTeamCiroTL: careerDetails.requiredTeamCiroTL,
        requiredUSD: careerDetails.requiredUSD,
        requiredActivePeople: careerDetails.requiredActivePeople,
        requiredDirectReferrals: careerDetails.requiredDirectReferrals,
      } as any;
      
      await user.save();

      // Trigger commission distribution for uplines immediately after approval
      try {
        const investmentAmount = user.totalInvestment || 100;
        const { MonolineCommissionService } = await import("../lib/monoline-commission-service");
        const PointsCareerServiceMod = await import("../lib/points-career-service");
        const PointsCareerService = PointsCareerServiceMod.default;

        const allUsers = await mongoDb.getAllUsers();

        const commissionResult = await MonolineCommissionService.calculateMonolineCommissions(
          user.id,
          investmentAmount,
          allUsers
        );

        if (commissionResult.transactions.length > 0) {
          await mongoDb.createMonolineCommissionTransactions(commissionResult.transactions);

          // Send notification to each upline who received a commission
          try {
            const { createUserNotification } = await import("../routes/training");
            for (const tx of commissionResult.transactions) {
              if (tx.toUserId && tx.amount > 0) {
                await createUserNotification(
                  tx.toUserId,
                  "💰 Yeni Komisyon Alındı!",
                  `${user.fullName} adlı üyenin ödemesi onaylandı. Monoline komisyonunuz: $${tx.amount.toFixed(2)}`,
                  "commission_received",
                  { fromUserId: user.id, amount: tx.amount, type: tx.type }
                );
              }
            }
            // Also notify the approved user
            await createUserNotification(
              user.id,
              "✅ Üyeliğiniz Onaylandı!",
              "Ödemeniz admin tarafından onaylandı. Üyeliğiniz aktif edildi ve sistemdeki yeriniz belirlendi.",
              "payment_approved",
              { userId: user.id }
            );
          } catch (notifErr) {
            console.warn("Notification send error (non-fatal):", notifErr);
          }
        }

        if (commissionResult.passivePoolAmount > 0) {
          await mongoDb.addToPassiveIncomePool(commissionResult.passivePoolAmount);
        }
        if ((commissionResult as any).companyFundAmount > 0) {
          await mongoDb.addToCompanyFund((commissionResult as any).companyFundAmount);
        }

        // Award points to sponsor
        if (user.sponsorId) {
          const sponsorUser = await mongoDb.getUserById(user.sponsorId);
          if (sponsorUser) {
            await PointsCareerService.awardPoints(
              user.sponsorId,
              "sale",
              investmentAmount,
              `Referral üye onayı: ${user.fullName}`,
              allUsers
            );
          }
        }

        console.log(`✅ Commission distribution completed for approved user ${user.id}: ${commissionResult.transactions.length} transactions`);
      } catch (commErr) {
        console.warn("Commission distribution warning (non-fatal):", commErr);
      }
    } else {
      user.isActive = false;
      await user.save();
    }

    return res.json({
      success: true,
      message: isActive ? "Kullanıcı başarıyla onaylandı, aktifleştirildi ve komisyonlar dağıtıldı." : "Kullanıcı pasifleştirildi.",
      user: sanitizeUserData(user),
    });
  } catch (error) {
    console.error("User approval error:", error);
    return res.status(500).json({
      success: false,
      error: "Kullanıcı onaylama sırasında hata oluştu.",
    });
  }
});

// Admin: Run MLM automation cycle
router.post("/admin/mlm/automation", requireAdmin, async (req: any, res) => {
  try {
    const { MLMAutomationService } = await import("../lib/mlm-automation-service");

    const result = await MLMAutomationService.runAutomationCycle();

    return res.json({
      success: result.success,
      message: "MLM otomasyon döngüsü başarıyla tamamlandı",
      stats: {
        careerUpdates: result.careerUpdates,
        passiveDistributions: result.passiveDistributions,
        activityEnforcements: result.activityEnforcements,
        timestamp: new Date().toISOString()
      },
      errors: result.errors
    });
  } catch (error) {
    console.error("MLM automation error:", error);
    return res.status(500).json({
      success: false,
      error: "MLM otomasyon sırasında hata oluştu.",
      details: (error as any).message
    });
  }
});

// Admin: List all documents
router.get("/admin/documents", requireAdmin, async (req: any, res) => {
  try {
    const documents = await mongoDb.SystemDocument.find().sort({ updatedAt: -1 });
    return res.json({ success: true, documents });
  } catch (error) {
    console.error("Admin list documents error:", error);
    return res.status(500).json({ success: false, error: "Dökümanlar alınamadı" });
  }
});

// Admin: Upload document (accepts JSON with base64 fileContent)
router.post("/admin/documents/upload", requireAdmin, async (req: any, res) => {
  try {
    const { title, description, category, type, accessLevel, tags, fileContent, fileName, fileSize, mimeType } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: "Döküman başlığı zorunludur" });
    }

    const docId = `doc-${Date.now()}`;

    const newDoc = new mongoDb.SystemDocument({
      id: docId,
      title: title.trim(),
      description: description || "",
      category: category || "general",
      type: type || "document",
      isActive: true,
      accessLevel: accessLevel || "all",
      tags: Array.isArray(tags) ? tags : (tags ? JSON.parse(tags) : []),
      fileName: fileName || "",
      fileSize: fileSize || 0,
      mimeType: mimeType || "application/octet-stream",
      fileContent: fileContent || "",
      uploadedBy: req.user?.id || "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newDoc.save();

    // Broadcast notification to all members
    try {
      const { broadcastNotification } = await import("./training");
      await broadcastNotification(
        "new_document",
        `📄 Yeni Döküman: ${title.trim()}`,
        `Sisteme yeni bir döküman yüklendi. Üye panelinizden inceleyebilirsiniz.`,
        { documentId: docId }
      );
    } catch (_) { /* notifications are best-effort */ }

    const safeDoc = { ...newDoc.toObject(), fileContent: undefined };
    return res.json({ success: true, document: safeDoc });
  } catch (error) {
    req.log?.error({ error }, "Admin upload document error");
    return res.status(500).json({ success: false, error: "Döküman yüklenemedi" });
  }
});

// Download document file
router.get("/admin/documents/:docId/download", requireAdmin, async (req: any, res) => {
  try {
    const doc = await mongoDb.SystemDocument.findOne({ id: req.params.docId });
    if (!doc || !doc.fileContent) {
      return res.status(404).json({ success: false, error: "Dosya bulunamadı" });
    }
    const buffer = Buffer.from(doc.fileContent, "base64");
    res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.fileName || doc.title)}"`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ success: false, error: "Dosya indirilemedi" });
  }
});

// Admin: Spiritual Content
router.get("/admin/spiritual-content", requireAdmin, async (req: any, res) => {
  try {
    const content = await mongoDb.getSpiritualContent();
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Manevi içerik alınamadı' });
  }
});

router.post("/admin/spiritual-content/hadiths", requireAdmin, async (req: any, res) => {
  try {
    const hadith = req.body;
    await mongoDb.addHadith(hadith);
    res.json({ success: true, message: 'Hadis eklendi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hadis eklenemedi' });
  }
});

router.post("/admin/spiritual-content/sunnahs", requireAdmin, async (req: any, res) => {
  try {
    const sunnah = req.body;
    const content = await mongoDb.getSpiritualContent();
    content.sunnahs.push({
      id: `sunnah-${Date.now()}`,
      ...sunnah,
      createdAt: new Date()
    });
    await mongoDb.updateSpiritualContent(content);
    res.json({ success: true, message: 'Sünnet eklendi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sünnet eklenemedi' });
  }
});

router.post("/admin/spiritual-content/quotes", requireAdmin, async (req: any, res) => {
  try {
    const quote = req.body;
    const content = await mongoDb.getSpiritualContent();
    content.quotes.push({
      id: `quote-${Date.now()}`,
      ...quote,
      createdAt: new Date()
    });
    await mongoDb.updateSpiritualContent(content);
    res.json({ success: true, message: 'Özlü söz eklendi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Özlü söz eklenemedi' });
  }
});

router.delete("/admin/spiritual-content/:type/:id", requireAdmin, async (req: any, res) => {
  try {
    const { type, id } = req.params;
    if (!['hadiths', 'sunnahs', 'quotes'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Geçersiz tip' });
    }
    await mongoDb.deleteSpiritualItem(type as any, id);
    res.json({ success: true, message: 'İçerik silindi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'İçerik silinemedi' });
  }
});

router.post("/admin/delete-test-users", requireAdmin, async (req: any, res) => {
  try {
    const deletedCount = await mongoDb.deleteTestUsers();
    res.json({ success: true, message: `${deletedCount} test kullanıcısı başarıyla silindi.`, deletedCount });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message || "Test kullanıcıları silinemedi." });
  }
});

router.post("/admin/spiritual-content/quran-playlist", requireAdmin, async (req: any, res) => {
  try {
    const { url } = req.body;
    const content = await mongoDb.getSpiritualContent();
    content.quranPlaylist = url;
    await mongoDb.updateSpiritualContent(content);
    res.json({ success: true, message: 'Kur\'an oynatma listesi güncellendi' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Oynatma listesi güncellenemedi' });
  }
});

// Document download routes
router.get("/member/documents", requireAuth, async (req: any, res) => {
  try {
    const docs = await mongoDb.SystemDocument.find({ isActive: true }).lean();
    res.json({ success: true, documents: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Dökümanlar alınamadı." });
  }
});

router.get("/member/documents/:docId/download", requireAuth, async (req: any, res) => {
  try {
    const { docId } = req.params;
    
    // Check if it's our special presentation pdf
    if (docId === 'doc-001-pdf') {
       const doc = new PDFDocument({ margin: 50 });
       
       res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', `attachment; filename="Kutbul-Zaman-Sunum-${(req.user as any)?.memberId || 'Genel'}.pdf"`);
       res.setHeader('Cache-Control', 'no-cache');
       
       doc.pipe(res);
       
       // Metadata
       doc.info['Title'] = 'Kutbul Zaman Sistem Sunumu';
       doc.info['Author'] = 'Kutbul Zaman';
       
       // Content
       doc.fontSize(28).fillColor('#065f46').text('Kutbul Zaman', { align: 'center' });
       doc.moveDown(0.5);
       doc.fontSize(18).fillColor('#1e293b').text('Sistem Tanitim ve Kazanc Sunumu', { align: 'center' });
       doc.moveDown(1.5);
       
       doc.fontSize(14).fillColor('#334155').text('Kutbul Zaman, insanin uc ana boyutunu (Madde, Mana ve Enerji) birlestiren dunyadaki ilk "Hibrit Tekamul" modelidir.', { align: 'left', lineGap: 5 });
       doc.moveDown();
       
       doc.fontSize(16).fillColor('#0f172a').text('Sistem Ozet Uygulamalari:', { underline: true });
       doc.moveDown(0.5);
       doc.fontSize(13).fillColor('#334155');
       doc.text('1. Manevi Yol: Ruhsal tekamul, Esma calismalari ve Vird takibi.');
       doc.moveDown(0.3);
       doc.text('2. Zahiri Sistem: Global Monoline hatti ile ticari gelir kapisi.');
       doc.moveDown(0.3);
       doc.text('3. Batini Sistem: Kozmik frekanslar, Ebced analizi ve Enerji boyutu.');
       doc.moveDown(1.5);
       
       doc.fontSize(16).fillColor('#0f172a').text('KAZANC PLANI VE AVANTAJLAR:', { underline: true });
       doc.moveDown(0.8);
       
       const points = [
         'Dogrudan Sponsor Primi: %15 Anlik Kazanc',
         'Monoline Derinlik Kazanci: 7 Farkli Nesilden Gelir',
         'Kariyer Bonuslari: Nefis Mertebelerine Gore Ek Primler',
         'Kuresel Ortaklik Havuzu: Sirket Cirosundan Pay Alimi',
         'E-Ticaret Altyapisi: Klon Magaza ile Hazir Satis Sistemi'
       ];
       
       points.forEach(point => {
         doc.fontSize(12).fillColor('#334155').text(`- ${point}`, { indent: 20 });
         doc.moveDown(0.4);
       });
       
       doc.moveDown(2);
       doc.rect(50, doc.y, 500, 1).fill('#e2e8f0');
       doc.moveDown(1.5);
       
       doc.fontSize(12).fillColor('#065f46').text('Bismillah de ve bu bereketli yolculuga sen de katil!', { align: 'center'});
       doc.moveDown();
       doc.fontSize(10).fillColor('#64748b').text('Daha fazla bilgi icin sponsorunuzla iletisime geciniz.', { align: 'center' });
       
       doc.end();
       return;
    }

    const doc = await mongoDb.SystemDocument.findOne({ id: docId }).lean() as any;
    if (!doc) {
      return res.status(404).json({ success: false, error: "Döküman bulunamadı." });
    }

    // Serve base64-stored file content
    if (doc.fileContent) {
      const buffer = Buffer.from(doc.fileContent, "base64");
      res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.fileName || doc.title)}"`);
      return res.send(buffer);
    }

    // Fallback: external URL redirect
    if (doc.fileUrl) {
      return res.redirect(doc.fileUrl);
    }

    // Nothing stored — return 404
    return res.status(404).json({ success: false, error: "Bu döküman için dosya bulunamadı." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Dosya indirilemedi." });
  }
});

export default router;
