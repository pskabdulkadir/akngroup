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
  Crown,
  Users,
  TrendingUp,
  Heart,
  Shield,
  Award,
  Star,
  Zap,
  CheckCircle,
  Play,
  MessageCircle,
  Phone,
  Mail,
  Share2,
  Copy,
  Twitter,
  Facebook,
  Instagram,
  ExternalLink,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { SystemPresentation } from "@/components/SystemPresentation";

interface ClonePageData {
  clonePage: {
    userId: string;
    slug: string;
    isActive: boolean;
    visitCount: number;
    conversionCount: number;
    customizations: {
      headerImage?: string;
      testimonials?: string[];
      customMessage?: string;
    };
  };
  user: {
    fullName: string;
    memberId: string;
    referralCode: string;
    careerLevel: {
      name: string;
      description: string;
      commissionRate: number;
    };
  };
}

const membershipPackages = [
  {
    name: "Giriş Paketi",
    price: "$100",
    description: "Sisteme başlangıç için ideal",
    features: [
      "Sistem aktivasyonu",
      "Kişisel klon sayfa",
      "Manevi panel erişimi",
      "Gerçek kazanç takibi",
    ],
    buttonText: "Başla",
    popular: false,
  },
  {
    name: "Aylık Aktiflik",
    price: "$20",
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
  },
  {
    name: "Yıllık Aktiflik",
    price: "$200",
    period: "/yıl",
    description: "En avantajlı paket",
    features: [
      "Tüm aylık haklar",
      "%15 indirim",
      "Ek bonuslar",
      "Safiye üyelere +%1",
    ],
    buttonText: "Yıllık Seç",
    popular: false,
  },
];

const careerLevels = [
  {
    name: "Nefs-i Emmare",
    description: "Kötülüğü emreden nefis",
    commission: "%2",
    pasive: "0%",
  },
  {
    name: "Nefs-i Levvame",
    description: "Kendini kınayan nefis",
    commission: "%3",
    pasive: "0.5%",
  },
  {
    name: "Nefs-i Mülhime",
    description: "İlham alan nefis",
    commission: "%4",
    pasive: "1%",
  },
  {
    name: "Nefs-i Mutmainne",
    description: "Tatmin olmuş, huzurlu nefis",
    commission: "%5",
    pasive: "1.5%",
  },
  {
    name: "Nefs-i Râziye",
    description: "Allah'ın takdirine razı olan nefis",
    commission: "%6",
    pasive: "2%",
  },
  {
    name: "Nefs-i Mardiyye",
    description: "Allah'ın razı olduğu nefis",
    commission: "%8",
    pasive: "3%",
  },
  {
    name: "Nefs-i Kâmile",
    description: "Olgunlaşmış, kemale ermiş nefis",
    commission: "%12",
    pasive: "4%",
  },
];

const features = [
  {
    icon: Users,
    title: "💎 Ruhsal Gelişim",
    description: "7 seviye derinlik komisyonu + pasif gelir havuzu",
  },
  {
    icon: TrendingUp,
    title: "Otomatik Sıralama",
    description: "Ruhsal Gelişim sisteminde otomatik sıralı yerleştirme",
  },
  {
    icon: Shield,
    title: "100.000 Kişi Kapasitesi",
    description: "Büyük ölçekli Ruhsal Gelişim Ağı desteği",
  },
  {
    icon: Heart,
    title: "Manevi Gelişim",
    description: "Ruhsal ve finansal büyüme bir arada",
  },
];

const testimonials = [
  {
    name: "Ayşe K.",
    location: "İstanbul",
    text: "Kutbul Zaman ile hem manevi hem finansal gelişimimi sağladım. 6 ayda 50 kişilik ekip oluşturdum.",
    rating: 5,
  },
  {
    name: "Mehmet S.",
    location: "Ankara",
    text: "Nefis mertebelerini öğrenmek ve aynı zamanda gelir elde etmek harika. Herkese tavsiye ederim.",
    rating: 5,
  },
  {
    name: "Fatma Y.",
    location: "İzmir",
    text: "Ruhsal Gelişim sistemi sayesinde pasif gelir elde ediyorum. Manevi gelişim içerikleri çok faydalı.",
    rating: 5,
  },
];

export default function ClonePage() {
  const { slug } = useParams();

  // Vivid Spiritual Theme Configuration
  const vividTheme = {
    gradientBg: "bg-white",
    cardBg: "bg-white border-purple-200 shadow-xl",
    buttonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30",
  };
  const navigate = useNavigate();
  const [pageData, setPageData] = useState<ClonePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchClonePageData(slug);
      trackVisit(slug);
    }
  }, [slug]);

  const fetchClonePageData = async (pageSlug: string) => {
    try {
      const response = await fetch(`/api/clone/${pageSlug}`);
      if (response.ok) {
        const data = await response.json();
        setPageData(data);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching clone page:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const trackVisit = async (pageSlug: string) => {
    try {
      await fetch(`/api/clone/${pageSlug}/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error tracking visit:", error);
    }
  };

  const handleJoinClick = () => {
    if (pageData?.user) {
      navigate(`/register?sponsor=${pageData.user.referralCode}`);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${vividTheme.gradientBg}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Sayfa yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${vividTheme.gradientBg}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sayfa Bulunamadı</h1>
          <Link to="/">
            <Button>Ana Sayfaya Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${vividTheme.gradientBg}`}>
      {/* Navigation */}
      <nav className="border-b border-slate-200 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
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
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Giriş Yap
                </Button>
              </Link>
              <Button size="sm" onClick={handleJoinClick}>
                Katıl
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-spiritual-purple/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <Badge className="mb-4">
                {pageData?.user?.careerLevel?.name || "Member"} - Sponsor:{" "}
                {pageData?.user?.fullName}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-spiritual-purple to-spiritual-gold bg-clip-text text-transparent">
                Manevi Rehberim
              </span>
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-white">
              {pageData?.clonePage?.customizations?.customTitle || ""}
            </h2>
            <p className="text-xl text-slate-100 mb-6 max-w-3xl mx-auto">
              {pageData?.clonePage?.customizations?.customMessage ||
                `${pageData?.user?.fullName} size özel davet ile katılın. Manevi gelişim ve finansal özgürlük yolculuğuna birlikte başlayalım.`}
            </p>
            <p className="text-slate-200 mb-8 max-w-2xl mx-auto">
              7 seviyeli nefis mertebeleri sistemi ile hem ruhsal hem de
              finansal gelişim. Ruhsal Gelişim sistemi ile pasif gelir fırsatları.
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setIsPresentationOpen(true)}
                  className="bg-spiritual-gold hover:bg-spiritual-gold/90 text-white"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Sistem Sunumunu İzle
                </Button>
                <Button
                  size="lg"
                  onClick={handleJoinClick}
                  className="bg-gradient-to-r from-primary to-spiritual-purple hover:opacity-90 relative"
                >
                <Zap className="w-5 h-5 mr-2" />
                {pageData?.user?.referralCode} Sponsoruyla Katıl
                <div className="absolute -top-2 -right-2 bg-spiritual-gold text-white text-xs px-2 py-1 rounded-full">
                  Sponsor Kayıtlı
                </div>
              </Button>
              <Link to="/kazanc">
                <Button size="lg" variant="outline">
                  <Play className="w-5 h-5 mr-2" />
                  Kazançları Görüntüle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsor Information */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Sponsorunuz: {pageData.user.fullName}
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              {pageData.user.careerLevel?.description || "Aktif Üye"} seviyesindeki rehberiniz
              ile manevi ve finansal yolculuğunuza başlayın.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className={`text-center ${vividTheme.cardBg}`}>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Kariyer Seviyesi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary mb-2">
                  {pageData.user.careerLevel?.name || "Member"}
                </p>
                <p className="text-sm text-muted-foreground">
                  %{pageData.user.careerLevel?.commissionRate || 0} komisyon oranı
                </p>
              </CardContent>
            </Card>

            <Card className={`text-center ${vividTheme.cardBg}`}>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-spiritual-gold to-spiritual-emerald rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Deneyim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-spiritual-gold mb-2">
                  Uzman
                </p>
                <p className="text-sm text-muted-foreground">
                  Size özel rehberlik sunacak
                </p>
              </CardContent>
            </Card>

            <Card className={`text-center ${vividTheme.cardBg}`}>
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-spiritual-emerald to-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Destek</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-spiritual-emerald mb-2">
                  7/24
                </p>
                <p className="text-sm text-muted-foreground">
                  Sürekli destek ve rehberlik
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Member Info & Sharing Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Member Info */}
            <Card className={`${vividTheme.cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-primary" />
                  Sponsor Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İsim:</span>
                  <span className="font-medium">{pageData.user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Üye ID:</span>
                  <span className="font-medium font-mono">
                    {pageData.user.memberId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sponsor Kodu:</span>
                  <span className="font-medium font-mono">
                    {pageData.user.referralCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Kariyer Seviyesi:
                  </span>
                  <Badge variant="outline">
                    {pageData.user.careerLevel.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sharing Card */}
            <Card className={`${vividTheme.cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="w-5 h-5 mr-2 text-primary" />
                  Bu Sayfayı Paylaş
                </CardTitle>
                <CardDescription>
                  Arkadaşlarınızı davet edin ve komisyon kazanın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Copy Link */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-2 bg-muted rounded border text-sm font-mono">
                    {window.location.href}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link kopyalandı!");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Social Media Sharing */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `${pageData.user.fullName} üzerinden Kutbul Zaman'a katılın! Manevi gelişim ve finansal özgürlük için: ${window.location.href}`;
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                        "_blank",
                      );
                    }}
                  >
                    <Twitter className="w-4 h-4 mr-1" />
                    Twitter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `${pageData.user.fullName} üzerinden Kutbul Zaman'a katılın! ${window.location.href}`;
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`,
                        "_blank",
                      );
                    }}
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `Kutbul Zaman manevi gelişim platformuna katılın: ${window.location.href}`;
                      window.open(
                        `whatsapp://send?text=${encodeURIComponent(text)}`,
                        "_blank",
                      );
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Kutbul Zaman - Manevi Rehberim",
                          text: `${pageData.user.fullName} üzerinden katılın!`,
                          url: window.location.href,
                        });
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Paylaş
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products CTA Section */}
      <section className="py-16 bg-gradient-to-r from-spiritual-gold/10 to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            🛍️ Premium Ürünlerden Alışveriş Yapın
          </h2>
          <p className="text-slate-200 mb-6">
            <strong>{pageData.user.fullName}</strong> sponsorluğunda alışveriş yapın ve otomatik komisyon kazandırın!
          </p>

          <div className="bg-gradient-to-r from-spiritual-purple/10 to-primary/10 rounded-lg p-6 mb-8 border border-primary/20">
            <h3 className="font-semibold text-primary mb-3">Bu Sayfadan Alışveriş Avantajları:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-spiritual-gold" />
                <span>{pageData.user.fullName} otomatik komisyon</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Anında işlem ve dağıtım</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-green-500" />
                <span>Sistem ağında %40 dağıtım</span>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-gradient-to-r from-spiritual-gold to-spiritual-gold/80 hover:from-spiritual-gold/90 hover:to-spiritual-gold/70 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              window.location.href = `/products?ref=${pageData.user.memberId}`;
            }}
          >
            <ShoppingCart className="w-6 h-6 mr-3" />
            Ürün Kataloğunu Keşfet
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <SystemPresentation 
        open={isPresentationOpen} 
        onOpenChange={setIsPresentationOpen} 
        referralCode={pageData?.user.referralCode}
      />
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Sistem Özellikleri
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Modern teknoloji ile manevi değerleri birleştiren güçlü platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`${vividTheme.cardBg} hover:shadow-2xl transition-all`}
              >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Packages */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Üyelik Paketleri
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Size uygun paketi seçin ve manevi yolculuğunuza{" "}
              {pageData.user.fullName} ile başlayın
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {membershipPackages.map((pkg, index) => (
              <Card
                key={index}
                className={`relative ${vividTheme.cardBg} hover:shadow-2xl transition-all ${pkg.popular ? "ring-2 ring-purple-500" : ""}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-spiritual-purple text-white px-4 py-1 rounded-full text-sm font-medium">
                      Popüler
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {pkg.price}
                    {pkg.period && (
                      <span className="text-slate-500">
                        {pkg.period}
                      </span>
                    )}
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-spiritual-gold mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={handleJoinClick}
                  >
                    {pkg.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Career System */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              7 Manevi Mertebe
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Ruhsal gelişim ile finansal başarıyı birleştiren kariyer sistemi
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerLevels.map((level, index) => (
              <Card
                key={index}
                className={`${vividTheme.cardBg} hover:shadow-2xl transition-all ${level.name === pageData.user.careerLevel.name
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
                  }`}
              >
                <CardHeader className="text-center pb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-spiritual-purple rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{level.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-center">
                    <p className="text-slate-700">{level.description}</p>
                    <div className="flex justify-between mt-3">
                      <span className="text-spiritual-gold font-medium">
                        Prim: {level.commission}
                      </span>
                      <span className="text-spiritual-emerald font-medium">
                        Pasif: {level.pasive}
                      </span>
                    </div>
                  </div>
                  {level.name === pageData.user.careerLevel.name && (
                    <Badge className="w-full justify-center">
                      Sponsorunuzun Seviyesi
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Üye Deneyimleri
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto">
              Sisteme katılan üyelerimizin başarı hikayeleri
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className={`${vividTheme.cardBg}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {testimonial.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location}
                      </p>
                    </div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 italic">
                    "{testimonial.text}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsor Guarantee Section */}
      <section className="py-12 bg-gradient-to-r from-primary/10 via-spiritual-purple/10 to-spiritual-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className={`${vividTheme.cardBg}`}>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-spiritual-gold to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-primary">
                  ✅ Sponsorluk Garantisi
                </h3>
                <div className="bg-white/50 rounded-lg p-6 mb-6">
                  <p className="text-lg font-semibold mb-2">
                    Bu sayfadan kayıt olduğunuzda otomatik olarak:
                  </p>
                  <div className="text-xl font-bold text-primary">
                    <span className="text-slate-800">Sponsor: </span>
                    {pageData.user.fullName}
                  </div>
                  <div className="text-lg font-bold text-spiritual-purple">
                    <span className="text-slate-800">Referans Kodu: </span>
                    {pageData.user.referralCode}
                  </div>
                </div>
                <p className="text-slate-700 max-w-2xl mx-auto">
                  Bu sayfadaki herhangi bir "Katıl" butonuna tıkladığınızda,
                  sponsorluğunuz otomatik olarak{" "}
                  <strong>{pageData.user.fullName}</strong>
                  üzerinden kaydedilecektir. Böylece doğru rehberinizle
                  yolculuğunuza başlayacaksınız.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="border-border/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hemen Katılın!
              </h2>
              <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
                {pageData.user.fullName} sponsorluğunda manevi ve finansal
                gelişim yolculuğunuza başlayın. Referans kodunuz:{" "}
                <strong className="text-primary">
                  {pageData.user.referralCode}
                </strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleJoinClick}
                  className="bg-gradient-to-r from-primary to-spiritual-purple hover:opacity-90"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {pageData.user.referralCode} ile Katıl
                </Button>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    İletişim
                  </Button>
                  <Button variant="outline" size="lg">
                    <Mail className="w-5 h-5 mr-2" />
                    Soru Sor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-muted/30">
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
            <p className="text-slate-300 mb-6">
              Manevi değerlerle sürdürülebilir büyüme
            </p>
            <div className="text-slate-400 space-y-2">
              <p>
                Bu sayfa {pageData.user.fullName} tarafından paylaşılmaktadır.
              </p>
              <p>
                Ziyaret sayısı: {pageData.clonePage.visitCount} | Referans kodu:{" "}
                {pageData.user.referralCode}
              </p>
              <div className="bg-primary/10 rounded-lg p-3 mt-4">
                <p className="text-primary font-semibold text-sm">
                  🎯 Bu sayfadan kayıt olan herkes otomatik olarak{" "}
                  <span className="font-bold">
                    {pageData.user.referralCode}
                  </span>{" "}
                  sponsoru ile sisteme dahil olur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
