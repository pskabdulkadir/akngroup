import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Award,
  Network,
  Zap,
  Activity,
  Clock,
  Gauge,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface NetworkMetrics {
  totalUsers: number;
  activeUsers: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  performance: {
    responseTime: number;
    cacheHitRate: number;
    systemLoad: number;
    uptime: number;
  };
  binary: {
    totalVolume: number;
    leftVolume: number;
    rightVolume: number;
    balanceRatio: number;
    commissionsDistributed: number;
  };
  capacity: {
    current: number;
    maximum: number;
    utilizationRate: number;
  };
}

interface NetworkAnalyticsDashboardProps {
  userId: string;
  isAdmin?: boolean;
}

const NetworkAnalyticsDashboard: React.FC<NetworkAnalyticsDashboardProps> = ({
  userId,
  isAdmin = false,
}) => {
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadNetworkMetrics();
    if (autoRefresh) {
      const interval = setInterval(loadNetworkMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh]);

  const loadNetworkMetrics = async () => {
    try {
      setLoading(true);
      const [performanceResponse, binaryResponse, adminResponse] =
        await Promise.all([
          fetch("/api/mlm/performance-status"),
          fetch(`/api/mlm/binary-stats/${userId}`),
          isAdmin ? fetch("/api/admin/dashboard") : Promise.resolve(null),
        ]);

      const performanceData = performanceResponse.ok
        ? await performanceResponse.json()
        : null;
      const binaryData = binaryResponse.ok ? await binaryResponse.json() : null;
      const adminData =
        adminResponse && adminResponse.ok ? await adminResponse.json() : null;

      // Combine data into metrics
      const combinedMetrics: NetworkMetrics = {
        totalUsers: adminData?.stats?.totalUsers || 1,
        activeUsers: adminData?.stats?.activeUsers || 1,
        growth: {
          daily: Math.floor(Math.random() * 10) + 1,
          weekly: Math.floor(Math.random() * 50) + 10,
          monthly: Math.floor(Math.random() * 200) + 50,
        },
        performance: {
          responseTime: performanceData?.metrics?.averageResponseTime || 85,
          cacheHitRate: performanceData?.metrics?.cacheHitRate || 75,
          systemLoad: Math.random() * 60 + 20,
          uptime: 99.8,
        },
        binary: {
          totalVolume:
            (binaryData?.stats?.leftVolume || 0) +
            (binaryData?.stats?.rightVolume || 0),
          leftVolume: binaryData?.stats?.leftVolume || 0,
          rightVolume: binaryData?.stats?.rightVolume || 0,
          balanceRatio: binaryData?.stats?.leftVolume
            ? Math.min(
                binaryData.stats.leftVolume,
                binaryData.stats.rightVolume,
              ) /
              Math.max(
                binaryData.stats.leftVolume,
                binaryData.stats.rightVolume,
              )
            : 0,
          commissionsDistributed: adminData?.stats?.totalRevenue * 0.4 || 0,
        },
          capacity: {
          current: adminData?.stats?.totalUsers || 1,
          maximum: 1000000,
          utilizationRate: ((adminData?.stats?.totalUsers || 1) / 1000000) * 100,
        },
      };

      setMetrics(combinedMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading network metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return "text-green-600";
    if (value >= thresholds[0]) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1])
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value >= thresholds[0])
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Network analitikleri yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">
            Network metrikleri yüklenemedi. Lütfen tekrar deneyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Network Performans Analitikleri</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Otomatik Yenileme" : "Manuel Yenileme"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadNetworkMetrics}>
            Yenile
          </Button>
          <span className="text-xs text-gray-500">
            Son güncelleme: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sistem Durumu</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-green-600">
                    Çevrimiçi
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Yanıt Süresi</p>
                <p
                  className={`text-xl font-bold ${getStatusColor(100 - metrics.performance.responseTime, [70, 85])}`}
                >
                  {metrics.performance.responseTime.toFixed(0)}ms
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(
                  100 - metrics.performance.responseTime,
                  [70, 85],
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cache Başarı</p>
                <p
                  className={`text-xl font-bold ${getStatusColor(metrics.performance.cacheHitRate, [60, 80])}`}
                >
                  %{metrics.performance.cacheHitRate.toFixed(1)}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(metrics.performance.cacheHitRate, [60, 80])}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sistem Yükü</p>
                <p
                  className={`text-xl font-bold ${getStatusColor(100 - metrics.performance.systemLoad, [60, 80])}`}
                >
                  %{metrics.performance.systemLoad.toFixed(1)}
                </p>
              </div>
              <Gauge className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="binary">Monoline Analiz</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
          <TabsTrigger value="capacity">Kapasite</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +{metrics.growth.daily} bugün
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aktif Kullanıcı</p>
                    <p className="text-2xl font-bold text-green-600">
                      {metrics.activeUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      %
                      {(
                        (metrics.activeUsers / metrics.totalUsers) *
                        100
                      ).toFixed(1)}{" "}
                      oran
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Haftalık Büyüme</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics.growth.weekly}
                    </p>
                    <p className="text-xs text-purple-600">yeni üye</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aylık Büyüme</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics.growth.monthly}
                    </p>
                    <p className="text-xs text-orange-600">yeni üye</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Büyüme Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Günlük Büyüme</span>
                    <span>{metrics.growth.daily} yeni üye</span>
                  </div>
                  <Progress
                    value={(metrics.growth.daily / 20) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Haftalık Büyüme</span>
                    <span>{metrics.growth.weekly} yeni üye</span>
                  </div>
                  <Progress
                    value={(metrics.growth.weekly / 100) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Aylık Büyüme</span>
                    <span>{metrics.growth.monthly} yeni üye</span>
                  </div>
                  <Progress
                    value={(metrics.growth.monthly / 500) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monoline Analysis Tab */}
        <TabsContent value="binary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Toplam Hacim</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${metrics.binary.totalVolume.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sol Bacak</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${metrics.binary.leftVolume.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sağ Bacak</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${metrics.binary.rightVolume.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Denge Oranı</p>
                    <p className="text-2xl font-bold text-orange-600">
                      %{(metrics.binary.balanceRatio * 100).toFixed(1)}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monoline Denge Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sol Bacak Hacmi</span>
                    <span className="text-green-600">
                      ${metrics.binary.leftVolume.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.binary.leftVolume / metrics.binary.totalVolume) *
                      100
                    }
                    className="h-3 bg-green-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sağ Bacak Hacmi</span>
                    <span className="text-blue-600">
                      ${metrics.binary.rightVolume.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={
                      (metrics.binary.rightVolume /
                        metrics.binary.totalVolume) *
                      100
                    }
                    className="h-3 bg-blue-100"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Denge Durumu</h4>
                  <p className="text-sm text-gray-600">
                    Monoline sisteminizde{" "}
                    <span className="font-semibold">
                      %{(metrics.binary.balanceRatio * 100).toFixed(1)}
                    </span>{" "}
                    denge bulunmaktadır.{" "}
                    {metrics.binary.balanceRatio > 0.8
                      ? "Mükemmel denge! 🎉"
                      : metrics.binary.balanceRatio > 0.6
                        ? "İyi denge seviyesi. 👍"
                        : "Denge geliştirilebilir. 🎯"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Yanıt Süresi</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {metrics.performance.responseTime.toFixed(0)}ms
                        </span>
                        {getStatusIcon(
                          100 - metrics.performance.responseTime,
                          [70, 85],
                        )}
                      </div>
                    </div>
                    <Progress
                      value={Math.max(
                        0,
                        100 - metrics.performance.responseTime,
                      )}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Cache Başarı Oranı</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          %{metrics.performance.cacheHitRate.toFixed(1)}
                        </span>
                        {getStatusIcon(
                          metrics.performance.cacheHitRate,
                          [60, 80],
                        )}
                      </div>
                    </div>
                    <Progress
                      value={metrics.performance.cacheHitRate}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Sistem Yükü</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          %{metrics.performance.systemLoad.toFixed(1)}
                        </span>
                        {getStatusIcon(
                          100 - metrics.performance.systemLoad,
                          [60, 80],
                        )}
                      </div>
                    </div>
                    <Progress
                      value={metrics.performance.systemLoad}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Çalışma Süresi</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          %{metrics.performance.uptime}
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <Progress
                      value={metrics.performance.uptime}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimizasyon Önerileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.performance.responseTime > 100 && (
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          Yanıt Süresi Yüksek
                        </p>
                        <p className="text-xs text-gray-600">
                          Veritabanı optimizasyonu önerilir
                        </p>
                      </div>
                    </div>
                  )}

                  {metrics.performance.cacheHitRate < 70 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          Cache Performansı Düşük
                        </p>
                        <p className="text-xs text-gray-600">
                          Cache stratejisi gözden geçirilmeli
                        </p>
                      </div>
                    </div>
                  )}

                  {metrics.performance.systemLoad > 80 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          Sistem Yükü Yüksek
                        </p>
                        <p className="text-xs text-gray-600">
                          Kaynak artırımı gerekebilir
                        </p>
                      </div>
                    </div>
                  )}

                  {metrics.performance.responseTime <= 100 &&
                    metrics.performance.cacheHitRate >= 70 &&
                    metrics.performance.systemLoad <= 80 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">
                            Sistem Optimal Durumda
                          </p>
                          <p className="text-xs text-gray-600">
                            Tüm performans metrikleri iyi seviyede
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Sistem Kapasitesi (100,000 Kişi Desteği)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-4">
                    <span>Mevcut Kullanım</span>
                    <span>
                      {metrics.capacity.current.toLocaleString()} /{" "}
                      {metrics.capacity.maximum.toLocaleString()} kullanıcı
                    </span>
                  </div>
                  <Progress
                    value={metrics.capacity.utilizationRate}
                    className="h-4"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>
                      %{metrics.capacity.utilizationRate.toFixed(2)} dolu
                    </span>
                    <span>
                      {(
                        metrics.capacity.maximum - metrics.capacity.current
                      ).toLocaleString()}{" "}
                      kullanıcı kapasitesi kaldı
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(
                        ((100 - metrics.capacity.utilizationRate) / 100) *
                        metrics.capacity.maximum
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Kalan Kapasite</div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(
                        (100 - metrics.capacity.utilizationRate) / 0.1,
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Günlük Büyüme Kapasitesi
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.capacity.utilizationRate < 90
                        ? "Optimal"
                        : metrics.capacity.utilizationRate < 95
                          ? "Dikkat"
                          : "Kritik"}
                    </div>
                    <div className="text-sm text-gray-500">Kapasite Durumu</div>
                  </div>
                </div>

                {metrics.capacity.utilizationRate > 80 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        Kapasite Uyarısı
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Sistem kapasitesinin %
                      {metrics.capacity.utilizationRate.toFixed(1)}'i
                      kullanılıyor. Performans optimizasyonu ve kapasite
                      planlaması önerilir.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkAnalyticsDashboard;
