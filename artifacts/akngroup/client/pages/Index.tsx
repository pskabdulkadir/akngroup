import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Users,
  TrendingUp,
  Heart,
  Crown,
  Zap,
  Shield,
  Award,
  ShoppingCart,
  Eye,
  Package,
  BookOpen,
  Wallet,
  Brain,
  Network,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ChevronLeft, ChevronRight, BookOpenCheck } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  features: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  isActive: boolean;
}

const membershipPackages = [
  {
    name: "Giriş Paketi",
    price: "₺100",
    description: "Sisteme katılım için zorunlu başlangıç paketi",
    features: [
      "Ömür boyu sistem aktivasyonu",
      "Kişisel klon sayfa ve mağaza",
      "Manevi rehberlik panel erişimi",
      "Gerçek zamanlı kazanç takibi",
      "💎 Ruhsal Gelişim içerikleri",
    ],
    buttonText: "Hemen Katıl",
    popular: true,
    color: "emerald",
  },
  {
    name: "Aylık Aktiflik",
    price: "₺20",
    period: "/ay",
    description: "Sürekli kazanç için aktif kal",
    features: [
      "Komisyon hakları",
      "Tüm içerik erişimi",
      "Pasif gelir sistemi",
      "Manevi rehberlik",
    ],
    buttonText: "Aktif Ol",
    popular: true,
    color: "amber",
  },
  {
    name: "Yıllık Aktiflik",
    price: "₺200",
    period: "/yıl",
    description: "En avantajlı paket",
    features: [
      "Tüm aylık haklar",
      "2 ay ücretsiz kullanım",
      "Ek bonuslar",
      "Safiye üyelere +%1 ek pay",
    ],
    buttonText: "Yıllık Seç",
    popular: true,
    color: "indigo",
  },
];

const newFeatures = [
  {
    icon: Network,
    title: "İkili Denge Sistemi",
    description: "Sağ ve sol kol yerleştirme algoritması ile dengeli kazanç ve görsel ağaç yönetimi.",
    badge: "YENİ",
  },
  {
    icon: Zap,
    title: "Gerçek Zamanlı Komisyon",
    description: "Tüm satışlar ve kayıtlar anında hesaplanır, e-cüzdanınıza saniyeler içinde yansır.",
    badge: "HIZLI",
  },
  {
    icon: Brain,
    title: "Akıllı Rehberlik",
    description: "Manevi ve finansal gelişiminiz için Gemini destekli akıllı asistan yanınızda.",
    badge: "SMART",
  },
  {
    icon: Shield,
    title: "Güvenli E-Cüzdan",
    description: "Para yatırma, çekme ve üyeler arası transfer işlemleri en yüksek güvenlik standartlarında.",
    badge: "GÜVENLİ",
  },
];

export default function Index() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || 'ak0000001';

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Education state
  const [selectedEdu, setSelectedEdu] = useState<any>(null);
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [currentEduPage, setCurrentEduPage] = useState(0);

  const educationModules = [
    { 
      id: "tezkiye",
      title: "Tezkiye-i Nefs", 
      author: "Manevi Rehberlik",
      desc: "Nefsin yedi mertebesi ve arınma yolları üzerine derinlemesine bir yolculuk.",
      img: "https://images.unsplash.com/photo-1507502707541-f369a3b18502?auto=format&fit=crop&q=80&w=500",
      content: [
        { title: "Giriş: Nefsi Tanıma", text: "Nefis, insanın içindeki terbiye edilmesi gereken en büyük güçtür. Onu yok etmek değil, dizginlemek esastır." },
        { title: "1. Mertebe: Nefs-i Emmare", text: "Kötülüğü emreden nefis. Bu aşamada insan arzularının esiridir. Kurtuluş yolu tam bir teslimiyet ve samimiyettir." },
        { title: "Emmare'den Çıkış Yolları", text: "Tövbe ve istiğfar ile kararan kalbi aydınlatma süreci başlar. Sabır bu kapının anahtarıdır." },
        { title: "2. Mertebe: Nefs-i Levvame", text: "Kendini kınayan nefis. İnsan hata yapar ama pişmanlık duyar. Bu, uyanışın ilk işaretidir." },
        { title: "Levvame ve Gözyaşı Sırrı", text: "Pişmanlık gözyaşları, ruhun kirlerini yıkayan en kutsal sudur. Rahmet kapıları burada aralanır." },
        { title: "3. Mertebe: Nefs-i Mülhime", text: "İlham alan nefis. Kalbe doğru ile yanlışı ayırt etme yetisi verilmeye başlar." },
        { title: "İlhamın Kaynağına İniş", text: "Rabbani ilhamlar kalp aynasına düşer. Bu makamda riya ve kibrin gizli tuzaklarına dikkat edilmelidir." },
        { title: "4. Mertebe: Nefs-i Mutmainne", text: "Huzura ermiş nefis. Şüpheler bitmiş, kalbe mutlak bir güven ve sekine inmiştir." },
        { title: "Mutmain Bir Kalbin Özellikleri", text: "Dış dünyadaki fırtınalar bu kalbi sarsamaz. O, Rabbi ile tam bir ünsiyet halindedir." },
        { title: "5. Mertebe: Nefs-i Radiye", text: "Razı olan nefis. Başa gelen her şeyi Allah'tan bilip, O'ndan razı olma halidir." },
        { title: "Rıza Makamı ve Teslimiyet", text: "Acı da tatlı da bu makamda birdir. 'Lütfun da hoş, kahrın da hoş' sırrı burada yaşanır." },
        { title: "6. Mertebe: Nefs-i Mardiye", text: "Allah'ın da kendisinden razı olduğu nefis. İnsan artık her hareketiyle ilahi rızayı yansıtır." },
        { title: "Sevilen Kul Olmanın Sırrı", text: "Bu makamdaki kul, Allah'ın gören gözü, işiten kulağı ve tutan eli makamına yükselir." },
        { title: "7. Mertebe: Nefs-i Safiye (Kamile)", text: "Mükemmel ve süzülmüş nefis. İnsan-ı Kamil makamı. Tam bir saflık ve nuranilik." },
        { title: "Safiye Makamında Vuslat", text: "Varlık birliğini hissedildiği, egonun tamamen kaybolduğu ve sadece 'Hakk'ın' görüldüğü bir andır." },
        { title: "Nefis Terbiyesinde Açlık (Savm)", text: "Maddi gıdayı azaltmak, ruhun gıdasını artırır. Oruç sadece mideye değil, tüm azalarla tutulmalıdır." },
        { title: "Az Konuşmak (Sükut)", text: "Dil susunca kalp konuşur. Gereksiz kelam, kalbin enerjisini tüketir." },
        { title: "Az Uyumak (Seher)", text: "Gecenin sessizliği, ilahi tecellilerin en yoğun aktığı andır. Seher vaktinde uyanık olmak dervişin miracıdır." },
        { title: "Halvet ve Uzlet", text: "Halk içinde Hak ile beraber olmak. Zaman zaman kendi iç dünyasına çekilip iç hesaba çekilmek." },
        { title: "Sonuç: Sürekli Tekamül", text: "Tezkiye bir anlık değil, bir ömür boyu süren bir yolculuktur. Her nefeste yeni bir arınma mümkündür." }
      ]
    },
    { 
      id: "ledun",
      title: "Ledün İlmi Esasları", 
      author: "Hikmet Dersleri",
      desc: "Olayların perde arkasındaki manevi işaretleri okuma ve anlama sanatı.",
      img: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=500",
      content: [
        { title: "Zahirden Batına Geçiş", text: "Dünya bir kabuktur, hakikat içeride saklıdır. Ledün ilmi, kabuğun ardındaki nura ulaşma rehberidir." },
        { title: "Hızır (a.s) ve Musa (a.s) Kıssası", text: "Mantığın bittiği, hikmetin başladığı yer. Zahiren şer görünenin batınen hayır olma sırrı." },
        { title: "Zaman ve Mekanın Ötesi", text: "Tayy-i mekan ve tayy-i zaman kavramları. Ruhun maddeden bağımsızlaşarak manevi koordinatlarda gezişi." },
        { title: "Olayların Kodlarını Okuma", text: "Başımıza gelen 'tesadüf' olmayan her olayın bir manevi kodu vardır. Hikmet sahibi bu kodları okur." },
        { title: "Rüya ve Yakaza Alemi", text: "İşaretlerin en saf geldiği kanal. Rüyalar, ruhun ötelerle kurduğu gizemli köprülerdir." },
        { title: "Semboller Dili", text: "Kâinat bir kitap, varlıklar ise harflerdir. Kuşun ötüşünden rüzgarın esişine kadar her şey bir mesajdır." },
        { title: "İlm-i Cifir ve Ebced", text: "Sayıların ve harflerin manevi enerjileri. Kur'an'ın batıni manalarına harfler üzerinden yolculuk." },
        { title: "İnsan-ı Küçük Evren (Mikrokozmos)", text: "Büyük alemde ne varsa küçük alem olan insanda da o vardır. Kendini bilen Rabbini bilir." },
        { title: "Eşyanın Hakikati", text: "Maddenin atomik yapısından ziyade, arkasındaki ilahi kelamın titreşimini hissetmek." },
        { title: "Gayb Alemine Bakış", text: "Görünmeyenin sınırlarında dolaşmak. Kalp gözü açılanlar için gayb, bir perde olmaktan çıkar." },
        { title: "Mana Dilini Öğrenmek", text: "Lisanın bittiği yerde kalp lisanı başlar. Karşındakinin niyetini ve kalbindekini hissetme becerisi." },
        { title: "Kaderin Gizli Geometrisi", text: "Hayatımızdaki karşılaşmaların ve ayrılıkların manevi bir matematiği ve planı vardır." },
        { title: "İsmi Azam Sırrı", text: "Dua ve zikrin doruk noktası. Kelamın yaratım gücüne en yakın olduğu frekanslar." },
        { title: "Aşkın Bilgisi", text: "Zihinsel bilgi (ilim) yerine, kalple tadılan bilgi (irfan). Tatmayan bilmez." },
        { title: "Tevafuk Sanatı", text: "Hiçbir şeyin boşuna olmadığına, her parçanın muazzam bir puzzle'ın parçası olduğuna uyanış." },
        { title: "Varlık Dereceleri", text: "Mülk, melekut, ceberut ve lahut alemleri. Her alemin kendine has yasaları ve nurları." },
        { title: "Kelamın Batını", text: "Ayetlerin zahiri hükümlerinin ötesindeki evrensel şifa ve hidayet şifreleri." },
        { title: "Nur-u Muhammed-i Sırrı", text: "Yaratılışın ilk nüvesi ve tüm varlıkların kaynağı olan o eşsiz nura dair tefekkür." },
        { title: "Fena ve Beka Halleri", text: "Nefsin faniliği ve ruhun baki oluşu. Ölmeden önce ölmenin ledünni boyutları." },
        { title: "Vuslat Kapısında Hikmet", text: "İlmin nihayeti hayrettir. Hayret makamında kul, Rabbinin büyüklüğü karşısında erir." }
      ]
    },
    { 
      id: "kutup",
      title: "Zamanın Kutbu Olmak", 
      author: "Liderlik ve Vizyon",
      desc: "Kendi hayatının lideri olma, zamanı ve mekanı manevi bir şuurla yönetme eğitimi.",
      img: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=500",
      content: [
        { title: "Liderliğin Manevi Temeli", text: "Kutbul Zaman vizyonu, bir dervişin dünya üzerinde bir güneş gibi parlamasını hedefler." },
        { title: "Manevi Otorite İnşası", text: "Otorite baskıyla değil, yayılan huzur ve adaletle kurulur. Liderin en büyük gücü sevgisidir." },
        { title: "Zamanı Yönetme Sanatı", text: "Zaman akan bir sudur. Onu bereketlendirmek, anı yakalamak ve 'vaktin oğlu' (ibnu'l vakt) olmaktır." },
        { title: "2026 Vizyonu ve Strateji", text: "Gelecek, bugünden manevi bir projeksiyonla inşa edilir. Planlama, tevekkülün pratik uygulamasıdır." },
        { title: "Karizma ve Nur", text: "Maddi karizma geçicidir, kalpten yayılan celal ve cemal nuru ise kalıcıdır." },
        { title: "Karar Verme Süreçleri", text: "Önce istişare, sonra istihare, en son azmetmek. Lider, Rabbi ile istişare eden kişidir." },
        { title: "Ekip Yönetimi ve Vefa", text: "Birlikte yürünenlerle kurulan bağ, sadece dünya menfaati değil, ahiret yoldaşlığı üzerine olmalıdır." },
        { title: "Kriz Yönetiminde Sekine", text: "Zor zamanlarda sükunetini koruyan lider, çevresine de güven verir. Sabır, fırtınadaki limandır." },
        { title: "Etkileyici İletişim", text: "Sözün kalpten çıkması kulağı değil, kalbi etkilemesi demektir. Belağat, nurun kelama dökülmesidir." },
        { title: "Odağı Korumak (Huzur)", text: "Dünya karmaşası içinde hedeften sapmamak. Kalbin kıblesini daima şuurda tutmak." },
        { title: "Delegasyon ve Güven", text: "Paylaşmak, gücü artırır. Yetki vermek, yetenekli ruhları keşfedip onlara alan açmaktır." },
        { title: "Vizyoner Bakış Açısı", text: "Herkesin baktığı yere değil, herkesin bakmadığı derinliğe bakabilmek ve öngörmek." },
        { title: "Hizmetkar Liderlik", text: "Efendilik hizmetle olur. Toplumun en üstündeki kişi, en altındakine hizmet edendir." },
        { title: "Özdisiplin ve Riyazet", text: "Başkalarına hükmeden güçlüdür, kendine hükmeden ebedi galibiyet kazanır." },
        { title: "Enerji Yönetimi", text: "Vücut ve ruh enerjisini boş işlere harcamamak. Odaklanmış zikir enerjisini işine yansıtmak." },
        { title: "Maddi ve Manevi Denge", text: "Cebin dolu, kalbin boş olması. Dünyayı eliyle tutmak ama kalbine sokmamak." },
        { title: "İnovasyon ve Gelenek", text: "Kökü mazide olan ati. Kadim değerleri modern teknoloji ve yöntemlerle sunmak." },
        { title: "Otoriteyi Adaletle Taçlandırmak", text: "Adalet mülkün temelidir. Lider, en küçük haktan bile sorumlu olduğu bilincindedir." },
        { title: "İlham Veren Yaşam", text: "Sözle değil hal ile davet. Liderin yaşantısı, en büyük eğitim müfredatıdır." },
        { title: "Vuslat Liderliği", text: "Nihai amaç; sistem kurmak ve o sistemi Hakk'a ulaştıran bir vesile haline getirmektir." }
      ]
    }
  ];

  const openEducation = (module: any) => {
    setSelectedEdu(module);
    setCurrentEduPage(0);
    setIsEduOpen(true);
  };

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success && data.products) {
        setFeaturedProducts((data.products || []).slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const calculateDiscount = (product: Product) => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-emerald-700 via-amber-600 to-emerald-700 bg-clip-text text-transparent italic font-serif">
                Kutbul Zaman
              </span>
            </Link>
            
            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/" className="text-emerald-800 hover:text-emerald-600 font-bold transition-all text-sm uppercase tracking-widest border-b-2 border-emerald-500">Ana Sayfa</Link>
              <Link to="/products" className="text-slate-700 hover:text-emerald-600 font-bold transition-all text-sm uppercase tracking-wider">🛍️ Market</Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/login" className="hidden sm:block text-slate-700 hover:text-emerald-600 font-bold px-4 py-2 rounded-lg transition-colors">
                Giriş Yap
              </Link>
              <Link to="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 px-6">
                  Üye Ol
                </Button>
              </Link>
              <Link to="/member-panel" className="hidden lg:block">
                <Button variant="outline" className="border-2 border-emerald-900 text-emerald-900 font-bold hover:bg-emerald-900 hover:text-white">
                  Üye Paneli
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-100 rounded-full blur-[128px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge className="mb-8 px-6 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded-full font-black text-sm tracking-widest border-2 border-emerald-200 uppercase">
               Kutbul Zaman 2026 Vizyonu
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] text-slate-900 tracking-tighter font-serif">
              Manevi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 italic">Derinlik</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Zamanın ruhunu yakalayın. Manevi değerlerle harmanlanmış, 
              teknoloji odaklı ve şeffaf kazanç sistemiyle hayatınızı dönüştürün.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="h-16 px-12 bg-slate-900 text-xl font-black rounded-2xl hover:scale-105 transition-transform shadow-2xl">
                  Geleceği Başlat <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-black border-2 border-emerald-600 text-emerald-600 rounded-2xl hover:bg-emerald-50">
                  Giriş Yap
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="mt-24 grid md:grid-cols-4 gap-6">
            {newFeatures.map((feat, i) => (
              <Card key={i} className="border-0 shadow-xl bg-white hover:-translate-y-2 transition-all border-b-4 border-emerald-600/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-2">
                    <feat.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">4 Adımda Özgürlük</h2>
            <p className="text-slate-600 font-medium tracking-wide">Yolculuğun burada başlıyor</p>
          </div>
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { n: "01", t: "Sistem Kaydı", d: "Dakikalar içinde hesabını oluştur ve topluluğa ilk adımı at." },
              { n: "02", t: "Giriş Paketi", d: "Sisteme dahil olmak için zorunlu olan başlangıç paketini seç." },
              { n: "03", t: "Ekibini Kur", d: "İkili denge sistemi ile sağ ve sol kolunu uyum içinde büyüt." },
              { n: "04", t: "Kazanç & Huzur", d: "Hem maddi komisyonlarını al hem manevi derinleş." },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="text-8xl font-black text-indigo-50 absolute -top-10 -left-4 z-0 group-hover:text-indigo-100 transition-colors">
                  {step.n}
                </div>
                <div className="relative z-10 pt-4">
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{step.t}</h4>
                  <p className="text-slate-600 leading-relaxed font-normal">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Üçlü Sistem Mimarisi Section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">BÜTÜNSEL MİMARİ</Badge>
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-white">
              Halkasız <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">Bir Sistem</span> Yoktur
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-xl font-medium leading-relaxed">
              Kutbul Zaman, insanın üç temel ihtiyacına (Ruh, Beden, Zihin) hitap eden
              birbirine geçmiş üç devasa sistemden oluşur. Her katman, bir sonrakinin temelidir.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Manevi Yol */}
            <div id="manevi-sistem" className="p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group overflow-hidden relative shadow-2xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all" />
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-emerald-500/30 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-emerald-300">Manevi Panel</h3>
              <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                Sistemin ruhu ve can damarı. Nefis tezkesi, esma çalışmaları ve İslami ilimlerle
                kalbinizi arındırırken, topluluk zikirleri ve hatim sistemleriyle manevi bağlarınızı güçlendirin.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "Nefis Tezkiye Eğitimleri", d: "7 mertebede ruhsal yükseliş protokolleri" },
                  { t: "Canlı Hatim & Zikir", d: "Dünya genelinde eş zamanlı katılım ve dua gücü" },
                  { t: "Günlük Sünnet Uygulamaları", d: "Peygamber efendimizin (S.A.V) izinde bir yaşam" },
                  { t: "Manevi Rehberlik", d: "İlim ehli tarafından sunulan kişisel tekamül desteği" }
                ].map((f, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f.t}
                    </div>
                    <span className="text-[10px] text-slate-500 ml-7 uppercase tracking-widest leading-none">{f.d}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-14 rounded-2xl shadow-lg shadow-emerald-900/40">Hemen Ruhunu Besle</Button>
              </Link>
            </div>

            {/* Zahiri Sistem */}
            <div id="zahiri-sistem" className="p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group overflow-hidden relative shadow-2xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all" />
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-amber-500/30 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-amber-300">Zahiri Sistem</h3>
              <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                Dünya rızkının arandığı, modern ticaretin helal dairesinde en yüksek teknolojiyle buluştuğu alan.
                Beden sağlığınızı korurken, Monoline MLM sistemiyle adil ve bereketli kazanca kapı aralayın.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "Bitkisel Detoks Setleri", d: "Beden emanetini en doğal yollarla koruma" },
                  { t: "Helal Kazanç Algoritması", d: "Halkasız, adil ve sürdürülebilir gelir modeli" },
                  { t: "Bioenerji & Alan Koruma", d: "Çevresel negatif etkilerden korunma yöntemleri" },
                  { t: "E-Ticaret & Klon Mağaza", d: "Kendi dijital dükkanınızla küresel pazara açılın" }
                ].map((f, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-amber-500" /> {f.t}
                    </div>
                    <span className="text-[10px] text-slate-500 ml-7 uppercase tracking-widest leading-none">{f.d}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 font-bold h-14 rounded-2xl shadow-lg shadow-amber-900/40">Beraber Bereketlenelim</Button>
              </Link>
            </div>

            {/* Batıni Sistem */}
            <div id="batini-sistem" className="p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group overflow-hidden relative shadow-2xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all" />
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-purple-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-purple-300">Batıni Sistem</h3>
              <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                Görünenin ötesini keşfetmek isteyenler için sır kapısı. İlm-i Ledün, rüya tabiri
                ve derin hikmet öğretileriyle varlığın gizli şifrelerini çözün ve derin irfana ulaşın.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "İlm-i Ledün Okumaları", d: "Gönül gözünü açan derin hikmet dersleri" },
                  { t: "Esma-ül Hüsna Sırları", d: "İlahi isimlerin tecellilerini anlama ve yaşama" },
                  { t: "Rüya & Sembol Analizi", d: "İlahi mesajların dilini çözme rehberliği" },
                  { t: "Ebced & Varlığın Dili", d: "Sayıların ve harflerin manevi matematigi" }
                ].map((f, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-purple-500" /> {f.t}
                    </div>
                    <span className="text-[10px] text-slate-500 ml-7 uppercase tracking-widest leading-none">{f.d}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 font-bold h-14 rounded-2xl shadow-lg shadow-purple-900/40">Sırra Yolculuğa Çık</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Manevi Özellikler */}
      <section className="py-24 bg-white text-slate-900 overflow-hidden relative border-y border-slate-200">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 leading-tight">
                Ruhsal Yolculuğunuz <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-amber-600">Yenileniyor</span>
              </h2>
              <div className="space-y-6">
                  {[
                    { icon: BookOpen, t: 'Hatim Takip Sistemi', d: 'Kişisel veya grup halinde hatimlerinizi anlık takip edin. Her cüz, her harf kayıt altında.' },
                    { icon: Sparkles, t: 'Rüya Tabiri', d: 'Kutbul Zaman asistanı ile rüyalarınızın manevi derinliklerini analiz edin.' },
                    { icon: Brain, t: 'Namaz Vakitleri & Hadis', d: 'Konumunuza en uygun vakitler ve ruhunuzu besleyen günlük hadis ikramları.' },
                  ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl mb-2 text-slate-900">{item.t}</h4>
                      <p className="text-slate-500 text-base leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="bg-emerald-600/5 rounded-[3rem] p-4 border border-emerald-600/10 shadow-inner">
               <div className="relative aspect-square rounded-[2.5rem] overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700" alt="Maneviyat" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kariyer Seviyeleri */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Kutup Yıldızı Kariyer Planı</h2>
             <p className="text-slate-600 max-w-2xl mx-auto font-medium">Toplamda 7 seviye, sonsuz kazanç ve itibar.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: 1, n: "Mürid", d: "Yola yeni giren, öğrenmeye ve hizmete talip olan kişi. Sistemin temel taşı ve başlangıç noktasıdır.", color: "bg-slate-100 text-slate-800" },
              { id: 2, n: "Derviş", d: "Eğitimlerini tamamlamış, ilk ekibini kurmaya başlamış ve başkalarına rehberlik etme yolunda olan samimi yolcu.", color: "bg-emerald-100 text-emerald-800" },
              { id: 3, n: "Sufi", d: "Dengeyi kurmuş, sağ ve sol kollarında uyum sağlamış, maddi ve manevi kazancı harmanlayan tecrübeli üye.", color: "bg-amber-100 text-amber-800" },
              { id: 4, n: "Rehber", d: "Geniş bir kitleye hitap eden, eğitimlerde aktif rol alan ve topluluğun büyümesine liderlik eden yol gösterici.", color: "bg-indigo-100 text-indigo-800" },
              { id: 5, n: "Zabit", d: "Sistem disiplinini sağlayan, geniş organizasyonları yöneten ve vizyonun yayılmasında kilit rol oynayan yetkili.", color: "bg-purple-100 text-purple-800" },
              { id: 6, n: "Vezir", d: "Üst düzey stratejist. Topluluğun geleceğini planlayan ve büyük kararlarda söz sahibi olan bilge lider.", color: "bg-rose-100 text-rose-800" },
              { id: 7, n: "Kutup", d: "Zamanın ruhuna hükmeden, sistemin zirvesine ulaşmış, tam yetki ve sonsuz itibar sahibi en yüksek makam.", color: "bg-gradient-to-r from-emerald-600 to-amber-500 text-white" },
            ].map((step, i) => (
              <Dialog key={i}>
                <DialogTrigger asChild>
                  <button className={cn(
                    "px-8 py-4 border rounded-2xl shadow-sm hover:shadow-xl transition-all font-black flex items-center gap-3 hover:-translate-y-1 active:scale-95 group",
                    step.color,
                    step.id === 7 ? "border-transparent" : "bg-white border-slate-200 text-slate-700"
                  )}>
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      step.id === 7 ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                    )}>{step.id}</span>
                    {step.n}
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border-4 border-emerald-500/20 rounded-[2rem] max-w-md">
                  <DialogHeader className="text-center pt-6">
                    <div className={cn("w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl font-black mb-4", step.color)}>
                      {step.id}
                    </div>
                    <DialogTitle className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{step.n} Makamı</DialogTitle>
                    <DialogDescription className="text-lg text-slate-600 font-medium leading-relaxed pt-4">
                      {step.d}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6">
                    <Button className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold">Hedefe Kilitlen</Button>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* Ürünler */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-slate-900 border-b-4 border-indigo-200 inline-block pb-2">Premium Ürünler</h2>
          </div>
          {productsLoading ? (
            <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all rounded-3xl bg-white border border-slate-100">
                  <img src={product.image} className="w-full h-56 object-cover" alt={product.name} />
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold">{product.name}</CardTitle>
                      <span className="text-2xl font-black text-emerald-600">₺{product.price}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{product.description}</p>
                    <Link to={`/products?product=${product.id}`}>
                      <Button className="w-full h-12 rounded-2xl font-bold bg-slate-900">İncele</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* İlim ve İrfan Eğitimleri Section */}
      <section className="py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-200">
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
             <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">HİKMET KAPISI</Badge>
             <h2 className="text-5xl font-black mb-4 font-serif italic tracking-tighter text-slate-900">İlim ve İrfan Eğitimleri</h2>
             <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
               Zahiri başarı için batini derinlik şarttır. Ruhunuzu besleyen, zihninizi açan özel eğitim serilerimizle kendinizi keşfedin.
             </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {educationModules.map((edu, i) => (
              <Card key={i} className="bg-white border-slate-200 group hover:shadow-2xl transition-all overflow-hidden border-t-4 border-t-emerald-600">
                <div className="aspect-video relative overflow-hidden">
                  <img src={edu.img} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" alt={edu.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-emerald-600 text-white font-bold">{edu.author}</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-slate-900">{edu.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 leading-relaxed mb-6">{edu.desc}</p>
                  <Button 
                    onClick={() => openEducation(edu)}
                    variant="outline" 
                    className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold"
                  >
                    Eğitime Başla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Paketler */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
             <h2 className="text-5xl font-black text-slate-900 tracking-tight font-serif italic">Geleceğini Seç</h2>
             <p className="mt-4 text-emerald-700 font-bold max-w-xl mx-auto">Sana en uygun yatırım planıyla bugün başlayabilirsin.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {membershipPackages.map((pkg, i) => (
              <Card 
                key={i} 
                className={cn(
                  "h-full border border-slate-200 shadow-xl rounded-[3rem] flex flex-col group hover:-translate-y-4 transition-all duration-500 overflow-hidden relative bg-white",
                  "text-slate-900 ring-4 ring-offset-4 ring-slate-100"
                )}
              >
                <CardHeader className="text-center pt-14 relative overflow-hidden bg-slate-50/50">
                   <div className={cn(
                     "absolute top-0 right-0 px-8 py-2 font-black text-xs uppercase tracking-widest rotate-45 translate-x-8 translate-y-2",
                     pkg.color === "emerald" ? "bg-emerald-600 text-white" :
                     pkg.color === "amber" ? "bg-amber-500 text-slate-900" :
                     "bg-indigo-600 text-white"
                   )}>
                     {pkg.name === "Giriş Paketi" ? "ZORUNLU" : "SEÇKİN"}
                   </div>
                   <h3 className="text-3xl font-black mb-4 tracking-tighter text-slate-900">{pkg.name}</h3>
                   <div className="flex items-baseline justify-center gap-1">
                     <span className="text-5xl font-black tracking-tighter text-slate-900">{pkg.price}</span>
                     {pkg.period && <span className="text-lg font-bold opacity-60 text-slate-500">{pkg.period}</span>}
                   </div>
                   <p className={cn(
                     "mt-4 text-sm font-bold uppercase tracking-widest", 
                     pkg.color === "emerald" ? "text-emerald-700" :
                     pkg.color === "amber" ? "text-amber-700" :
                     "text-indigo-700"
                   )}>{pkg.description}</p>
                </CardHeader>
                <CardContent className="flex-1 px-10 py-10">
                   <div className="space-y-5">
                      {pkg.features.map((f, j) => (
                        <div key={j} className="flex gap-4 items-center">
                           <div className={cn(
                             "w-6 h-6 rounded-full flex items-center justify-center shrink-0", 
                             pkg.color === "emerald" ? "bg-emerald-50" :
                             pkg.color === "amber" ? "bg-amber-50" :
                             "bg-indigo-50"
                           )}>
                             <CheckCircle2 className={cn(
                               "w-4 h-4", 
                               pkg.color === "emerald" ? "text-emerald-600" :
                               pkg.color === "amber" ? "text-amber-600" :
                               "text-indigo-600"
                             )} />
                           </div>
                           <span className="text-sm font-semibold text-slate-700">{f}</span>
                        </div>
                      ))}
                   </div>
                </CardContent>
                <div className="px-10 pb-12 mt-auto">
                   <Link to="/register">
                      <Button className={cn(
                        "w-full h-16 rounded-[1.5rem] font-black text-xl shadow-lg transition-all border-b-4", 
                        pkg.color === "emerald" ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800" :
                        pkg.color === "amber" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 border-amber-700" :
                        "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800"
                      )}>
                        {pkg.buttonText}
                      </Button>
                   </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-xl flex items-center justify-center shadow-2xl">
                    <Crown className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-widest text-slate-900 italic font-serif">Kutbul Zaman</span>
            </div>
            <p className="text-slate-500 mb-10 max-w-lg mx-auto italic font-medium leading-relaxed">"Gaye sadece kazanmak değil, kazandığınla gönüller yapmaktır. Maneviyat ve Maddiyatın en zarif buluşma noktası."</p>
            <div className="flex justify-center gap-10 text-sm font-black text-emerald-800 uppercase tracking-[0.2em]">
               <Link to="/gizlilik" className="hover:text-emerald-600 transition-colors">Gizlilik</Link>
               <Link to="/kvkk" className="hover:text-emerald-600 transition-colors">KVKK</Link>
               <Link to="/terms" className="hover:text-emerald-600 transition-colors">Şartlar</Link>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-400 font-black tracking-widest flex flex-col md:flex-row justify-center items-center gap-4">
                <span>© 2026 KUTBUL ZAMAN - İRFAN VE TİCARET SİSTEMİ</span>
                <span className="hidden md:inline">•</span>
                <span className="text-emerald-600">AKN GLOBAL GROUP LTD</span>
            </div>
        </div>
      </footer>
      <Dialog open={isEduOpen} onOpenChange={setIsEduOpen}>
        <DialogContent className="max-w-5xl w-[98vw] md:w-full h-[95dvh] md:h-[90vh] p-0 overflow-hidden bg-white border-slate-200 shadow-2xl flex flex-col">
          <div className="flex-none p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
             <div className="pr-4 min-w-0">
               <Badge className="bg-emerald-600 text-white font-bold mb-1 shrink-0">{selectedEdu?.author}</Badge>
               <DialogTitle className="text-xl md:text-2xl font-black font-serif italic text-slate-900 line-clamp-1 truncate">{selectedEdu?.title}</DialogTitle>
             </div>
             <div className="flex items-center gap-2 md:gap-4 shrink-0">
               <div className="text-sm font-bold text-slate-500 hidden sm:block">
                 Sayfa {currentEduPage + 1} / {selectedEdu?.content?.length || 0}
               </div>
               <DialogClose asChild>
                 <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-white transition-colors h-10 w-10 text-slate-500">
                   <X className="w-6 h-6" />
                 </Button>
               </DialogClose>
             </div>
          </div>

          <div className="flex-1 overflow-hidden flex min-h-0">
             {/* Sidebar Navigation - Hidden on mobile */}
             <div className="w-64 border-r border-slate-200 bg-slate-50 hidden lg:block shrink-0 h-full">
               <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                  <div className="space-y-1">
                     {selectedEdu?.content.map((page: any, i: number) => (
                       <button
                         key={i}
                         onClick={() => setCurrentEduPage(i)}
                         className={cn(
                           "w-full text-left p-3 rounded-xl transition-all text-sm font-medium",
                           currentEduPage === i 
                             ? "bg-emerald-600 text-white shadow-lg" 
                             : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                         )}
                       >
                         {i + 1}. {page.title}
                       </button>
                     ))}
                  </div>
               </div>
             </div>

             {/* Main Content Area */}
             <div className="flex-1 flex flex-col relative bg-white min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 md:p-12 pb-24 custom-scrollbar overscroll-contain">
                  <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentEduPage}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="min-h-full"
                      >
                        <Badge className="mb-4 md:mb-6 bg-emerald-100 text-emerald-700 border-emerald-200">DERS {currentEduPage + 1}</Badge>
                        <h3 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 font-serif italic border-b-2 border-emerald-600 inline-block pb-2 text-slate-900">
                          {selectedEdu?.content[currentEduPage]?.title}
                        </h3>
                        <div className="text-base md:text-xl leading-relaxed text-slate-700 font-medium whitespace-pre-line space-y-6">
                          <p>{selectedEdu?.content[currentEduPage]?.text}</p>
                          <p className="text-slate-500 text-sm md:text-base border-l-4 border-emerald-500 pl-4 py-2 italic bg-slate-50 rounded-r-xl">
                            Bu eğitim modülü, Kutbul Zaman topluluğunun manevi mimarisini anlamak ve 2026 vizyonuna uyum sağlamak için kritik bir adımdır.
                          </p>
                          <div className="p-4 md:p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4 mt-8">
                             <BookOpenCheck className="w-6 md:w-8 h-6 md:h-8 text-emerald-600 shrink-0" />
                             <div className="text-xs md:text-sm italic text-emerald-800 leading-relaxed">
                               "İlim rütbesi rütbelerin en yücesidir. Lakin edep ile taçlanmadıkça yükten başka bir şey değildir."
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Navigation Buttons - Fixed at bottom of content area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-slate-200 flex justify-between items-center bg-white shadow-2xl shrink-0 z-10">
                   <Button 
                     disabled={currentEduPage === 0}
                     onClick={() => setCurrentEduPage(prev => prev - 1)}
                     variant="outline" 
                     className="border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                   >
                     <ChevronLeft className="mr-1 md:mr-2 w-4 h-4" /> <span className="hidden xs:inline">Önceki</span>
                   </Button>
                    
                   <div className="flex gap-1 font-bold text-emerald-600 text-sm">
                      {currentEduPage + 1} / {selectedEdu?.content?.length || 0}
                   </div>

                   <Button 
                     disabled={currentEduPage === (selectedEdu?.content?.length - 1)}
                     onClick={() => setCurrentEduPage(prev => prev + 1)}
                     className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                   >
                     <span className="hidden xs:inline">Sonraki</span> <ChevronRight className="ml-1 md:ml-2 w-4 h-4" />
                   </Button>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
