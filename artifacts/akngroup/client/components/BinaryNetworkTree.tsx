/**
 * @deprecated Binary MLM system is deprecated. Use Monoline MLM system for new implementations.
 * This component is maintained for backward compatibility only.
 *
 * Binary system will be removed in a future release.
 * Please migrate to MonolineTreeView component instead.
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
  User,
  Crown,
  Star,
} from "lucide-react";

interface NetworkNode {
  id: string;
  name: string;
  memberId: string;
  careerLevel: string;
  totalInvestment: number;
  isActive: boolean;
  leftChild?: NetworkNode;
  rightChild?: NetworkNode;
  teamSize: number;
  teamVolume: number;
}

interface BinaryStats {
  leftVolume: number;
  rightVolume: number;
  leftCount: number;
  rightCount: number;
  binaryBonus: number;
  nextBinaryBonus: number;
}

interface BinaryNetworkTreeProps {
  userId: string;
  maxLevels?: number;
}

const BinaryNetworkTree: React.FC<BinaryNetworkTreeProps> = ({
  userId,
  maxLevels = 7,
}) => {
  const [networkData, setNetworkData] = useState<NetworkNode | null>(null);
  const [binaryStats, setBinaryStats] = useState<BinaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([userId]),
  );
  const [selectedLevel, setSelectedLevel] = useState(1);

  useEffect(() => {
    loadNetworkData();
  }, [userId, selectedLevel]);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      const [networkResponse, statsResponse] = await Promise.all([
        fetch(`/api/mlm/network/${userId}?depth=${selectedLevel}`),
        fetch(`/api/mlm/binary-stats/${userId}`),
      ]);

      if (networkResponse.ok && statsResponse.ok) {
        const networkData = await networkResponse.json();
        const statsData = await statsResponse.json();

        setNetworkData(networkData.networkTree);
        setBinaryStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error loading network data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getCareerLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      "Nefs-i Emmare": "bg-slate-500",
      "Nefs-i Levvame": "bg-blue-500",
      "Nefs-i Mülhime": "bg-green-500",
      "Nefs-i Mutmainne": "bg-yellow-500",
      "Nefs-i Râziye": "bg-orange-500",
      "Nefs-i Mardiyye": "bg-purple-500",
      "Nefs-i Kâmile": "bg-red-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const renderNetworkNode = (
    node: NetworkNode,
    level: number,
    position?: "left" | "right",
  ) => {
    if (!node || level > maxLevels) return null;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.leftChild || node.rightChild;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <Card
          className={`w-64 mb-4 border-2 ${
            position === "left"
              ? "border-green-300"
              : position === "right"
                ? "border-blue-300"
                : "border-purple-300"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                {level === 1 ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNodeExpansion(node.id)}
                  className="p-1 h-auto"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">ID:</span>
                <span className="font-mono">{node.memberId}</span>
              </div>

              <Badge
                className={`${getCareerLevelColor(node.careerLevel)} text-white text-xs`}
                variant="secondary"
              >
                {node.careerLevel}
              </Badge>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{node.teamSize}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${node.totalInvestment}</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Badge variant={node.isActive ? "default" : "secondary"}>
                  {node.isActive ? "Aktif" : "Pasif"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        {isExpanded && hasChildren && level < maxLevels && (
          <div className="flex gap-8 relative">
            {/* Connection lines */}
            <div className="absolute top-0 left-1/2 w-px h-8 bg-gray-300 transform -translate-x-px"></div>

            {/* Left child */}
            <div className="flex flex-col items-center">
              {node.leftChild && (
                <>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  {renderNetworkNode(node.leftChild, level + 1, "left")}
                </>
              )}
            </div>

            {/* Right child */}
            <div className="flex flex-col items-center">
              {node.rightChild && (
                <>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  {renderNetworkNode(node.rightChild, level + 1, "right")}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Binary network yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Binary Stats Dashboard */}
      {binaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sol Bacak Hacmi</p>
                  <p className="text-xl font-bold text-green-600">
                    ${binaryStats.leftVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {binaryStats.leftCount} üye
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sağ Bacak Hacmi</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${binaryStats.rightVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {binaryStats.rightCount} üye
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Binary Bonus</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${binaryStats.binaryBonus.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Zayıf bacaktan</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sonraki Bonus</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${binaryStats.nextBinaryBonus.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Potansiyel</p>
                </div>
                <Star className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Binary Balance Visualization */}
      {binaryStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Binary Denge Analizi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Sol Bacak</span>
                  <span className="text-green-600">
                    ${binaryStats.leftVolume.toLocaleString()} (
                    {binaryStats.leftCount} üye)
                  </span>
                </div>
                <Progress
                  value={
                    (binaryStats.leftVolume /
                      (binaryStats.leftVolume + binaryStats.rightVolume)) *
                    100
                  }
                  className="h-3 bg-green-100"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Sağ Bacak</span>
                  <span className="text-blue-600">
                    ${binaryStats.rightVolume.toLocaleString()} (
                    {binaryStats.rightCount} üye)
                  </span>
                </div>
                <Progress
                  value={
                    (binaryStats.rightVolume /
                      (binaryStats.leftVolume + binaryStats.rightVolume)) *
                    100
                  }
                  className="h-3 bg-blue-100"
                />
              </div>

              <Separator />

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Binary Bonus Oranı</p>
                <p className="text-lg font-semibold">
                  %
                  {(
                    (Math.min(binaryStats.leftVolume, binaryStats.rightVolume) /
                      Math.max(
                        binaryStats.leftVolume,
                        binaryStats.rightVolume,
                      )) *
                    100
                  ).toFixed(1)}{" "}
                  Denge
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Network Görünümü</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
              >
                {level}. Seviye
              </Button>
            ))}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            <p>
              💡 Network ağacınızı {maxLevels} seviyeye kadar
              görüntüleyebilirsiniz
            </p>
            <p>🟢 Sol bacak | 🔵 Sağ bacak | 🟣 Siz</p>
          </div>
        </CardContent>
      </Card>

      {/* Network Tree */}
      <Card>
        <CardContent className="p-6 overflow-x-auto">
          <div className="min-w-max">
            {networkData ? (
              renderNetworkNode(networkData, 1)
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Network verisi bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-placement Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Otomatik Yerleştirme Sistemi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">
                ✓ Aktif Özellikler
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 7 seviyeye kadar komisyon</li>
                <li>• Zayıf bacağa otomatik yerleşim</li>
                <li>• 100.000 kişi kapasitesi</li>
                <li>• Binary denge analizi</li>
                <li>• Anlık komisyon hesaplama</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-600 mb-2">
                🎯 Manevi Gelişim
              </h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 7 Nefis mertebesi sistemi</li>
                <li>• Ruhsal ve finansal büyüme</li>
                <li>• Manevi rehberlik desteği</li>
                <li>• Kişisel gelişim takibi</li>
                <li>• Topluluk bilinci</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BinaryNetworkTree;
