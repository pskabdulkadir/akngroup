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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Crown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Send,
  Wallet,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Gift,
  ShoppingCart,
  Undo,
  AlertCircle,
  Activity,
  BarChart3,
  Calendar,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  transactionId: string;
  userId: string;
  memberId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "commission"
    | "bonus"
    | "transfer"
    | "purchase"
    | "refund"
    | "penalty";
  subType?: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  description: string;
  metadata: any;
  timestamps: {
    created: string;
    processed?: string;
    completed?: string;
  };
  balancesBefore: {
    user: number;
    system: number;
  };
  balancesAfter: {
    user: number;
    system: number;
  };
  riskScore: number;
  ipAddress?: string;
  userAgent?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  avgTransactionAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  riskScore: number;
}

export default function RealTimeTransactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalVolume: 0,
    avgTransactionAmount: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    riskScore: 0,
  });

  // Create Transaction Form
  const [createTransactionForm, setCreateTransactionForm] = useState({
    type: "deposit",
    subType: "",
    amount: "",
    description: "",
    targetUserId: "",
    metadata: "",
  });

  // Filter States
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    checkAuthentication();
    loadTransactions();

    // Set up real-time updates
    const interval = setInterval(loadTransactions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentUserData = localStorage.getItem("currentUser");
      if (!currentUserData) {
        navigate("/login");
        return;
      }

      const currentUser = JSON.parse(currentUserData);
      if (!currentUser.id) {
        navigate("/login");
        return;
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      navigate("/login");
    }
  };

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `/api/transactions/my-transactions?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTransactions(data.transactions || []);
          setStats(data.stats || stats);
        }
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const requestBody = {
        ...createTransactionForm,
        amount: parseFloat(createTransactionForm.amount),
        metadata: createTransactionForm.metadata
          ? JSON.parse(createTransactionForm.metadata)
          : {},
      };

      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("Transaction başarıyla oluşturuldu!");
          setCreateDialogOpen(false);
          setCreateTransactionForm({
            type: "deposit",
            subType: "",
            amount: "",
            description: "",
            targetUserId: "",
            metadata: "",
          });
          loadTransactions();
        } else {
          alert(`Hata: ${data.error}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Hata: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Transaction oluşturma sırasında hata oluştu.");
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "commission":
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case "bonus":
        return <Gift className="w-4 h-4 text-purple-500" />;
      case "transfer":
        return <ArrowLeftRight className="w-4 h-4 text-orange-500" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4 text-indigo-500" />;
      case "refund":
        return <Undo className="w-4 h-4 text-yellow-500" />;
      case "penalty":
        return <Minus className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Bekliyor
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="text-blue-600">
            <RefreshCw className="w-3 h-3 mr-1" />
            İşleniyor
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tamamlandı
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Başarısız
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            İptal
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore <= 3) {
      return (
        <Badge variant="default" className="bg-green-500">
          Düşük Risk
        </Badge>
      );
    } else if (riskScore <= 6) {
      return (
        <Badge variant="outline" className="text-yellow-600">
          Orta Risk
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Yüksek Risk</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Gerçek zamanlı işlemler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/member-panel")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Gerçek Zamanlı İşlemler
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600">
                <Activity className="w-3 h-3 mr-1" />
                Canlı
              </Badge>
              <Button onClick={loadTransactions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İşlem
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Ort. {formatCurrency(stats.avgTransactionAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Hacim
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalVolume)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingTransactions} bekleyen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Başarı Oranı
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTransactions > 0
                  ? Math.round(
                      (stats.completedTransactions / stats.totalTransactions) *
                        100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedTransactions} tamamlandı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Skoru</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.riskScore.toFixed(1)}/10
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.failedTransactions} başarısız
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">Tüm İşlemler</TabsTrigger>
              <TabsTrigger value="pending">Bekleyenler</TabsTrigger>
              <TabsTrigger value="completed">Tamamlananlar</TabsTrigger>
              <TabsTrigger value="analytics">Analitik</TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni İşlem
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Yeni İşlem Oluştur</DialogTitle>
                    <DialogDescription>
                      Gerçek zamanlı işlem kaydı oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">İşlem Tipi</Label>
                      <Select
                        value={createTransactionForm.type}
                        onValueChange={(value) =>
                          setCreateTransactionForm({
                            ...createTransactionForm,
                            type: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Para Yatırma</SelectItem>
                          <SelectItem value="withdrawal">Para Çekme</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="purchase">Satın Alma</SelectItem>
                          <SelectItem value="commission">Komisyon</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {createTransactionForm.type === "transfer" && (
                      <div>
                        <Label htmlFor="targetUserId">Hedef Kullanıcı ID</Label>
                        <Input
                          id="targetUserId"
                          value={createTransactionForm.targetUserId}
                          onChange={(e) =>
                            setCreateTransactionForm({
                              ...createTransactionForm,
                              targetUserId: e.target.value,
                            })
                          }
                          placeholder="Hedef kullanıcı ID'si"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="amount">Miktar (TRY)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={createTransactionForm.amount}
                        onChange={(e) =>
                          setCreateTransactionForm({
                            ...createTransactionForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        value={createTransactionForm.description}
                        onChange={(e) =>
                          setCreateTransactionForm({
                            ...createTransactionForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="İşlem açıklaması"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="metadata">Metadata (JSON)</Label>
                      <Textarea
                        id="metadata"
                        value={createTransactionForm.metadata}
                        onChange={(e) =>
                          setCreateTransactionForm({
                            ...createTransactionForm,
                            metadata: e.target.value,
                          })
                        }
                        placeholder='{"key": "value"}'
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button onClick={createTransaction}>İşlem Oluştur</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Dışa Aktar
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tüm İşlemler</CardTitle>
                <CardDescription>
                  Gerçek zamanlı işlem geçmişi ve durum takibi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İşlem ID</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.transactionId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize">
                              {transaction.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency,
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(transaction.riskScore)}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.timestamps.created)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bekleyen İşlemler</CardTitle>
                <CardDescription>
                  Onay bekleyen veya işlenmekte olan işlemler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İşlem ID</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Bekleyen Süre</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .filter(
                        (t) =>
                          t.status === "pending" || t.status === "processing",
                      )
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.transactionId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">
                                {transaction.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            {getRiskBadge(transaction.riskScore)}
                          </TableCell>
                          <TableCell>
                            {Math.floor(
                              (new Date().getTime() -
                                new Date(
                                  transaction.timestamps.created,
                                ).getTime()) /
                                (1000 * 60),
                            )}{" "}
                            dk
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {transaction.status === "pending" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        İşlemi İptal Et
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu işlemi iptal etmek istediğinizden
                                        emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Vazgeç
                                      </AlertDialogCancel>
                                      <AlertDialogAction>
                                        İptal Et
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tamamlanan İşlemler</CardTitle>
                <CardDescription>
                  Başarıyla tamamlanan işlem geçmişi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İşlem ID</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Bakiye Değişimi</TableHead>
                      <TableHead>Tamamlanma Tarihi</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .filter((t) => t.status === "completed")
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.transactionId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">
                                {transaction.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-muted-foreground">
                                {formatCurrency(
                                  transaction.balancesBefore.user,
                                )}{" "}
                                →{" "}
                                {formatCurrency(transaction.balancesAfter.user)}
                              </div>
                              <div
                                className={`font-semibold ${
                                  transaction.balancesAfter.user >
                                  transaction.balancesBefore.user
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.balancesAfter.user >
                                transaction.balancesBefore.user
                                  ? "+"
                                  : ""}
                                {formatCurrency(
                                  transaction.balancesAfter.user -
                                    transaction.balancesBefore.user,
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.timestamps.completed
                              ? formatDate(transaction.timestamps.completed)
                              : formatDate(transaction.timestamps.created)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>İşlem Dağılımı</CardTitle>
                  <CardDescription>İşlem tiplerinin dağılımı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      transactions.reduce(
                        (acc, t) => {
                          acc[t.type] = (acc[t.type] || 0) + 1;
                          return acc;
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div
                              className="h-2 bg-primary rounded-full"
                              style={{
                                width: `${(count / transactions.length) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Analizi</CardTitle>
                  <CardDescription>İşlem risk dağılımı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        range: "Düşük (0-3)",
                        color: "bg-green-500",
                        count: transactions.filter((t) => t.riskScore <= 3)
                          .length,
                      },
                      {
                        range: "Orta (4-6)",
                        color: "bg-yellow-500",
                        count: transactions.filter(
                          (t) => t.riskScore > 3 && t.riskScore <= 6,
                        ).length,
                      },
                      {
                        range: "Yüksek (7-10)",
                        color: "bg-red-500",
                        count: transactions.filter((t) => t.riskScore > 6)
                          .length,
                      },
                    ].map((risk) => (
                      <div
                        key={risk.range}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 ${risk.color} rounded-full`}
                          />
                          <span>{risk.range}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-muted rounded-full">
                            <div
                              className={`h-2 ${risk.color} rounded-full`}
                              style={{
                                width: `${transactions.length > 0 ? (risk.count / transactions.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {risk.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>İşlem Detayları</DialogTitle>
              <DialogDescription>
                {selectedTransaction?.transactionId} - Detaylı bilgiler
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>İşlem ID</Label>
                    <div className="font-mono text-sm">
                      {selectedTransaction.transactionId}
                    </div>
                  </div>
                  <div>
                    <Label>Üye ID</Label>
                    <div className="font-mono text-sm">
                      {selectedTransaction.memberId}
                    </div>
                  </div>
                  <div>
                    <Label>Tip</Label>
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(selectedTransaction.type)}
                      <span className="capitalize">
                        {selectedTransaction.type}
                      </span>
                      {selectedTransaction.subType && (
                        <Badge variant="outline">
                          {selectedTransaction.subType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Durum</Label>
                    <div>{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                  <div>
                    <Label>Miktar</Label>
                    <div className="text-lg font-semibold">
                      {formatCurrency(
                        selectedTransaction.amount,
                        selectedTransaction.currency,
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Risk Skoru</Label>
                    <div>{getRiskBadge(selectedTransaction.riskScore)}</div>
                  </div>
                </div>

                <div>
                  <Label>Açıklama</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {selectedTransaction.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Önceki Bakiye</Label>
                    <div className="font-semibold">
                      {formatCurrency(selectedTransaction.balancesBefore.user)}
                    </div>
                  </div>
                  <div>
                    <Label>Sonraki Bakiye</Label>
                    <div className="font-semibold">
                      {formatCurrency(selectedTransaction.balancesAfter.user)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Zaman Damgaları</Label>
                  <div className="space-y-1 text-sm">
                    <div>
                      Oluşturulma:{" "}
                      {formatDate(selectedTransaction.timestamps.created)}
                    </div>
                    {selectedTransaction.timestamps.processed && (
                      <div>
                        İşleme:{" "}
                        {formatDate(selectedTransaction.timestamps.processed)}
                      </div>
                    )}
                    {selectedTransaction.timestamps.completed && (
                      <div>
                        Tamamlanma:{" "}
                        {formatDate(selectedTransaction.timestamps.completed)}
                      </div>
                    )}
                  </div>
                </div>

                {selectedTransaction.metadata &&
                  Object.keys(selectedTransaction.metadata).length > 0 && (
                    <div>
                      <Label>Metadata</Label>
                      <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto">
                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                {selectedTransaction.ipAddress && (
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>IP: {selectedTransaction.ipAddress}</div>
                    <div>
                      User Agent:{" "}
                      {selectedTransaction.userAgent?.substring(0, 50)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
