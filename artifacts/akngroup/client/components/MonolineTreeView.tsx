import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, Crown, Star, TreePine, Target } from 'lucide-react';

interface MonolineNode {
  id: string;
  memberId: string;
  fullName: string;
  level: number;
  position: number;
  directReferrals: number;
  totalEarnings: number;
  isActive: boolean;
  careerLevel: number;
  registrationDate: string;
}

interface MonolineTreeViewProps {
  userId: string;
  userName: string;
  memberId: string;
  maxLevels?: number;
  onClose?: () => void;
}

const MonolineTreeView: React.FC<MonolineTreeViewProps> = ({
  userId,
  userName,
  memberId,
  maxLevels = 7,
  onClose
}) => {
  const [treeData, setTreeData] = useState<MonolineNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<MonolineNode | null>(null);

  useEffect(() => {
    loadMonolineTree();
  }, [userId, maxLevels]);

  const loadMonolineTree = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}/network?depth=${maxLevels}`);
      if (response.ok) {
        const data = await response.json();
        const flat = flattenNetworkTree(data.networkTree);
        if (flat.length === 0) {
          // Ensure at least the current user is shown
          setTreeData([rootNodeFallback()]);
        } else {
          setTreeData(flat);
        }
      } else {
        setTreeData([rootNodeFallback()]);
      }
    } catch (error) {
      setTreeData([rootNodeFallback()]);
    } finally {
      setLoading(false);
    }
  };

  const rootNodeFallback = (): MonolineNode => ({
    id: userId,
    memberId,
    fullName: userName,
    level: 0,
    position: 1,
    directReferrals: 0,
    totalEarnings: 0,
    isActive: true,
    careerLevel: 1,
    registrationDate: new Date().toISOString(),
  });

  const flattenNetworkTree = (root: any): MonolineNode[] => {
    if (!root || !root.user) return [];
    const queue: Array<{ node: any; level: number } > = [{ node: root, level: 0 }];
    const result: MonolineNode[] = [];
    let position = 1;

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      const u = node.user;
      result.push({
        id: u.id,
        memberId: u.memberId,
        fullName: u.fullName,
        level,
        position: position++,
        directReferrals: u.directReferrals || 0,
        totalEarnings: u.wallet?.totalEarnings || 0,
        isActive: !!u.isActive,
        careerLevel: u.careerLevel?.id || 1,
        registrationDate: (u.registrationDate ? new Date(u.registrationDate) : new Date()).toISOString(),
      });

      const children = Array.isArray(node.children) ? node.children : [];
      for (const child of children) {
        if (level + 1 <= maxLevels) {
          queue.push({ node: child, level: level + 1 });
        }
      }
    }

    return result;
  };

  const getPositionColor = (level: number) => {
    const colors = [
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-red-100 border-red-300 text-red-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800'
    ];
    return colors[level] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getCareerLevelIcon = (level: number) => {
    if (level >= 7) return '👑';
    if (level >= 5) return '⭐';
    if (level >= 3) return '🌟';
    return '👤';
  };

  const totalNetworkEarnings = treeData.reduce((sum, node) => sum + node.totalEarnings, 0);
  const activeMembers = treeData.filter(node => node.isActive).length;
  const totalMembers = treeData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <TreePine className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg font-semibold">Monoline ağaç yapısı yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-200">
          <CardContent className="p-4 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-700">{userName}</div>
            <div className="text-sm text-purple-600">Root Sponsor</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-700">{totalMembers}</div>
            <div className="text-sm text-blue-600">Toplam Network</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-200">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-700">{activeMembers}</div>
            <div className="text-sm text-green-600">Aktif Üyeler</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-200">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-700">${totalNetworkEarnings.toFixed(0)}</div>
            <div className="text-sm text-orange-600">Network Kazancı</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TreePine className="w-6 h-6 text-purple-600" />
            <span>💎 {userName} - Monoline MLM Ağaç Yapısı</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: maxLevels + 1 }, (_, level) => {
              const levelMembers = treeData.filter(node => node.level === level);
              if (levelMembers.length === 0) return null;

              return (
                <div key={level} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={`px-3 py-1 font-bold ${getPositionColor(level)}`}>
                      {level === 0 ? '👑 ROOT' : `Level ${level}`}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      ({levelMembers.length} üye)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {levelMembers.map((node) => (
                      <Card
                        key={node.id}
                        className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${
                          selectedNode?.id === node.id ? 'ring-2 ring-purple-500' : ''
                        } ${getPositionColor(level)}`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {node.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{node.fullName}</div>
                              <div className="text-xs text-gray-600">{node.memberId}</div>
                            </div>
                            <div className="text-lg">
                              {getCareerLevelIcon(node.careerLevel)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Pozisyon:</span>
                              <span className="font-bold">#{node.position}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Referanslar:</span>
                              <span className="font-bold text-blue-600">{node.directReferrals}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Kazanç:</span>
                              <span className="font-bold text-green-600">${node.totalEarnings.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span>Durum:</span>
                              <Badge className={`text-xs ${node.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {node.isActive ? '✅' : '❌'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedNode && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span>Seçili Üye Detayları</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Ad Soyad:</span>
                  <span className="font-bold">{selectedNode.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Üye ID:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedNode.memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monoline Pozisyon:</span>
                  <span className="font-bold text-purple-600">#{selectedNode.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Level:</span>
                  <span className="font-bold">{selectedNode.level === 0 ? 'ROOT' : `Level ${selectedNode.level}`}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Kariyer Seviyesi:</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {getCareerLevelIcon(selectedNode.careerLevel)} Level {selectedNode.careerLevel}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Direkt Referanslar:</span>
                  <span className="font-bold text-blue-600">{selectedNode.directReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Toplam Kazanç:</span>
                  <span className="font-bold text-green-600">${selectedNode.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Kayıt Tarihi:</span>
                  <span className="font-bold">{new Date(selectedNode.registrationDate).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>💰 Monoline MLM Komisyon Yapısı</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-800 mb-3">Komisyon Dağılımı:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>• Direkt Sponsor Bonusu:</span>
                  <span className="font-bold text-green-600">%15 ($3.00)</span>
                </div>
                <div className="flex justify-between">
                  <span>• Level 1-7 Derinlik:</span>
                  <span className="font-bold text-blue-600">%39.5 ($7.90)</span>
                </div>
                <div className="flex justify-between">
                  <span>• Pasif Gelir Havuzu:</span>
                  <span className="font-bold text-purple-600">%0.5 ($0.10)</span>
                </div>
                <div className="flex justify-between">
                  <span>• Şirket Fonu:</span>
                  <span className="font-bold text-gray-600">%45 ($9.00)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800 mb-3">Level Komisyonları:</h4>
              <div className="space-y-1 text-sm">
                {[
                  { level: 1, rate: 12.5, amount: 2.50 },
                  { level: 2, rate: 7.5, amount: 1.50 },
                  { level: 3, rate: 5.0, amount: 1.00 },
                  { level: 4, rate: 3.5, amount: 0.70 },
                  { level: 5, rate: 2.5, amount: 0.50 },
                  { level: 6, rate: 2.0, amount: 0.40 },
                  { level: 7, rate: 1.5, amount: 0.30 }
                ].map(item => (
                  <div key={item.level} className="flex justify-between">
                    <span>• Level {item.level}:</span>
                    <span className="font-bold text-blue-600">%{item.rate} (${item.amount.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-purple-300 text-purple-600">
            Kapat
          </Button>
        </div>
      )}
    </div>
  );
};

export default MonolineTreeView;
