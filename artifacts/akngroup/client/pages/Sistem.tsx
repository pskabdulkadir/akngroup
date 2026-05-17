import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Network,
  Plus,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  CreditCard,
  Wallet,
  Award,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demonstration
const mockMembers = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    level: "Mülhime",
    directReferrals: 6,
    totalTeam: 25,
    totalInvestment: 2500,
    commission: 450,
    status: "active",
    joinDate: "2024-01-15",
    leftLeg: 12,
    rightLeg: 13,
  },
  {
    id: 2,
    name: "Fatma Öztürk",
    email: "fatma@example.com",
    level: "Levvame",
    directReferrals: 3,
    totalTeam: 8,
    totalInvestment: 800,
    commission: 120,
    status: "active",
    joinDate: "2024-02-20",
    leftLeg: 4,
    rightLeg: 4,
  },
  {
    id: 3,
    name: "Mehmet Demir",
    email: "mehmet@example.com",
    level: "Emmare",
    directReferrals: 1,
    totalTeam: 3,
    totalInvestment: 300,
    commission: 45,
    status: "passive",
    joinDate: "2024-03-10",
    leftLeg: 1,
    rightLeg: 2,
  },
];

const mockPayments = [
  {
    id: 1,
    member: "Ahmet Yılmaz",
    type: "deposit",
    amount: 500,
    status: "completed",
    date: "2024-12-15",
    method: "Bank Transfer",
  },
  {
    id: 2,
    member: "Fatma Öztürk",
    type: "withdrawal",
    amount: 200,
    status: "pending",
    date: "2024-12-14",
    method: "Bank Transfer",
  },
  {
    id: 3,
    member: "Mehmet Demir",
    type: "deposit",
    amount: 100,
    status: "rejected",
    date: "2024-12-13",
    method: "Bank Transfer",
  },
];

const careerLevels = [
  { name: "Emmare", minInvestment: 0, commission: 2, passive: 0 },
  { name: "Levvame", minInvestment: 500, commission: 3, passive: 0.5 },
  { name: "Mülhime", minInvestment: 1500, commission: 4, passive: 1 },
  { name: "Mutmainne", minInvestment: 3000, commission: 5, passive: 1.5 },
  { name: "Râziye", minInvestment: 5000, commission: 6, passive: 2 },
  { name: "Mardiyye", minInvestment: 10000, commission: 8, passive: 3 },
  { name: "Safiye", minInvestment: 25000, commission: 12, passive: 4 },
];

export default function Sistem() {
  const [selectedMember, setSelectedMember] = useState(mockMembers[0]);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    sponsor: "",
    package: "",
  });
  const [commissionSettings, setCommissionSettings] = useState({
    sponsorBonus: 10,
    careerBonus: 25,
    passiveIncome: 5,
    systemFund: 60,
  });

  const calculateCommissions = (investment: number) => {
    return {
      sponsor: (investment * commissionSettings.sponsorBonus) / 100,
      career: (investment * commissionSettings.careerBonus) / 100,
      passive: (investment * commissionSettings.passiveIncome) / 100,
      system: (investment * commissionSettings.systemFund) / 100,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "passive":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelColor = (level: string) => {
    const levelIndex = careerLevels.findIndex((l) => l.name === level);
    const colors = [
      "bg-gray-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-purple-500",
    ];
    return colors[levelIndex] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Kutbul Zaman
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Ana Sayfa
              </Link>
              <Link
                to="/manevi-panel"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Manevi Panel
              </Link>
              <Link
                to="/zahiri-panel"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Zahiri Panel
              </Link>
              <Link
                to="/batini-panel"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Batıni Panel
              </Link>
              <Link
                to="/products"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                🛍️ Ürünler
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("isAuthenticated");
                  localStorage.removeItem("userEmail");
                  window.location.href = "/";
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
          <h1 className="text-3xl font-bold mb-2">Sistem Yönetim Paneli</h1>
          <p className="text-foreground/60">
            Ruhsal Gelişim sistemi, üyeler ve komisyon yönetimi
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="flex w-max lg:w-full h-auto p-1 bg-white/10 rounded-xl backdrop-blur-md">
              <TabsTrigger value="dashboard" className="px-4 py-2 whitespace-nowrap">Dashboard</TabsTrigger>
              <TabsTrigger value="members" className="px-4 py-2 whitespace-nowrap">Üyeler</TabsTrigger>
              <TabsTrigger value="network" className="px-4 py-2 whitespace-nowrap">Ruhsal Gelişim Ağı</TabsTrigger>
              <TabsTrigger value="commissions" className="px-4 py-2 whitespace-nowrap">Komisyonlar</TabsTrigger>
              <TabsTrigger value="payments" className="px-4 py-2 whitespace-nowrap">Ödemeler</TabsTrigger>
              <TabsTrigger value="settings" className="px-4 py-2 whitespace-nowrap">Ayarlar</TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Üyeler
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    +12% geçen aydan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Aylık Gelir
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231</div>
                  <p className="text-xs text-muted-foreground">
                    +20% geçen aydan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Aktif Üyeler
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">892</div>
                  <p className="text-xs text-muted-foreground">
                    +8% geçen aydan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ruhsal Gelişim Derinliği
                  </CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">
                    Maksimum seviye
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kariyer Seviye Dağılımı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {careerLevels.map((level, index) => (
                    <div key={level.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{level.name}</span>
                        <span>{Math.floor(Math.random() * 200) + 50} üye</span>
                      </div>
                      <Progress value={Math.random() * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Son İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPayments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{payment.member}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.type === "deposit" ? "Yatırım" : "Çekim"} •{" "}
                            {payment.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${payment.amount}</p>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(payment.status)}
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Üye Yönetimi</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Üye Ekle
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Üye Listesi</CardTitle>
                <CardDescription>
                  Sistem içindeki tüm üyeleri yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant="secondary"
                          className={getLevelColor(member.level)}
                        >
                          {member.level}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {member.directReferrals} direkt
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.totalTeam} toplam ekip
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gönül Ağı Tab */}
          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ruhsal Gelişim Ağı Görselleştirme</CardTitle>
                <CardDescription>
                  Sol ve sağ kol Ruhsal Gelişim Ağı yapısını görüntüleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto pb-4">
                  <div className="min-w-[600px] flex flex-col items-center">
                    {/* Root Node */}
                    <div className="flex justify-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        CEO
                      </div>
                    </div>

                    {/* Level 1 */}
                    <div className="grid grid-cols-2 gap-16 md:gap-32 mb-8 w-full max-w-md relative">
                      {/* Connection Lines (Visual aid) */}
                      <div className="absolute top-[-32px] left-1/2 w-px h-8 bg-border"></div>
                      
                      <div className="text-center relative">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-md">
                            A
                          </div>
                          <p className="text-xs font-semibold">Sol Bacak</p>
                          <p className="text-[10px] opacity-70">456 üye</p>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-md">
                            B
                          </div>
                          <p className="text-xs font-semibold">Sağ Bacak</p>
                          <p className="text-[10px] opacity-70">423 üye</p>
                        </div>
                      </div>
                    </div>

                    {/* Level 2 */}
                    <div className="grid grid-cols-4 gap-4 md:gap-16 w-full max-w-xl">
                      {['C', 'D', 'E', 'F'].map((node, idx) => (
                        <div key={node} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm bg-${idx % 2 === 0 ? 'yellow-500' : 'orange-500'}`}>
                            {node}
                          </div>
                          <div className="mt-1 h-2 w-px bg-border/50"></div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 text-center text-[11px] text-muted-foreground italic">
                      Ruhsal Gelişim Ağı 7 seviye derinliğinde devam ediyor...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sol Bacak İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Toplam Üye:</span>
                      <span className="font-bold">456</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aktif Üye:</span>
                      <span className="font-bold">312</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toplam Yatırım:</span>
                      <span className="font-bold">$23,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aylık Üretim:</span>
                      <span className="font-bold">$4,680</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sağ Bacak İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Toplam Üye:</span>
                      <span className="font-bold">423</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aktif Üye:</span>
                      <span className="font-bold">298</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toplam Yatırım:</span>
                      <span className="font-bold">$21,890</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aylık Üretim:</span>
                      <span className="font-bold">$4,320</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Komisyon Hesaplamaları</CardTitle>
                <CardDescription>
                  Sistem komisyon dağılımı ve hesaplamaları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">
                      Komisyon Oranları (Her $100 yatırım için)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Sponsor Bonusu:</span>
                        <span className="font-bold text-green-600">
                          %{commissionSettings.sponsorBonus}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Kariyer Bonusu:</span>
                        <span className="font-bold text-blue-600">
                          %{commissionSettings.careerBonus}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Pasif Gelir:</span>
                        <span className="font-bold text-purple-600">
                          %{commissionSettings.passiveIncome}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Sistem Fonu:</span>
                        <span className="font-bold text-orange-600">
                          %{commissionSettings.systemFund}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Örnek Hesaplama</h3>
                    <div className="space-y-3">
                      <Label htmlFor="investment">Yatırım Tutarı ($)</Label>
                      <Input
                        id="investment"
                        type="number"
                        placeholder="1000"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const calc = calculateCommissions(value);
                          console.log(calc);
                        }}
                      />
                      <div className="mt-4 space-y-2 text-sm">
                        <p>Sponsor: $100 (10%)</p>
                        <p>Kariyer: $250 (25%)</p>
                        <p>Pasif: $50 (5%)</p>
                        <p>Sistem: $600 (60%)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Toplam Komisyon Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">$12,450</p>
                    <p className="text-sm text-muted-foreground">
                      Sponsor Bonusları
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">$31,125</p>
                    <p className="text-sm text-muted-foreground">
                      Kariyer Bonusları
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">$6,225</p>
                    <p className="text-sm text-muted-foreground">Pasif Gelir</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold">$74,700</p>
                    <p className="text-sm text-muted-foreground">Sistem Fonu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Yönetimi</CardTitle>
                <CardDescription>
                  Yatırım ve çekim işlemlerini yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center">
                          {payment.type === "deposit" ? (
                            <Upload className="w-5 h-5 text-white" />
                          ) : (
                            <Download className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{payment.member}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.type === "deposit" ? "Yatırım" : "Çekim"} •{" "}
                            {payment.method} • {payment.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">${payment.amount}</p>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(payment.status)}
                          >
                            {payment.status === "completed" && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {payment.status === "pending" && (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {payment.status === "rejected" && (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          {payment.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline">
                                Onayla
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reddet
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Toplam Yatırımlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    $124,500
                  </div>
                  <p className="text-sm text-muted-foreground">Bu ay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toplam Çekimler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">$45,230</div>
                  <p className="text-sm text-muted-foreground">Bu ay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bekleyen İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">12</div>
                  <p className="text-sm text-muted-foreground">
                    İnceleme bekliyor
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>
                  Ruhsal Gelişim sistemi ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Komisyon Oranları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sponsor-bonus">Sponsor Bonus (%)</Label>
                      <Input
                        id="sponsor-bonus"
                        type="number"
                        value={commissionSettings.sponsorBonus}
                        onChange={(e) =>
                          setCommissionSettings({
                            ...commissionSettings,
                            sponsorBonus: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="career-bonus">Kariyer Bonus (%)</Label>
                      <Input
                        id="career-bonus"
                        type="number"
                        value={commissionSettings.careerBonus}
                        onChange={(e) =>
                          setCommissionSettings({
                            ...commissionSettings,
                            careerBonus: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="passive-income">Pasif Gelir (%)</Label>
                      <Input
                        id="passive-income"
                        type="number"
                        value={commissionSettings.passiveIncome}
                        onChange={(e) =>
                          setCommissionSettings({
                            ...commissionSettings,
                            passiveIncome: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="system-fund">Sistem Fonu (%)</Label>
                      <Input
                        id="system-fund"
                        type="number"
                        value={commissionSettings.systemFund}
                        onChange={(e) =>
                          setCommissionSettings({
                            ...commissionSettings,
                            systemFund: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">İkili Denge Sistemi Ayarları</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="placement-algorithm">
                        Yerleştirme Algoritması
                      </Label>
                      <Select defaultValue="weak-leg">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weak-leg">Zayıf Bacağa</SelectItem>
                          <SelectItem value="strong-leg">
                            Güçlü Bacağa
                          </SelectItem>
                          <SelectItem value="balanced">Dengeli</SelectItem>
                          <SelectItem value="random">Rastgele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="max-depth">
                        Maksimum Gönül Ağı Derinliği
                      </Label>
                      <Input
                        id="max-depth"
                        type="number"
                        defaultValue="7"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button>Ayarları Kaydet</Button>
                  <Button variant="outline">Varsayılana Döndür</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
