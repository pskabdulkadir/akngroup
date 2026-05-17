import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Crown,
  ArrowLeft,
  Brain,
  Ghost,
  Music,
  Zap,
  Star,
  Quote,
  Trophy,
  Users,
  Play,
  Heart,
  Sparkles,
  Info,
  ExternalLink,
  Pause,
  Volume2,
  Shield,
  Timer,
  Wind,
  Settings2,
  RefreshCw,
  Wallet,
  Download,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SystemPresentation } from "@/components/SystemPresentation";

const BreathingExercise = () => {
  const [phase, setPhase] = useState<" Nefes Al" | " Tut" | " Nefes Ver" | "Bekle">(" Nefes Al");
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isActive) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (phase === " Nefes Al") {
              setPhase(" Tut");
              return 4;
            } else if (phase === " Tut") {
              setPhase(" Nefes Ver");
              return 4;
            } else if (phase === " Nefes Ver") {
              setPhase("Bekle");
              return 4;
            } else {
              setPhase(" Nefes Al");
              setCompletedCycles(c => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase]);

  const reset = () => {
    setIsActive(false);
    setPhase(" Nefes Al");
    setTimeLeft(4);
    setCompletedCycles(0);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-spiritual-purple/5 overflow-hidden shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Wind className="w-6 h-6 text-primary" />
          Dört Kare Nefes Tekniği
        </CardTitle>
        <CardDescription>Zihni sakinleştirmek ve stresi anında düşürmek için</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-8">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Background circles */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
          
          {/* Animated Circle */}
          <motion.div
            animate={{
              scale: phase === " Nefes Al" ? [1, 1.4] : phase === " Tut" ? 1.4 : phase === " Nefes Ver" ? [1.4, 1] : 1,
              opacity: phase === " Nefes Al" ? [0.2, 0.4] : 0.4
            }}
            transition={{ duration: 4, ease: "linear" }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          />

          <div className="relative z-10 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-black text-primary mb-1 uppercase tracking-widest"
              >
                {phase}
              </motion.div>
            </AnimatePresence>
            <div className="text-5xl font-mono font-bold text-spiritual-purple">
              {timeLeft}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!isActive ? (
            <Button onClick={() => setIsActive(true)} size="sm" className="w-32 bg-primary hover:bg-primary/90 font-bold">
              <Play className="w-4 h-4 mr-2" /> Başlat
            </Button>
          ) : (
            <Button onClick={() => setIsActive(false)} variant="outline" size="sm" className="w-32 font-bold">
              <Pause className="w-4 h-4 mr-2" /> Durdur
            </Button>
          )}
          <Button onClick={reset} variant="ghost" size="sm" className="w-32 font-bold">
            <RefreshCw className="w-3 h-3 mr-2" /> Sıfırla
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-foreground/60">
          <Badge variant="outline" className="bg-white/50">Tamamlanan: {completedCycles}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const psychologicalMethods = [
  {
    title: "Bilişsel Davranışçı Terapi (BDT)",
    description: "Düşünce biçimlerimizi değiştirerek duygusal tepkilerimizi ve davranışlarımızı iyileştirme yöntemi.",
    benefits: ["Anksiyete yönetimi", "Depresyonla mücadele", "Özsaygı artışı"],
    steps: [
      "Olumsuz düşünce kalıplarını belirleme",
      "Bu düşünceleri gerçekçi verilerle sorgulama",
      "Daha sağlıklı alternatif düşünceler geliştirme",
      "Yeni düşünce yapısını günlük hayatta uygulama"
    ]
  },
  {
    title: "Mindfulness (Farkındalık)",
    description: "Şimdiki ana yargısız bir şekilde odaklanma pratiği.",
    benefits: ["Stres azaltma", "Odaklanma artışı", "Duygusal denge"],
    steps: [
      "Rahat bir oturuş bulun",
      "Nefesinize odaklanın",
      "Düşünceler gelince onları sadece izleyin ve bırakın",
      "Tekrar nefesinize dönün"
    ]
  },
  {
    title: "Pozitif Psikoloji Uygulamaları",
    description: "Bireyin güçlü yönlerine ve yaşamın olumlu yanlarına odaklanma.",
    benefits: ["Yaşam doyumu", "Resilience (Dayanıklılık)", "Mutluluk seviyesi artışı"],
    steps: [
      "Şükür günlüğü tutun",
      "Güçlü yanlarınızı belirleyin ve kullanın",
      "İyi oluş halinizi destekleyen aktivitelere zaman ayırın"
    ]
  },
  {
    title: "EMDR (Göz Hareketleriyle Duyarsızlaştırma)",
    description: "Travmatik anıların işlenmesini sağlayan güçlü bir psikoterapi yöntemi.",
    benefits: ["Travma sonrası stres bozukluğu", "Fobiler", "Performans kaygısı"],
    steps: [
      "Güvenli yer egzersizi",
      "Hedef anının belirlenmesi",
      "Bilateral uyarım (göz hareketleri veya vuruşlar)",
      "Pozitif inanç yerleştirme"
    ]
  },
  {
    title: "ACT (Kabul ve Kararlılık Terapisi)",
    description: "Zorlayıcı duygu ve düşünceleri kabul ederek değerler odaklı yaşama yaklaşımı.",
    benefits: ["Psikolojik esneklik", "Düşünce ayrışması", "Değerlere bağlılık"],
    steps: [
      "Duyguyu fark et ve isimlendir",
      "Düşüncelerin sadece birer düşünce olduğunu gör",
      "Hayat değerlerini belirle",
      "Değerlerine uygun eyleme geç"
    ]
  }
];

const paranormalMethods = [
  {
    title: "Enerji Alanı Koruma",
    description: "Negatif enerjilerden korunmak için aura ve enerji alanı teknikleri.",
    technics: ["İmgeleme", "Tuz banyosu", "Doğal taş kullanımı"],
    advice: "İnanç ve niyet en güçlü kalkandır. Düzenli manevi temizlik önemlidir."
  },
  {
    title: "Mekan Temizliği",
    description: "Yaşanan alanlardaki ağırlık ve negatif tortuların giderilmesi.",
    technics: ["Sirke ile temizlik", "Adaçayı tütsüsü", "Ses frekansları (Ezan/Ayet okunuşu)"],
    advice: "Evinizi havalandırın ve gereksiz eşyalardan arındırın."
  },
  {
    title: "Dua ve Zikir ile Korunma",
    description: "Manevi kalelerin dualarla güçlendirilmesi.",
    technics: ["Ayetel Kürsi tilaveti", "Muavvizeteyn (Felak-Nas) sureleri", "Sabah-Akşam zikirleri"],
    advice: "Abdestli bulunmak ve niyetin halis olması korumayı artırır."
  },
  {
    title: "Sembollerin Dili ve Bilinçaltı",
    description: "Çevremizdeki görsel imgelerin ve sembollerin ruh halimize etkisi.",
    technics: ["Geometrik formların dengesi", "Renk terapisi", "Doğal yaşam imgeleri"],
    advice: "Karmaşık ve karanlık tablolardan ziyade huzur veren görselleri tercih edin."
  }
];

const meditationMusic = [
  { id: "1", title: "Deep Zen Meditation", duration: "10:00", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Healing Forest Rain", duration: "15:00", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "3", title: "Morning Serenity", duration: "08:30", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "4", title: "Tibetan Bowl Harmony", duration: "12:00", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" }
];

const motivationalQuotes = [
  { text: "Başarı, hazırlık ve fırsatın buluştuğu noktadır.", author: "Seneca" },
  { text: "Zorluklar, yetenekli insanları keşfetmek için birer bahistir.", author: "Epiktetos" },
  { text: "Bugün yapacağın küçük bir adım, yarınki büyük değişimin başlangıcıdır.", author: "James Clear" },
  { text: "Kendi ışığına güvenen, gölgelerden korkmaz.", author: "Anonim Bilgelik" },
  { text: "Zihniniz neye odaklanırsa, hayatınız o yönde gelişir.", author: "Marcus Aurelius" },
  { text: "Yapabileceğinize inanırsanız, yolun yarısını kat etmişsinizdir.", author: "Theodore Roosevelt" }
];

const saintlyWords = [
  { text: "İlim, kalpteki bir nurdur ki Allah onu dilediği kimsenin kalbine atar.", author: "İmam Malik" },
  { text: "Aşkın iğnesiyle dikilen, bir daha sökülmez.", author: "Mevlana Celaleddin Rumi" },
  { text: "Kendini tanıyan, Rabbini tanır.", author: "Hadis-i Şerif" },
  { text: "Sabır, kurtuluşun anahtarıdır.", author: "Hz. Ali (r.a.)" },
  { text: "Kalp, Allah'ın evidir; onu başkasıyla meşgul etme.", author: "Şah-ı Nakşibend" },
  { text: "Derdi dünya olanın, dünya kadar derdi olur.", author: "Yunus Emre" },
  { text: "İsteyen bir yüzü, vermeyen iki yüzü kara.", author: "Hacı Bektaş-ı Veli" },
  { text: "İhlas, ameli halkın görmesinden tasfiye etmektir.", author: "Abdülkadir Geylani" }
];

const successStories = [
  {
    name: "Sıfırdan Zirveye",
    summary: "İmkanları yokken sadece azim ve kararlılıkla dünya çapında bir yazılımcı olan bir gencin hikayesi.",
    lesson: "Kaynağın değil, arzunun büyüklüğü önemlidir."
  },
  {
    name: "Huzuru Buluş",
    summary: "Büyük bir şirketin CEO'su iken her şeyi bırakıp sade yaşama geçen ve gerçek mutluluğu bulan bir yöneticinin dönüşümü.",
    lesson: "Dışsal başarı içsel boşluğu doldurmaz."
  }
];

export default function ZahiriPanel() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPracticeDialogOpen, setIsPracticeDialogOpen] = useState(false);
  const [dynamicPanelContent, setDynamicPanelContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const response = await fetch('/api/panel-content/zahiri');
        if (response.ok) {
          const data = await response.json();
          setDynamicPanelContent(data.content || []);
        }
      } catch (error) {
        console.error("Error fetching zahiri panel content:", error);
      }
    };
    fetchDynamicContent();
  }, []);

  const displayPsychologicalMethods = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'psikolojik-metodlar' || c.category === 'Psikolojik Metodlar') && c.isActive)
      .map(c => ({
        title: c.title,
        description: c.content,
        benefits: Array.isArray(c.details?.benefits) ? c.details.benefits : [],
        steps: Array.isArray(c.details?.steps) ? c.details.steps : []
      }));
    return dynamic.length > 0 ? [...dynamic, ...psychologicalMethods] : psychologicalMethods;
  }, [dynamicPanelContent]);

  const displayParanormalMethods = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'paranormal-metodlar' || c.category === 'Paranormal Metodlar') && c.isActive)
      .map(c => ({
        title: c.title,
        description: c.content,
        technics: Array.isArray(c.details?.technics) ? c.details.technics : [],
        advice: c.details?.advice || ""
      }));
    return dynamic.length > 0 ? [...dynamic, ...paranormalMethods] : paranormalMethods;
  }, [dynamicPanelContent]);

  const displaySaintlyWords = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'evliya-sozleri' || c.category === 'Evliya Sözleri') && c.isActive)
      .map(c => ({
        text: c.content,
        author: c.title
      }));
    return dynamic.length > 0 ? [...dynamic, ...saintlyWords] : saintlyWords;
  }, [dynamicPanelContent]);

  const displayMeditationMusic = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'meditasyon-muzikleri' || c.category === 'Meditasyon Müzikleri') && c.isActive)
      .map((c, i) => ({
        id: c.id || `dyn-m-${i}`,
        title: c.title,
        duration: c.details?.duration || "0:00",
        url: c.details?.url || ""
      }));
    return dynamic.length > 0 ? [...dynamic, ...meditationMusic] : meditationMusic;
  }, [dynamicPanelContent]);

  const displaySuccessStories = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'basari-hikayeleri' || c.category === 'Başarı Hikayeleri') && c.isActive)
      .map((c, i) => ({
        name: c.title,
        summary: c.content,
        lesson: c.details?.lesson || ""
      }));
    return dynamic.length > 0 ? [...dynamic, ...successStories] : successStories;
  }, [dynamicPanelContent]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const response = await fetch(`/api/users/${user.id}`);
          const data = await response.json();
          if (data.success) {
            setUserData(data.user);
            
            // Fetch purchases
            const purchaseResponse = await fetch(`/api/products/user/${user.id}/purchases`);
            const purchaseData = await purchaseResponse.json();
            if (purchaseData.success) {
              setPurchases(purchaseData.purchases);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleMusic = (id: string) => {
    const track = meditationMusic.find(m => m.id === id);
    
    if (isPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (track) {
        audioRef.current = new Audio(track.url);
        audioRef.current.play().catch(err => {
          console.error("Audio play error:", err);
          setIsPlaying(null);
          // Show error toast if available, otherwise just console error
          alert("Ses dosyası yüklenemedi. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.");
        });
        audioRef.current.onended = () => setIsPlaying(null);
        setIsPlaying(id);
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">Ana Sayfa</Link>
              <Link to="/manevi-panel" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">Manevi Panel</Link>
              <Link to="/zahiri-panel" className="text-primary font-bold text-sm">Zahiri Panel</Link>
              <Link to="/batini-panel" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">Batıni Panel</Link>
              <Link to="/member-panel" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">Üye Paneli</Link>
              <Link to="/products" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">🛍️ Ürünler</Link>
              <button onClick={() => navigate(-1)} className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-bold cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <Brain className="w-10 h-10 mr-4 text-blue-600" />
            Zahiri Panel
          </h1>
          <p className="text-lg text-foreground/70 max-w-3xl mb-8">
            Dünyevi yaşamın iyileştirilmesi, zihinsel denge, motivasyon ve finansal özgürlük üzerine kapsamlı rehberiniz.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Financial Summary */}
            <div className="space-y-6">
              <Card className="border border-indigo-100 shadow-xl bg-white text-slate-900 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Wallet className="w-24 h-24 text-indigo-600" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 font-bold">
                    <CreditCard className="w-5 h-5" />
                    Cüzdan Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mevcut Bakiye</p>
                    <div className="text-4xl font-black text-slate-900">${userData?.wallet?.balance?.toLocaleString() || "0"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Toplam Kazanç</p>
                      <p className="text-lg font-black text-green-600">${userData?.wallet?.totalEarnings?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Ekip Bonusu</p>
                      <p className="text-lg font-black text-blue-600">${userData?.wallet?.careerBonus?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                    onClick={() => navigate("/e-wallet")}
                  >
                    Cüzdan Detayları <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                 <Card 
                  className="p-4 flex flex-col items-center text-center gap-2 hover:bg-primary/5 cursor-pointer transition-all border-primary/10 shadow-sm border-2"
                  onClick={() => navigate("/products")}
                 >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-bold text-sm">Ürün Al</span>
                 </Card>
                 <Card 
                  className="p-4 flex flex-col items-center text-center gap-2 hover:bg-orange-50 cursor-pointer transition-all border-orange-200 shadow-sm border-2"
                  onClick={() => navigate("/earnings")}
                 >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="font-bold text-sm">Analizler</span>
                 </Card>
              </div>
            </div>

            {/* Middle: Breathing Exercise */}
            <BreathingExercise />

            {/* Right: Daily Practice & Info */}
            <div className="space-y-6">
              <Card className="border border-blue-100 shadow-md bg-white text-slate-900">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 text-blue-700 font-bold">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    Günün Pratiği
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    "Zihin, kontrol edilmediğinde vahşi bir at gibidir; ancak bilinçli bir nefes ile dizginlenebilir."
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bugünkü Önerilen Aktivite:</p>
                    <div className="flex items-center gap-2 font-black text-lg text-slate-900">
                      <Timer className="w-5 h-5 text-orange-500" />
                      5 Dakika Mindful Yürüyüş
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-100"
                    onClick={() => setIsPracticeDialogOpen(true)}
                  >
                    Nasıl Yapılır?
                  </Button>
                </CardContent>
              </Card>

              {/* Practice Detail Dialog */}
              <Dialog open={isPracticeDialogOpen} onOpenChange={setIsPracticeDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl text-indigo-600">
                      <Timer className="w-6 h-6" />
                      Mindful Yürüyüş Rebeheri
                    </DialogTitle>
                    <DialogDescription>
                      Zihninizi şimdiki ana getirmek ve günlük stresi azaltmak için etkili bir yöntem.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 italic text-indigo-800 text-sm">
                      "Yürürken sadece yürüdüğünüzü bilin. Her adım bir varış noktasıdır."
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                        <p className="text-sm"><strong>Yavaşlayın:</strong> Normal yürüme hızınızın yarısına inin. Acele etmeyin, her hareketi hissedin.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                        <p className="text-sm"><strong>Ayak Hareketleri:</strong> Ayağınızın topuğunun yere değmesini, tabanının yayılmasını ve parmak uçlarınızın yerden kesilmesini dikkatle izleyin.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                        <div className="text-sm">
                          <strong>Duyulara Odaklanın:</strong> 
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Rüzgarın teninize temasını hissedin.</li>
                            <li>Çevredeki sesleri sadece "ses" olarak fark edin.</li>
                            <li>Zihninize gelen düşünceleri bir bulut gibi izleyip geçmesine izin verin.</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">4</div>
                        <p className="text-sm"><strong>Gülümseyin:</strong> Hafif bir tebessüm ile kendinize ve ana şefkat gösterin.</p>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={() => setIsPracticeDialogOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                      Anladım, Uygulayacağım
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Card className="border-emerald-100 bg-white">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">Güvenli Alan</h4>
                    <p className="text-xs text-emerald-700">Verileriniz ve ilerlemeniz uçtan uca şifrelenerek korunur.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 h-auto p-1 bg-white border border-slate-200">
            <TabsTrigger value="system" className="py-3">
              <BookOpen className="w-4 h-4 mr-2" />
              Sistem
            </TabsTrigger>
            <TabsTrigger value="my-digital" className="py-3">
              <BookOpen className="w-4 h-4 mr-2" />
              Kütüphanem
            </TabsTrigger>
            <TabsTrigger value="psychology" className="py-3">
              <Brain className="w-4 h-4 mr-2" />
              Psikoloji
            </TabsTrigger>
            <TabsTrigger value="paranormal" className="py-3">
              <Ghost className="w-4 h-4 mr-2" />
              Paranormal
            </TabsTrigger>
            <TabsTrigger value="meditation" className="py-3">
              <Music className="w-4 h-4 mr-2" />
              Meditasyon
            </TabsTrigger>
            <TabsTrigger value="motivation" className="py-3">
              <Zap className="w-4 h-4 mr-2" />
              Motivasyon
            </TabsTrigger>
            <TabsTrigger value="quotes" className="py-3">
              <Quote className="w-4 h-4 mr-2" />
              Sözler
            </TabsTrigger>
            <TabsTrigger value="success" className="py-3">
              <Trophy className="w-4 h-4 mr-2" />
              Başarı
            </TabsTrigger>
            <TabsTrigger value="saints" className="py-3">
              <Sparkles className="w-4 h-4 mr-2" />
              Evliyalar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6 pt-6 text-left">
            <Card className="bg-white text-slate-900 border border-indigo-100 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BookOpen className="w-32 h-32 rotate-12 text-indigo-600" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full text-xs font-bold tracking-wider uppercase text-indigo-700 border border-indigo-200">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Başarı Rehberi
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900">Sistem Tanıtım ve Kazanç Sunumu</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Sistem işleyişi, kazanç planı ve kariyer basamakları hakkında detaylı bilgi edinin. 
                      Bu interaktif sunum ile tüm detaylara hakim olun.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsPresentationOpen(true)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 font-black px-10 h-14 text-lg rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 shadow-indigo-100"
                  >
                    Sunumu Başlat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-digital" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.filter(p => p.product?.isDigital).length > 0 ? (
                  purchases.filter(p => p.product?.isDigital).map((purchase) => (
                    <Card key={purchase.id} className="group hover:shadow-xl transition-all border-purple-100 overflow-hidden">
                       <div className="aspect-video w-full overflow-hidden relative">
                          <img 
                            src={purchase.product?.image || "/placeholder.svg"} 
                            alt={purchase.product?.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2">
                             <Badge className="bg-purple-600">Dijital Ürün</Badge>
                          </div>
                       </div>
                       <CardHeader>
                          <CardTitle className="text-lg">{purchase.product?.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{purchase.product?.description}</CardDescription>
                       </CardHeader>
                       <CardContent className="flex flex-col gap-3">
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => {
                              if (purchase.product?.downloadUrl) {
                                window.open(purchase.product.downloadUrl, "_blank");
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" /> İndir / Eriş
                          </Button>
                          <p className="text-[10px] text-center text-muted-foreground italic">
                            Satın alma tarihi: {new Date(purchase.createdAt).toLocaleDateString("tr-TR")}
                          </p>
                       </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                     <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                     <h3 className="text-xl font-bold text-slate-500 mb-2">Henüz Dijital Ürününüz Yok</h3>
                     <p className="text-slate-400 max-w-xs mx-auto mb-6">Mağazamızdan meditasyon müzikleri veya ilim kitapları alarak kütüphanenizi oluşturun.</p>
                     <Button onClick={() => navigate("/products")} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                        Mağazaya Git
                     </Button>
                  </div>
                )}
             </div>
          </TabsContent>

          {/* Psychology Tab */}
          <TabsContent value="psychology" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayPsychologicalMethods.map((method, i) => (
                <Card key={i} className="hover:shadow-lg transition-all border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-700">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold mb-2">Faydaları:</h4>
                      <div className="flex flex-wrap gap-2">
                        {method.benefits.map((b, j) => (
                          <Badge key={j} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{b}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-2">Uygulama Adımları:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside text-foreground/80">
                        {method.steps.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Paranormal Tab */}
          <TabsContent value="paranormal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayParanormalMethods.map((method, i) => (
                <Card key={i} className="border-purple-100 hover:shadow-lg transition-all bg-gradient-to-br from-white to-purple-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      <Shield className="w-5 h-5 mr-2" />
                      {method.title}
                    </CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold mb-2">Teknikler:</h4>
                      <div className="flex flex-wrap gap-2">
                        {method.technics.map((t, j) => (
                          <Badge key={j} className="bg-purple-600 font-medium">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg border border-purple-100 italic text-sm text-purple-800">
                      <strong>Tavsiye:</strong> {method.advice}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Önemli Uyarı
              </h3>
              <p className="text-sm text-yellow-700">
                Paranormal deneyimler çoğu zaman psikolojik veya biyolojik faktörlerden kaynaklanabilir. Her durumda öncelikle bir tıp uzmanına veya psikoloğa danışmak esastır. Bu teknikler tamamlayıcı manevi pratikler olarak görülmelidir.
              </p>
            </div>
          </TabsContent>

          {/* Meditation Tab */}
          <TabsContent value="meditation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayMeditationMusic.map((music) => (
                <Card key={music.id} className="text-center hover:shadow-md transition-all">
                  <CardContent className="pt-8">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${isPlaying === music.id ? 'bg-green-100 animate-pulse' : 'bg-blue-50'}`}>
                      <Music className={`w-8 h-8 ${isPlaying === music.id ? 'text-green-600' : 'text-blue-500'}`} />
                    </div>
                    <h3 className="font-bold mb-1">{music.title}</h3>
                    <p className="text-xs text-foreground/50 mb-4">{music.duration}</p>
                    <Button
                      variant={isPlaying === music.id ? "destructive" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleMusic(music.id)}
                    >
                      {isPlaying === music.id ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" /> Durdur
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" /> Dinle
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center py-8">
              <Button variant="link" className="text-blue-600">
                Daha Fazla Müzik Keşfet <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </TabsContent>

          {/* Motivation Tab */}
          <TabsContent value="motivation" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {motivationalQuotes.map((quote, i) => (
              <Card key={i} className="border-l-4 border-l-orange-500 bg-orange-50/10">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-orange-200 mb-2" />
                  <p className="text-xl font-medium mb-4 italic">"{quote.text}"</p>
                  <p className="text-sm font-bold text-orange-600">— {quote.author}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Beautiful Words Tab */}
          <TabsContent value="quotes">
            <ScrollArea className="h-[400px] rounded-md border p-6">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold flex items-center border-b pb-2">
                       <Heart className="w-6 h-6 mr-2 text-red-500" />
                       Hayatın İçinden
                    </h3>
                    <p className="italic text-lg">"Bir insanın kalbini kırmak, Kâbe'yi yetmiş defa yıkmaktan daha büyük günahtır."</p>
                    <p className="italic text-lg">"Gülümsemek, ruhun müziğidir."</p>
                    <p className="italic text-lg">"Sevgi, her kapıyı açan tek anahtardır."</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold flex items-center border-b pb-2">
                       <Sparkles className="w-6 h-6 mr-2 text-spiritual-gold" />
                       Bilgelik Damlaları
                    </h3>
                    <p className="italic text-lg">"Dün akıllıydım, dünyayı değiştirmek istedim. Bugün bilgeyim, kendimi değiştiriyorum."</p>
                    <p className="italic text-lg">"Sana uzanan her eli tut, ama her elin seni tutmasını bekleme."</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Success Stories Tab */}
          <TabsContent value="success" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {displaySuccessStories.map((story, i) => (
                <Card key={i} className="overflow-hidden border-emerald-100 hover:shadow-lg transition-all">
                  <div className="h-2 bg-emerald-500" />
                  <CardHeader className="bg-emerald-50/50">
                    <CardTitle className="text-emerald-800">{story.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-foreground/80 leading-relaxed">{story.summary}</p>
                    <div className="p-4 bg-emerald-100/30 rounded-xl border border-emerald-200">
                      <p className="text-sm font-bold text-emerald-900">Çıkarılan Ders:</p>
                      <p className="text-emerald-700 italic">{story.lesson}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Saints Tab */}
          <TabsContent value="saints" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displaySaintlyWords.map((word, i) => (
                <Card key={i} className="bg-spiritual-gold/5 border-spiritual-gold/20">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-full bg-spiritual-gold/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-5 h-5 text-spiritual-gold" />
                    </div>
                    <p className="text-lg font-medium mb-4 italic text-spiritual-dark">"{word.text}"</p>
                    <p className="text-sm font-bold text-spiritual-gold">— {word.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <SystemPresentation open={isPresentationOpen} onOpenChange={setIsPresentationOpen} />
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 mt-12 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
             <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Kutbul Zaman
                </span>
              </div>
              <p className="text-foreground/60 mb-6 font-medium">Bütüncül Gelişim Rehberi: Manevi ve Zahiri Bir Arada</p>
              <div className="flex justify-center space-x-8 text-sm text-foreground/50">
                <span>© 2026 Kutbul Zaman</span>
                <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
                <Link to="/manevi-panel" className="hover:text-primary transition-colors">Manevi Panel</Link>
                <Link to="/destek" className="hover:text-primary transition-colors">Destek</Link>
              </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
