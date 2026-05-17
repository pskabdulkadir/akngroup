import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Heart, 
  Sparkles, 
  Moon, 
  Eye, 
  Sun, 
  Flame, 
  Wind, 
  Mountain,
  BookOpen,
  Crown,
  ChevronRight,
  RefreshCw,
  Library,
  Feather,
  Compass,
  Link2,
  Dna, 
  Map, 
  Radio, 
  Activity, 
  Settings, 
  Brain, 
  Target, 
  CircleDot, 
  Shield,
  Zap,
  Star,
  CheckCircle2,
  ArrowLeft,
  Video,
  Volume2,
  VolumeX,
  Box,
  Globe,
  Waves,
  Infinity as InfinityIcon,
  Cpu,
  Key,
  HeartPulse,
  KeyRound,
  Users2,
  Handshake,
  Coins,
  TrendingUp,
  Bird,
  Flower,
  ShieldAlert,
  LockOpen,
  Anchor,
  CloudRain,
  Gem,
  Smile,
  FlameKindling
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "motion/react";

const frequencies = [
  { id: "174hz", title: "174 Hz: Güven ve Temel", freq: "174 Hz", hz: 174, color: "slate", icon: Shield, desc: "Ağrıları dindirir, organlara güvenlik hissi verir." },
  { id: "285hz", title: "285 Hz: Doku Yenileme", freq: "285 Hz", hz: 285, color: "blue", icon: Activity, desc: "Hücreleri onarır, doku hasarlarını iyileştirir." },
  { id: "396hz", title: "396 Hz: Korku ve Suçluluk", freq: "396 Hz", hz: 396, color: "red", icon: Wind, desc: "Negatif duyguları serbest bırakır, manevi engel kırıcısıdır." },
  { id: "417hz", title: "417 Hz: Değişim ve Hafifleme", freq: "417 Hz", hz: 417, color: "orange", icon: RefreshCw, desc: "Travmatik olayların etkilerini temizler, yeni başlangıçlar sağlar." },
  { id: "432hz", title: "432 Hz: Doğa Rezonansı", freq: "432 Hz", hz: 432, color: "emerald", icon: Box, desc: "Doğal evrensel akışla uyumlanma, içsel huzur." },
  { id: "528hz", title: "528 Hz: DNA Onarımı & Mucizeler", freq: "528 Hz", hz: 528, color: "indigo", icon: Sparkles, desc: "Ruhsal dönüşüm, sevgi enerjisi ve genetik kodlama." },
  { id: "639hz", title: "639 Hz: Bağlantı ve Uyum", freq: "639 Hz", hz: 639, color: "cyan", icon: Link2, desc: "İlişkileri güçlendirir, kişiler arası frekans uyumu sağlar." },
  { id: "741hz", title: "741 Hz: Sezgi ve İfade", freq: "741 Hz", hz: 741, color: "purple", icon: Eye, desc: "Toksin temizliği, aura parlatma ve saf sezgi." },
  { id: "852hz", title: "852 Hz: İlahi Düzen", freq: "852 Hz", hz: 852, color: "violet", icon: Sun, desc: "Spiritüel uyanış, üçüncü göz aktivasyonu." },
  { id: "963hz", title: "963 Hz: Tanrı Frekansı", freq: "963 Hz", hz: 963, color: "pink", icon: Star, desc: "Saf bilinç, ışık bedeni aktivasyonu ve kozmik birlik." },
  { id: "111hz", title: "111 Hz: Hücresel Gençleşme", freq: "111 Hz", hz: 111, color: "rose", icon: Heart, desc: "Hücre zarlarını güçlendirir ve gençlik enerjisini aktive eder." },
  { id: "222hz", title: "222 Hz: Spiritüel Denge", freq: "222 Hz", hz: 222, color: "teal", icon: Compass, desc: "Zihin ve beden arasındaki dualiteyi dengeler." },
  { id: "333hz", title: "333 Hz: Tezahür Gücü", freq: "333 Hz", hz: 333, color: "amber", icon: Zap, desc: "Niyetlerin fiziksel realitede hızla vücut bulmasını sağlar." },
  { id: "444hz", title: "444 Hz: Ruhani Koruma", freq: "444 Hz", hz: 444, color: "blue", icon: Shield, desc: "Negatif enerjilere karşı aşılmaz bir frekans kalkanı oluşturur." },
  { id: "555hz", title: "555 Hz: Radikal Dönüşüm", freq: "555 Hz", hz: 555, color: "purple", icon: RefreshCw, desc: "Eski kalıpları kırar ve büyük hayat değişimlerini kolaylaştırır." },
  { id: "777hz", title: "777 Hz: Ezoterik Bilgelik", freq: "777 Hz", hz: 777, color: "indigo", icon: BookOpen, desc: "Kadim bilgilere erişim ve içsel rehberlik kanallarını açar." },
  { id: "888hz", title: "888 Hz: Kozmik Bolluk", freq: "888 Hz", hz: 888, color: "emerald", icon: Crown, desc: "Refah bilincini ve evrensel bolluğu hayata çeker." },
  { id: "999hz", title: "999 Hz: Döngüsel Tamamlanma", freq: "999 Hz", hz: 999, color: "fuchsia", icon: CircleDot, desc: "Karmik döngüleri kapatır ve yeni bir spiritüel dönemi başlatır." },
  { id: "1000hz", title: "1000 Hz: Saf Berraklık", freq: "1000 Hz", hz: 1000, color: "slate", icon: Brain, desc: "Zihinsel bulanıklığı giderir ve kristal netliğinde düşünce sağlar." },
  { id: "1111hz", title: "1111 Hz: Portal Aktivasyonu", freq: "1111 Hz", hz: 1111, color: "violet", icon: Sparkles, desc: "Boyutlar arası geçiş ve yüksek benlik ile doğrudan iletişim." },
  { id: "7.83hz", title: "7.83 Hz: Schumann Rezonansı", freq: "7.83 Hz", hz: 7.83, color: "emerald", icon: Globe, desc: "Dünya'nın kalp atışı. Derin topraklanma ve doğal denge sağlar." },
  { id: "10.5hz", title: "10.5 Hz: Alfa Dalgaları", freq: "10.5 Hz", hz: 10.5, color: "blue", icon: Brain, desc: "Yaratıcı düşünce, stres yönetimi ve derin gevşeme frekansı." },
  { id: "40hz", title: "40 Hz: Gama Beyin Dalgaları", freq: "40 Hz", hz: 40, color: "indigo", icon: Zap, desc: "Yüksek bilişsel işlem, hafıza güçlendirme ve odaklanma." },
  { id: "1.618hz", title: "1.618 Hz: Altın Oran (Phi)", freq: "1.618 Hz", hz: 1.618, color: "amber", icon: InfinityIcon, desc: "Evrensel geometrik uyum. Biyofotonik dengelenme." },
  { id: "144hz", title: "144 Hz: Işık Hızı Birimi", freq: "144 Hz", hz: 144, color: "slate", icon: Sun, desc: "Yüksek bilinç geçidi. Kristalize enerji beden aktivasyonu." },
  { id: "128hz", title: "128 Hz: Somatik Topraklanma", freq: "128 Hz", hz: 128, color: "green", icon: Mountain, desc: "Vücut dokularının frekansını doğayla senkronize eder." },
  { id: "136.1hz", title: "136.1 Hz: Kozmik OM", freq: "136.1 Hz", hz: 136.1, color: "rose", icon: Heart, desc: "Güneş yılı frekansı. Kalp çakrasını evrensel sevgiye açar." },
  { id: "256hz", title: "256 Hz: Kök Bağlantısı", freq: "256 Hz", hz: 256, color: "red", icon: Shield, desc: "Hayatta kalma içgüdüsünü ve temel güven duygusunu onarır." },
  { id: "288hz", title: "288 Hz: Akışkan Yaratıcılık", freq: "288 Hz", hz: 288, color: "orange", icon: Waves, desc: "Duygusal esneklik ve yaratıcı enerjinin önündeki engellerı kaldırır." },
  { id: "320hz", title: "320 Hz: İrade Gücü", freq: "320 Hz", hz: 320, color: "yellow", icon: Flame, desc: "Kişisel güç ve özgüveni merkezler. Mide çakrasını ısıtır." },
  { id: "384hz", title: "384 Hz: Berrak İfade", freq: "384 Hz", hz: 384, color: "cyan", icon: Volume2, desc: "Kendini ifade etme ve dürüst iletişim frekansını aktive eder." },
  { id: "426hz", title: "426 Hz: İçgörü Kanalları", freq: "426 Hz", hz: 426, color: "blue", icon: Eye, desc: "Sezgisel algıyı keskinleştirir ve rüya hafızasını güçlendirir." },
  { id: "480hz", title: "480 Hz: Kozmik Taç", freq: "480 Hz", hz: 480, color: "purple", icon: Crown, desc: "İlahi olanla doğrudan bağlantı ve ruhsal içgörü." },
  { id: "147hz", title: "147 Hz: Nöral Stabilizasyon", freq: "147 Hz", hz: 147, color: "slate", icon: Activity, desc: "Sinir sistemini sakinleştirir ve elektriksel kaosu giderir." },
  { id: "727hz", title: "727 Hz: Bağışıklık Kalkanı", freq: "727 Hz", hz: 727, color: "emerald", icon: Shield, desc: "Biyolojik savunma mekanizmalarını frekansla mühürler." },
  { id: "1024hz", title: "1024 Hz: Kozmik Zeka", freq: "1024 Hz", hz: 1024, color: "indigo", icon: Cpu, desc: "Yüksek akıl ve analitik zeka katmanlarını senkronize eder." },
  { id: "2150hz", title: "2150 Hz: Epifiz Uyarıcı", freq: "2150 Hz", hz: 2150, color: "fuchsia", icon: Target, desc: "Üçüncü gözün fotonik algılama kapasitesini artırır." },
  { id: "3225hz", title: "3225 Hz: Astral Kayma", freq: "3225 Hz", hz: 3225, color: "violet", icon: Compass, desc: "Beden dışı deneyimler için astral formu stabilize eder." },
  { id: "88hz", title: "88 Hz: Sonsuzluk Döngüsü", freq: "88 Hz", hz: 88, color: "amber", icon: InfinityIcon, desc: "Zaman ve mekan ötesi süreklilik bilincine erişim." },
  { id: "369hz", title: "369 Hz: Tesla Anahtarı", freq: "369 Hz", hz: 369, color: "gold", icon: Key, desc: "Evrenin sırlarını açan Tesla matematiği tabanlı rezonans." },
  { id: "love-pure", title: "Saf Aşk Rezonansı", freq: "221.23 Hz", hz: 221.23, color: "rose", icon: HeartPulse, desc: "Venüs frekansı. Koşulsuz sevgi ve romantik çekim enerjisi sağlar." },
  { id: "family-harmony", title: "Aile ve Yuva Uyumu", freq: "194.18 Hz", hz: 194.18, color: "orange", icon: Users2, desc: "Aile bağlarını güçlendirir ve ev içindeki huzuru stabilize eder." },
  { id: "open-doors", title: "Kapalı Kapıların Açılması", freq: "417 Hz", hz: 417, color: "amber", icon: LockOpen, desc: "Hayatınızdaki tıkanıklıkları giderir ve yeni fırsat kapılarını aralar." },
  { id: "untying-knots", title: "Karmik Düğümlerin Çözümü", freq: "396 Hz", hz: 396, color: "red", icon: KeyRound, desc: "Geçmişten gelen bağları ve ruhsal düğümleri serbest bırakır." },
  { id: "aura-cleanse", title: "Derin Aura Temizliği", freq: "741 Hz", hz: 741, color: "purple", icon: Sparkles, desc: "Enerji alanındaki toksinleri ve negatif kancaları temizler." },
  { id: "abundance-flow", title: "Sonsuz Bolluk Akışı", freq: "888 Hz", hz: 888, color: "emerald", icon: Coins, desc: "Finansal tıkanıklıkları açar ve evrensel bolluk frekansına uyumlar." },
  { id: "success-business", title: "Ticari Başarı ve Kazanç", freq: "1024 Hz", hz: 1024, color: "blue", icon: TrendingUp, desc: "İş hayatında öngörü ve kazanç getiren frekans katmanlarını aktive eder." },
  { id: "relationship-healing", title: "İlişkisel Şifa", freq: "639 Hz", hz: 639, color: "cyan", icon: Handshake, desc: "Kırgınlıkları onarır ve partnerler arasındaki telepatiyi güçlendirir." },
  { id: "evil-eye-shield", title: "Nazar ve Negatif Koruma", freq: "444 Hz", hz: 444, color: "slate", icon: ShieldAlert, desc: "Kıskançlık ve kötü niyetli enerjilere karşı frekans bariyeri oluşturur." },
  { id: "fertility-creation", title: "Bereket ve Doğurganlık", freq: "210.42 Hz", hz: 210.42, color: "pink", icon: Flower, desc: "Yaratım enerjisini ve fiziksel bereketi artıran Ay rezonansı." },
  { id: "inner-child", title: "İçsel Çocuk Şifası", freq: "174 Hz", hz: 174, color: "blue", icon: Bird, desc: "Çocukluk travmalarını onarır ve temel güven duygusunu canlandırır." },
  { id: "weight-loss", title: "Metabolik Denge ve Tedavi", freq: "285 Hz", hz: 285, color: "teal", icon: Activity, desc: "Vücut sistemlerini onarır ve dokusal yenilenmeyi hızlandırır." },
  { id: "spiritual-marriage", title: "Ruhsal İzdivaç Rehberi", freq: "528 Hz", hz: 528, color: "violet", icon: Heart, desc: "Ruh eşiyle frekansal buluşmayı ve manevi birliği sağlar." },
  { id: "financial-stability", title: "Finansal Odak ve İstikrar", freq: "136.1 Hz", hz: 136.1, color: "green", icon: Anchor, desc: "Parayı elde tutma ve finansal kararlarda topraklanma sağlar." },
  { id: "forgiveness-gate", title: "Affetme ve Özgürleşme", freq: "147 Hz", hz: 147, color: "slate", icon: CloudRain, desc: "Kin ve öfke yüklerini boşaltarak ruhu hafifletir." },
  { id: "confidence-charisma", title: "Özgüven ve Karizma", freq: "320 Hz", hz: 320, color: "yellow", icon: FlameKindling, desc: "Solar pleksus aktivasyonu ile kişisel manyetizmayı artırır." },
  { id: "divine-grace", title: "İlahi Lütuf ve Şans", freq: "777 Hz", hz: 777, color: "indigo", icon: Gem, desc: "Beklenmedik mucizelerin ve ilahi yardımın kapısını açar." },
  { id: "peaceful-mind", title: "Zihinsel Huzur ve Tedavi", freq: "10.5 Hz", hz: 10.5, color: "blue", icon: Smile, desc: "Anksiyete ve stresi dindirerek berrak bir zihin yapısı sunur." },
  { id: "global-earnings", title: "Küresel Kazanç Portalı", freq: "7.83 Hz", hz: 7.83, color: "emerald", icon: Globe, desc: "Dünya rezonansıyla uyumlu geniş çaplı başarı ve tanınma." },
  { id: "eternity-love", title: "Ebedi Aşk ve Sadakat", freq: "333 Hz", hz: 333, color: "rose", icon: InfinityIcon, desc: "Çiftler arasındaki bağı ebedileştirir ve sadakati mühürler." },
];

const INITIAL_STATS = [
  { 
    title: "Kozmik Rezonans", 
    value: 963.147, 
    suffix: " Hz", 
    icon: Sun, 
    color: "text-amber-500", 
    bg: "bg-amber-50",
    description: "963 Hz, ilahi düzene geri dönüş frekansıdır. Bilinç ve evrensel birliği temsil eder.",
    longDescription: "Bu frekans, epifiz bezini uyarır ve doğrudan yüksek benlik ile iletişim kurmanızı sağlar. 'Işık Bedeni' aktivasyonunun temel taşıdır. Mevcut seviyeniz, kozmik akışla %98.6 oranında uyumludur."
  },
  { 
    title: "Aura Bütünlüğü", 
    value: 98.618, 
    suffix: "%", 
    icon: Shield, 
    color: "text-emerald-500", 
    bg: "bg-emerald-50",
    description: "Enerji alanınızın dış etkilere karşı koruma ve saflık derecesidir.",
    longDescription: "Aura bütünlüğünüz, düşük frekanslı parazitleri engelleme kapasitenizi gösterir. %98 üzerindeki değerler, 'Manevi Zırh'ın tam koruma modunda olduğunu işaret eder. Negatif kancaların bağlandığı hiçbir yırtık tespit edilmemiştir."
  },
  { 
    title: "Boyutsal Algı", 
    value: 7.23, 
    suffix: ". Seviye", 
    icon: Eye, 
    color: "text-purple-500", 
    bg: "bg-purple-50",
    description: "Bilincin eşzamanlı olarak algılayabildiği varlık katmanlarını ifade eder.",
    longDescription: "7. Seviye algı, misal alemi (astral boyut) ile fiziksel realite arasındaki perdeyi şeffaf kılar. Bu aşamada rüyalar berraklaşır ve eşzamanlılıklar (synchronicities) hayatta daha belirgin hale gelir."
  },
  { 
    title: "Işık Bedeni Katsayısı", 
    value: 1.841, 
    suffix: " φ", icon: Zap, 
    color: "text-blue-500", 
    bg: "bg-blue-50",
    description: "Fiziksel hücrelerin ışığı hapsetme ve iletme kapasitesinin altın oranla uyumu.",
    longDescription: "1.618 (Altın Oran-Phi) katsayısına yaklaşmak, biyolojik formun 'Işık Formu'na (Merkaba) dönüşüm hızını belirtir. 1.841 seviyesi, hücresel titreşimin karbon bazlı formun limitlerini zorladığını gösterir."
  }
];

const COSMIC_LOGS: Record<string, string[]> = {
  "dna-tuning": [
    "Fotonik ızgara taranıyor...",
    "Heliks sarmalları ışıkla yıkanıyor.",
    "Genetik kodlar 528Hz rezonansına alınıyor.",
    "Işık bedeni mühürlendi."
  ],
  "astral-nav": [
    "Gümüş kordon stabilize ediliyor...",
    "Misal alemi kapıları aralanıyor.",
    "Bilinç dışı katmanlar geçiliyor.",
    "Astral form 7. semaya bağlandı."
  ],
  "freq-mod": [
    "Enerji alanı torus formuna alınıyor...",
    "Negatif parazitler nötralize ediliyor.",
    "Kalp frekansı Sevgi frekansına yükseltildi.",
    "Aura kalkanı maksimum kapasitede."
  ]
};

const techniques = [
  {
    id: "dna-tuning",
    title: "DNA Işık Kodlama",
    category: "Kozmik",
    icon: Dna,
    color: "text-blue-600",
    bg: "bg-blue-100",
    description: "64 kodonluk genetik yapının ışık frekanslarıyla akort edilmesi.",
    details: "Bu teknik, hücre içindeki fotonların spin yönünü hizalayarak biyolojik saat ve ruhsal tekamül arasındaki bağı güçlendirir. 528Hz ve 432Hz çapraz frekans kullanımı önerilir.",
    steps: ["Derin alfa nefesi", "Merkaba aktivasyonu", "Fotonik hizalama", "Mühürleme"]
  },
  {
    id: "astral-nav",
    title: "Mekan-ı Lamekan Navigasyonu",
    category: "Mistik",
    icon: Map,
    color: "text-purple-600",
    bg: "bg-purple-100",
    description: "Maddi boyutun ötesindeki alemlerde bilinçli seyahat rehberi.",
    details: "Bilinç altı katmanlarından geçerek misal alemine açılan kapıları kullanma tekniği. Gümüş kordon stabilizasyonu ve semavi harita okuma becerisi kazandırır.",
    steps: ["Beden kilitleme", "Eterik ayrışma", "Rehber eşleşme", "Geri dönüş çıpası"]
  },
  {
    id: "freq-mod",
    title: "Kalbî Frekans Modülasyonu",
    category: "Enerji",
    icon: Radio,
    color: "text-rose-600",
    bg: "bg-rose-100",
    description: "Dışsal negatif etkileri bloke eden içsel kalkan sistemi.",
    details: "Kalp çakrasının yaydığı elektromanyetik alanı torus formunda genişleterek aura yırtıklarını onarma ve düşük frekanslı parazitleri temizleme sistemi.",
    steps: ["Merkezleme", "Torus genişletme", "Frekans tarama", "İzolasyon mühürü"]
  }
];

export default function BatiniPanel() {
  const [loading, setLoading] = useState(true);
  const [dynamicPanelContent, setDynamicPanelContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const response = await fetch('/api/panel-content/batini');
        if (response.ok) {
          const data = await response.json();
          setDynamicPanelContent(data.content || []);
        }
      } catch (error) {
        console.error("Error fetching batini panel content:", error);
      }
    };
    fetchDynamicContent();
  }, []);

  const displayFrequencies = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'frekanslar' || c.category === 'Frekanslar') && c.isActive)
      .map(c => ({
        id: c.id || Math.random().toString(36).substr(2, 9),
        title: c.title,
        freq: c.details?.freq || "",
        hz: parseFloat(c.details?.hz || "0"),
        color: c.details?.color || "slate",
        icon: Sparkles, // Default
        desc: c.content
      }));
    return dynamic.length > 0 ? [...dynamic, ...frequencies] : frequencies;
  }, [dynamicPanelContent]);

  const [activeTab, setActiveTab] = useState("secrets");
  const [selectedTechnique, setSelectedTechnique] = useState<any>(null);
  const [selectedStat, setSelectedStat] = useState<any>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [activePractice, setActivePractice] = useState<any>(null);
  const [activeFrequency, setActiveFrequency] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [practiceLogs, setPracticeLogs] = useState<{ id: string; text: string }[]>([]);
  const logIdCounter = useRef(0);

  const getNextLogId = (suffix = "") => {
    logIdCounter.current += 1;
    return `log-${Date.now()}-${logIdCounter.current}${suffix}`;
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [stats, setStats] = useState(INITIAL_STATS);

  useEffect(() => {
    let timer: any;
    if (activePractice || activeFrequency) {
      timer = setInterval(() => {
        setPracticeProgress((prev) => {
          if (prev >= 100) {
            if (activePractice && currentStep < activePractice.steps.length - 1) {
              setCurrentStep(currentStep + 1);
              const logs = COSMIC_LOGS[activePractice.id] || ["Hizalama devam ediyor..."];
              setPracticeLogs(prevLogs => [
                { id: getNextLogId(), text: logs[currentStep] || "Veri akışı kararlı." },
                ...prevLogs
              ].slice(0, 5));
              return 0;
            } else if (activeFrequency) {
               // Frequency loading just keeps going or finishes after 100%
               // Let's add some random logs for frequency loading
               const freqLogs = [
                 "Piksel rezonansı optimize ediliyor...",
                 "Biyometrik frekans eşleşmesi sağlandı.",
                 "Işık spektrumu genişletiliyor.",
                 "Kozmik indirme tamamlanıyor..."
               ];
               setPracticeLogs(prevLogs => [
                 { id: getNextLogId(), text: freqLogs[Math.floor(Math.random() * freqLogs.length)] },
                ...prevLogs
               ].slice(0, 5));
               return 100; // Stop at 100
            } else {
              clearInterval(timer);
              return 100;
            }
          }
          return prev + (activeFrequency ? 1 : 2); 
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [activePractice, activeFrequency, currentStep]);

  const startPractice = (tech: any) => {
    setActivePractice(tech);
    setCurrentStep(0);
    setPracticeProgress(0);
    setPracticeLogs([{ id: getNextLogId(), text: "Uygulama başlatıldı. Frekans taranıyor..." }]);
    setSelectedTechnique(null);
  };

  const handleDownloadMap = () => {
    setIsGeneratingMap(true);
    
    // Simulate complex calculation
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const celestialBodies = [
        { name: "Ay (Luna)", freq: "210.42 Hz", layer: 1, angle: 30 },
        { name: "Merkür", freq: "141.27 Hz", layer: 2, angle: 120 },
        { name: "Venüs", freq: "221.23 Hz", layer: 3, angle: 210 },
        { name: "Güneş (Sol)", freq: "126.22 Hz", layer: 4, angle: 45 },
        { name: "Mars", freq: "144.72 Hz", layer: 5, angle: 300 },
        { name: "Jüpiter", freq: "183.58 Hz", layer: 6, angle: 180 },
        { name: "Satürn", freq: "147.85 Hz", layer: 7, angle: 330 },
        { name: "Sirius (Akyıldız)", freq: "432 Hz", layer: 7, angle: 90 },
        { name: "Pleiades (Ülker)", freq: "528 Hz", layer: 7, angle: 250 },
        { name: "Arcturus", freq: "963 Hz", layer: 7, angle: 10 }
      ];

      const layers = [
        { id: 1, name: "Esfel-i Safilin Arınması", esma: "Ya Kuddüs" },
        { id: 2, name: "Nefs-i Levvame Dengeleme", esma: "Ya Tevvab" },
        { id: 3, name: "Latifeler Aktivasyonu", esma: "Ya Latif" },
        { id: 4, name: "Ruhani Vizyon Açılımı", esma: "Ya Nur" },
        { id: 5, name: "Maddi Olmayan Formlar", esma: "Ya Zahir" },
        { id: 6, name: "Boyutlar Arası Geçiş", esma: "Ya Batin" },
        { id: 7, name: "Sırat-ı Müstakim", esma: "Ya Allah" }
      ];

      // Deep Space Background
      const grad = ctx.createRadialGradient(800, 800, 100, 800, 800, 1200);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1600, 1600);

      // Starfield with variance
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * 1600;
        const y = Math.random() * 1600;
        const radius = Math.random() * 1.5;
        const opacity = Math.random();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Orbits (The 7 Spheres)
      ctx.lineWidth = 1;
      for (let i = 1; i <= 7; i++) {
        const r = i * 100 + 40;
        const layerData = layers[i-1];

        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(99, 102, 241, 0.3)";
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 - (i * 0.04)})`;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(800, 800, r, 0, Math.PI * 2);
        ctx.stroke();

        // Layer Labels (Top of the arc)
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        
        ctx.save();
        ctx.translate(800, 800 - r);
        ctx.fillText(`${i}. Kat: ${layerData.name}`, 0, -15);
        ctx.fillStyle = "#fbbf24"; // Golden amber for Esma
        ctx.font = "italic 12px serif";
        ctx.fillText(`Anahtar Zikir: ${layerData.esma}`, 0, -32);
        ctx.restore();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw Celestial Bodies and Labels
      celestialBodies.forEach(body => {
        const radius = body.layer * 100 + 40;
        const x = 800 + radius * Math.cos(body.angle * Math.PI / 180);
        const y = 800 + radius * Math.sin(body.angle * Math.PI / 180);

        // Body Glow
        const bodyGrad = ctx.createRadialGradient(x, y, 0, x, y, 15);
        bodyGrad.addColorStop(0, '#fff');
        bodyGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.5)');
        bodyGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Planet/Star label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(body.name, x + 20, y - 5);
        
        ctx.fillStyle = "#4ade80"; // Emerald/Green for health/freq
        ctx.font = "14px monospace";
        ctx.fillText(`Portal: ${body.freq}`, x + 20, y + 15);
      });

      // Center Portal (The Singularity)
      const centerGrad = ctx.createRadialGradient(800, 800, 0, 800, 800, 50);
      centerGrad.addColorStop(0, '#fff');
      centerGrad.addColorStop(0.2, '#818cf8');
      centerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(800, 800, 50, 0, Math.PI * 2);
      ctx.fill();



      // Download
      const link = document.createElement('a');
      link.download = `batini-kozmik-harita-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setIsGeneratingMap(false);
    }, 3000);
  };

  const playFrequencyAudio = (hz: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1); 

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    } catch (err) {
      console.error("Audio generation failed:", err);
    }
  };

  const startFrequency = async (freq: any) => {
    setActiveFrequency(freq);
    setPracticeProgress(0);
    setPracticeLogs([{ id: getNextLogId(), text: `${freq.freq} rezonansı başlatılıyor...` }]);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Kamera başlatılamadı:", err);
      setPracticeLogs(prev => [{ id: getNextLogId("error"), text: "Uyarı: Kamera erişimi sağlanamadı, yükleme sadece sesli devam edecek." }, ...prev]);
    }

    playFrequencyAudio(freq.hz);
  };

  const stopFrequency = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    
    if (gainNodeRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      gainNodeRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      setTimeout(() => {
        oscillatorRef.current?.stop();
        oscillatorRef.current = null;
      }, 150);
    }
    // Reward stats if completed
    if (practiceProgress >= 100) {
      setStats(prev => prev.map(s => ({
        ...s,
        value: Number((s.value + (Math.random() * 0.05)).toFixed(3))
      })));
    }
    setActiveFrequency(null);
    setIsCameraActive(false);
    setPracticeProgress(0);
  };

  const finishPractice = () => {
    setStats(prev => prev.map(s => ({
      ...s,
      value: Number((s.value + (Math.random() * 0.1)).toFixed(3))
    })));
    setActivePractice(null);
    setCurrentStep(0);
    setPracticeProgress(0);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin transition-all mx-auto mb-4 text-indigo-600" />
          <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] animate-pulse">Kozmik Frekanslar Senkronize Ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-200">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900 italic font-serif">Kutbul Zaman</span>
              </Link>
            </div>
            
            <div className="hidden lg:flex items-center space-x-6">
              <Link to="/manevi-panel" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Manevi</Link>
              <Link to="/zahiri-panel" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Zahiri</Link>
              <Link to="/batini-panel" className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b-2 border-indigo-600 pb-1">Batıni</Link>
              <Link to="/products" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Market</Link>
            </div>

            <div className="flex items-center gap-4">
               <Link to="/member-panel">
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-indigo-600">Giriş Yap</Button>
               </Link>
               <Link to="/register">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest px-6 h-10 rounded-full">Kayıt Ol</Button>
               </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-200 opacity-20 blur-[100px] rounded-full -z-10 animate-pulse" />
          <Badge className="mb-6 bg-slate-900 text-white hover:bg-slate-900 border-none uppercase tracking-[0.3em] text-[10px] font-black px-6 py-2 rounded-full shadow-xl">
            V 2.0.0 - Üst Seviye Bilinç Paneli
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 font-serif italic">
            Batıni <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600">Meta-Sistem</span>
          </h1>
          <p className="text-slate-500 max-w-3xl mx-auto text-xl leading-relaxed font-serif italic text-center">
            "Dışarıda ne varsa içeride o vardır." Kozmik ışık kodları, frekans mühendisliği ve 
            kadim sırlar ile ruhsal mimarinizi yeniden inşa edin.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedStat(stat)}
              className="cursor-pointer"
            >
              <Card className="border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.title}</h4>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {stat.value}{stat.suffix}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="secrets" value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md p-2 rounded-full border border-slate-200 shadow-xl max-w-3xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 h-14 bg-transparent gap-2">
              <TabsTrigger value="secrets" className="rounded-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                <Activity className="w-4 h-4 mr-2" />
                Dinamik Sırlar
              </TabsTrigger>
              <TabsTrigger value="heart" className="rounded-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-rose-600 data-[state=active]:text-white transition-all">
                <Radio className="w-4 h-4 mr-2" />
                Frekanslar
              </TabsTrigger>
              <TabsTrigger value="cosmic" className="rounded-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Işık Sistemi
              </TabsTrigger>
              <TabsTrigger value="techniques" className="rounded-full font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                <Settings className="w-4 h-4 mr-2" />
                Teknikler
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Secrets Content */}
          <TabsContent value="secrets" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none bg-slate-900 text-white overflow-hidden group shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 pointer-events-none" />
                 <div className="relative p-12 space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                          <Brain className="w-6 h-6 text-indigo-400" />
                       </div>
                       <div>
                          <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Haftalık Sır Akışı</h6>
                          <h3 className="text-3xl font-black tracking-tighter">İlim Şehrinin Kapıları</h3>
                       </div>
                    </div>
                    <p className="text-xl text-slate-300 leading-relaxed font-serif italic">
                       "Bilmeyen için hiçbir şey yoktur, bilen için ise her şey birer ayettir. 
                       Bugün yeryüzündeki manyetik değişim, kalbinizdeki 'Vezn' (denge) noktasını aktive ediyor."
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 pt-4">
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <h5 className="font-bold mb-2 flex items-center gap-2">
                             <Target className="w-4 h-4 text-emerald-400" />
                             Bilinç Odağı
                          </h5>
                          <p className="text-sm text-slate-400">Beşeri algının ötesinde, özneyi ve nesneyi birleştiren tevhid bakışı.</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <h5 className="font-bold mb-2 flex items-center gap-2">
                             <CircleDot className="w-4 h-4 text-rose-400" />
                             Kuantum Tecelli
                          </h5>
                          <p className="text-sm text-slate-400">Gözlemcinin niyetinin, ihtimaller denizindeki dalga fonksiyonunu çökertmesi.</p>
                       </div>
                    </div>
                 </div>
              </Card>

              <div className="space-y-6">
                 <Card className="border border-slate-100 shadow-xl bg-white p-8">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Mistik Analiz</h4>
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <div className="flex justify-between items-end">
                             <span className="text-xs font-bold text-slate-600">KALP CİLASI</span>
                             <span className="text-lg font-black text-indigo-600">%92</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between items-end">
                             <span className="text-xs font-bold text-slate-600">ÖZEL İLHAMLAR</span>
                             <span className="text-lg font-black text-rose-600">14 Kayıt</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full" />
                          </div>
                       </div>
                       <div className="pt-6 border-t border-slate-50 italic text-slate-400 text-sm leading-relaxed">
                          * Sisteminizdeki veriler güncel astro-numerolojik döngülere göre kalibre edilmiştir.
                       </div>
                    </div>
                 </Card>
              </div>
            </div>
          </TabsContent>

          {/* Frequencies Tab */}
          <TabsContent value="heart" className="animate-in fade-in duration-500 outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayFrequencies.map((f, i) => (
                  <Card key={i} className="group border border-slate-100 shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden text-center p-8 bg-white relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <f.icon className="w-16 h-16" />
                     </div>
                     <div className={`w-16 h-16 bg-${f.color}-50 text-${f.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-${f.color}-600 group-hover:text-white transition-all duration-500`}>
                        <f.icon className="w-8 h-8" />
                     </div>
                     <h3 className="text-lg font-black mb-1">{f.title}</h3>
                     <p className={`text-2xl font-black text-${f.color}-600 mb-4 tracking-tighter`}>{f.freq}</p>
                     <p className="text-slate-500 text-xs leading-relaxed font-medium mb-6">{f.desc}</p>
                     <Button 
                       onClick={() => startFrequency(f)}
                       variant="outline" 
                       className={`border-2 border-${f.color}-600 text-${f.color}-600 font-bold w-full rounded-xl hover:bg-${f.color}-50 transition-colors uppercase tracking-widest text-[10px] h-12`}
                     >
                        Frekansı Yükle
                     </Button>
                  </Card>
                ))}
             </div>
          </TabsContent>

          {/* Light System Tab */}
          <TabsContent value="cosmic" className="animate-in fade-in duration-500 outline-none">
             <Card className="border border-slate-200 shadow-2xl overflow-hidden bg-white">
                <div className="grid lg:grid-cols-2">
                   <div className="p-12 space-y-10">
                      <div>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-[0.2em] mb-4">Astral Katmanlar</Badge>
                        <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-tight">Yedi Semavat <br /> Işık Navigasyonu</h2>
                      </div>
                      <div className="space-y-6">
                         {[
                           { level: "1. Kat", name: "Esfel-i Safilin Arınması", color: "bg-slate-400" },
                           { level: "2. Kat", name: "Nefs-i Levvame Dengeleme", color: "bg-blue-400" },
                           { level: "3. Kat", name: "Latifeler Aktivasyonu", color: "bg-indigo-400" },
                           { level: "4. Kat", name: "Ruhani Vizyon Açılımı", color: "bg-purple-400" },
                           { level: "5. Kat", name: "Maddi Olmayan Formlar", color: "bg-rose-400" },
                           { level: "6. Kat", name: "Boyutlar Arası Geçiş", color: "bg-amber-400" },
                           { level: "7. Kat", name: "Sırat-ı Müstakim Işıkları", color: "bg-emerald-400" }
                         ].map((l, i) => (
                           <div key={i} className="flex items-center gap-6 group">
                              <span className="text-[10px] font-black text-slate-400 w-12">{l.level}</span>
                              <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }} 
                                   whileInView={{ width: "100%" }} 
                                   transition={{ delay: i * 0.1, duration: 1 }}
                                   className={`h-full ${l.color} opacity-30 group-hover:opacity-100 transition-opacity`}
                                 />
                              </div>
                              <span className="text-xs font-bold text-slate-700 w-40 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{l.name}</span>
                           </div>
                         ))}
                      </div>
                      <Button 
                         onClick={handleDownloadMap}
                         disabled={isGeneratingMap}
                         className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest leading-none disabled:bg-blue-300"
                      >
                         {isGeneratingMap ? (
                           <div className="flex items-center gap-3">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              HARİTA HESAPLANIYOR...
                           </div>
                         ) : "Kozmik Haritayı İndir"}
                      </Button>
                   </div>
                   <div className="bg-slate-900 relative flex items-center justify-center p-12 overflow-hidden">
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-2 border-white rounded-full animate-[spin_20s_linear_infinite]" />
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/50 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/20 rounded-full animate-[spin_60s_linear_infinite]" />
                      </div>
                      <div className="relative text-center space-y-6">
                         <Star className="w-24 h-24 text-amber-400 mx-auto animate-pulse" />
                         <h4 className="text-white text-2xl font-serif italic text-white/80">"Gökyüzündeki her bir yıldız, <br /> kalbinizdeki bir hücreye fısıldar."</h4>
                         <div className="flex justify-center gap-4">
                            <Badge variant="outline" className="text-white border-white/20">MERKABA: AKTİF</Badge>
                            <Badge variant="outline" className="text-white border-white/20">SİNYAL: GÜÇLÜ</Badge>
                         </div>
                      </div>
                   </div>
                </div>
             </Card>
          </TabsContent>

          {/* Techniques Content */}
          <TabsContent value="techniques" className="animate-in fade-in duration-500 outline-none">
             <div className="grid md:grid-cols-3 gap-8">
                {techniques.map((tech) => (
                  <Card key={tech.id} className="border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group h-full flex flex-col bg-white">
                     <div className={`p-8 ${tech.bg} flex items-center justify-center relative overflow-hidden h-48`}>
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <tech.icon className={`w-20 h-20 ${tech.color} relative z-10 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12`} />
                     </div>
                     <CardContent className="p-8 flex-1 flex flex-col text-left">
                        <Badge variant="outline" className="w-fit mb-4 uppercase tracking-[0.2em] font-black text-[10px] border-slate-200">
                           {tech.category}
                        </Badge>
                        <h3 className="text-2xl font-black mb-4 tracking-tighter">{tech.title}</h3>
                        <p className="text-slate-500 font-medium mb-8 flex-1 leading-relaxed">{tech.description}</p>
                        <Button 
                           onClick={() => setSelectedTechnique(tech)}
                           className={`w-full font-black uppercase tracking-widest h-14 rounded-2xl ${tech.bg} ${tech.color} hover:opacity-80 transition-opacity border-none shadow-sm`}
                        >
                           Tekniği İncele
                        </Button>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Technique Modal Overlay */}
      <AnimatePresence>
        {selectedTechnique && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedTechnique(null)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative z-110"
            >
               <div className={`p-12 ${selectedTechnique.bg} relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <selectedTechnique.icon className={`w-48 h-48 rotate-12 ${selectedTechnique.color}`} />
                  </div>
                  <Badge className="bg-white/40 text-slate-900 border-none mb-4 font-black uppercase tracking-[0.2em] text-[10px]">DETAYLI REHBER</Badge>
                  <h2 className="text-4xl font-black tracking-tighter mb-4">{selectedTechnique.title}</h2>
                  <p className="text-slate-600 text-lg font-serif italic max-w-md">{selectedTechnique.details}</p>
               </div>
               <div className="p-12 space-y-8">
                  <div>
                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Uygulama Adımları</h5>
                     <div className="space-y-4 text-left">
                        {selectedTechnique.steps.map((step: string, i: number) => (
                          <div key={i} className="flex items-center gap-6 p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors">
                             <span className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{i + 1}</span>
                             <span className="font-bold text-slate-700 text-lg">{step}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="pt-8 flex gap-4">
                     <Button 
                       onClick={() => startPractice(selectedTechnique)}
                       className="flex-1 h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-lg shadow-xl shadow-slate-200"
                     >
                        Uygulamayı Başlat
                     </Button>
                     <Button variant="outline" onClick={() => setSelectedTechnique(null)} className="h-16 px-8 border-2 border-slate-200 font-black uppercase tracking-widest rounded-2xl">Kapat</Button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stat Detail Modal */}
      <AnimatePresence>
        {selectedStat && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedStat(null)}
               className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative z-10"
            >
               <div className={`p-12 ${selectedStat.bg} relative overflow-hidden`}>
                  <div className="absolute -top-12 -right-12 p-8 opacity-10">
                     <selectedStat.icon className={`w-48 h-48 rotate-12 ${selectedStat.color}`} />
                  </div>
                  <Badge className="bg-slate-900 text-white border-none mb-6 font-black uppercase tracking-[0.3em] text-[10px] px-4 py-1.5 rounded-full">
                     BATINI ANALİZ DETAYI
                  </Badge>
                  <h2 className="text-4xl font-black tracking-tighter mb-4 text-slate-900">{selectedStat.title}</h2>
                  <p className="text-slate-600 text-lg font-serif italic">{selectedStat.description}</p>
               </div>
               <div className="p-12 space-y-8">
                  <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-slate-700 leading-relaxed font-medium">
                        {selectedStat.longDescription}
                     </p>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${selectedStat.bg} rounded-xl flex items-center justify-center`}>
                           <selectedStat.icon className={`w-5 h-5 ${selectedStat.color}`} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Güncel Seviye</span>
                     </div>
                     <span className="text-2xl font-black text-indigo-600">{selectedStat.value}{selectedStat.suffix}</span>
                  </div>
                  <Button 
                    onClick={() => setSelectedStat(null)}
                    className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-slate-800 transition-colors shadow-xl"
                  >
                    Anladım, Kozmik Akışa Dön
                  </Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Practice Overlay */}
      <AnimatePresence>
        {activePractice && (
          <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 sm:p-12 text-center text-white overflow-hidden">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="relative z-10 w-full max-w-4xl flex flex-col items-center"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse" />
              
              <Badge className="bg-white/10 text-white border-white/20 mb-8 uppercase tracking-[0.4em] font-black text-[11px] px-8 py-2 rounded-full backdrop-blur-md">
                AKTİF BATINİ UYGULAMA
              </Badge>

              <div className="mb-12 relative group">
                <div className="absolute inset-0 bg-white blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <activePractice.icon className={`w-32 h-32 ${activePractice.color} animate-bounce relative z-10`} />
              </div>

              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 italic font-serif">
                {activePractice.title}
              </h2>

              <p className="text-slate-400 text-xl font-medium max-w-2xl mb-16 italic opacity-80">
                "{activePractice.description}"
              </p>

              <div className="w-full max-w-xl space-y-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-left">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Mevcut Aşama</p>
                       <p className="text-2xl font-black text-white">{activePractice.steps[currentStep]}</p>
                    </div>
                    <p className="text-4xl font-black text-indigo-500 tracking-tighter">{Math.round(practiceProgress)}%</p>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                    <motion.div 
                      className={`h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${practiceProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-left space-y-2 h-32 overflow-hidden relative">
                   <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-950/50 to-transparent pointer-events-none" />
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Canlı Kozmik Akış</div>
                   <AnimatePresence mode="popLayout">
                     {practiceLogs.map((log, i) => (
                       <motion.p 
                         key={log.id}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1 - (i * 0.2), x: 0 }}
                         exit={{ opacity: 0, x: 20 }}
                         className="text-xs font-mono text-indigo-300 flex items-center gap-2"
                       >
                          <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                          {log.text}
                       </motion.p>
                     ))}
                   </AnimatePresence>
                </div>
              </div>

              {currentStep === activePractice.steps.length - 1 && practiceProgress >= 100 ? (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-20 space-y-6 w-full max-w-md"
                >
                  <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[32px] shadow-2xl flex items-center gap-6 group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle2 className="w-24 h-24" />
                     </div>
                     <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 relative z-10">
                        <Sparkles className="w-10 h-10 text-white" />
                     </div>
                     <div className="text-left relative z-10">
                        <h4 className="text-2xl font-black tracking-tight">Hizalama Tamam!</h4>
                        <p className="text-emerald-50 text-sm font-medium">Bilinç katsayınız +1.618 oranında normalize edildi.</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Button 
                       onClick={finishPractice}
                       className="h-16 bg-white text-slate-900 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-slate-100 transition-colors shadow-xl"
                     >
                       Sisteme Dön
                     </Button>
                     <Button 
                       className="h-16 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl text-xs border-none shadow-xl shadow-indigo-500/20"
                     >
                       Sertifika Al
                     </Button>
                  </div>
                </motion.div>
              ) : (
                <Button 
                   variant="ghost" 
                   onClick={finishPractice}
                   className="mt-20 text-white/40 hover:text-white transition-colors uppercase tracking-widest text-xs font-black"
                >
                  Uygulamayı Durdur
                </Button>
              )}
            </motion.div>

            {/* Background Symbols */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="absolute top-10 left-10"><Sun className="w-64 h-64 animate-spin-slow" /></div>
              <div className="absolute bottom-10 right-10"><Moon className="w-64 h-64 animate-pulse" /></div>
              <div className="absolute top-1/2 right-10"><Star className="w-48 h-48 animate-bounce-slow" /></div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Frequency Loading Overlay */}
      <AnimatePresence>
        {activeFrequency && (
          <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Camera Feed Background */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              className={`absolute inset-0 w-full h-full object-cover opacity-60 grayscale scale-110 blur-[2px] ${isCameraActive ? 'block' : 'hidden'}`}
            />
            
            {/* Cosmic Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1 }}
               className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center"
            >
              <Badge className="bg-indigo-600 text-white border-none mb-6 animate-pulse uppercase tracking-[0.5em] font-black text-[10px] px-8 py-2 rounded-full">
                 FREKANS YÜKLEMESİ AKTİF
              </Badge>

              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-4 text-center italic font-serif">
                 {activeFrequency.freq}
              </h2>
              <p className="text-indigo-300 text-lg font-bold mb-12 uppercase tracking-[0.2em]">{activeFrequency.title}</p>

              <div className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-white/10 shadow-2xl space-y-10">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Yükleme Durumu</p>
                          <p className="text-white font-bold">{practiceProgress >= 100 ? "Rezonans Sabitlendi" : "Hücresel Senkronizasyon..."}</p>
                       </div>
                       <p className="text-5xl font-black text-indigo-500 tracking-tighter">{Math.round(practiceProgress)}%</p>
                    </div>
                    <Progress value={practiceProgress} className="h-2 bg-white/10" />
                 </div>

                 {/* Logs Area */}
                 <div className="h-40 overflow-hidden font-mono text-[11px] text-indigo-200/60 bg-black/40 rounded-2xl p-6 border border-white/5">
                    <AnimatePresence mode="popLayout">
                       {practiceLogs.map((log) => (
                          <motion.p 
                             key={log.id} 
                             initial={{ opacity: 0, x: -10 }} 
                             animate={{ opacity: 1, x: 0 }}
                             className="mb-2 flex items-start gap-2"
                          >
                             <span className="text-indigo-500">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                             {log.text}
                          </motion.p>
                       ))}
                    </AnimatePresence>
                 </div>

                 {practiceProgress >= 100 ? (
                   <div className="space-y-4">
                     <div className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                           <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                           <p className="text-white font-black uppercase text-xs tracking-widest">Yükleme Başarılı</p>
                           <p className="text-emerald-300 text-[10px]">Işık bedeniniz {activeFrequency.freq} rezonansına başarıyla kalibre edildi.</p>
                        </div>
                     </div>
                     <Button 
                       onClick={stopFrequency}
                       className="w-full h-16 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-200 transition-all text-lg"
                     >
                       Sisteme Geri Dön
                     </Button>
                   </div>
                 ) : (
                   <Button 
                      onClick={stopFrequency}
                      variant="ghost" 
                      className="w-full h-16 text-white/40 hover:text-white uppercase tracking-[0.4em] font-black text-xs"
                   >
                     İptal Et
                   </Button>
                 )}
              </div>
            </motion.div>

            {/* Visualizer Effect (Fake) */}
            <div className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-center gap-1 px-4 opacity-30">
               {[...Array(50)].map((_, i) => (
                 <motion.div 
                   key={i}
                   animate={{ height: [20, Math.random() * 80 + 20, 20] }}
                   transition={{ repeat: Infinity, duration: 0.5 + Math.random() }}
                   className="w-full bg-indigo-500 rounded-t-sm"
                 />
               ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-100 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="p-3 bg-slate-900 rounded-2xl">
               <Crown className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-black font-serif italic tracking-tighter">Kutbul Zaman</span>
          </div>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed mb-12 font-medium">
             Batıni sistem, ruhun özgürlüğü için tasarlanmış bir üst-gerçeklik arayüzüdür. 
             Veriler kadim kaynaklar ve modern kozmik hesaplamalarla harmonize edilmiştir.
          </p>
          <div className="flex flex-wrap justify-center gap-10 mb-16">
            {['Gizlilik', 'Şartlar', 'Kozmik Rehber', 'Bize Ulaşın'].map((item) => (
              <Link key={item} to="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <div className="pt-10 border-t border-slate-50">
             <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] leading-loose">
                AUTHENTICATED BY SPIRITUAL TECHNOLOGY UNIT<br />
                © 2026 AKN GLOBAL - BEYOND THE HORIZON
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* BATINI SYSTEM V2.0 - AKN GLOBAL */
