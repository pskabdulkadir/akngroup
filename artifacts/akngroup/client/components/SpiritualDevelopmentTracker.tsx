import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Sparkles,
  Star,
  Crown,
  Heart,
  Moon,
  Sun,
  Mountain,
  Compass,
  Target,
  TrendingUp,
  Award,
  Book,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface SpiritualLevel {
  id: number;
  name: string;
  description: string;
  spiritualGoals: string[];
  financialTargets: {
    minInvestment: number;
    minDirectReferrals: number;
    minTeamSize: number;
  };
  rewards: string[];
  color: string;
  icon: React.ComponentType<any>;
}

// Yatırım miktarını manevi puana dönüştürme oranı
const INVESTMENT_TO_POINTS_RATIO = 10;

interface SpiritualProgress {
  currentLevel: number;
  spiritualPoints: number;
  completedGoals: string[];
  dailyPractices: {
    prayer: number;
    meditation: number;
    charity: number;
    learning: number;
  };
  weeklyGoals: {
    [key: string]: boolean;
  };
  binaryNetworkContribution: {
    leftLegGrowth: number;
    rightLegGrowth: number;
    balanceBonus: number;
  };
}

const SPIRITUAL_LEVELS: SpiritualLevel[] = [
  {
    id: 1,
    name: "Nefs-i Emmare",
    description: "Kötülüğü emreden nefis - Başlangıç yolculuğu",
    spiritualGoals: [
      "Günde 5 vakit namaz",
      "Sabah zikri",
      "Kuran okuma",
      "Nefis muhasebesi",
    ],
    financialTargets: {
      minInvestment: 100,
      minDirectReferrals: 1,
      minTeamSize: 1,
    },
    rewards: ["%2 komisyon artışı", "Başlangıç rehberlik", "Topluluk erişimi"],
    color: "bg-slate-500",
    icon: Moon,
  },
  {
    id: 2,
    name: "Nefs-i Levvame",
    description: "Kendini kınayan nefis - Farkındalık gelişimi",
    spiritualGoals: [
      "İstighfar zikri",
      "Tevbe ve pişmanlık",
      "Yardımlaşma",
      "Manevi kitap okuma",
    ],
    financialTargets: {
      minInvestment: 500,
      minDirectReferrals: 2,
      minTeamSize: 5,
    },
    rewards: ["%3 komisyon artışı", "Pasif gelir başlangıcı", "Mentör desteği"],
    color: "bg-blue-500",
    icon: Compass,
  },
  {
    id: 3,
    name: "Nefs-i Mülhime",
    description: "İlham alan nefis - Rehberlik seviyesi",
    spiritualGoals: [
      "Meditasyon ve tefekkür",
      "Hayır işleri",
      "Dua ve yakarış",
      "Manevi sohbet",
    ],
    financialTargets: {
      minInvestment: 1500,
      minDirectReferrals: 4,
      minTeamSize: 15,
    },
    rewards: ["%4 komisyon artışı", "Binary denge bonusu", "Liderlik eğitimi"],
    color: "bg-green-500",
    icon: Heart,
  },
  {
    id: 4,
    name: "Nefs-i Mutmainne",
    description: "Tatmin olmuş, huzurlu nefis - İç huzur",
    spiritualGoals: [
      "Sabır ve şükür",
      "Topluma hizmet",
      "Maneviyat paylaşımı",
      "İç düzen",
    ],
    financialTargets: {
      minInvestment: 3000,
      minDirectReferrals: 10,
      minTeamSize: 50,
    },
    rewards: [
      "%5 komisyon artışı",
      "Binary network bonusu",
      "Manevi rehberlik yetkisi",
    ],
    color: "bg-yellow-500",
    icon: Sun,
  },
  {
    id: 5,
    name: "Nefs-i Râziye",
    description: "Allah'ın takdirine razı olan nefis - Rıza hali",
    spiritualGoals: [
      "Kemal-i rıza",
      "Tevekkül",
      "Manevi öğretmenlik",
      "Toplum liderliği",
    ],
    financialTargets: {
      minInvestment: 5000,
      minDirectReferrals: 25,
      minTeamSize: 150,
    },
    rewards: [
      "%6 komisyon artışı",
      "Özel manevi bonuslar",
      "Liderlik akademisi",
    ],
    color: "bg-orange-500",
    icon: Mountain,
  },
  {
    id: 6,
    name: "Nefs-i Mardiyye",
    description: "Allah'ın razı olduğu nefis - İlahi rıza",
    spiritualGoals: [
      "Kemal-i fanâ",
      "Vahdet şuuru",
      "Evliyalık sıfatı",
      "Topluma rehberlik",
    ],
    financialTargets: {
      minInvestment: 10000,
      minDirectReferrals: 50,
      minTeamSize: 500,
    },
    rewards: [
      "%8 komisyon artışı",
      "Binary master bonusu",
      "Manevi miras sistemi",
    ],
    color: "bg-purple-500",
    icon: Star,
  },
  {
    id: 7,
    name: "Nefs-i Kâmile",
    description: "Olgunlaşmış, kemale ermiş nefis - Kemal hali",
    spiritualGoals: [
      "Kemal-i beqa",
      "Nur-u hedayet",
      "Kutbiyyet makamı",
      "Evrensel rehberlik",
    ],
    financialTargets: {
      minInvestment: 25000,
      minDirectReferrals: 100,
      minTeamSize: 1000,
    },
    rewards: [
      "%12 komisyon artışı",
      "Kutbul Zaman unvanı",
      "Sistem kurucu bonusu",
    ],
    color: "bg-red-500",
    icon: Crown,
  },
];

interface SpiritualDevelopmentTrackerProps {
  userId: string;
  currentCareerLevel: number;
  binaryStats?: {
    leftVolume: number;
    rightVolume: number;
    leftCount: number;
    rightCount: number;
  };
}

const SpiritualDevelopmentTracker: React.FC<
  SpiritualDevelopmentTrackerProps
> = ({ userId, currentCareerLevel, binaryStats }) => {
  const [spiritualProgress, setSpiritualProgress] = useState<SpiritualProgress>(
    {
      currentLevel: currentCareerLevel,
      spiritualPoints: 0,
      completedGoals: [],
      dailyPractices: {
        prayer: 0,
        meditation: 0,
        charity: 0,
        learning: 0,
      },
      weeklyGoals: {},
      binaryNetworkContribution: {
        leftLegGrowth: 0,
        rightLegGrowth: 0,
        balanceBonus: 0,
      },
    },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  useEffect(() => {
    loadSpiritualProgress();
  }, [userId]);

  useEffect(() => {
    if (binaryStats) {
      calculateBinaryContribution();
    }
  }, [binaryStats]);

  const loadSpiritualProgress = async () => {
    try {
      setIsLoading(true);
      // Gerçek bir API çağrısını simüle etmek için bekleme süresi
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockProgress: SpiritualProgress = {
        currentLevel: currentCareerLevel,
        spiritualPoints: 150 + currentCareerLevel * 50,
        completedGoals: [
          "Günde 5 vakit namaz",
          "Sabah zikri",
          "İstighfar zikri",
        ],
        dailyPractices: {
          prayer: 4,
          meditation: 2,
          charity: 1,
          learning: 3,
        },
        weeklyGoals: {
          "Kuran okuma": true,
          "Hayır işleri": false,
          "Manevi sohbet": true,
        },
        binaryNetworkContribution: {
          leftLegGrowth: binaryStats?.leftCount || 0,
          rightLegGrowth: binaryStats?.rightCount || 0,
          balanceBonus: 0,
        },
      };
      setSpiritualProgress(mockProgress);
    } catch (error) {
      console.error("Error loading spiritual progress:", error);
      setError("Manevi gelişim verileri yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBinaryContribution = () => {
    if (!binaryStats) return;

    const balanceRatio =
      Math.min(binaryStats.leftVolume, binaryStats.rightVolume) /
      Math.max(binaryStats.leftVolume, binaryStats.rightVolume);

    const balanceBonus = balanceRatio * 100; // Perfect balance = 100 points

    setSpiritualProgress((prev) => ({
      ...prev,
      binaryNetworkContribution: {
        leftLegGrowth: binaryStats.leftCount,
        rightLegGrowth: binaryStats.rightCount,
        balanceBonus,
      },
    }));
  };

  const markGoalCompleted = (goalName: string) => {
    setSpiritualProgress((prev) => ({
      ...prev,
      completedGoals: [...prev.completedGoals, goalName],
      spiritualPoints: prev.spiritualPoints + 25,
    }));
  };

  const updateDailyPractice = (
    practice: keyof typeof spiritualProgress.dailyPractices,
    value: number,
  ) => {
    setSpiritualProgress((prev) => ({
      ...prev,
      dailyPractices: {
        ...prev.dailyPractices,
        [practice]: value,
      },
      spiritualPoints: prev.spiritualPoints + 5,
    }));
  };

  const getCurrentLevel = () =>
    SPIRITUAL_LEVELS[spiritualProgress.currentLevel - 1];
  const getNextLevel = () => SPIRITUAL_LEVELS[spiritualProgress.currentLevel];

  const getProgressToNextLevel = () => {
    const current = getCurrentLevel();
    const next = getNextLevel();
    if (!next) return 100;

    const totalRequiredPoints = next.financialTargets.minInvestment / INVESTMENT_TO_POINTS_RATIO;
    return Math.min(
      (spiritualProgress.spiritualPoints / totalRequiredPoints) * 100,
      100,
    );
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const IconComponent = currentLevel?.icon || Sparkles;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-500">Manevi gelişim verileri yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <div className="flex items-center justify-between w-full">
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" onClick={loadSpiritualProgress} className="ml-4 border-red-200 hover:bg-red-50 text-red-800">
            <RefreshCw className="w-4 h-4 mr-2" /> Tekrar Dene
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Spiritual Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div
              className={`p-3 rounded-full ${currentLevel?.color || "bg-gray-500"} text-white`}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl">{currentLevel?.name}</h3>
              <p className="text-sm text-gray-600">
                {currentLevel?.description}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Manevi Puanınız
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {spiritualProgress.spiritualPoints}
                </div>
                <div className="text-sm text-gray-500">Manevi Puan</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sonraki Seviye
              </h4>
              {nextLevel ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{nextLevel.name}</p>
                  <Progress value={getProgressToNextLevel()} className="mb-2" />
                  <p className="text-xs text-gray-500">
                    %{getProgressToNextLevel().toFixed(1)} tamamlandı
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-gray-600">
                    En yüksek seviyedesiniz!
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Binary Katkı
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sol Bacak:</span>
                  <span className="font-medium">
                    {spiritualProgress.binaryNetworkContribution.leftLegGrowth}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sağ Bacak:</span>
                  <span className="font-medium">
                    {spiritualProgress.binaryNetworkContribution.rightLegGrowth}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Denge Bonusu:</span>
                  <span className="font-medium text-green-600">
                    +
                    {spiritualProgress.binaryNetworkContribution.balanceBonus.toFixed(
                      1,
                    )}{" "}
                    puan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spiritual Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Manevi Hedefler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentLevel?.spiritualGoals.map((goal, index) => {
                const isCompleted =
                  spiritualProgress.completedGoals.includes(goal);
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      isCompleted
                        ? "bg-green-50 border-green-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setSelectedGoal(selectedGoal === goal ? null : goal)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          isCompleted
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isCompleted && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <span
                        className={
                          isCompleted ? "line-through text-gray-500" : ""
                        }
                      >
                        {goal}
                      </span>
                    </div>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          markGoalCompleted(goal);
                        }}
                      >
                        Tamamla
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              Günlük Pratikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(spiritualProgress.dailyPractices).map(
                ([practice, count]) => {
                  const practiceNames = {
                    prayer: "Namaz",
                    meditation: "Meditasyon",
                    charity: "Sadaka",
                    learning: "Öğrenme",
                  };

                  return (
                    <div key={practice} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {
                            practiceNames[
                              practice as keyof typeof practiceNames
                            ]
                          }
                        </span>
                        <span className="text-sm text-gray-500">{count}/5</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              updateDailyPractice(
                                practice as keyof typeof spiritualProgress.dailyPractices,
                                level,
                              )
                            }
                            className={`w-8 h-8 rounded border transition-colors ${
                              level <= count
                                ? "bg-purple-500 border-purple-500 text-white"
                                : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Binary Network Spiritual Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-orange-600" />
            Binary Network & Manevi Gelişim Entegrasyonu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold">Sol Bacak Büyümesi</h4>
              <p className="text-2xl font-bold text-green-600">
                {spiritualProgress.binaryNetworkContribution.leftLegGrowth}
              </p>
              <p className="text-sm text-gray-500">
                Her yeni üye = +10 manevi puan
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold">Sağ Bacak Büyümesi</h4>
              <p className="text-2xl font-bold text-blue-600">
                {spiritualProgress.binaryNetworkContribution.rightLegGrowth}
              </p>
              <p className="text-sm text-gray-500">
                Her yeni üye = +10 manevi puan
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold">Denge Bonusu</h4>
              <p className="text-2xl font-bold text-purple-600">
                +
                {spiritualProgress.binaryNetworkContribution.balanceBonus.toFixed(
                  0,
                )}
              </p>
              <p className="text-sm text-gray-500">Denge = Manevi kemâl</p>
            </div>
          </div>

          <Alert className="mt-6 border-purple-200 bg-purple-50">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Manevi Rehberlik:</strong> Binary network sisteminizde
              denge sağlamak, sadece finansal başarı değil, aynı zamanda
              nefsinizi terbiye etme yolculuğunuzda da önemli bir adımdır. Sol
              ve sağ bacağınız arasında denge kurmak, içsel dengenizi de
              geliştirir.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Spiritual Rewards */}
      {currentLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Mevcut Seviye Ödülleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentLevel.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50 border-yellow-200"
                >
                  <Award className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">{reward}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpiritualDevelopmentTracker;
