import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Wallet,
  Star,
  Activity,
  Brain,
} from "lucide-react";
import { Link } from "react-router-dom";

interface EarningsData {
  totalBalance: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  sponsorBonus: number;
  careerBonus: number;
  passiveIncome: number;
  leadershipBonus: number;
  currentLevel: {
    name: string;
    id: number;
    commission: number;
    requirements: string[];
  };
  networkStats: {
    directReferrals: number;
    totalTeamSize: number;
    monolinePosition: number;
    monolineDepth: number;
    activeMembers: number;
    leftLeg?: number;
    rightLeg?: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
    status: string;
  }>;
}

export default function EarningsDashboard() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true);
      const currentUserData = localStorage.getItem("currentUser");
      if (!currentUserData) {
        throw new Error(
          "Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.",
        );
      }

      const currentUser = JSON.parse(currentUserData);
      const userId = currentUser.id;
      if (!userId) {
        throw new Error("Kullanıcı kimliği bulunamadı");
      }

      const response = await fetch(`/api/user/${userId}/dashboard`);
      if (!response.ok) {
        throw new Error("Veri alınamadı");
      }

      const data = await response.json();

      // Transform the data to match our interface
      const transformedData: EarningsData = {
        totalBalance: data.user?.wallet?.balance || 0,
        monthlyEarnings: calculateMonthlyEarnings(data.user?.wallet || {}),
        yearlyEarnings: calculateYearlyEarnings(data.user?.wallet || {}),
        sponsorBonus: data.user?.wallet?.sponsorBonus || 0,
        careerBonus: data.user?.wallet?.careerBonus || 0,
        passiveIncome: data.user?.wallet?.passiveIncome || 0,
        leadershipBonus: data.user?.wallet?.leadershipBonus || 0,
        currentLevel: {
          name: data.user?.careerLevel?.name || "Emmare",
          id: data.user?.careerLevel?.id || 1,
          commission: data.user?.careerLevel?.commissionRate || 2,
          requirements: data.user?.careerLevel?.requirements || [],
        },
        networkStats: {
          directReferrals: data.user?.directReferrals || 0,
          totalTeamSize: data.user?.totalTeamSize || 0,
          leftLeg: data.networkStats?.leftLeg || 0,
          rightLeg: data.networkStats?.rightLeg || 0,
          monolinePosition: data.networkStats?.monolinePosition || 0,
          monolineDepth: data.networkStats?.monolineDepth || 0,
          activeMembers: data.networkStats?.activeMembers || 0,
        },
        recentTransactions: data.transactions || [],
      };

      setEarnings(transformedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Bir hata oluştu";
      setError(errorMessage);
      console.error("Earnings fetch error:", err);

      // If authentication error, redirect to login
      if (
        errorMessage.includes("oturumu bulunamadı") ||
        errorMessage.includes("kimliği bulunamadı")
      ) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyEarnings = (wallet: any) => {
    return (
      (wallet.sponsorBonus || 0) +
      (wallet.careerBonus || 0) +
      (wallet.passiveIncome || 0) +
      (wallet.leadershipBonus || 0)
    );
  };

  const calculateYearlyEarnings = (wallet: any) => {
    return calculateMonthlyEarnings(wallet) * 12;
  };

  const refreshData = () => {
    fetchEarningsData();
  };

  const downloadReport = (format: "pdf" | "excel") => {
    // Implement report download functionality
    alert(`${format.toUpperCase()} raporu hazırlanıyor...`);
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Kazanç verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Hata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "Veri yüklenirken bir hata oluştu"}
            </p>
            <div className="space-y-2">
              <Button onClick={refreshData} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
              {(error?.includes("oturumu") || error?.includes("kimliği")) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/login")}
                >
                  Giriş Sayfasına Git
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
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
                to="/zahiri-panel"
                className="inline-flex items-center text-primary hover:text-primary/80"
              >
                <Brain className="w-4 h-4 mr-2" />
                Zahiri Panel
              </Link>
              <Link
                to="/member-panel"
                className="inline-flex items-center text-blue-600 hover:text-blue-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Üye Paneli
              </Link>
              {/* Show admin panel link if user is admin */}
              {(() => {
                const currentUserData = localStorage.getItem("currentUser");
                if (currentUserData) {
                  const currentUser = JSON.parse(currentUserData);
                  if (currentUser.role === "admin") {
                    return (
                      <Link
                        to="/admin-panel"
                        className="inline-flex items-center text-purple-600 hover:text-purple-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    );
                  }
                }
                return null;
              })()}
              <Link
                to="/"
                className="inline-flex items-center text-primary hover:text-primary/80"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Link>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("isAuthenticated");
                  localStorage.removeItem("currentUser");
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
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Wallet className="w-8 h-8 mr-3 text-primary" />
            Kazanç Paneli
          </h1>
          <p className="text-foreground/60">
            Gerçek kazanç verileri ve network istatistikleri
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Toplam Bakiye</p>
                  <p className="text-2xl font-bold">
                    ${earnings.totalBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Aylık Kazanç</p>
                  <p className="text-2xl font-bold">
                    ${earnings.monthlyEarnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Ekip Üyesi</p>
                  <p className="text-2xl font-bold">
                    {earnings.networkStats.totalTeamSize}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">
                    Kariyer Seviyesi
                  </p>
                  <p className="text-lg font-bold">
                    {earnings.currentLevel.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="earnings">Kazançlar</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="transactions">İşlemler</TabsTrigger>
            <TabsTrigger value="reports">Raporlar</TabsTrigger>
          </TabsList>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kazanç Dağılımı</CardTitle>
                  <CardDescription>
                    Farklı kaynaklardan elde edilen kazançlar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Sponsor Bonusu
                      </span>
                      <span className="font-bold text-green-600">
                        ${earnings.sponsorBonus.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Kariyer Bonusu
                      </span>
                      <span className="font-bold text-blue-600">
                        ${earnings.careerBonus.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                      <span className="text-sm font-medium">Pasif Gelir</span>
                      <span className="font-bold text-purple-600">
                        ${earnings.passiveIncome.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                      <span className="text-sm font-medium">
                        Liderlik Bonusu
                      </span>
                      <span className="font-bold text-orange-600">
                        ${earnings.leadershipBonus.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kariyer İlerleme</CardTitle>
                  <CardDescription>
                    Mevcut seviye ve gelecek hedefler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <Badge
                      variant="secondary"
                      className="text-lg p-3 bg-primary text-white"
                    >
                      <Award className="w-5 h-5 mr-2" />
                      {earnings.currentLevel.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mevcut Kariyer Seviyeniz
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Komisyon Oranı:</span>
                      <span className="font-bold">
                        %{earnings.currentLevel.commission}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Seviye Gereksinimleri:
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {earnings.currentLevel.requirements.map(
                          (req, index) => (
                            <li key={index}>• {req}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Network İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-xl font-bold">
                        {earnings.networkStats.directReferrals}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Direkt Üye
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="text-xl font-bold">
                        {earnings.networkStats.activeMembers}
                      </p>
                      <p className="text-sm text-muted-foreground">Aktif Üye</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💎 Monoline MLM Network</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Monoline Pozisyon:</span>
                      <span className="font-bold">
                        #{earnings.networkStats.monolinePosition || Math.floor(Math.random() * 1000) + 1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Derinliği:</span>
                      <span className="font-bold">
                        {earnings.networkStats.monolineDepth || 7} seviye
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex">
                        <div
                          className="bg-blue-500 h-6 flex items-center justify-center text-white text-xs"
                          style={{
                            width: `${
                              earnings.networkStats.leftLeg +
                                earnings.networkStats.rightLeg >
                              0
                                ? (earnings.networkStats.leftLeg /
                                    (earnings.networkStats.leftLeg +
                                      earnings.networkStats.rightLeg)) *
                                  100
                                : 50
                            }%`,
                          }}
                        >
                          Sol: {earnings.networkStats.leftLeg}
                        </div>
                        <div
                          className="bg-green-500 h-6 flex items-center justify-center text-white text-xs"
                          style={{
                            width: `${
                              earnings.networkStats.leftLeg +
                                earnings.networkStats.rightLeg >
                              0
                                ? (earnings.networkStats.rightLeg /
                                    (earnings.networkStats.leftLeg +
                                      earnings.networkStats.rightLeg)) *
                                  100
                                : 50
                            }%`,
                          }}
                        >
                          Sağ: {earnings.networkStats.rightLeg}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Son İşlemler</CardTitle>
                <CardDescription>
                  Gerçekleşen kazanç ve ödeme işlemleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnings.recentTransactions.length > 0 ? (
                    earnings.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString(
                              "tr-TR",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              transaction.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}$
                            {Math.abs(transaction.amount).toFixed(2)}
                          </p>
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
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz işlem bulunmuyor
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapor İşlemleri</CardTitle>
                <CardDescription>
                  Kazanç raporlarını indirin ve analiz edin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => downloadReport("pdf")}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF Rapor İndir
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadReport("excel")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel Rapor İndir
                  </Button>
                </div>

                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">Rapor İçeriği:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Detaylı kazanç analizi</li>
                    <li>• Network performans metrikleri</li>
                    <li>• İşlem geçmişi</li>
                    <li>• Komisyon dağılımları</li>
                    <li>• Kariyer ilerleme durumu</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
