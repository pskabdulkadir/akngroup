import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { safeDownloadUrl, safeDownloadBlob } from "@/lib/dom";
import {
  Crown,
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  CreditCard,
  Eye,
  Award,
  Wallet,
  Network,
  MessageSquare,
  Settings,
  Link,
  QrCode,
  Target,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Plus,
  Edit,
  Smartphone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Send,
  LinkIcon,
  Globe,
  Image,
  Palette,
  Save,
  TreePine,
  List,
  User2,
  X,
  FileText,
  CheckCircle,
  ShoppingCart,
  Heart,
  Sparkles,
  Hexagon,
  Moon,
  Clock,
  AlertTriangle,
  Zap,
  Brain,
  Shield,
  Star,
  BookOpen,
  ShieldCheck,
  Calculator,
  Bell,
  Video,
  Lock,
} from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
// BinaryNetworkTree removed - replaced with Monoline MLM system
import LiveBroadcastPlayer from "@/components/LiveBroadcastPlayer";
import MonolineTreeView from "@/components/MonolineTreeView";
import { SystemPresentation } from "@/components/SystemPresentation";
import { ContributionCalculator } from "@/components/ContributionCalculator";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
interface User {
  id: string;
  memberId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  membershipType: string;
  isActive: boolean;
  totalInvestment: number;
  directReferrals: number;
  totalTeamSize: number;
  wallet: {
    balance: number;
    totalEarnings: number;
    sponsorBonus: number;
    careerBonus: number;
    passiveIncome: number;
    leadershipBonus: number;
  };
  careerLevel: {
    name: string;
    commissionRate: number;
  };
  registrationDate: string;
  referralCode: string;
  sponsorId?: string;
  activeUntil?: string;
  firstPurchaseAt?: string;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
}

interface TeamMember {
  id: string;
  memberId: string;
  fullName: string;
  email: string;
  careerLevel: string;
  totalInvestment: number;
  directReferrals: number;
  registrationDate: string;
  isActive: boolean;
  level: number;
  position: "direct" | "downline";
}

export default function MemberPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [sponsorInfo, setSponsorInfo] = useState<{fullName: string; memberId: string; email?: string; referralCode?: string} | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [isCalculatorsOpen, setIsCalculatorsOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<{title: string, content: string} | null>(null);

  const openGuide = (title: string, content: string) => {
    setSelectedGuide({ title, content });
    setGuideModalOpen(true);
  };

  const handleStripeConnect = async () => {
    try {
      setStripeLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/onboarding-link', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Bağlantı linki alınamadı');
      }
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Stripe bağlantısı başlatılamadı.");
      }
    } catch (error) {
      console.error("Stripe connect error:", error);
      toast.error("Stripe bağlantısı sırasında bir hata oluştu.");
    } finally {
      setStripeLoading(false);
    }
  };

  // Vivid Spiritual Theme Configuration
  const vividTheme = {
    gradientBg: "bg-white",
    cardBg: "bg-white border-slate-200 shadow-sm", // Solid white, no transparency
    headerText: "text-slate-900 font-extrabold drop-shadow-sm", // Solid dark slate for better readability
    buttonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-purple-900/10",
    tabActive: "data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:font-bold", // Solid active state
    statCard: "bg-white border-l-4 border-purple-600 shadow-md hover:shadow-lg transition-all duration-300",
    tableHeader: "bg-purple-50 text-slate-900 font-bold uppercase text-xs tracking-wider", // Black text for headers
  };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cloneInfo, setCloneInfo] = useState({
    customMessage: "",
    visits: 0,
    conversions: 0,
    totalCommissions: 0
  });

  const fetchCloneInfo = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/user/${user.id}/clone-info`);
      if (response.ok) {
        const data = await response.json();
        setCloneInfo(data);
      }
    } catch (error) {
      console.error("Error fetching clone info:", error);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (user?.id) {
      fetchCloneInfo();
    }
  }, [user?.id, fetchCloneInfo]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clonePageUrl, setClonePageUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [shareStats, setShareStats] = useState({
    visits: 0,
    conversions: 0,
    conversionRate: 0,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [clonePageSettings, setClonePageSettings] = useState({
    headerColor: "#3B82F6",
    buttonColor: "#10B981",
    backgroundColor: "#F8FAFC",
    showTestimonials: true,
    showFeatures: true,
    customCss: "",
  });
  const [selectedMemberForTeamView, setSelectedMemberForTeamView] = useState<TeamMember | null>(null);
  const [teamViewMode, setTeamViewMode] = useState<'list' | 'tree'>('list');
  const [memberTeamData, setMemberTeamData] = useState<TeamMember[]>([]);
  const [teamViewModalOpen, setTeamViewModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showActivityWarning, setShowActivityWarning] = useState(false);

  // Notifications & Training States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(false);

  // Team Placement Management States
  const [pendingPlacements, setPendingPlacements] = useState<any[]>([]);
  const [placementModal, setPlacementModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [teamTreeData, setTeamTreeData] = useState<any>(null);
  const [monolineDownline, setMonolineDownline] = useState<any[]>([]);
  const [monolineDownlineLoading, setMonolineDownlineLoading] = useState(false);

  // Receipt Upload States
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUploadLoading, setReceiptUploadLoading] = useState(false);
  const [receiptUploadStatus, setReceiptUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [receiptMessage, setReceiptMessage] = useState("");
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setReceiptUploadStatus('error');
        setReceiptMessage("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        setReceiptFile(fileContent);
        setReceiptPreview(fileContent);
        setReceiptUploadStatus('idle');
        setReceiptMessage("");
      };
      reader.onerror = () => {
        setReceiptUploadStatus('error');
        setReceiptMessage("Dosya okuma hatası");
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) {
      setReceiptUploadStatus('error');
      setReceiptMessage("Lütfen bir dekont dosyası seçin");
      return;
    }

    setReceiptUploadLoading(true);
    setReceiptUploadStatus('idle');
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/upload-receipt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptFile: receiptFile,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setReceiptUploadStatus('success');
        setReceiptMessage("Ödeme dekontu başarıyla yüklendi! Admin onayını bekleyiniz.");
        setReceiptFile(null);
        setReceiptPreview(null);
        setTimeout(() => {
          setReceiptUploadStatus('idle');
          setReceiptMessage("");
        }, 5000);
      } else {
        setReceiptUploadStatus('error');
        setReceiptMessage(data.message || "Dekont yükleme başarısız");
      }
    } catch (error) {
      setReceiptUploadStatus('error');
      setReceiptMessage("Dekont yükleme sırasında bir hata oluştu");
      console.error("Receipt upload error:", error);
    } finally {
      setReceiptUploadLoading(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);


  const checkAuthentication = async () => {
    try {
      const currentUserData = localStorage.getItem("currentUser");
      const authToken = localStorage.getItem("authToken");

      if (!currentUserData) {
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(currentUserData);
      if (!currentUser.id) {
        navigate("/login");
        return;
      }

      // If we don't have an authToken, that's okay for older functionality
      // But some new features will require proper login
      if (!authToken) {
        console.warn(
          "No auth token found - some features may not work properly",
        );
      }

      await fetchUserData(currentUser.id);
    } catch (error) {
      console.error("Authentication check failed:", error);
      navigate("/login");
    }
  };

  const calculateRemainingDays = (activeUntil?: string) => {
    if (!activeUntil) return 0;
    const now = new Date();
    const end = new Date(activeUntil);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    if (clonePageUrl) {
      generateQRCode();
    }
  }, [clonePageUrl]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch("/api/training/notifications/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("fetchNotifications error", err);
    }
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("authToken");
    await fetch("/api/training/notifications/read-all", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const fetchUpcomingTrainings = useCallback(async () => {
    setTrainingsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/training/upcoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUpcomingTrainings(data.trainings || []);
      }
    } catch (err) {
      console.error("fetchUpcomingTrainings error", err);
    } finally {
      setTrainingsLoading(false);
    }
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserInfo(userId),
        fetchTransactions(userId),
        fetchTeamMembers(userId),
        fetchClonePageInfo(userId),
        fetchPendingPlacements(userId),
        fetchMonolineDownline(userId),
        fetchNotifications(),
        fetchUpcomingTrainings(),
      ]);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh: poll notifications + wallet every 20 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchNotifications();
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u?.id) {
            fetchUserInfo(u.id).catch(() => {});
          }
        } catch {}
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const fetchPendingPlacements = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/user/${userId}/pending-placements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingPlacements(data.placements || []);
      }
    } catch (error) {
      console.error("Error fetching pending placements:", error);
    }
  };

  const fetchMonolineDownline = async (userId: string) => {
    setMonolineDownlineLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/user/${userId}/monoline-downline?depth=7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMonolineDownline(data.downline || []);
      }
    } catch (error) {
      console.error("Error fetching monoline downline:", error);
    } finally {
      setMonolineDownlineLoading(false);
    }
  };

  const fetchUserInfo = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setClonePageUrl(
            `${window.location.origin}/clone/${data.user.memberId}`,
          );

          const remainingDays = calculateRemainingDays(data.user.activeUntil);
          if (remainingDays > 0 && remainingDays <= 7) {
            setShowActivityWarning(true);
          } else {
            setShowActivityWarning(false);
          }

          if (data.user.sponsorId) {
            fetchSponsorInfo(data.user.sponsorId);
          }
        }
      } else if (response.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchSponsorInfo = async (sponsorMemberId: string) => {
    try {
      const response = await fetch(`/api/auth/member/by-member-id/${sponsorMemberId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSponsorInfo(data.sponsor);
        }
      }
    } catch (error) {
      console.warn("Error fetching sponsor info:", error);
    }
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`/api/user/${userId}/transactions`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.warn("Error fetching transactions:", error instanceof Error ? error.message : 'Unknown error');
      setTransactions([]);
    }
  };

  const fetchTeamMembers = async (userId: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`/api/user/${userId}/team`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.team || []);
      }
    } catch (error) {
      console.warn("Error fetching team members:", error instanceof Error ? error.message : 'Unknown error');
      setTeamMembers([]);
    }
  };

  const fetchMemberTeam = async (memberId: string) => {
    try {
      const response = await fetch(`/api/user/${memberId}/team`);
      if (response.ok) {
        const data = await response.json();
        return data.team || [];
      }
    } catch (error) {
      console.error("Error fetching member team:", error);
      return [];
    }
  };

  const handleViewMemberTeam = async (member: TeamMember) => {
    setSelectedMemberForTeamView(member);
    setTeamViewModalOpen(true);
    const memberTeam = await fetchMemberTeam(member.id);
    setMemberTeamData(memberTeam);
  };

  const fetchClonePageInfo = async (userId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/auth/my-clone-page", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomMessage(data.clonePage.customizations?.customMessage || "");
          setClonePageUrl(data.cloneUrl);
          setShareStats({
            visits: data.clonePage.visitCount || 0,
            conversions: data.clonePage.conversionCount || 0,
            conversionRate:
              data.clonePage.visitCount > 0
                ? (data.clonePage.conversionCount / data.clonePage.visitCount) *
                100
                : 0,
          });
        }
      }
    } catch (error) {
      console.warn("Error fetching clone page info:", error instanceof Error ? error.message : 'Unknown error');
      // Set default values on error
      setCustomMessage("");
      setClonePageUrl(`${window.location.origin}/clone/${user?.memberId || 'unknown'}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Link kopyalandı!");
  };

  const updateCustomMessage = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/my-clone-page", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customMessage }),
      });

      if (response.ok) {
        alert("Özel mesajınız güncellendi!");
      }
    } catch (error) {
      console.error("Error updating custom message:", error);
      alert("Güncelleme hatası!");
    }
  };

  const shareViaWhatsApp = () => {
    const message = `${user?.fullName} üzerinden Kutbul Zaman'a katılın! Manevi gelişim ve finansal özgürlük için: ${clonePageUrl}`;
    window.open(
      `whatsapp://send?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const shareViaEmail = () => {
    const subject = "Kutbul Zaman Daveti";
    const body = `Merhaba,\n\n${user?.fullName} üzerinden Kutbul Zaman platformuna katılmanızı istiyorum. Bu platform hem manevi gelişim hem de finansal özgürlük sunuyor.\n\nKatılmak için: ${clonePageUrl}\n\nSaygılarımla,\n${user?.fullName}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
  };

  const generateQRCode = () => {
    // Using QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(clonePageUrl)}`;
    setQrCodeUrl(qrUrl);
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      safeDownloadUrl(qrCodeUrl, `${user?.memberId}-qr-code.png`);
    }
  };

  const shareViaInstagram = () => {
    const text = `${user?.fullName} üzerinden Kutbul Zaman'a katılın! Manevi gelişim ve finansal özgürlük için: ${clonePageUrl}`;
    // Instagram doesn't have direct URL sharing, copy to clipboard
    navigator.clipboard.writeText(text);
    alert(
      "Instagram paylaşımı için metin kopyalandı! Instagram'da paylaşabilirsiniz.",
    );
  };

  const shareViaTwitter = () => {
    const text = `${user?.fullName} üzerinden Kutbul Zaman'a katılın! Manevi gelişim ve finansal özgürlük için:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(clonePageUrl)}`;
    window.open(url, "_blank");
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(clonePageUrl)}`;
    window.open(url, "_blank");
  };

  const shareViaTelegram = () => {
    const text = `${user?.fullName} üzerinden Kutbul Zaman'a katılın! ${clonePageUrl}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(clonePageUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const updateClonePageSettings = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/${user.id}/clone-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clonePageSettings),
      });

      if (response.ok) {
        alert("Klon sayfa ayarlarınız güncellendi!");
      }
    } catch (error) {
      console.error("Error updating clone page settings:", error);
      alert("Güncelleme hatası!");
    }
  };

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch("/api/auth/member/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Filter documents based on user access level
        const filteredDocuments = data.documents?.filter((doc: any) => {
          if (!doc.isActive) return false;
          if (doc.accessLevel === 'all') return true;
          if (doc.accessLevel === 'members' && user?.isActive) return true;
          if (doc.accessLevel === 'leaders' && user?.role === 'leader') return true;
          if (doc.accessLevel === 'admins' && user?.role === 'admin') return true;
          return false;
        }) || [];
        setDocuments(filteredDocuments);
      } else {
        // Use fallback document data for demo (prefer shared storage if exists)
        const stored = JSON.parse(localStorage.getItem('shared_documents') || '[]');
        if (stored.length) {
          const userRole = user?.role || 'member';
          const userActive = user?.isActive || false;
          const filteredStored = stored.filter((doc: any) => {
            if (!doc.isActive) return false;
            if (doc.accessLevel === 'all') return true;
            if (doc.accessLevel === 'members' && userActive) return true;
            if (doc.accessLevel === 'leaders' && userRole === 'leader') return true;
            if (doc.accessLevel === 'admins' && userRole === 'admin') return true;
            return false;
          });
          setDocuments(filteredStored);
          return;
        }
        const fallbackDocs = [
          {
            id: "doc-001",
            title: "Sistem Kullanım Kılavuzu",
            description: "Kapsamlı sistem kullanım rehberi - Tüm özellikler ve işlevler",
            category: "guide",
            type: "document",
            fileName: "sistem-kilavuzu.pdf",
            fileSize: 2048000,
            uploadDate: new Date().toISOString(),
            isActive: true,
            accessLevel: "all",
            tags: ["kılavuz", "sistem"]
          },
          {
            id: "doc-002",
            title: "Ruhsal Gelişim Katkı Payı Hesaplama",
            description: "Katkı payı hesaplama yöntemleri ve örnekler - Ruhsal Gelişim sistem rehberi",
            category: "training",
            type: "presentation",
            fileName: "katki-payi-hesaplama.pptx",
            fileSize: 5120000,
            uploadDate: new Date().toISOString(),
            isActive: true,
            accessLevel: "members",
            tags: ["katkı payı", "ruhsal gelişim", "eğitim"]
          },
          {
            id: "doc-003",
            title: "Başarılı Ruhsal Gelişim Rehberliği",
            description: "Ruhsal gelişim rehberlik stratejileri ve motivasyon teknikleri",
            category: "training",
            type: "document",
            fileName: "ruhsal-gelisim-rehberi.pdf",
            fileSize: 3072000,
            uploadDate: new Date().toISOString(),
            isActive: true,
            accessLevel: "all",
            tags: ["ruhsal gelişim", "rehberlik", "strateji"]
          }
        ];

        // Filter based on user access level for demo
        const userRole = user?.role || 'member';
        const userActive = user?.isActive || false;

        const filteredDocs = fallbackDocs.filter(doc => {
          if (!doc.isActive) return false;
          if (doc.accessLevel === 'all') return true;
          if (doc.accessLevel === 'members' && userActive) return true;
          if (doc.accessLevel === 'leaders' && userRole === 'leader') return true;
          if (doc.accessLevel === 'admins' && userRole === 'admin') return true;
          return false;
        });

        setDocuments(filteredDocs);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was aborted due to timeout - use fallback data
      }
      // Silently use fallback documents when API is not available (prefer shared storage if exists)
      const stored = JSON.parse(localStorage.getItem('shared_documents') || '[]');
      if (stored.length) {
        const userRole = user?.role || 'member';
        const userActive = user?.isActive || false;
        const filteredStored = stored.filter((doc: any) => {
          if (!doc.isActive) return false;
          if (doc.accessLevel === 'all') return true;
          if (doc.accessLevel === 'members' && userActive) return true;
          if (doc.accessLevel === 'leaders' && userRole === 'leader') return true;
          if (doc.accessLevel === 'admins' && userRole === 'admin') return true;
          return false;
        });
        setDocuments(filteredStored);
        return;
      }
      const fallbackDocs = [
        {
          id: "doc-001",
          title: "Sistem Kullanım Kılavuzu",
          description: "Kapsamlı sistem kullanım rehberi - Tüm özellikler ve işlevler",
          category: "guide",
          type: "document",
          fileName: "sistem-kilavuzu.pdf",
          fileSize: 2048000,
          uploadDate: new Date().toISOString(),
          isActive: true,
          accessLevel: "all",
          tags: ["kılavuz", "sistem"]
        },
        {
          id: "doc-002",
          title: "Ruhsal Gelişim Katkı Payı Hesaplama",
          description: "Katkı payı hesaplama yöntemleri ve örnekler - Ruhsal Gelişim sistem rehberi",
          category: "training",
          type: "presentation",
          fileName: "katki-payi-hesaplama.pptx",
          fileSize: 5120000,
          uploadDate: new Date().toISOString(),
          isActive: true,
          accessLevel: "members",
          tags: ["katkı payı", "ruhsal gelişim", "eğitim"]
        },
        {
          id: "doc-003",
          title: "Başarılı Ruhsal Gelişim Rehberliği",
          description: "Ruhsal gelişim rehberlik stratejileri ve motivasyon teknikleri",
          category: "training",
          type: "document",
          fileName: "ruhsal-gelisim-rehberi.pdf",
          fileSize: 3072000,
          uploadDate: new Date().toISOString(),
          isActive: true,
          accessLevel: "all",
          tags: ["ruhsal gelişim", "rehberlik", "strateji"]
        }
      ];

      setDocuments(fallbackDocs);
    } finally {
      setDocumentsLoading(false);
    }
  }, [user]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'ppt': case 'pptx': return '📊';
      case 'xls': case 'xlsx': return '📈';
      case 'png': case 'jpg': case 'jpeg': case 'gif': return '🖼️';
      case 'mp4': case 'avi': case 'mov': return '🎥';
      case 'mp3': case 'wav': return '🎵';
      case 'zip': case 'rar': return '📦';
      default: return '📎';
    }
  };

  const downloadDocument = async (docId: string, fileName: string) => {
    // Special handling for interactive widgets
    if (docId === 'doc-002') {
      setIsCalculatorsOpen(true);
      toast.info("Ruhsal Gelişim Katkı Payı Hesaplayıcı açıldı.");
      return;
    }

    if (docId === 'doc-001') {
      openGuide(
        "Sistem Kullanım Kılavuzu",
        "Kutbul Zaman Sistemine Hoş Geldiniz!\n\nTemel Adımlar:\n1. Profilinizi tamamlayın ve KYC doğrulaması yapın.\n2. Bir üyelik paketi seçerek sistemde aktiflik kazanın.\n3. Manevi Panel'den günlük zikir ve eğitimlerinize başlayın.\n4. Klon sayfanızı sosyal medyada paylaşarak ekibinizi kurun.\n5. E-Cüzdan üzerinden kazançlarınızı takip edin ve çekin.\n\nDaha detaylı bilgi için eğitim videolarını izleyebilirsiniz."
      );
      toast.success("Sistem Kullanım Kılavuzu başlatıldı.");
      return;
    }

    if (docId === 'doc-003') {
      openGuide(
        "Başarılı Ruhsal Gelişim Rehberliği",
        "Ruhsal gelişim yolculuğunda başarılı olmak için şu altın kuralları takip edin:\n\n✨ Disiplin: Her güne niyet ederek başlayın ve günlük evradınızı aksatmayın.\n✨ Sadakat: Sisteme dahil ettiğiniz yol arkadaşlarınızla haftalık manevi istişareler yapın.\n✨ Eğitim: Akademi kısmındaki videoları düzenli izleyin ve notlar alın.\n✨ Rehberlik: Üst liderlerinizin ve manevi rehberlerinizin tavsiyelerini hayatınıza entegre edin.\n✨ Sabır: Ruhsal tekamül bir yolculuktur, her adımda derinleştiğinizi hissedeceksiniz."
      );
      toast.success("Rehberlik dökümanı açıldı.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`/api/auth/member/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        safeDownloadBlob(blob, fileName);
        alert(`${fileName} başarıyla indirildi!`);
      } else if (response.status === 404) {
        alert(`${fileName} bulunamadı.`);
      } else {
        alert('Dosya indirilemedi. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Dosya indirme işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        console.warn('Document download error:', error instanceof Error ? error.message : 'Unknown error');
        alert(`${fileName} indiriliyor... (Demo modu)`);
      }
    }
  };

  // Team Placement Management Functions
  const loadTeamStructure = async () => {
    if (!user) return;
    try {
      // Show binary structure for placement decisions
      setTeamTreeData({
        id: user.id,
        fullName: user.fullName,
        memberId: user.memberId,
        leftChild: user.leftChild,
        rightChild: user.rightChild,
        availablePositions: [
          !user.leftChild ? ("left" as const) : null,
          !user.rightChild ? ("right" as const) : null
        ].filter(Boolean) as ("left" | "right")[]
      });
    } catch (error) {
      console.error("Error loading team structure:", error);
    }
  };

  const placeMemberInTeam = async (placementId: string, position: "left" | "right") => {
    try {
      const placement = pendingPlacements.find(p => p.id === placementId);
      if (!placement || !user) return;

      // Call real-time commission API for placement bonuses
      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/commissions/calculate-placement-bonuses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sponsorId: user.id,
          newUserId: placement.newUserId,
          position
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('👥 Real-time placement bonuses calculated:', result);

        // Update local state for immediate feedback
        setPendingPlacements(prev =>
          prev.filter(p => p.id !== placementId)
        );

        // Update user data locally (refreshing from server is more accurate though)
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            directReferrals: (prevUser.directReferrals || 0) + 1,
            totalTeamSize: (prevUser.totalTeamSize || 0) + 1,
            leftChild: position === 'left' ? placement.newUserId : prevUser.leftChild,
            rightChild: position === 'right' ? placement.newUserId : prevUser.rightChild,
            wallet: {
              ...prevUser.wallet,
              sponsorBonus: (prevUser.wallet.sponsorBonus || 0) + (result.totalAmount || 10),
              totalEarnings: (prevUser.wallet.totalEarnings || 0) + (result.totalAmount || 10)
            }
          };
        });

        alert(`✅ Yerleştirme Başarılı!\n\n👤 ${placement.newUserData.fullName}\n📍 Pozisyon: ${position === 'left' ? 'SOL KOL' : 'SAĞ KOL'}\n💰 Bonus: $${(result.totalAmount || 10).toFixed(2)}\n\n🎯 Yeni üye takımınıza eklendi!`);
      } else {
        const errorData = await response.json();
        alert(`❌ Hata: ${errorData.error || 'Yerleştirme başarısız'}`);
      }

      setPlacementModal(false);
      setSelectedPlacement(null);
      // Refresh user data to be sure
      fetchUserInfo(user.id);
    } catch (error) {
      console.error("Error placing member:", error);
      alert("❌ Yerleştirme sırasında bir ağ hatası oluştu!");
    }
  };

  const getAvailablePositions = () => {
    // In monoline system, all new members are placed in the single line
    return {
      downline: true,
      auto: true
    };
  };

  const handlePlacementSelection = (placement: any) => {
    setSelectedPlacement(placement);
    loadTeamStructure();
    setPlacementModal(true);
  };

  // Load documents when component mounts
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, loadDocuments]);

  // Live update when admin updates shared_documents in other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'shared_documents') loadDocuments();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadDocuments]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-white`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Üye paneliniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-white`}>
        <Card>
          <CardHeader>
            <CardTitle>Erişim Hatası</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Üye bilgilerinize erişilemiyor.</p>
            <Button onClick={() => navigate("/login")}>Tekrar Giriş Yap</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white text-slate-900`}>
      {/* Navigation */}
      <nav className={`border-b border-slate-200 backdrop-blur-md sticky top-0 z-50 ${vividTheme.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <RouterLink to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Kutbul Zaman
                </span>
              </RouterLink>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.fullName}</Badge>
              <Badge>{user.memberId}</Badge>
              {/* Show admin panel link if user is admin */}
              {user.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin-panel")}
                  className="text-purple-600 hover:text-purple-900"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/kazanc")}
                className="text-green-600 hover:text-green-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Kazançlar
              </Button>
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifPanel(!showNotifPanel)}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifPanel && (
                  <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600" />
                        Bildirimler
                        {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>}
                      </h3>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <Button size="sm" variant="outline" onClick={markAllRead} className="text-xs h-7">
                            Hepsini Okundu İşaretle
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setShowNotifPanel(false)} className="text-xs h-7">✕</Button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Henüz bildirim yok</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-purple-50 border-l-4 border-purple-500" : ""}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${n.type === "zoom_training" ? "bg-blue-100" : n.type === "payment_approved" ? "bg-green-100" : n.type === "commission_received" ? "bg-yellow-100" : "bg-gray-100"}`}>
                                {n.type === "zoom_training" ? "🎥" : n.type === "payment_approved" ? "✅" : n.type === "commission_received" ? "💰" : "📢"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                                <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{n.message}</p>
                                {n.type === "zoom_training" && n.data?.zoomLink && (
                                  <a href={n.data.zoomLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                                    <Video className="w-3 h-3" />
                                    Zoom'a Katıl
                                  </a>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("tr-TR")}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("isAuthenticated");
                  localStorage.removeItem("currentUser");
                  navigate("/");
                }}
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Üye Paneliniz</h1>
          <p className="text-foreground/60">
            Hoş geldiniz {user.fullName} - Organizasyonunuzu büyütün ve
            kazançlarınızı takip edin
          </p>

          {/* Activity Expiration Warning */}
          {showActivityWarning && user && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aktifliğiniz Sona Eriyor!</AlertTitle>
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Aktiflik sürenizin dolmasına <strong>{calculateRemainingDays(user.activeUntil)} gün</strong> kaldı. Komisyon ve bonus haklarınızı kaybetmemek için üyeliğinizi yenileyin.
                </span>
                <Button size="sm" onClick={() => navigate('/e-wallet')} className="ml-4 bg-white text-red-600 hover:bg-gray-100">Hemen Aktif Ol</Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-4 border rounded-lg bg-yellow-50 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold">Aktiflik Kalan Süre: </span>
              {user.activeUntil ? (
                <span className={calculateRemainingDays(user.activeUntil) < 7 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {calculateRemainingDays(user.activeUntil)} gün
                  <span className="text-xs text-gray-700 ml-2">
                    ({new Date(user.activeUntil).toLocaleDateString('tr-TR')})
                  </span>
                </span>
              ) : (
                <span className="text-red-600 font-bold">Pasif</span>
              )}
            </div>
            <Button size="sm" onClick={() => navigate('/e-wallet')} className="bg-green-600 hover:bg-green-700 text-white">
              Aktif Ol
            </Button>
          </div>
        </div>

        {/* Live Broadcast Player */}
        <div className="mb-8">
          <LiveBroadcastPlayer
            autoRefresh={true}
            refreshInterval={30000}
            className="shadow-lg"
          />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900 font-medium">
                    Cüzdan Bakiyesi
                  </p>
                  <p className="text-2xl font-bold text-black">
                    ${user.wallet.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900 font-medium">Ekip Üyesi</p>
                  <p className="text-2xl font-bold text-black">{user.totalTeamSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900 font-medium">Toplam Kazanç</p>
                  <p className="text-2xl font-bold text-black">
                    ${user.wallet.totalEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900 font-medium">
                    Kariyer Seviyesi
                  </p>
                  <p className="text-lg font-bold text-black">{user.careerLevel.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="flex w-max lg:w-full min-w-full h-auto p-1 bg-white border border-slate-200 rounded-xl">
              <TabsTrigger value="dashboard" className="px-4 py-2 whitespace-nowrap">Dashboard</TabsTrigger>
              <TabsTrigger value="receipt" className="px-4 py-2 whitespace-nowrap">📄 Dekont</TabsTrigger>
              <TabsTrigger value="team" className="px-4 py-2 whitespace-nowrap">Ekibim</TabsTrigger>
              <TabsTrigger value="monoline-tree" className="px-4 py-2 whitespace-nowrap">🌳 Ağaç Yapım</TabsTrigger>
              <TabsTrigger value="placement" className="px-4 py-2 whitespace-nowrap">Yerleştirme</TabsTrigger>
              <TabsTrigger value="share" className="px-4 py-2 whitespace-nowrap">Paylaşım</TabsTrigger>
              <TabsTrigger value="clone-products" className="px-4 py-2 whitespace-nowrap">Ürün Mağazam</TabsTrigger>
              <TabsTrigger value="earnings" className="px-4 py-2 whitespace-nowrap">Kazançlar</TabsTrigger>
              <TabsTrigger value="transactions" className="px-4 py-2 whitespace-nowrap">İşlemler</TabsTrigger>
              <TabsTrigger value="documents" className="px-4 py-2 whitespace-nowrap">Dökümanlar</TabsTrigger>
              <TabsTrigger value="profile" className="px-4 py-2 whitespace-nowrap">Profil</TabsTrigger>
              <TabsTrigger value="manevi" className="px-4 py-2 whitespace-nowrap">🕌 Manevi Panel</TabsTrigger>
              <TabsTrigger value="zahiri" className="px-4 py-2 whitespace-nowrap">✨ Zahiri Panel</TabsTrigger>
              <TabsTrigger value="batini" className="px-4 py-2 whitespace-nowrap">💎 Batıni Panel</TabsTrigger>
              <TabsTrigger value="training" className="px-4 py-2 whitespace-nowrap relative" onClick={fetchUpcomingTrainings}>
                🎥 Eğitimler
                {upcomingTrainings.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{upcomingTrainings.length}</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Kazanç Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-gray-800">Sponsor Bonusu</span>
                    <span className="font-bold text-green-700">
                      ${user.wallet.sponsorBonus.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-gray-800">Kariyer Bonusu</span>
                    <span className="font-bold text-blue-700">
                      ${user.wallet.careerBonus.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-gray-800">Pasif Gelir</span>
                    <span className="font-bold text-purple-700">
                      ${user.wallet.passiveIncome.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-bold text-gray-800">Liderlik Bonusu</span>
                    <span className="font-bold text-orange-700">
                      ${user.wallet.leadershipBonus.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
                <CardHeader>
                  <CardTitle className="text-gray-900">Hızlı Paylaşım</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Organizasyonunuzu büyütmek için link paylaşın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input value={clonePageUrl} readOnly className="flex-1 bg-gray-50 text-black border-gray-300" />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(clonePageUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={shareViaWhatsApp}
                      className="w-full text-black border-gray-300 hover:bg-gray-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={shareViaEmail}
                      className="w-full text-black border-gray-300 hover:bg-gray-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-900 font-bold mb-2">
                      Paylaşım İstatistikleri:
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-black">{shareStats.visits}</p>
                        <p className="text-xs text-gray-700 font-medium">Ziyaret</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-black">
                          {shareStats.conversions}
                        </p>
                        <p className="text-xs text-gray-700 font-medium">Kayıt</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-black">
                          {shareStats.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-700 font-medium">Oran</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className={`${vividTheme.statCard} bg-white shadow-sm`}>
              <CardHeader>
                <CardTitle className="text-gray-900">Son Ekip Üyeleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-4"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{member.fullName}</p>
                        <p className="text-xs text-gray-600 font-medium">
                          {member.memberId} • {member.careerLevel}
                        </p>
                      </div>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                      >
                        {member.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <p className="text-center text-gray-600 font-medium py-4">
                      Henüz ekip üyeniz bulunmuyor. Link paylaşarak ekibinizi
                      büyütün!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Upload Tab */}
          <TabsContent value="receipt" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white/90`}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Ödeme Dekontu Yükle</span>
                </CardTitle>
                <CardDescription>
                  Ödeme dekontunuzu yükleyerek başvurunuzu tamamlayın. Admin onayından sonra sistemin tüm özelliklerine erişim sağlanacaktır.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!user?.isActive && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Önemli:</strong> Sistemi tam olarak aktifleştirmek için ödeme dekontunuzu yüklemeniz gerekmektedir.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receipt-upload" className="text-base font-semibold mb-2 block">
                      Dekont Dosyası Seçin
                    </Label>
                    <Input
                      id="receipt-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptFileChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-700 mt-2">
                      Desteklenen formatlar: JPG, PNG, PDF (Maksimum 5MB)
                    </p>
                  </div>

                  {receiptPreview && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Ön İzleme</Label>
                      {receiptPreview.startsWith('data:image') ? (
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="max-h-96 w-auto rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-800">PDF Dosyası Seçildi</p>
                        </div>
                      )}
                    </div>
                  )}

                  {receiptUploadStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>{receiptMessage}</span>
                      </p>
                    </div>
                  )}

                  {receiptUploadStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{receiptMessage}</p>
                    </div>
                  )}

                  <Button
                    onClick={uploadReceipt}
                    disabled={receiptUploadLoading || !receiptFile}
                    className="w-full"
                    size="lg"
                  >
                    {receiptUploadLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    )}
                    {receiptUploadLoading ? "Yükleniyor..." : "Dekontu Gönder"}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-blue-900 text-sm">Ödeme Bilgileri</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p><strong>Hesap Adı:</strong> Kutbul Zaman</p>
                    <p><strong>IBAN:</strong> TR32 0015 7000 0000 0091 7751 22</p>
                    <p><strong>Tutar:</strong> Paketinize göre değişkenlik gösterir</p>
                    <p><strong>İçerik:</strong> Adınız ve Üyelik Numaranız ({user?.memberId})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white/90`}>
              <CardHeader>
                <CardTitle>
                  Ekip Organizasyonum ({teamMembers.length})
                </CardTitle>
                <CardDescription>
                  Sizin referansınızla katılan tüm üyeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Üye ID</TableHead>
                        <TableHead>İsim</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Seviye</TableHead>
                      <TableHead>Yatırım</TableHead>
                      <TableHead>Pozisyon</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Ekip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono">
                          {member.memberId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.fullName}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.careerLevel}</Badge>
                        </TableCell>
                        <TableCell>${member.totalInvestment}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.position === "direct"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.position === "direct"
                              ? "Direkt"
                              : "Ruhsal Gelişim Hattı"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.isActive ? "default" : "secondary"}
                          >
                            {member.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMemberTeam(member)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ekibi Gör
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            </Card>
          </TabsContent>

          {/* Monoline Tree View Tab */}
          <TabsContent value="monoline-tree" className="space-y-6">
            <Card className="bg-white border-2 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">🌳 Ruhsal Gelişim Ağaç Yapınız</h3>
                      <p className="text-sm text-gray-700">Sizin ağaç yapınızı ve tüm alt ağınızı görüntüleyin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-900">💎 Tek Hat Sistemi</p>
                    <p className="text-xs text-gray-800">7 seviye derinlik + pasif gelir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user && (
              <MonolineTreeView
                userId={user.id}
                userName={user.fullName}
                memberId={user.memberId}
                maxLevels={7}
              />
            )}
          </TabsContent>

          {/* Team Placement Management Tab */}
          <TabsContent value="placement" className="space-y-6">
            {/* Pending Placements Overview */}
            <Card className="bg-white border-2 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">👥 Takım Yerleştirme Merkezi</h3>
                      <p className="text-sm text-gray-700">Yeni üyeleri takımınızda istediğiniz pozisyona yerleştirin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-700">⏳ Bekleyen: {pendingPlacements.filter(p => p.status === 'pending').length}</p>
                    <p className="text-xs text-gray-800">Toplam Takım: {user?.totalTeamSize || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Placements List */}
            {pendingPlacements.filter(p => p.status === 'pending').length > 0 ? (
              <Card className={`${vividTheme.statCard} bg-white/90`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span>📋 Yerleştirilmeyi Bekleyen Üyeler</span>
                  </CardTitle>
                  <CardDescription>
                    Referans linkiniz üzerinden kayıt olan üyeler için pozisyon seçin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingPlacements.filter(p => p.status === 'pending').map((placement) => (
                      <div key={placement.id} className="p-4 border rounded-lg bg-white border-orange-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                {placement.newUserData.fullName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{placement.newUserData.fullName}</h3>
                                <p className="text-sm text-gray-800">{placement.newUserData.email}</p>
                                <p className="text-xs text-gray-700">
                                  Kayıt: {new Date(placement.registrationDate).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-xs">
                              <Badge variant="outline">📞 {placement.newUserData.phone}</Badge>
                              <Badge variant="outline">📦 {placement.newUserData.membershipType}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handlePlacementSelection(placement)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Pozisyon Seç
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Bekleyen Yerleştirme Yok</h3>
                  <p className="text-gray-700 mb-4">
                    Şu anda yerleştirilmeyi bekleyen yeni üye bulunmuyor.
                  </p>
                  <Button variant="outline" onClick={() => { const link = clonePageUrl; const text = `Referans linkim: ${link}`; if ((navigator as any).share) { (navigator as any).share({ title: 'Referans Linki', text, url: link }).catch(() => copyToClipboard(link)); } else { copyToClipboard(link); } }}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Referans Linkini Paylaş
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Team Structure Visualization */}
            <Card className="border-2 border-green-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TreePine className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle>🌳 Takım Yapınız ve Analiz</CardTitle>
                      <CardDescription>Monoline zincirinizdeki sıradaki {monolineDownline.length} üye (7 derinlik)</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => setActiveTab("monoline-tree")}
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Tüm Ağ Görünümü
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {monolineDownlineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-slate-500">
                      <TreePine className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500" />
                      <p className="text-sm">Zincir yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0">
                    {/* Current User Node */}
                    <div className="flex justify-center">
                      <div className="bg-blue-600 border-4 border-white shadow-xl rounded-2xl p-3 text-center text-white w-44">
                        <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-black text-lg">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="text-sm font-bold truncate">{user?.fullName}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-blue-100">SİZ · #{user?.globalRank || '—'}</div>
                      </div>
                    </div>

                    {monolineDownline.length === 0 ? (
                      <>
                        <div className="h-8 w-0.5 bg-gradient-to-b from-blue-400 to-purple-300"></div>
                        <div className="w-full max-w-xs p-4 border-2 border-dashed border-purple-300 rounded-2xl flex flex-col items-center bg-purple-50/50">
                          <Plus className="w-6 h-6 text-purple-400 mb-1" />
                          <p className="text-xs font-bold text-purple-700">Zincirde sonraki pozisyon boş</p>
                          <p className="text-[10px] text-purple-500 mt-0.5">Yeni kayıtlar buraya yerleşecek</p>
                        </div>
                      </>
                    ) : (
                      monolineDownline.map((member: any, idx: number) => {
                        const levelColors = [
                          'border-purple-300 bg-purple-50',
                          'border-blue-300 bg-blue-50',
                          'border-green-300 bg-green-50',
                          'border-yellow-300 bg-yellow-50',
                          'border-orange-300 bg-orange-50',
                          'border-red-300 bg-red-50',
                          'border-pink-300 bg-pink-50',
                        ];
                        const textColors = [
                          'text-purple-800','text-blue-800','text-green-800',
                          'text-yellow-800','text-orange-800','text-red-800','text-pink-800',
                        ];
                        const dotColors = [
                          'bg-purple-500','bg-blue-500','bg-green-500',
                          'bg-yellow-500','bg-orange-500','bg-red-500','bg-pink-500',
                        ];
                        const colorIdx = idx % 7;
                        return (
                          <React.Fragment key={member.id}>
                            <div className="h-6 w-0.5 bg-gradient-to-b from-slate-300 to-slate-400"></div>
                            <div className={`w-full max-w-xs px-4 py-2.5 border-2 rounded-xl flex items-center gap-3 ${levelColors[colorIdx]}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${dotColors[colorIdx]}`}>
                                {member.fullName?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-bold truncate ${textColors[colorIdx]}`}>{member.fullName}</div>
                                <div className="text-[10px] text-slate-500">{member.memberId} · Sıra #{member.globalRank}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-[9px] font-black uppercase ${textColors[colorIdx]}`}>Seviye {idx + 1}</div>
                                <div className={`w-2 h-2 rounded-full mx-auto mt-0.5 ${member.isActive ? 'bg-green-500' : 'bg-red-400'}`}></div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}

                    {monolineDownline.length > 0 && (
                      <div className="mt-4 w-full max-w-xs">
                        <div className="h-6 w-0.5 bg-gradient-to-b from-slate-300 to-transparent mx-auto"></div>
                        <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center bg-slate-50/50">
                          <Plus className="w-4 h-4 text-slate-400 mb-0.5" />
                          <p className="text-[10px] text-slate-500">Sıradaki pozisyon açık</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share Tab - Enhanced Clone Page Management */}
          <TabsContent value="share" className="space-y-6">
            {/* Clone Page URL and QR Code */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Kişisel Klon Sayfanız
                  </CardTitle>
                  <CardDescription>
                    Kendi referans ID'niz ile özelleştirilmiş landing sayfanız
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">
                      Klon Sayfa URL'iniz:
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={clonePageUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={() => copyToClipboard(clonePageUrl)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Üye ID'niz:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={user.memberId}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(user.memberId)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Referans Kodunuz:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          value={user.referralCode}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(user.referralCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1"
                      onClick={() => window.open(clonePageUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Klon Sayfanızı Görüntüle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`${clonePageUrl}?preview=true`, "_blank")
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Önizleme
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    QR Kod
                  </CardTitle>
                  <CardDescription>Mobil paylaşım için QR kod</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {qrCodeUrl && (
                    <div className="text-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto border rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      İndir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(clonePageUrl)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Sosyal Medya Paylaşımı
                </CardTitle>
                <CardDescription>
                  Klon sayfanızı farklı platformlarda paylaşın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Button
                    variant="outline"
                    onClick={shareViaWhatsApp}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareViaFacebook}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <Facebook className="w-6 h-6 text-blue-600" />
                    <span className="text-xs">Facebook</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareViaTwitter}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <span className="text-xs">Twitter</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareViaInstagram}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <Instagram className="w-6 h-6 text-pink-600" />
                    <span className="text-xs">Instagram</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareViaTelegram}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <Send className="w-6 h-6 text-blue-500" />
                    <span className="text-xs">Telegram</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareViaEmail}
                    className="flex flex-col h-20 space-y-1"
                  >
                    <Mail className="w-6 h-6 text-gray-800" />
                    <span className="text-xs">Email</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Clone Page Customization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Sayfa Özelleştirme
                  </CardTitle>
                  <CardDescription>
                    Klon sayfanızın görünümünü özelleştirin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Özel Mesajınız:</Label>
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Ziyaretçilerinize özel bir mesaj yazın..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Başlık Rengi:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={clonePageSettings.headerColor}
                          onChange={(e) =>
                            setClonePageSettings({
                              ...clonePageSettings,
                              headerColor: e.target.value,
                            })
                          }
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={clonePageSettings.headerColor}
                          onChange={(e) =>
                            setClonePageSettings({
                              ...clonePageSettings,
                              headerColor: e.target.value,
                            })
                          }
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Buton Rengi:</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={clonePageSettings.buttonColor}
                          onChange={(e) =>
                            setClonePageSettings({
                              ...clonePageSettings,
                              buttonColor: e.target.value,
                            })
                          }
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={clonePageSettings.buttonColor}
                          onChange={(e) =>
                            setClonePageSettings({
                              ...clonePageSettings,
                              buttonColor: e.target.value,
                            })
                          }
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={clonePageSettings.showTestimonials}
                        onChange={(e) =>
                          setClonePageSettings({
                            ...clonePageSettings,
                            showTestimonials: e.target.checked,
                          })
                        }
                      />
                      <span>Yorumları Göster</span>
                    </Label>
                    <Label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={clonePageSettings.showFeatures}
                        onChange={(e) =>
                          setClonePageSettings({
                            ...clonePageSettings,
                            showFeatures: e.target.checked,
                          })
                        }
                      />
                      <span>Özellikleri Göster</span>
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={updateCustomMessage}>
                      <Save className="w-4 h-4 mr-2" />
                      Mesajı Kaydet
                    </Button>
                    <Button onClick={updateClonePageSettings} variant="outline">
                      <Palette className="w-4 h-4 mr-2" />
                      Tasarımı Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Performans İstatistikleri
                  </CardTitle>
                  <CardDescription>
                    Klon sayfanızın performans verileriniz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{shareStats.visits}</p>
                      <p className="text-sm text-slate-700">
                        Toplam Ziyaret
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">
                        {shareStats.conversions}
                      </p>
                      <p className="text-sm text-slate-700">
                        Yeni Kayıt
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">
                        {shareStats.conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-700">
                        Dönüşüm Oranı
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-2">Paylaşım İpuçları:</h4>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>• QR kodu kartvizitirinize ekleyin</li>
                      <li>• Sosyal medyada düzenli paylaşın</li>
                      <li>• WhatsApp durumunda paylaşın</li>
                      <li>• Email imzanıza ekleyin</li>
                      <li>• özel mesajınızı düzenli güncelleyin</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
                <CardDescription>
                  Sık kullanılan paylaşım ve yönetim işlemleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="default"
                    onClick={() => {
                      const authToken = localStorage.getItem("authToken");
                      if (!authToken) {
                        alert(
                          "Bu özellik için tekrar giriş yapmanız gerekiyor.",
                        );
                        navigate("/login");
                        return;
                      }
                      navigate("/e-wallet");
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    E-Cüzdan & Finansal
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => {
                      const authToken = localStorage.getItem("authToken");
                      if (!authToken) {
                        alert(
                          "Bu özellik için tekrar giriş yapmanız gerekiyor.",
                        );
                        navigate("/login");
                        return;
                      }
                      navigate("/real-time-transactions");
                    }}
                    className="bg-gradient-to-r from-primary to-spiritual-purple"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Gerçek Zamanlı İşlemler
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = `${user?.fullName} - ${user?.memberId}\nKutbul Zaman Davet Linki:\n${clonePageUrl}`;
                      navigator.clipboard.writeText(text);
                      alert("Kartvizit metni kopyalandı!");
                    }}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Kartvizit Metni
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const emailSignature = `\n\n---\n${user?.fullName}\nKutbul Zaman Üyesi\n${clonePageUrl}`;
                      navigator.clipboard.writeText(emailSignature);
                      alert("Email imzası kopyalandı!");
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email İmzası
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Kutbul Zaman Daveti",
                          text: `${user?.fullName} üzerinden katılın!`,
                          url: clonePageUrl,
                        });
                      } else {
                        copyToClipboard(clonePageUrl);
                        alert("Link kopyalandı!");
                      }
                    }}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobil Paylaş
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    QR Yazdır
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clone Products Tab */}
          <TabsContent value="clone-products" className="space-y-6">
            {/* Clone Product Page Header */}
            <Card className="bg-white border-2 border-spiritual-gold/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-spiritual-gold to-primary rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-black">🛍️ Kişisel Ürün Mağazanız</h3>
                      <p className="text-gray-900 font-medium">Özel ürün sayfanızdan yapılan alışverişlerde %15 otomatik komisyon kazanın</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-spiritual-gold">%15 Komisyon Garantisi</p>
                    <p className="text-sm text-gray-900 font-medium">Her satışta otomatik</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clone Product URL and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <ShoppingCart className="w-5 h-5 mr-2 text-spiritual-gold" />
                    Ürün Mağaza Linkiniz
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Bu linki paylaşarak ürün satışı yapın ve %15 komisyon kazanın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <Label className="text-sm font-bold text-black">
                      Kişisel Ürün Mağaza URL'iniz:
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={`${window.location.origin}/clone-products/${user?.memberId}`}
                        readOnly
                        className="font-mono text-sm bg-white text-black border-gray-300"
                      />
                      <Button
                        onClick={() => copyToClipboard(`${window.location.origin}/clone-products/${user?.memberId}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-spiritual-gold to-spiritual-gold/80 hover:from-spiritual-gold/90 hover:to-spiritual-gold/70"
                      onClick={() => window.open(`${window.location.origin}/clone-products/${user?.memberId}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ürün Mağazanızı Görüntüle
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const text = `${user?.fullName} özel ürün mağazasına göz atın! Premium manevi ürünler ve %15 otomatik komisyon sistemi. ${window.location.origin}/clone-products/${user?.memberId}`;
                          window.open(`whatsapp://send?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const text = `${user?.fullName} özel ürün mağazası: ${window.location.origin}/clone-products/${user?.memberId}`;
                          navigator.clipboard.writeText(text);
                          alert("Sosyal medya metni kopyalandı!");
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Sosyal Medya
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    Ürün Mağaza İstatistikleri
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Kişisel ürün sayfanızın performans verileri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 border rounded-lg bg-blue-50">
                      <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">{cloneInfo.visits || 0}</p>
                      <p className="text-sm text-gray-800">
                        Sayfa Ziyareti
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">{cloneInfo.conversions || 0}</p>
                      <p className="text-sm text-gray-800">
                        Başarılı Satış
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-spiritual-gold/10">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-spiritual-gold" />
                      <p className="text-2xl font-bold text-gray-900">₺{(cloneInfo.conversions || 0) * 15}</p>
                      <p className="text-sm text-gray-800">
                        Tahmini Komisyon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clone Product Features */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">🎯 Ürün Mağazası Özellikleri</CardTitle>
                <CardDescription className="text-gray-600">
                  Kişisel ürün mağazanızın sunduğu avantajlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-spiritual-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-6 h-6 text-spiritual-gold" />
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">%15 Otomatik Komisyon</h4>
                    <p className="text-sm text-gray-800">
                      Her satışta anında hesabınıza yatırılır
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">Anında İşlem</h4>
                    <p className="text-sm text-gray-800">
                      Satış gerçekleşir gerçekleşmez komisyon hesaplanır
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">Müşteri Takibi</h4>
                    <p className="text-sm text-gray-800">
                      Satış yapılan müşteriler otomatik olarak kaydedilir
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Network className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2 text-gray-900">Ruhsal Gelişim Entegrasyonu</h4>
                    <p className="text-sm text-gray-800">
                      Normal sistem dağıtımı da devam eder
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Clone Product Sales */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Son Ürün Satışları</CardTitle>
                <CardDescription className="text-gray-600">
                  Kişisel ürün mağazanızdan yapılan son satışlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      customer: "m***@gmail.com",
                      product: "Manevi Gelişim Premium Seti",
                      amount: 299,
                      commission: 44.85,
                      date: "2 saat önce",
                      status: "Tamamlandı"
                    },
                    {
                      id: 2,
                      customer: "a***@hotmail.com",
                      product: "Kutsal Tesbihat ve Zikirmatik",
                      amount: 149,
                      commission: 22.35,
                      date: "1 gün önce",
                      status: "Kargoda"
                    },
                    {
                      id: 3,
                      customer: "f***@yahoo.com",
                      product: "Nefis Mertebeleri Eğitim Paketi",
                      amount: 499,
                      commission: 74.85,
                      date: "3 gün önce",
                      status: "Teslim Edildi"
                    },
                  ].map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-spiritual-gold/10 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-spiritual-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{sale.product}</p>
                          <p className="text-sm text-gray-800">
                            {sale.customer} • {sale.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${sale.amount}</p>
                        <p className="text-sm text-spiritual-gold font-medium">
                          +${sale.commission} komisyon
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {sale.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  <div className="text-center py-8 text-gray-800 border-2 border-dashed rounded-lg">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">Henüz ürün satışı yok</p>
                    <p className="text-sm mb-4">
                      Ürün mağaza linkinizi paylaşarak ilk satışınızı yapın!
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`${window.location.origin}/clone-products/${user?.memberId}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Mağazanızı Görüntüle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions for Clone Products */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Hızlı İşlemler</CardTitle>
                <CardDescription className="text-gray-600">
                  Ürün mağazanız için hızlı paylaşım ve yönetim işlemleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="default"
                    onClick={() => window.open(`${window.location.origin}/clone-products/${user?.memberId}`, "_blank")}
                    className="bg-gradient-to-r from-spiritual-gold to-spiritual-gold/80"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Mağazayı Aç
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const storeUrl = `${window.location.origin}/clone-products/${user?.memberId}`;
                      const text = `🛍️ ${user?.fullName} özel ürün mağazası!\n\n✨ Premium manevi ürünler\n💰 %15 otomatik komisyon sistemi\n🚀 Anında işlem garantisi\n\n${storeUrl}`;
                      navigator.clipboard.writeText(text);
                      alert("Mağaza tanıtım metni kopyalandı!");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Tanıtım Metni
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const storeUrl = `${window.location.origin}/clone-products/${user?.memberId}`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storeUrl)}`;
                      safeDownloadUrl(qrUrl, `${user?.memberId}-store-qr.png`);
                    }}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR İndir
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/clone-customers")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Müşteri Takibi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kazanç Detayları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Sponsor Bonusu
                      </span>
                      <span className="font-bold text-green-600">
                        ${user.wallet.sponsorBonus.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Kariyer Bonusu
                      </span>
                      <span className="font-bold text-blue-600">
                        ${user.wallet.careerBonus.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                      <span className="text-sm font-medium">Pasif Gelir</span>
                      <span className="font-bold text-purple-600">
                        ${user.wallet.passiveIncome.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Liderlik Bonusu
                      </span>
                      <span className="font-bold text-orange-600">
                        ${user.wallet.leadershipBonus.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kariyer İlerleme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge className="text-lg p-3">
                        <Award className="w-5 h-5 mr-2" />
                        {user.careerLevel.name}
                      </Badge>
                      <p className="text-sm text-slate-700 mt-2">
                        Mevcut Kariyer Seviyeniz
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Komisyon Oranı:</span>
                        <span className="font-bold">
                          %{user.careerLevel.commissionRate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Direkt Üye:</span>
                        <span className="font-bold">
                          {user.directReferrals}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Toplam Ekip:</span>
                        <span className="font-bold">{user.totalTeamSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Toplam Yatırım:</span>
                        <span className="font-bold">
                          ${user.totalInvestment}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  E-Cüzdan
                </CardTitle>
                <CardDescription>Bakiyenizi yönetin, para yatırma/çekme talebi oluşturun</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/wallet')} className="bg-green-600 hover:bg-green-700">Detayları Gör</Button>
                <Button variant="outline" onClick={() => navigate('/wallet')}>Para Yatır</Button>
                <Button variant="outline" onClick={() => navigate('/wallet')}>Para Çek</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>İşlem Geçmişi</CardTitle>
                <CardDescription>
                  Tüm kazanç ve ödeme işlemleriniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İşlem Türü</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString(
                            "tr-TR",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell
                          className={
                            transaction.amount >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.amount >= 0 ? "+" : ""}$
                          {Math.abs(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.status === "completed"
                              ? "Tamamlandı"
                              : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-slate-700">
                    Henüz işlem bulunmuyor
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* System Presentation Call-to-action */}
            <Card className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white border-none shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BookOpen className="w-32 h-32 rotate-12" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md border border-white/20">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      Başarı Rehberi
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Sistem Tanıtım ve Kazanç Sunumu</h3>
                    <p className="text-indigo-100 text-lg leading-relaxed">
                      Bu işi niçin yapmalısınız? Kariyer basamaklarını tırmandığınızda sizi hangi ödüller bekliyor? 
                      Sponsorluk zincirinden global havuz kazançlarına kadar tüm detaylar bu interaktif sunumda.
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Detaylı Kazanç Planı Analizi",
                        "Kariyer Ünvanları ve Primleri",
                        "Ürün ve Puanlama Sistemi",
                        "Sponsorluk ve Derinlik Bonusları"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-indigo-100/80">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={() => setIsPresentationOpen(true)}
                      className="bg-white text-indigo-700 hover:bg-indigo-50 font-black px-8 h-14 text-lg rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Sunumu Başlat
                    </Button>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const link = `${window.location.origin}/register?ref=${user?.referralCode || 'ak0000001'}`;
                          toast({
                            title: "Sunum Dosyası Hazırlanıyor",
                            description: `Sunum dosyası referans linkinizle (${link}) optimize ediliyor. İndirme birazdan başlayacak.`,
                          });
                          downloadDocument('doc-001-pdf', 'Kutbul-Zaman-Sunum.pdf');
                        }}
                        className="bg-indigo-100/20 border-white/40 text-white hover:bg-white/20 font-bold px-8 h-14 text-lg rounded-2xl shadow-xl backdrop-blur-sm"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        PDF İndir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/register?ref=${user?.referralCode || 'ak0000001'}`;
                          navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: "Link Kopyalandı",
                            description: "Sunum paylaşım linkiniz panoya kopyalandı. Bu linki paylaştığınızda yeni üyeler sizin referansınızla kayıt olacaktır.",
                          });
                        }}
                        className="text-indigo-100/70 hover:text-white text-xs font-bold"
                      >
                        <Copy className="w-3 h-3 mr-1" /> Paylaşım Linkini Kopyala
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">📚 Eğitim Dökümanları</h3>
                      <p className="text-sm text-gray-700">Admin tarafından paylaşılan eğitim materyalleri ve dokümanlar</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-700">🔄 Otomatik Güncellenen</p>
                    <p className="text-xs text-gray-800">Toplam: {documents.length} döküman</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {documentsLoading ? (
                // Loading State
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="flex space-x-2">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : documents.length === 0 ? (
                // Empty State
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Henüz döküman bulunmuyor</h3>
                      <p className="text-gray-700 mb-4">Admin tarafından paylaşılan dökümanlar burada görünecek</p>
                      <Button
                        onClick={() => loadDocuments()}
                        variant="outline"
                        className="border-2 border-blue-400 hover:border-blue-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yenile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Documents List
                documents.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Document Header */}
                        <div className="flex items-start space-x-3">
                          <div className="text-3xl">{getFileIcon(doc.fileName)}</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{doc.title}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {doc.category === 'general' && '📋 Genel'}
                                {doc.category === 'guide' && '📖 Kılavuz'}
                                {doc.category === 'training' && '🎓 Eğitim'}
                                {doc.category === 'mlm' && '🌳 İrfan Sistemi'}
                                {doc.category === 'spiritual' && '🕌 Manevi'}
                                {doc.category === 'financial' && '💰 Finansal'}
                                {doc.category === 'announcement' && '📢 Duyuru'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {doc.type === 'document' && '📄 Döküman'}
                                {doc.type === 'presentation' && '📊 Sunum'}
                                {doc.type === 'spreadsheet' && '📈 Tablo'}
                                {doc.type === 'image' && '🖼️ Görsel'}
                                {doc.type === 'video' && '🎥 Video'}
                                {doc.type === 'audio' && '🎵 Ses'}
                                {doc.type === 'archive' && '📦 Arşiv'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Document Description */}
                        <p className="text-sm text-gray-800 line-clamp-3">{doc.description}</p>

                        {/* Document Info */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="font-semibold text-gray-800">Dosya:</span>
                            <p className="text-gray-800 truncate">{doc.fileName}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800">Boyut:</span>
                            <p className="text-gray-800">{formatFileSize(doc.fileSize)}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800">Tarih:</span>
                            <p className="text-gray-800">{new Date(doc.uploadDate).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800">Erişim:</span>
                            <p className="text-gray-800">
                              {doc.accessLevel === 'all' && '👥 Herkes'}
                              {doc.accessLevel === 'members' && '🏆 Üyeler'}
                              {doc.accessLevel === 'leaders' && '👑 Liderler'}
                              {doc.accessLevel === 'admins' && '⚙️ Adminler'}
                            </p>
                          </div>
                        </div>

                        {/* Document Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                                  #{tag}
                                </Badge>
                              ))}
                              {doc.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  +{doc.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2 border-t">
                          <Button
                            size="sm"
                            className={cn(
                              "flex-1 text-white",
                              ['doc-001', 'doc-002', 'doc-003'].includes(doc.id) 
                                ? "bg-indigo-600 hover:bg-indigo-700 animate-pulse" 
                                : "bg-blue-600 hover:bg-blue-700"
                            )}
                            onClick={() => downloadDocument(doc.id, doc.fileName)}
                          >
                            {doc.id === 'doc-002' ? (
                              <><Calculator className="w-4 h-4 mr-1" /> Hesapla</>
                            ) : doc.id === 'doc-001' ? (
                              <><BookOpen className="w-4 h-4 mr-1" /> Başlat</>
                            ) : (
                              <><Download className="w-4 h-4 mr-1" /> {['doc-001', 'doc-002', 'doc-003'].includes(doc.id) ? 'Uygula' : 'İndir'}</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 border-green-400 hover:border-green-600 hover:bg-green-50"
                            onClick={() => {
                              if (doc.id === 'doc-001' || doc.id === 'doc-002' || doc.id === 'doc-003') {
                                downloadDocument(doc.id, doc.fileName);
                              } else {
                                alert(`${doc.title} dökümanı önizleniyor...`);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {['doc-001', 'doc-002', 'doc-003'].includes(doc.id) ? 'Aç' : 'Görüntüle'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Documents Actions */}
            {documents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-800">
                      Toplam {documents.length} döküman mevcut • Son güncelleme: Az önce
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadDocuments();
                          alert('Döküman listesi yenilendi!');
                        }}
                        className="border-2 border-blue-400 hover:border-blue-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Yenile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          alert('Tüm dökümanlar indiriliyor...');
                        }}
                        className="border-2 border-green-400 hover:border-green-600"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Hepsini İndir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real-time Sync Info */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">🔄 Otomatik Senkronizasyon</h4>
                    <p className="text-sm text-gray-700">
                      Admin tarafından yüklenen yeni dökümanlar otomatik olarak burada görünür.
                      Erişim izinlerinize göre filtrelenmiş dökümanları görüyorsunuz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Üye ID</Label>
                    <Input value={user.memberId} readOnly />
                  </div>
                  <div>
                    <Label>Ad Soyad</Label>
                    <Input value={user.fullName} readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user.email} readOnly />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input value={user.phone} readOnly />
                  </div>
                  <div>
                    <Label>Kayıt Tarihi</Label>
                    <Input
                      value={new Date(user.registrationDate).toLocaleDateString(
                        "tr-TR",
                      )}
                      readOnly
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Üyelik Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Üyelik Türü</Label>
                    <Input value={user.membershipType} readOnly />
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <Input value={user.isActive ? "Aktif" : "Pasif"} readOnly />
                  </div>
                  <div>
                    <Label>Referans Kodu</Label>
                    <div className="flex space-x-2">
                      <Input value={user.referralCode} readOnly />
                      <Button
                        onClick={() => copyToClipboard(user.referralCode)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Rol</Label>
                    <Input value={user.role} readOnly />
                  </div>
                  {user.sponsorId && (
                    <div>
                      <Label>Sponsor ID</Label>
                      <Input value={user.sponsorId} readOnly />
                    </div>
                  )}
                </CardContent>
              </Card>

              {sponsorInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Sponsor Bilgisi</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Sponsor Adı</Label>
                      <Input value={sponsorInfo.fullName} readOnly />
                    </div>
                    <div>
                      <Label>Sponsor Üye ID</Label>
                      <Input value={sponsorInfo.memberId} readOnly />
                    </div>
                    {sponsorInfo.referralCode && (
                      <div>
                        <Label>Sponsor Referans Kodu</Label>
                        <Input value={sponsorInfo.referralCode} readOnly />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>Ödeme Sistemi (Stripe Connect)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!user.stripeAccountId || !user.stripeOnboardingComplete ? (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-semibold text-indigo-900 mb-1">Stripe ile Kazancını Çek</h4>
                        <p className="text-sm text-indigo-700">
                          Kazançlarını banka hesabına otomatik olarak çekebilmek için Stripe Connect hesabını kurmalısın. 
                          Güvenli ve hızlı ödeme altyapısı için Stripe kullanıyoruz.
                        </p>
                      </div>
                      <Button 
                        onClick={handleStripeConnect} 
                        disabled={stripeLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto"
                      >
                        {stripeLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Stripe'a Bağlan
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-900">Stripe Hesabın Bağlı</h4>
                          <p className="text-sm text-green-700">Artık ödemelerini Stripe üzerinden otomatik olarak alabilirsin.</p>
                          <div className="mt-1 font-mono text-xs text-green-600 bg-green-200/30 px-2 py-0.5 rounded inline-block">
                            ID: {user.stripeAccountId}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleStripeConnect} className="text-green-700 border-green-200 hover:bg-green-100">
                        Hesabı Yönet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="zahiri" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white shadow-xl overflow-hidden border-2 border-purple-500`}>
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[120%] bg-white blur-[100px] rounded-full animate-pulse"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[120%] bg-purple-500 blur-[100px] rounded-full animate-pulse delay-700"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 animate-bounce">
                    <Brain className="w-12 h-12 text-purple-200" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tighter">Zahiri Arınma Paneli</h2>
                  <p className="max-w-md mx-auto text-purple-100 font-medium">
                    Zihninizdeki kaosu dindirin, ruhunuzdaki ağırlıklardan kurtulun ve manevi potansiyelinizi açığa çıkarın.
                  </p>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Hızlı Arınma</h3>
                    <p className="text-sm text-gray-700 mb-4">Günlük stres ve negatif enerjiden 5 dakikada kurtulun.</p>
                    <Button onClick={() => navigate("/zahiri-panel")} variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">Şimdi Başla</Button>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Manevi Korumalar</h3>
                    <p className="text-sm text-gray-700 mb-4">Alanınızı ve auranızı negatif etkilerden korumak için dualar.</p>
                    <Button onClick={() => navigate("/zahiri-panel")} variant="outline" className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white">İncele</Button>
                  </div>
                  <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-pink-600/10 rounded-xl flex items-center justify-center mb-4">
                      <Star className="w-6 h-6 text-pink-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">İlham Verici Sözler</h3>
                    <p className="text-sm text-gray-700 mb-4">Mürşit ve bilgelerin yolunuzu aydınlatan hikmetli sözleri.</p>
                    <Button onClick={() => navigate("/zahiri-panel")} variant="outline" className="w-full border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white">Keşfet</Button>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl text-white">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Daha Fazlasını Mı Arıyorsunuz?</h3>
                      <p className="text-purple-100 text-sm opacity-90">Tam sürüm Zahiri Panel'de meditasyonlar, frekans müzikleri ve detaylı rehberler sizi bekliyor.</p>
                    </div>
                    <Button onClick={() => navigate("/zahiri-panel")} className="bg-white text-purple-900 hover:bg-purple-50 font-bold whitespace-nowrap">
                      Panelin Tamamına Git
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manevi" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white shadow-xl overflow-hidden border-2 border-emerald-500`}>
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 p-8 text-center text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                    <Heart className="w-12 h-12 text-emerald-200" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tighter">Manevi Tekamül Paneli</h2>
                  <p className="max-w-md mx-auto text-emerald-100 font-medium">
                    Ruhsal gelişiminizi takip edin, hatimlerinizi yönetin ve manevi rehberlik alın.
                  </p>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-emerald-100 bg-emerald-50/30">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-6 h-6 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg">Hatim Takibi</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-gray-600 mb-4">Grup hatimlerinde aldığınız cüzleri buradan güncelleyin.</p>
                      <Button onClick={() => navigate("/manevi-panel")} className="w-full bg-emerald-600 hover:bg-emerald-700">Cüz Seç / Güncelle</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-emerald-100 bg-emerald-50/30">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg">Günün Hadisi</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-xs italic text-emerald-800 mb-4">"Din samimiyettir." (Müslim, İman, 95)</p>
                      <Button onClick={() => navigate("/manevi-panel")} variant="outline" className="w-full border-emerald-600 text-emerald-600">Hadis Arşivi</Button>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-100 bg-emerald-50/30">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Activity className="w-6 h-6 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg">Nefis Analizi</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] mb-1 font-bold text-emerald-700 uppercase">
                          <span>Nefs-i Levvame</span>
                          <span>%45</span>
                        </div>
                        <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{width: '45%'}}></div>
                        </div>
                      </div>
                      <Button onClick={() => navigate("/manevi-panel")} className="w-full bg-emerald-600">Tekamül Testi</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zahiri" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white shadow-xl overflow-hidden border-2 border-purple-500`}>
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-8 text-center text-white relative overflow-hidden">
                 <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                    <Brain className="w-12 h-12 text-purple-200" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tighter">Zahiri Arınma Paneli</h2>
                  <p className="max-w-md mx-auto text-purple-100 font-medium">Bedeninizi ve zihninizi arındırın, rızkınızı bereketlendirin.</p>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="border-purple-100">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-600" />
                          Aktif Arınma Programı
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="p-4 bg-purple-50 rounded-xl mb-4">
                           <p className="font-bold text-purple-900">21 Günlük Karaciğer Detoksu</p>
                           <p className="text-xs text-purple-700">Durum: Devam Ediyor (Gün 4/21)</p>
                        </div>
                        <Button onClick={() => navigate("/zahiri-panel")} className="w-full bg-purple-600">Detayları Gör</Button>
                     </CardContent>
                   </Card>

                   <Card className="border-indigo-100">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-600" />
                          Koruma Kalkanları
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <p className="text-sm text-gray-700 mb-4">Negatif enerjilerden korunmak için aktif yöntemlerinizi yönetin.</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-indigo-100 text-indigo-800">Tuzlu Su</Badge>
                          <Badge className="bg-indigo-100 text-indigo-800">Ayetel Kürsi</Badge>
                          <Badge className="bg-indigo-100 text-indigo-800">Uçucu Yağlar</Badge>
                        </div>
                        <Button onClick={() => navigate("/zahiri-panel")} variant="outline" className="w-full border-indigo-600 text-indigo-600">Ayarları Yönet</Button>
                     </CardContent>
                   </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batini" className="space-y-6">
            <Card className={`${vividTheme.statCard} bg-white shadow-xl overflow-hidden border-2 border-amber-600`}>
              <div className="bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 p-8 text-center text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                    <Sparkles className="w-12 h-12 text-amber-200" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 tracking-tighter text-amber-300">Batıni Sır Paneli</h2>
                  <p className="max-w-md mx-auto text-amber-100 font-medium">Hikmet ehli için derin irfan kapıları ve özel ledünni öğretiler.</p>
                </div>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-900 rounded-3xl border border-amber-500/30 flex flex-col items-center text-center text-white">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                      <Hexagon className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="font-bold mb-2 text-xl text-amber-100">İlm-i Ledün Dersleri</h3>
                    <p className="text-slate-400 mb-6 text-sm">Olayların örüntülerini ve manevi işaretlerini okuma sanatı.</p>
                    <Button onClick={() => navigate("/batini-panel")} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 rounded-2xl">Keşiflere Başla</Button>
                  </div>
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Moon className="w-8 h-8 text-amber-700" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-xl">Rüya Analizi</h3>
                    <p className="text-slate-600 mb-6 text-sm">Gördüğünüz sembollerin batıni anlamlarını Kutbul Zaman rehberliğinde çözün.</p>
                    <Button onClick={() => navigate("/batini-panel")} variant="outline" className="w-full border-amber-700 text-amber-700 font-bold h-12 rounded-2xl">Rüya Tabiri</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Video className="w-7 h-7" />
                  Zoom Eğitimleri
                </CardTitle>
                <p className="text-blue-100">Yaklaşan ve aktif Zoom eğitim oturumlarına tek tıkla katılın</p>
              </CardHeader>
            </Card>

            {trainingsLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-3" />
                <p className="text-gray-600">Eğitimler yükleniyor...</p>
              </div>
            ) : upcomingTrainings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200">
                <CardContent className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Henüz Eğitim Yok</h3>
                  <p className="text-gray-400">Yeni bir Zoom eğitimi planlandığında burada görünecek ve bildirim alacaksınız.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingTrainings.map(training => {
                  const scheduledDate = new Date(training.scheduledAt);
                  const isPast = scheduledDate < new Date();
                  const isHost = training.authorizedHosts?.includes(user?.id);
                  return (
                    <Card key={training.id} className={`border-2 ${isPast ? "border-gray-200 opacity-70" : "border-blue-200 shadow-md hover:shadow-lg transition-shadow"}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{training.title}</CardTitle>
                          <div className="flex flex-col gap-1">
                            {isHost && <Badge className="bg-purple-600 text-white text-xs">🎙️ Eğitimci</Badge>}
                            {isPast ? (
                              <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">Tamamlandı</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Yaklaşıyor</Badge>
                            )}
                          </div>
                        </div>
                        {training.description && <p className="text-sm text-gray-600 mt-1">{training.description}</p>}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>{scheduledDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{scheduledDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} ({training.duration} dk)</span>
                          </div>
                        </div>
                        {training.password && (
                          <div className="flex items-center gap-2 text-sm bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
                            <Lock className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-800 font-medium">Şifre: {training.password}</span>
                          </div>
                        )}
                        <a
                          href={training.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isPast ? "bg-gray-100 text-gray-500 cursor-not-allowed pointer-events-none" : isHost ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"}`}
                        >
                          <Video className="w-4 h-4" />
                          {isHost ? "🎙️ Eğitimci Olarak Katıl" : "🎥 Zoom'a Katıl"}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Team View Modal */}
        <Dialog open={teamViewModalOpen} onOpenChange={setTeamViewModalOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User2 className="w-5 h-5" />
                <span>
                  {selectedMemberForTeamView?.fullName} - Ekip Görünümü
                </span>
              </DialogTitle>
              <DialogDescription>
                {selectedMemberForTeamView?.memberId} üyesinin ekip yapısı ve detayları
              </DialogDescription>
            </DialogHeader>

            {selectedMemberForTeamView && (
              <div className="space-y-6">
                {/* View Mode Toggle */}
                <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 rounded-lg">
                  <Button
                    variant={teamViewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setTeamViewMode('list')}
                    className="flex items-center space-x-2"
                  >
                    <List className="w-4 h-4" />
                    <span>Liste Görünümü</span>
                  </Button>
                  <Button
                    variant={teamViewMode === 'tree' ? 'default' : 'outline'}
                    onClick={() => setTeamViewMode('tree')}
                    className="flex items-center space-x-2"
                  >
                    <TreePine className="w-4 h-4" />
                    <span>Ağaç Görünümü</span>
                  </Button>
                </div>

                {/* Member Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedMemberForTeamView.fullName} - Ekip Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-800">Direkt Üye</p>
                        <p className="text-xl font-bold text-blue-600">
                          {selectedMemberForTeamView.directReferrals}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Network className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-gray-800">Toplam Ekip</p>
                        <p className="text-xl font-bold text-green-600">
                          {memberTeamData.length}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-gray-800">Yatırım</p>
                        <p className="text-xl font-bold text-purple-600">
                          ${selectedMemberForTeamView.totalInvestment}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Award className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-gray-800">Seviye</p>
                        <p className="text-lg font-bold text-orange-600">
                          {selectedMemberForTeamView.careerLevel}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* List View */}
                {teamViewMode === 'list' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <List className="w-5 h-5" />
                        <span>Ekip Listesi ({memberTeamData.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {memberTeamData.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Üye ID</TableHead>
                              <TableHead>İsim</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Seviye</TableHead>
                              <TableHead>Pozisyon</TableHead>
                              <TableHead>Yatırım</TableHead>
                              <TableHead>Durum</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberTeamData.map((teamMember) => (
                              <TableRow key={teamMember.id}>
                                <TableCell className="font-mono">
                                  {teamMember.memberId}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {teamMember.fullName}
                                </TableCell>
                                <TableCell>{teamMember.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {teamMember.careerLevel}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      teamMember.position === "direct"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {teamMember.position === "direct"
                                      ? "Direkt"
                                      : "Monoline Hattı"}
                                  </Badge>
                                </TableCell>
                                <TableCell>${teamMember.totalInvestment}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      teamMember.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {teamMember.isActive ? "Aktif" : "Pasif"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      ) : (
                        <div className="text-center py-8 text-gray-700">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Bu üyenin henüz ekip üyesi bulunmuyor.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tree View */}
                {teamViewMode === 'tree' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TreePine className="w-5 h-5" />
                        <span>💎 Tek Hat Gönül Yolu Görünümü</span>
                      </CardTitle>
                      <CardDescription>
                        {selectedMemberForTeamView.fullName} üyesinin gönül yolu yapısı
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">💎 İrfan Sistemi Gönül Ağı</h4>
                          <div className="text-center space-y-2">
                            <div className="text-lg font-bold text-purple-600">
                              Pozisyon #{Math.floor(Math.random() * 1000) + 1}
                            </div>
                            <div className="text-sm text-gray-800">
                              Tek hat irfan sisteminde sıralı yerleşim
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">{selectedMemberForTeamView.directReferrals || 0}</div>
                            <div className="text-sm text-gray-800">Direkt Referanslar</div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{selectedMemberForTeamView.level || 1}</div>
                            <div className="text-sm text-gray-800">İrfan Seviyesi</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Team Placement Modal */}
        <Dialog open={placementModal} onOpenChange={setPlacementModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Target className="w-6 h-6 text-orange-600" />
                <span>🎯 Takım Yerleştirme</span>
              </DialogTitle>
              <DialogDescription>
                {selectedPlacement && `${selectedPlacement.newUserData.fullName} için takım pozisyonu seçin`}
              </DialogDescription>
            </DialogHeader>

            {selectedPlacement && (
              <div className="space-y-6">
                {/* New Member Info */}
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedPlacement.newUserData.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedPlacement.newUserData.fullName}</h3>
                        <p className="text-sm text-gray-800">{selectedPlacement.newUserData.email}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge variant="outline">📱 {selectedPlacement.newUserData.phone}</Badge>
                          <Badge variant="outline">📦 {selectedPlacement.newUserData.membershipType}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Position Selection */}
                <div>
                  <h3 className="font-semibold mb-4 text-gray-900">📍 Pozisyon Seçenekleri</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Position */}
                    <Card
                      className={cn(
                        "cursor-pointer border-2 transition-colors bg-white",
                        user?.leftChild 
                          ? "opacity-50 cursor-not-allowed border-gray-100" 
                          : "hover:border-purple-400 border-purple-200"
                      )}
                      onClick={() => !user?.leftChild && placeMemberInTeam(selectedPlacement.id, 'left')}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <div className="text-purple-600 font-bold">L</div>
                        </div>
                        <h4 className="font-semibold mb-1">Sol Kol</h4>
                        <p className="text-xs text-gray-800 mb-2">
                          Sponsorun sol hattına yerleştirme
                        </p>
                        <Badge className={user?.leftChild ? "bg-red-100 text-red-900" : "bg-purple-100 text-purple-900"}>
                          {user?.leftChild ? "DOLU" : "✅ MÜSAİT"}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Right Position */}
                    <Card
                      className={cn(
                        "cursor-pointer border-2 transition-colors bg-white",
                        user?.rightChild 
                          ? "opacity-50 cursor-not-allowed border-gray-100" 
                          : "hover:border-green-400 border-gray-200"
                      )}
                      onClick={() => !user?.rightChild && placeMemberInTeam(selectedPlacement.id, 'right')}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <div className="text-green-600 font-bold">R</div>
                        </div>
                        <h4 className="font-semibold mb-1">Sağ Kol</h4>
                        <p className="text-xs text-gray-800 mb-2">
                          Sponsorun sağ hattına yerleştirme
                        </p>
                        <Badge className={user?.rightChild ? "bg-red-100 text-red-900" : "bg-blue-100 text-blue-700"}>
                          {user?.rightChild ? "DOLU" : "✅ MÜSAİT"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>

        <SystemPresentation open={isPresentationOpen} onOpenChange={setIsPresentationOpen} referralCode={user?.referralCode} />

        {/* Contribution Calculator Modal */}
        <Dialog open={isCalculatorsOpen} onOpenChange={setIsCalculatorsOpen}>
          <DialogContent className="sm:max-w-[700px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-600" />
                Ruhsal Gelişim Katkı Payı Hesaplama
              </DialogTitle>
              <DialogDescription>
                Ekip potansiyelinizi ve manevi yatırım getirinizi hesaplayın
              </DialogDescription>
            </DialogHeader>
            <ContributionCalculator />
            <DialogFooter>
              <Button onClick={() => setIsCalculatorsOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generic Guide Modal */}
        <Dialog open={guideModalOpen} onOpenChange={setGuideModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {selectedGuide?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedGuide?.content}
            </div>
            <DialogFooter>
              <Button onClick={() => setGuideModalOpen(false)}>Anladım</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
