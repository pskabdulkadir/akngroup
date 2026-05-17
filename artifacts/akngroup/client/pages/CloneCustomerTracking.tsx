import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Crown,
  ShoppingCart,
  Users,
  TrendingUp,
  Eye,
  ArrowLeft,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar,
  Mail,
  Package,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";

interface CloneCustomer {
  id: string;
  buyerEmail: string;
  orderId: string;
  productId: string;
  productName: string;
  purchaseAmount: number;
  commissionAmount: number;
  purchaseDate: string;
  status: "completed" | "pending" | "shipped" | "delivered";
  source: "clone_product_page";
}

interface CloneCustomerStats {
  totalCustomers: number;
  totalRevenue: number;
  totalCommissions: number;
  averageOrderValue: number;
  conversionRate: number;
  repeatCustomers: number;
}

export default function CloneCustomerTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CloneCustomer[]>([]);
  const [stats, setStats] = useState<CloneCustomerStats>({
    totalCustomers: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    repeatCustomers: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CloneCustomer | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentUserData = localStorage.getItem("currentUser");
      if (!currentUserData) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(currentUserData);
      setCurrentUser(user);
      await fetchCloneCustomers(user.memberId);
    } catch (error) {
      console.error("Authentication check failed:", error);
      navigate("/login");
    }
  };

  const fetchCloneCustomers = async (memberId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clone-products/${memberId}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        
        // Calculate stats
        const totalCustomers = data.customers?.length || 0;
        const totalRevenue = data.customers?.reduce((sum: number, customer: CloneCustomer) => sum + customer.purchaseAmount, 0) || 0;
        const totalCommissions = data.customers?.reduce((sum: number, customer: CloneCustomer) => sum + customer.commissionAmount, 0) || 0;
        const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        
        // Count unique customers by email
        const uniqueEmails = new Set(data.customers?.map((c: CloneCustomer) => c.buyerEmail) || []);
        const repeatCustomers = totalCustomers - uniqueEmails.size;

        setStats({
          totalCustomers,
          totalRevenue,
          totalCommissions,
          averageOrderValue,
          conversionRate: data.totalVisits > 0 ? (totalCustomers / data.totalVisits) * 100 : 0,
          repeatCustomers,
        });
      } else {
        // Demo data for display
        const demoCustomers: CloneCustomer[] = [
          {
            id: "1",
            buyerEmail: "m***@gmail.com",
            orderId: "ORD-001",
            productId: "product-1",
            productName: "Manevi Gelişim Premium Seti",
            purchaseAmount: 299,
            commissionAmount: 44.85,
            purchaseDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            source: "clone_product_page",
          },
          {
            id: "2",
            buyerEmail: "a***@hotmail.com",
            orderId: "ORD-002",
            productId: "product-2",
            productName: "Kutsal Tesbihat ve Zikirmatik",
            purchaseAmount: 149,
            commissionAmount: 22.35,
            purchaseDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: "shipped",
            source: "clone_product_page",
          },
          {
            id: "3",
            buyerEmail: "f***@yahoo.com",
            orderId: "ORD-003",
            productId: "product-3",
            productName: "Nefis Mertebeleri Eğitim Paketi",
            purchaseAmount: 499,
            commissionAmount: 74.85,
            purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: "delivered",
            source: "clone_product_page",
          },
        ];

        setCustomers(demoCustomers);
        setStats({
          totalCustomers: 3,
          totalRevenue: 947,
          totalCommissions: 142.05,
          averageOrderValue: 315.67,
          conversionRate: 2.4,
          repeatCustomers: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching clone customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.buyerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { variant: "default" as const, text: "Tamamlandı", color: "bg-green-500" },
      pending: { variant: "secondary" as const, text: "Beklemede", color: "bg-yellow-500" },
      shipped: { variant: "outline" as const, text: "Kargoda", color: "bg-blue-500" },
      delivered: { variant: "default" as const, text: "Teslim Edildi", color: "bg-purple-500" },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Müşteri verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/member-panel")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Üye Paneli
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Kutbul Zaman
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Müşteri Takibi
              </Badge>
              {currentUser && (
                <Badge>{currentUser.fullName}</Badge>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">👥 Clone Sayfa Müşteri Takibi</h1>
          <p className="text-foreground/60">
            Kişisel ürün mağazanızdan alışveriş yapan müşterilerin detaylı takibi
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Toplam Müşteri</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Toplam Satış</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-spiritual-gold/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-spiritual-gold" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Komisyon</p>
                  <p className="text-2xl font-bold">${stats.totalCommissions.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Ort. Sipariş</p>
                  <p className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Dönüşüm Oranı</p>
                  <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Tekrar Eden</p>
                  <p className="text-2xl font-bold">{stats.repeatCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Email, sipariş no veya ürün ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fetchCloneCustomers(currentUser?.memberId)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Yenile
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Müşteri Listesi ({filteredCustomers.length})
            </CardTitle>
            <CardDescription>
              Clone ürün sayfanızdan alışveriş yapan tüm müşteriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri Email</TableHead>
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Komisyon</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.buyerEmail}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.orderId}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {customer.productName}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ${customer.purchaseAmount}
                      </TableCell>
                      <TableCell className="font-bold text-spiritual-gold">
                        ${customer.commissionAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(customer.purchaseDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(customer.status).variant}>
                          {getStatusBadge(customer.status).text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Müşteri Detayları</DialogTitle>
                              <DialogDescription>
                                Sipariş ve komisyon detayları
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedCustomer && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Müşteri Email</Label>
                                    <Input value={selectedCustomer.buyerEmail} readOnly />
                                  </div>
                                  <div>
                                    <Label>Sipariş No</Label>
                                    <Input value={selectedCustomer.orderId} readOnly />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Ürün</Label>
                                  <Input value={selectedCustomer.productName} readOnly />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Sipariş Tutarı</Label>
                                    <Input value={`$${selectedCustomer.purchaseAmount}`} readOnly />
                                  </div>
                                  <div>
                                    <Label>Sizin Komisyonunuz (%15)</Label>
                                    <Input 
                                      value={`$${selectedCustomer.commissionAmount.toFixed(2)}`} 
                                      readOnly 
                                      className="text-spiritual-gold font-bold"
                                    />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Sipariş Tarihi</Label>
                                    <Input value={formatDate(selectedCustomer.purchaseDate)} readOnly />
                                  </div>
                                  <div>
                                    <Label>Durum</Label>
                                    <div className="mt-2">
                                      <Badge variant={getStatusBadge(selectedCustomer.status).variant}>
                                        {getStatusBadge(selectedCustomer.status).text}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <Card className="bg-spiritual-gold/10 border-spiritual-gold/20">
                                  <CardContent className="p-4">
                                    <h4 className="font-medium text-spiritual-gold mb-2">
                                      Komisyon Bilgileri
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Komisyon Oranı:</span>
                                        <span className="font-medium">%15</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Sipariş Tutarı:</span>
                                        <span>${selectedCustomer.purchaseAmount}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-spiritual-gold">
                                        <span>Toplam Komisyon:</span>
                                        <span>${selectedCustomer.commissionAmount.toFixed(2)}</span>
                                      </div>
                                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                        Bu komisyon otomatik olarak hesabınıza eklenmiştir.
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Henüz müşteri yok</h3>
                <p className="text-muted-foreground mb-4">
                  Ürün mağaza linkinizi paylaşarak ilk müşterinizi kazanın!
                </p>
                <Button
                  onClick={() => window.open(`${window.location.origin}/clone-products/${currentUser?.memberId}`, "_blank")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ürün Mağazanızı Açın
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
