import { useState, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import {
  Crown,
  ArrowLeft,
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Settings,
  Info,
  Zap,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

// Kariyer seviyeleri ve gereksinimleri
const careerLevels = [
  {
    name: "Emmare",
    minInvestment: 0,
    minDirects: 0,
    commission: 2,
    passive: 0,
    bonus: 0,
  },
  {
    name: "Levvame",
    minInvestment: 500,
    minDirects: 2,
    commission: 3,
    passive: 0.5,
    bonus: 50,
  },
  {
    name: "Mülhime",
    minInvestment: 1500,
    minDirects: 4,
    commission: 4,
    passive: 1,
    bonus: 150,
  },
  {
    name: "Mutmainne",
    minInvestment: 3000,
    minDirects: 10,
    commission: 5,
    passive: 1.5,
    bonus: 300,
  },
  {
    name: "Râziye",
    minInvestment: 5000,
    minDirects: 2,
    commission: 6,
    passive: 2,
    bonus: 500,
    leaderRequired: true,
  },
  {
    name: "Mardiyye",
    minInvestment: 10000,
    minDirects: 50,
    commission: 8,
    passive: 3,
    bonus: 1000,
  },
  {
    name: "Safiye",
    minInvestment: 25000,
    minDirects: 3,
    commission: 12,
    passive: 4,
    bonus: 2500,
    leaderRequired: true,
  },
];

// Komisyon oranları
const commissionRates = {
  sponsor: 10, // %
  career: 25, // %
  passive: 5, // %
  system: 60, // %
};

export default function Simulasyon() {
  // Form verileri
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [directTeamSize, setDirectTeamSize] = useState(5);
  const [totalTeamSize, setTotalTeamSize] = useState(25);
  const [monthlyActivity, setMonthlyActivity] = useState(20);
  const [yearlyMembers, setYearlyMembers] = useState(100);
  const [leftLegSize, setLeftLegSize] = useState(12);
  const [rightLegSize, setRightLegSize] = useState(13);

  // Hesaplanmış veriler
  const [currentLevel, setCurrentLevel] = useState(0);
  const [projectedEarnings, setProjectedEarnings] = useState({
    monthly: 0,
    yearly: 0,
    sponsor: 0,
    career: 0,
    passive: 0,
    levelBonus: 0,
  });

  // Admin test modu
  const [testMode, setTestMode] = useState(false);
  const [testScenarios, setTestScenarios] = useState([]);

  // Mevcut seviyeyi hesapla
  const calculateCurrentLevel = () => {
    let level = 0;
    for (let i = 0; i < careerLevels.length; i++) {
      const levelReq = careerLevels[i];
      if (
        investmentAmount >= levelReq.minInvestment &&
        directTeamSize >= levelReq.minDirects
      ) {
        level = i;
      } else {
        break;
      }
    }
    setCurrentLevel(level);
    return level;
  };

  // Komisyon hesaplamaları
  const calculateCommissions = () => {
    const level = calculateCurrentLevel();
    const levelData = careerLevels[level];

    // Sponsor bonusu (direkt yönlendirmeler için)
    const sponsorBonus =
      (directTeamSize * monthlyActivity * commissionRates.sponsor) / 100;

    // Kariyer bonusu (seviye bazlı)
    const careerBonus =
      (investmentAmount * levelData.commission) / 100 + (levelData.bonus || 0);

    // Pasif gelir (alt üyelerden)
    const passiveIncome =
      (totalTeamSize * monthlyActivity * levelData.passive) / 100;

    // Aylık toplam
    const monthlyTotal = sponsorBonus + careerBonus + passiveIncome;

    // Yıllık projeksiyon
    const yearlyTotal = monthlyTotal * 12;

    setProjectedEarnings({
      monthly: monthlyTotal,
      yearly: yearlyTotal,
      sponsor: sponsorBonus,
      career: careerBonus,
      passive: passiveIncome,
      levelBonus: levelData.bonus || 0,
    });
  };

  // Rastgele test senaryosu oluştur
  const generateRandomScenario = () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: uniqueId,
      name: `Test Senaryosu ${Math.floor(Math.random() * 1000)}`,
      investment: Math.floor(Math.random() * 50000) + 1000,
      directs: Math.floor(Math.random() * 100) + 1,
      totalTeam: Math.floor(Math.random() * 500) + 10,
      monthlyActivity: Math.floor(Math.random() * 100) + 20,
    };
  };

  // Test senaryosu uygula
  const applyTestScenario = (scenario) => {
    setInvestmentAmount(scenario.investment);
    setDirectTeamSize(scenario.directs);
    setTotalTeamSize(scenario.totalTeam);
    setMonthlyActivity(scenario.monthlyActivity);
  };

  // Parametreleri sıfırla
  const resetParameters = () => {
    setInvestmentAmount(1000);
    setDirectTeamSize(5);
    setTotalTeamSize(25);
    setMonthlyActivity(20);
    setYearlyMembers(100);
    setLeftLegSize(12);
    setRightLegSize(13);
  };

  // Sonraki seviye için gerekli şartları hesapla
  const getNextLevelRequirements = () => {
    if (currentLevel >= careerLevels.length - 1) return null;

    const nextLevel = careerLevels[currentLevel + 1];
    return {
      name: nextLevel.name,
      investmentNeeded: Math.max(0, nextLevel.minInvestment - investmentAmount),
      directsNeeded: Math.max(0, nextLevel.minDirects - directTeamSize),
    };
  };

  // Binary network dengesini hesapla
  const calculateNetworkBalance = () => {
    const total = leftLegSize + rightLegSize;
    const balance = Math.abs(leftLegSize - rightLegSize);
    const balancePercentage = total > 0 ? (balance / total) * 100 : 0;
    return {
      total,
      balance,
      balancePercentage,
      isBalanced: balancePercentage < 20, // %20'den az fark varsa dengeli
    };
  };

  // Effect hook'ları
  useEffect(() => {
    calculateCommissions();
  }, [
    investmentAmount,
    directTeamSize,
    totalTeamSize,
    monthlyActivity,
    currentLevel,
  ]);

  useEffect(() => {
    if (testMode) {
      const scenarios = Array.from({ length: 5 }, () =>
        generateRandomScenario(),
      );
      setTestScenarios(scenarios);
    }
  }, [testMode]);

  const networkBalance = calculateNetworkBalance();
  const nextLevelReq = getNextLevelRequirements();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
                className="inline-flex items-center text-primary hover:text-primary/80"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestMode(!testMode)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {testMode ? "Normal Mod" : "Test Modu"}
              </Button>
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
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-primary" />
            Kazanç Simülasyonu
          </h1>
          <p className="text-foreground/60">
            MLM sistemi kazanç hesaplamaları ve kariyer projeksiyonları
          </p>
        </div>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="calculator">Hesaplayıcı</TabsTrigger>
            <TabsTrigger value="projections">Projeksiyonlar</TabsTrigger>
            <TabsTrigger value="network">Network Analiz</TabsTrigger>
            <TabsTrigger value="scenarios">Senaryolar</TabsTrigger>
          </TabsList>

          {/* Hesaplayıcı Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parametreler */}
              <Card>
                <CardHeader>
                  <CardTitle>Simülasyon Parametreleri</CardTitle>
                  <CardDescription>
                    Yatırım ve ekip bilgilerinizi girin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="investment">
                      Toplam Yatırım Tutarı ($)
                    </Label>
                    <div className="px-2">
                      <Slider
                        value={[investmentAmount]}
                        onValueChange={(value) => setInvestmentAmount(value[0])}
                        max={50000}
                        min={100}
                        step={100}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>$100</span>
                      <span className="font-bold text-primary">
                        ${investmentAmount.toLocaleString()}
                      </span>
                      <span>$50,000</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directs">Direkt Ekip Üye Sayısı</Label>
                    <Input
                      id="directs"
                      type="number"
                      value={directTeamSize}
                      onChange={(e) =>
                        setDirectTeamSize(parseInt(e.target.value) || 0)
                      }
                      min="0"
                      max="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total-team">Toplam Ekip Üye Sayısı</Label>
                    <Input
                      id="total-team"
                      type="number"
                      value={totalTeamSize}
                      onChange={(e) =>
                        setTotalTeamSize(parseInt(e.target.value) || 0)
                      }
                      min="0"
                      max="10000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly">Aylık Aktivite ($)</Label>
                    <Input
                      id="monthly"
                      type="number"
                      value={monthlyActivity}
                      onChange={(e) =>
                        setMonthlyActivity(parseInt(e.target.value) || 0)
                      }
                      min="0"
                      max="10000"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={calculateCommissions}>
                      <Calculator className="w-4 h-4 mr-2" />
                      Hesapla
                    </Button>
                    <Button variant="outline" onClick={resetParameters}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sıfırla
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sonuçlar */}
              <Card>
                <CardHeader>
                  <CardTitle>Hesaplama Sonuçları</CardTitle>
                  <CardDescription>
                    Tahmini kazanç ve kariyer projeksiyonları
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mevcut Seviye */}
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className={`text-lg p-3 ${
                        careerLevels[currentLevel]?.name === "Safiye"
                          ? "bg-purple-500 text-white"
                          : "bg-primary text-white"
                      }`}
                    >
                      <Award className="w-5 h-5 mr-2" />
                      {careerLevels[currentLevel]?.name || "Hesaplanıyor..."}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Mevcut Kariyer Seviyeniz
                    </p>
                  </div>

                  {/* Kazanç Detayları */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="text-xl font-bold">
                          ${projectedEarnings.monthly.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Aylık</p>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-xl font-bold">
                          ${projectedEarnings.yearly.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Yıllık</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Sponsor Bonusu:</span>
                        <span className="font-bold text-green-600">
                          ${projectedEarnings.sponsor.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Kariyer Bonusu:</span>
                        <span className="font-bold text-blue-600">
                          ${projectedEarnings.career.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm">Pasif Gelir:</span>
                        <span className="font-bold text-purple-600">
                          ${projectedEarnings.passive.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sonraki Seviye */}
                  {nextLevelReq && (
                    <div className="mt-4 p-4 border border-yellow-500/50 rounded-lg bg-yellow-500/10">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Sonraki Seviye: {nextLevelReq.name}
                      </h4>
                      <div className="text-sm space-y-1">
                        {nextLevelReq.investmentNeeded > 0 && (
                          <p>• ${nextLevelReq.investmentNeeded} daha yatırım</p>
                        )}
                        {nextLevelReq.directsNeeded > 0 && (
                          <p>• {nextLevelReq.directsNeeded} daha direkt üye</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Komisyon Dağılımı */}
            <Card>
              <CardHeader>
                <CardTitle>Komisyon Dağılım Analizi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <PieChart className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-bold">
                      %{commissionRates.sponsor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sponsor Bonus
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-lg font-bold">
                      %{commissionRates.career}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Kariyer Bonus
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-lg font-bold">
                      %{commissionRates.passive}
                    </p>
                    <p className="text-sm text-muted-foreground">Pasif Gelir</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-lg font-bold">
                      %{commissionRates.system}
                    </p>
                    <p className="text-sm text-muted-foreground">Sistem Fonu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projeksiyonlar Tab */}
          <TabsContent value="projections" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Kazanç Projeksiyonu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const growth = Math.pow(1.05, i); // %5 aylık büyüme
                      const monthlyEarning = projectedEarnings.monthly * growth;
                      return (
                        <div
                          key={month}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>{month}. Ay</span>
                          <span className="font-bold">
                            ${monthlyEarning.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kariyer İlerleme Tahmini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {careerLevels.map((level, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          index === currentLevel
                            ? "border-primary bg-primary/10"
                            : index < currentLevel
                              ? "border-green-500 bg-green-500/10"
                              : "border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{level.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Min. ${level.minInvestment} • {level.minDirects}{" "}
                              direkt
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">%{level.commission}</p>
                            <p className="text-sm text-muted-foreground">
                              komisyon
                            </p>
                          </div>
                        </div>
                        {index === currentLevel && (
                          <Badge variant="default" className="mt-2">
                            Mevcut Seviye
                          </Badge>
                        )}
                        {index < currentLevel && (
                          <Badge
                            variant="secondary"
                            className="mt-2 bg-green-500"
                          >
                            Tamamlandı
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Network Analiz Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Binary Network Dengesi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="left-leg">Sol Bacak Üye Sayısı</Label>
                      <Input
                        id="left-leg"
                        type="number"
                        value={leftLegSize}
                        onChange={(e) =>
                          setLeftLegSize(parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="right-leg">Sağ Bacak Üye Sayısı</Label>
                      <Input
                        id="right-leg"
                        type="number"
                        value={rightLegSize}
                        onChange={(e) =>
                          setRightLegSize(parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Toplam Network:</span>
                      <span className="font-bold">{networkBalance.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dengesizlik:</span>
                      <span className="font-bold">
                        {networkBalance.balance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denge Durumu:</span>
                      <Badge
                        variant={
                          networkBalance.isBalanced ? "default" : "destructive"
                        }
                      >
                        {networkBalance.isBalanced ? "Dengeli" : "Dengesiz"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm">Sol/Sağ Dağılım</Label>
                    <div className="flex mt-2">
                      <div
                        className="bg-blue-500 h-6 flex items-center justify-center text-white text-xs"
                        style={{
                          width: `${
                            networkBalance.total > 0
                              ? (leftLegSize / networkBalance.total) * 100
                              : 50
                          }%`,
                        }}
                      >
                        Sol: {leftLegSize}
                      </div>
                      <div
                        className="bg-green-500 h-6 flex items-center justify-center text-white text-xs"
                        style={{
                          width: `${
                            networkBalance.total > 0
                              ? (rightLegSize / networkBalance.total) * 100
                              : 50
                          }%`,
                        }}
                      >
                        Sağ: {rightLegSize}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Optimizasyon Önerileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {networkBalance.isBalanced ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Star className="w-5 h-5" />
                        <span>Network dengeniz optimal seviyede!</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <Info className="w-5 h-5" />
                          <span>Network dengenizi optimize edebilirsiniz</span>
                        </div>
                        {leftLegSize > rightLegSize ? (
                          <p className="text-sm">
                            Sağ bacağınıza daha fazla üye yönlendirin. İdeal
                            hedef: {Math.ceil((leftLegSize - rightLegSize) / 2)}{" "}
                            üye
                          </p>
                        ) : (
                          <p className="text-sm">
                            Sol bacağınıza daha fazla üye yönlendirin. İdeal
                            hedef: {Math.ceil((rightLegSize - leftLegSize) / 2)}{" "}
                            üye
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-6 space-y-2 text-sm">
                      <h4 className="font-medium">Optimizasyon İpuçları:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Zayıf bacağa yeni üyeleri yönlendirin</li>
                        <li>• Binary sistemde denge komisyon artırır</li>
                        <li>• Her iki bacağı da aktif tutun</li>
                        <li>
                          • Derinliği artırmak yerine genişlik odaklı olun
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Senaryolar Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            {testMode ? (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Test Modu</CardTitle>
                  <CardDescription>
                    Rastgele senaryolarla sistemi test edin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Test Senaryoları</h3>
                      <Button
                        onClick={() =>
                          setTestScenarios(
                            Array.from({ length: 5 }, () =>
                              generateRandomScenario(),
                            ),
                          )
                        }
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Yeni Senaryolar
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {testScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{scenario.name}</h4>
                              <div className="text-sm text-muted-foreground mt-1">
                                <p>Yatırım: ${scenario.investment}</p>
                                <p>Direkt: {scenario.directs} üye</p>
                                <p>Toplam: {scenario.totalTeam} üye</p>
                                <p>Aylık: ${scenario.monthlyActivity}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => applyTestScenario(scenario)}
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Uygula
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Özel Senaryolar</CardTitle>
                  <CardDescription>
                    Farklı durumlar için kazanç projeksiyonları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Konservatif Senaryo</h3>
                      <div className="text-sm space-y-2">
                        <p>• $1,000 yatırım</p>
                        <p>• 3 direkt üye</p>
                        <p>• $50 aylık aktivite</p>
                        <p className="font-bold text-green-600">
                          Tahmini aylık: $75
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Agresif Senaryo</h3>
                      <div className="text-sm space-y-2">
                        <p>• $10,000 yatırım</p>
                        <p>• 20 direkt üye</p>
                        <p>• $500 aylık aktivite</p>
                        <p className="font-bold text-green-600">
                          Tahmini aylık: $2,850
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">İdeal Senaryo</h3>
                      <div className="text-sm space-y-2">
                        <p>• $25,000 yatırım</p>
                        <p>• 50 direkt üye</p>
                        <p>• $1,000 aylık aktivite</p>
                        <p className="font-bold text-green-600">
                          Tahmini aylık: $8,500
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Maksimum Senaryo</h3>
                      <div className="text-sm space-y-2">
                        <p>• $50,000 yatırım</p>
                        <p>• 100 direkt üye</p>
                        <p>• $2,000 aylık aktivite</p>
                        <p className="font-bold text-green-600">
                          Tahmini aylık: $18,600
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Rapor İşlemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    PDF İndir
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Excel İndir
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Raporu Yenile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
