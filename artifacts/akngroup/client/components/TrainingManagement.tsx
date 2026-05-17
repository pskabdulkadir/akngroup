import React, { useState, useEffect, useRef } from "react";
import { safeDownloadBlob } from "@/lib/dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  BarChart3,
  Settings,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TrainingModule, TrainingPage, defaultTrainingModules } from "@shared/training-content";

interface TrainingStats {
  totalModules: number;
  totalPages: number;
  activeModules: number;
  totalEnrollments: number;
  completionRate: number;
  averageTimeSpent: number;
}

interface UserProgress {
  userId: string;
  userName: string;
  moduleId: string;
  moduleName: string;
  progress: number;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
}

export default function TrainingManagement() {
  const { toast } = useToast();
  
  const [modules, setModules] = useState<TrainingModule[]>(defaultTrainingModules);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<TrainingPage | null>(null);
  
  const [stats, setStats] = useState<TrainingStats>({
    totalModules: 1,
    totalPages: 30,
    activeModules: 1,
    totalEnrollments: 0,
    completionRate: 0,
    averageTimeSpent: 0,
  });

  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [trainingSettings, setTrainingSettings] = useState({
    allowGuestAccess: false,
    defaultEstimatedTime: "30 dakika",
    enableCertificates: true,
  });

  const [newModule, setNewModule] = useState({
    title: "",
    description: "",
    estimatedTime: "",
    isActive: true,
  });

  const [newPage, setNewPage] = useState({
    title: "",
    content: "",
    verses: "",
    hadiths: "",
    keyPoints: "",
  });

  useEffect(() => {
    loadTrainingStats();
    loadUserProgress();
  }, []);

  const loadTrainingStats = async () => {
    try {
      // In a real application, this would be an API call
      const mockStats: TrainingStats = {
        totalModules: modules.length,
        totalPages: modules.reduce((sum, module) => sum + module.totalPages, 0),
        activeModules: modules.filter(m => m.isActive).length,
        totalEnrollments: Math.floor(Math.random() * 100) + 20,
        completionRate: Math.floor(Math.random() * 40) + 60,
        averageTimeSpent: Math.floor(Math.random() * 30) + 15,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading training stats:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      // In a real application, this would be an API call
      const mockProgress: UserProgress[] = [
        {
          userId: "1",
          userName: "Ahmet Yılmaz",
          moduleId: "sadaka-training",
          moduleName: "Sadaka ve Hayır İşleri Eğitimi",
          progress: 85,
          startedAt: "2024-01-15T10:00:00Z",
          timeSpent: 35 * 60 * 1000, // 35 minutes in ms
        },
        {
          userId: "2",
          userName: "Fatma Öz",
          moduleId: "sadaka-training",
          moduleName: "Sadaka ve Hayır İşleri Eğitimi",
          progress: 100,
          startedAt: "2024-01-10T09:30:00Z",
          completedAt: "2024-01-12T11:15:00Z",
          timeSpent: 42 * 60 * 1000, // 42 minutes in ms
        },
        {
          userId: "3",
          userName: "Mehmet Kaya",
          moduleId: "sadaka-training",
          moduleName: "Sadaka ve Hayır İşleri Eğitimi",
          progress: 60,
          startedAt: "2024-01-20T14:20:00Z",
          timeSpent: 25 * 60 * 1000, // 25 minutes in ms
        },
      ];
      setUserProgress(mockProgress);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const createModule = async () => {
    try {
      const module: TrainingModule = {
        id: `training-${Date.now()}`,
        title: newModule.title,
        description: newModule.description,
        totalPages: 0,
        estimatedTime: newModule.estimatedTime,
        pages: [],
        isActive: newModule.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setModules(prev => [...prev, module]);
      setNewModule({ title: "", description: "", estimatedTime: "", isActive: true });
      setIsCreateModalOpen(false);
      
      toast({
        title: "Eğitim Modülü Oluşturuldu",
        description: "Yeni eğitim modülü başarıyla oluşturuldu.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitim modülü oluşturulurken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const toggleModuleStatus = async (moduleId: string) => {
    try {
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, isActive: !module.isActive, updatedAt: new Date().toISOString() }
          : module
      ));
      
      toast({
        title: "Modül Durumu Güncellendi",
        description: "Eğitim modülü durumu başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Modül durumu güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteModule = async (moduleId: string) => {
    try {
      setModules(prev => prev.filter(module => module.id !== moduleId));
      
      toast({
        title: "Modül Silindi",
        description: "Eğitim modülü başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Modül silinirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} dakika`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const downloadProgressReport = () => {
    const header = ["userId","userName","moduleId","moduleName","progress","startedAt","completedAt","timeSpent_minutes"];
    const rows = userProgress.map(p => [p.userId, p.userName, p.moduleId, p.moduleName, String(p.progress), p.startedAt, p.completedAt || "", String(Math.floor(p.timeSpent / 60000))]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const filename = `egitim-ilerleme-raporu-${new Date().toISOString().slice(0,10)}.csv`;
    safeDownloadBlob(blob, filename);
    toast({ title: "📥 Rapor indirildi", description: "İlerleme raporu CSV olarak indirildi" });
  };

  const triggerBulkImport = () => {
    fileInputRef.current?.click();
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) return [] as UserProgress[];
    const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    const idx = (k: string) => header.indexOf(k);
    const out: UserProgress[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/"([^"]|"")*"|[^,]+/g)?.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
      const toNum = (v: string) => Number(v || 0);
      const minutes = toNum(cols[idx("timeSpent_minutes")]);
      out.push({
        userId: cols[idx("userId")] || "",
        userName: cols[idx("userName")] || "",
        moduleId: cols[idx("moduleId")] || "",
        moduleName: cols[idx("moduleName")] || "",
        progress: toNum(cols[idx("progress")]) || 0,
        startedAt: cols[idx("startedAt")] || new Date().toISOString(),
        completedAt: (cols[idx("completedAt")] || undefined) as any,
        timeSpent: minutes * 60000,
      });
    }
    return out;
  };

  const onBulkFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseCsv(text);
    if (!imported.length) {
      toast({ title: "Uyarı", description: "Geçerli veri bulunamadı", variant: "destructive" });
      return;
    }
    setUserProgress(prev => [...prev, ...imported]);
    toast({ title: "✅ İçeri aktarıldı", description: `${imported.length} kayıt eklendi` });
    e.target.value = "";
  };

  const openDetailedAnalytics = () => setIsAnalyticsOpen(true);
  const openTrainingSettings = () => setIsSettingsOpen(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-8 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter mb-2 font-serif">Manevi Eğitimler</h2>
          <p className="text-emerald-100/70 font-medium italic">
            Ruhsal tekamül ve zahiri gelişim modüllerini yönetin
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold border-b-4 border-amber-800 rounded-xl px-8 h-14">
              <Plus className="w-5 h-5 mr-2" />
              Yeni İrfan Hazinesi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Eğitim Modülü Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir İslami eğitim modülü oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Modül Başlığı</Label>
                <Input
                  id="title"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Örn: Namaz Eğitimi"
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Eğitim modülünün açıklaması"
                />
              </div>
              <div>
                <Label htmlFor="estimatedTime">Tahmini Süre</Label>
                <Input
                  id="estimatedTime"
                  value={newModule.estimatedTime}
                  onChange={(e) => setNewModule(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  placeholder="Örn: 30 dakika"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newModule.isActive}
                  onCheckedChange={(checked) => setNewModule(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={createModule}>Oluştur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-emerald-50 border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black text-emerald-900 uppercase tracking-widest">Toplam Modül</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.totalModules}</div>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              {stats.activeModules} Aktif İrfan Yolculuğu
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-amber-50 border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black text-amber-900 uppercase tracking-widest">İlim Kapısı</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.totalPages}</div>
            <p className="text-xs text-amber-700 font-bold mt-1">
              Toplanılan İnci Sayısı
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black text-blue-900 uppercase tracking-widest">Kayıtlı Talep</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.totalEnrollments}</div>
            <p className="text-xs text-blue-700 font-bold mt-1">
              Eğitime Başlayan Yolcu
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-purple-50 border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-black text-purple-900 uppercase tracking-widest">Tekamül Oranı</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">%{stats.completionRate}</div>
            <p className="text-xs text-purple-700 font-bold mt-1">
              Ortalama Başarı Puanı
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="bg-white/50 backdrop-blur-md p-1 border rounded-2xl shadow-sm">
          <TabsTrigger value="modules" className="rounded-xl px-6 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">📚 Eğitim Modülleri</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white">👣 Yolculuk İlerlemeleri</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white">📊 İrfan Analitiği</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <Card className="overflow-hidden border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Aktif Eğitim Modülleri
                  </CardTitle>
                  <p className="text-emerald-100/70 text-sm mt-1">Sistemdeki tüm manevi ve zahiri eğitim yolculukları</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-emerald-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-emerald-950">Modül Adı</TableHead>
                    <TableHead className="font-bold text-emerald-950">Seviye ve Kaynak</TableHead>
                    <TableHead className="font-bold text-emerald-950">Tahmini Süre</TableHead>
                    <TableHead className="font-bold text-emerald-950">Durum</TableHead>
                    <TableHead className="text-right font-bold text-emerald-950">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id} className="hover:bg-emerald-50/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                            {module.title.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{module.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {module.totalPages} Durak
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-4 h-4 mr-1 text-emerald-500" />
                          {module.estimatedTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${module.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          <Badge className={module.isActive ? "bg-emerald-500" : "bg-slate-400"}>
                            {module.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 hover:bg-emerald-100"
                            onClick={() => window.open(`/egitim?module=${module.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:bg-blue-100"
                            onClick={() => toggleModuleStatus(module.id)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-rose-600 hover:bg-rose-100">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-bold text-slate-900">Yolculuğu Sonlandır?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu eğitim modülünü silmek üzeresiniz. Bu işlem tüm öğrenci verilerini de etkileyebilir.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteModule(module.id)}
                                  className="bg-rose-600 hover:bg-rose-700 rounded-xl"
                                >
                                  Evet, Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı İlerlemeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Eğitim Modülü</TableHead>
                    <TableHead>İlerleme</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Tamamlanma</TableHead>
                    <TableHead>Süre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProgress.map((progress, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{progress.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {progress.userId}
                        </div>
                      </TableCell>
                      <TableCell>{progress.moduleName}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">%{progress.progress}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(progress.startedAt)}</TableCell>
                      <TableCell>
                        {progress.completedAt ? (
                          <Badge className="bg-green-500">
                            {formatDate(progress.completedAt)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Devam ediyor</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatTime(progress.timeSpent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Eğitim İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Ortalama Tamamlanma Süresi</span>
                  <Badge>{stats.averageTimeSpent} dakika</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>En Popüler Modül</span>
                  <Badge>Sadaka Eğitimi</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Günlük Aktif Kullanıcı</span>
                  <Badge>{Math.floor(stats.totalEnrollments * 0.3)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Haftalık Yeni Kayıt</span>
                  <Badge>{Math.floor(stats.totalEnrollments * 0.1)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onBulkFileChange} />
                <Button className="w-full justify-start" variant="outline" onClick={downloadProgressReport}>
                  <Download className="w-4 h-4 mr-2" />
                  İlerleme Raporunu İndir
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={triggerBulkImport}>
                  <Upload className="w-4 h-4 mr-2" />
                  Toplu Kullanıcı İçe Aktar
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={openDetailedAnalytics}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Detaylı Analitik
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={openTrainingSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  Eğitim Ayarları
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detaylı Analitik</DialogTitle>
            <DialogDescription>Eğitim performansı ve kullanıcı davranışları</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between"><span>Toplam Modül</span><Badge>{stats.totalModules}</Badge></div>
            <div className="flex justify-between"><span>Toplam Sayfa</span><Badge>{stats.totalPages}</Badge></div>
            <div className="flex justify-between"><span>Aktif Modül</span><Badge>{stats.activeModules}</Badge></div>
            <div className="flex justify-between"><span>Ortalama Tamamlanma Oranı</span><Badge>%{stats.completionRate}</Badge></div>
            <Separator />
            <div>
              <div className="font-medium mb-1">Öne Çıkan Kullanıcılar</div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {userProgress.slice(0,5).map((u, i) => (
                  <li key={i}>{u.userName} — %{u.progress} • {u.moduleName}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAnalyticsOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eğitim Ayarları</DialogTitle>
            <DialogDescription>Genel eğitim yapılandırmaları</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Misafir Erişimi</div>
                <div className="text-sm text-muted-foreground">Giriş yapmadan modül önizleme</div>
              </div>
              <Switch checked={trainingSettings.allowGuestAccess} onCheckedChange={(v) => setTrainingSettings(s => ({...s, allowGuestAccess: v}))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Varsayılan Süre</div>
                <div className="text-sm text-muted-foreground">Yeni modüller için önerilen süre</div>
              </div>
              <Input value={trainingSettings.defaultEstimatedTime} onChange={(e) => setTrainingSettings(s => ({...s, defaultEstimatedTime: e.target.value}))} className="w-40" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Sertifikalar</div>
                <div className="text-sm text-muted-foreground">Tamamlayanlara sertifika ver</div>
              </div>
              <Switch checked={trainingSettings.enableCertificates} onCheckedChange={(v) => setTrainingSettings(s => ({...s, enableCertificates: v}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>İptal</Button>
            <Button onClick={() => { setIsSettingsOpen(false); toast({ title: "Ayarlar kaydedildi" }); }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
