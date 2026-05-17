import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { ZoomTraining, Notification } from "../lib/models.js";
import { mongoDb } from "../lib/mongo-database.js";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ success: false, error: "Token gerekli" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Geçersiz token" });
  }
};

const requireAdmin = (req: any, res: any, next: any) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin yetkisi gerekli" });
    }
    next();
  });
};

// Helper: broadcast notification to all users
async function broadcastNotification(title: string, message: string, type: string, data?: any) {
  const allUsers = await mongoDb.getAllUsers();
  const notifications = allUsers.map((u: any) => ({
    id: `notif-${uuidv4()}`,
    userId: u.id,
    type,
    title,
    message,
    data,
    isRead: false,
    createdAt: new Date(),
  }));
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

// Helper: create notification for specific user
async function createUserNotification(userId: string, title: string, message: string, type: string, data?: any) {
  await Notification.create({
    id: `notif-${uuidv4()}`,
    userId,
    type,
    title,
    message,
    data,
    isRead: false,
    createdAt: new Date(),
  });
}

export { broadcastNotification, createUserNotification };

// ─── ZOOM TRAINING ROUTES ─────────────────────────────────────────────────

// GET all trainings (admin)
router.get("/", requireAdmin, async (req: any, res: Response) => {
  try {
    const trainings = await ZoomTraining.find().sort({ scheduledAt: -1 });
    return res.json({ success: true, trainings });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Eğitimler alınamadı" });
  }
});

// GET upcoming trainings (all authenticated users)
router.get("/upcoming", requireAuth, async (req: any, res: Response) => {
  try {
    const now = new Date();
    const trainings = await ZoomTraining.find({ isActive: true }).sort({ scheduledAt: 1 });
    return res.json({ success: true, trainings });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Eğitimler alınamadı" });
  }
});

// POST create training (admin)
router.post("/", requireAdmin, async (req: any, res: Response) => {
  try {
    const { title, description, zoomLink, meetingId, password, scheduledAt, duration } = req.body;
    if (!title || !zoomLink || !scheduledAt) {
      return res.status(400).json({ success: false, error: "Başlık, Zoom linki ve tarih zorunludur" });
    }

    const training = await ZoomTraining.create({
      id: `zoom-${uuidv4()}`,
      title,
      description,
      zoomLink,
      meetingId,
      password,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      isActive: true,
      notificationSent: false,
      authorizedHosts: [],
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.json({ success: true, training });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Eğitim oluşturulamadı" });
  }
});

// PUT update training (admin)
router.put("/:id", requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.scheduledAt) updates.scheduledAt = new Date(updates.scheduledAt);

    const training = await ZoomTraining.findOneAndUpdate({ id }, { $set: updates }, { new: true });
    if (!training) return res.status(404).json({ success: false, error: "Eğitim bulunamadı" });

    return res.json({ success: true, training });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Eğitim güncellenemedi" });
  }
});

// DELETE training (admin)
router.delete("/:id", requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await ZoomTraining.findOneAndDelete({ id });
    return res.json({ success: true, message: "Eğitim silindi" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Eğitim silinemedi" });
  }
});

// POST send notification to all members about a training (admin)
router.post("/:id/notify", requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const training = await ZoomTraining.findOne({ id });
    if (!training) return res.status(404).json({ success: false, error: "Eğitim bulunamadı" });

    const scheduledDate = new Date(training.scheduledAt).toLocaleString("tr-TR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    await broadcastNotification(
      `🎓 Yeni Zoom Eğitimi: ${training.title}`,
      `📅 Tarih: ${scheduledDate}\n⏱ Süre: ${training.duration} dakika${training.password ? `\n🔑 Şifre: ${training.password}` : ""}\n\nKatılmak için üye panelinizi kontrol edin.`,
      "zoom_training",
      { trainingId: training.id, zoomLink: training.zoomLink, password: training.password }
    );

    await ZoomTraining.findOneAndUpdate({ id }, { notificationSent: true, updatedAt: new Date() });

    return res.json({ success: true, message: "Tüm üyelere bildirim gönderildi" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Bildirim gönderilemedi" });
  }
});

// POST grant/revoke hosting rights to a member (admin)
router.post("/:id/hosts", requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'grant' | 'revoke'

    const training = await ZoomTraining.findOne({ id });
    if (!training) return res.status(404).json({ success: false, error: "Eğitim bulunamadı" });

    let authorizedHosts: string[] = training.authorizedHosts || [];

    if (action === "grant") {
      if (!authorizedHosts.includes(userId)) {
        authorizedHosts.push(userId);
      }
      // Send notification to the authorized member
      const user = await mongoDb.getUserById(userId);
      if (user) {
        const scheduledDate = new Date(training.scheduledAt).toLocaleString("tr-TR", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
        await createUserNotification(
          userId,
          `✅ Eğitim Yetkiniz Onaylandı: ${training.title}`,
          `Admin tarafından "${training.title}" eğitimi için eğitim yapma yetkiniz onaylandı.\n📅 Tarih: ${scheduledDate}\n🔗 Link: ${training.zoomLink}${training.password ? `\n🔑 Şifre: ${training.password}` : ""}`,
          "zoom_training",
          { trainingId: training.id, isHost: true, zoomLink: training.zoomLink, password: training.password }
        );
      }
    } else if (action === "revoke") {
      authorizedHosts = authorizedHosts.filter((h: string) => h !== userId);
    }

    await ZoomTraining.findOneAndUpdate({ id }, { authorizedHosts, updatedAt: new Date() });

    return res.json({ success: true, authorizedHosts });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Yetki güncellenemedi" });
  }
});

// ─── NOTIFICATION ROUTES ──────────────────────────────────────────────────

// GET user's notifications
router.get("/notifications/mine", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Bildirimler alınamadı" });
  }
});

// PUT mark notifications as read
router.put("/notifications/read-all", requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return res.json({ success: true, message: "Tüm bildirimler okundu olarak işaretlendi" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Bildirimler güncellenemedi" });
  }
});

// PUT mark single notification as read
router.put("/notifications/:notifId/read", requireAuth, async (req: any, res: Response) => {
  try {
    const { notifId } = req.params;
    const userId = req.user?.id || req.user?.userId;
    await Notification.findOneAndUpdate({ id: notifId, userId }, { isRead: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Bildirim güncellenemedi" });
  }
});

// POST admin broadcast custom notification to all members
router.post("/notifications/broadcast", requireAdmin, async (req: any, res: Response) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: "Başlık ve mesaj zorunludur" });
    }
    await broadcastNotification(title, message, type || "system");
    return res.json({ success: true, message: "Bildirim tüm üyelere gönderildi" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Bildirim gönderilemedi" });
  }
});

export default router;
