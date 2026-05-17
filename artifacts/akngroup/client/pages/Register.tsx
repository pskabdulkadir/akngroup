import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Loader2, CheckCircle, Star, DollarSign, Eye, X, Upload, FileText, Clock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

const MEMBERSHIP_PACKAGES = [
  {
    id: "entry",
    name: "Zorunlu Giriş Paketi",
    price: 100,
    duration: "Ömür Boyu",
    type: "entry",
    features: [
      "Sistem aktivasyonu (Zorunlu)",
      "Kişisel klon sayfa ve mağaza",
      "Manevi panel tam erişim",
      "Gerçek kazanç takibi",
      "💎 Ruhsal Gelişim sistemi dahil",
      "📜 Üyelik Sertifikası",
    ],
    popular: true,
  },
  {
    id: "monthly",
    name: "Aylık Aktiflik",
    price: 20,
    duration: "Aylık",
    type: "monthly",
    features: [
      "Komisyon hakları",
      "Tüm özellikler aktif",
      "Ruhsal Gelişim sistem erişimi",
      "Klon sayfa yönetimi",
      "Destek sistemi",
      "Manevi içerik erişimi",
    ],
    popular: true,
  },
  {
    id: "yearly",
    name: "Yıllık Plan",
    price: 200,
    duration: "Yıllık",
    type: "yearly",
    originalPrice: 240,
    discount: 16,
    features: [
      "Tüm aylık özellikler",
      "%16 indirim avantajı",
      "Ek bonuslar",
      "Safiye üyeler için +%1",
      "Öncelikli destek",
      "Ekstra manevi içerik",
    ],
    popular: false,
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sponsorCode = searchParams.get("sponsor");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    sponsorCode: sponsorCode || "",
    selectedPackage: "entry",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      iban: "",
      accountHolderName: "",
    },
    spiritualInfo: {
      motherName: "",
      birthDate: "",
      address: "",
    },
  });
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  // Agreement states
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [agreementsAccepted, setAgreementsAccepted] = useState({
    terms: false,
    privacy: false,
    membership: false,
  });

  // Receipt upload states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (registrationData.password !== registrationData.confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      return;
    }

    if (registrationData.password.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    setStep(2);
  };

  const handlePackageSelection = (packageId: string) => {
    setRegistrationData({
      ...registrationData,
      selectedPackage: packageId,
    });
    setStep(3);
  };

  const handleAgreementsAccept = () => {
    if (agreementsAccepted.terms && agreementsAccepted.privacy && agreementsAccepted.membership) {
      setStep(4);
    } else {
      alert("Lütfen tüm sözleşmeleri okuyup kabul edin!");
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: registrationData.fullName,
          email: registrationData.email,
          phone: registrationData.phone,
          password: registrationData.password,
          sponsorCode: registrationData.sponsorCode,
          membershipType: registrationData.selectedPackage,
          bankDetails: registrationData.bankDetails,
        }),
      });

      const userData = await response.json();

      if (response.ok && userData.success) {
        setRegisteredUser(userData.user);

        // Create membership purchase request
        const selectedPackage = MEMBERSHIP_PACKAGES.find(
          (pkg) => pkg.id === registrationData.selectedPackage,
        );

        if (selectedPackage) {
          await fetch("/api/membership/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData.user.id,
              packageType: selectedPackage.type,
              paymentMethod: "bank_transfer",
              bankReceipt: receiptPreview || null,
            }),
          });
        }

        setStep(5);
      } else {
        alert(userData.error || "Kayıt başarısız");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Kayıt sırasında hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      alert("Lütfen bir ödeme dekontu yükleyin!");
      return;
    }

    setLoading(true);

    try {
      if (registeredUser) {
        await fetch("/api/membership/update-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: registeredUser.id,
            receiptFile: receiptPreview,
          }),
        });
      }

      setStep(6);
    } catch (error) {
      console.error("Receipt upload error:", error);
      alert("Dekont yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = MEMBERSHIP_PACKAGES.find(
    (pkg) => pkg.id === registrationData.selectedPackage,
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
              Kutbul Zaman
            </span>
          </Link>
          <p className="text-foreground/60 mt-2">
            Manevi Rehberim - Ruhsal Gelişim Sistemi
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((stepNum, idx, arr) => (
              <div key={stepNum} className="flex items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= stepNum
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {stepNum}
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-12 md:w-16 h-1 bg-muted mx-2">
                    <div
                      className={`h-full bg-primary transition-all ${step >= stepNum + 1 ? "w-full" : "w-0"
                        }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>
                Ruhsal Gelişim sistemine katılmak için bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePersonalInfoSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Ad Soyad</Label>
                    <Input
                      id="fullName"
                      required
                      value={registrationData.fullName}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={registrationData.email}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={registrationData.phone}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sponsorCode">
                      <span>Sponsor Kodu </span>
                      <span>{sponsorCode ? "✅ Otomatik Dolduruldu" : "(Opsiyonel)"}</span>
                    </Label>
                    {sponsorCode && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <p className="text-green-800 text-sm font-semibold">
                          🎯 Sponsor otomatik olarak tespit edildi:{" "}
                          <span className="font-bold">{sponsorCode}</span>
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          Bu klon sayfadan geldiğiniz için sponsor kodunuz
                          otomatik olarak ayarlandı.
                        </p>
                      </div>
                    )}
                    <Input
                      id="sponsorCode"
                      value={registrationData.sponsorCode}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          sponsorCode: e.target.value,
                        })
                      }
                      placeholder={
                        sponsorCode ? sponsorCode : "Sponsor kodunu girin"
                      }
                      className={
                        sponsorCode ? "border-green-300 bg-green-50" : ""
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={registrationData.password}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={registrationData.confirmPassword}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="motherName">
                      Anne Adı (Manevi hesaplamalar için)
                    </Label>
                    <Input
                      id="motherName"
                      value={registrationData.spiritualInfo.motherName}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          spiritualInfo: {
                            ...registrationData.spiritualInfo,
                            motherName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Doğum Tarihi</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={registrationData.spiritualInfo.birthDate}
                      onChange={(e) =>
                        setRegistrationData({
                          ...registrationData,
                          spiritualInfo: {
                            ...registrationData.spiritualInfo,
                            birthDate: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link to="/login">
                  <Button variant="outline">Zaten hesabım var</Button>
                </Link>
                <Button type="submit">Devam Et</Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 text-emerald-900 font-serif">Üyelik Paketini Seçin</h2>
              <p className="text-emerald-700/80 italic">
                Sisteme dahil olmak için Giriş Paketi veya üzeri bir paketi seçmeniz zorunludur.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {MEMBERSHIP_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-2xl border-2 ${pkg.popular ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-slate-100"
                    } ${registrationData.selectedPackage === pkg.id
                      ? "bg-emerald-50/50 border-emerald-500"
                      : "bg-white"
                    }`}
                  onClick={() => handlePackageSelection(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="bg-emerald-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest">
                      TAVSİYE EDİLEN BAŞLANGIÇ
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold text-slate-800">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-4xl font-black text-emerald-600">
                        <span>₺{pkg.price}</span>
                        {pkg.originalPrice && (
                          <span className="text-lg line-through text-slate-400 ml-2">
                            ₺{pkg.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-emerald-700/60 flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{pkg.duration}</span>
                        {pkg.discount && (
                          <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">
                            %{pkg.discount} İNDİRİM
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm font-medium text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button
                      className={cn(
                        "w-full font-bold h-12 rounded-xl transition-all",
                        registrationData.selectedPackage === pkg.id 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      )}
                    >
                      {registrationData.selectedPackage === pkg.id ? "Seçildi ✓" : "Bu Paketi Seç"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Geri Dön
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Information */}
        {/* Step 3: Agreements */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Sözleşmeleri Kabul Edin</CardTitle>
              <CardDescription>
                Platform kullanmaya başlamadan önce sözleşmeleri okumanız ve kabul etmeniz gerekmektedir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Terms of Use */}
                <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-blue-900 mb-2">📋 KULLANIM ŞARTLARI</h3>
                      <p className="text-sm text-blue-700 mb-3">Platform Adı: Kutbul Zaman | Yürürlük Tarihi: 23 Eylül 2025</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTermsDialog(true)}
                      className="ml-4 border-blue-400 hover:border-blue-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Oku
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-blue-200">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreementsAccepted.terms}
                      onChange={(e) => setAgreementsAccepted({ ...agreementsAccepted, terms: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-blue-900 font-semibold cursor-pointer">
                      Kullanım Şartlarını okudum ve kabul ediyorum
                    </label>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-green-900 mb-2">✅ GİZLİLİK POLİTİKASI</h3>
                      <p className="text-sm text-green-700 mb-3">Platform Adı: Kutbul Zaman | Yürürlük Tarihi: 23 Eylül 2025</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrivacyDialog(true)}
                      className="ml-4 border-green-400 hover:border-green-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Oku
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-green-200">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={agreementsAccepted.privacy}
                      onChange={(e) => setAgreementsAccepted({ ...agreementsAccepted, privacy: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <label htmlFor="privacy" className="text-sm text-green-900 font-semibold cursor-pointer">
                      Gizlilik Politikasını okudum ve kabul ediyorum
                    </label>
                  </div>
                </div>

                {/* Membership Agreement */}
                <div className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-purple-900 mb-2">📄 ÜYELİK SÖZLEŞMESİ</h3>
                      <p className="text-sm text-purple-700 mb-3">Yürürlük Tarihi: 23 Eylül 2025 | Platform: Kutbul Zaman</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMembershipDialog(true)}
                      className="ml-4 border-purple-400 hover:border-purple-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Oku
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-purple-200">
                    <input
                      type="checkbox"
                      id="membership"
                      checked={agreementsAccepted.membership}
                      onChange={(e) => setAgreementsAccepted({ ...agreementsAccepted, membership: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <label htmlFor="membership" className="text-sm text-purple-900 font-semibold cursor-pointer">
                      Üyelik Sözleşmesini okudum ve kabul ediyorum
                    </label>
                  </div>
                </div>
              </div>

              {/* Acceptance Status */}
              <div className={`p-4 rounded-lg ${agreementsAccepted.terms && agreementsAccepted.privacy && agreementsAccepted.membership
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-yellow-50 border-2 border-yellow-300'
                }`}>
                <p className={`text-sm font-semibold ${agreementsAccepted.terms && agreementsAccepted.privacy && agreementsAccepted.membership
                  ? 'text-green-800'
                  : 'text-yellow-800'
                  }`}>
                  <span>
                    {agreementsAccepted.terms && agreementsAccepted.privacy && agreementsAccepted.membership
                      ? '✅ Tüm sözleşmeler kabul edildi. Devam edebilirsiniz.'
                      : '⚠️ Devam etmek için lütfen tüm sözleşmeleri kabul edin.'}
                  </span>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Geri Dön
              </Button>
              <Button
                onClick={handleAgreementsAccept}
                disabled={!agreementsAccepted.terms || !agreementsAccepted.privacy || !agreementsAccepted.membership}
              >
                Kabul Edip Devam Et
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Payment Information */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Bilgileri</CardTitle>
              <CardDescription>
                <span>Seçtiğiniz paket: {selectedPackage?.name} - ₺{selectedPackage?.price}</span>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePaymentInfoSubmit}>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Banka Havalesi Bilgileri</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ödemenizi aşağıdaki hesaba yapabilirsiniz:
                  </p>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Hesap Adı:</strong> Kutbul Zaman İrfan Sistemi
                    </p>
                    <p>
                      <strong>IBAN:</strong> TR00 0000 0000 0000 0000 0000 00
                    </p>
                    <p>
                      <strong>Banka:</strong> Türkiye İş Bankası
                    </p>
                    <p>
                      <strong>Tutar:</strong> ₺{selectedPackage?.price}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">
                    Kişisel Banka Bilgileriniz
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Banka Adı</Label>
                      <Input
                        id="bankName"
                        value={registrationData.bankDetails.bankName}
                        onChange={(e) =>
                          setRegistrationData({
                            ...registrationData,
                            bankDetails: {
                              ...registrationData.bankDetails,
                              bankName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountHolderName">Hesap Sahibi</Label>
                      <Input
                        id="accountHolderName"
                        value={registrationData.bankDetails.accountHolderName}
                        onChange={(e) =>
                          setRegistrationData({
                            ...registrationData,
                            bankDetails: {
                              ...registrationData.bankDetails,
                              accountHolderName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="accountNumber">Hesap Numarası</Label>
                      <Input
                        id="accountNumber"
                        value={registrationData.bankDetails.accountNumber}
                        onChange={(e) =>
                          setRegistrationData({
                            ...registrationData,
                            bankDetails: {
                              ...registrationData.bankDetails,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        value={registrationData.bankDetails.iban}
                        onChange={(e) =>
                          setRegistrationData({
                            ...registrationData,
                            bankDetails: {
                              ...registrationData.bankDetails,
                              iban: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Geri Dön
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kayıt Ol
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Step 5: Receipt Upload */}
        {step === 5 && registeredUser && (
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Dekontu Yükleyin</CardTitle>
              <CardDescription>
                Banka havalesi sonrası aldığınız dekontu yükleyerek onay aşamasını tamamlayın
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleReceiptSubmit}>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Kayıt Başarıyla Tamamlandı
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>
                      <strong>Üyeniz:</strong> {registeredUser.fullName}
                    </p>
                    <p>
                      <strong>Üye ID:</strong> <span className="font-mono">{registeredUser.memberId}</span>
                    </p>
                    <p>
                      <strong>Seçilen Paket:</strong> {selectedPackage?.name} - ${selectedPackage?.price}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">💳 Ödeme Dekontu Yükleyin</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Banka havalesi sonrası gönderilen dekontu sisteme yükleyin. Admin onayı sonrasında üyeliğiniz tamamen aktif olacaktır.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="font-semibold text-gray-700 mb-1">
                        <span>{receiptFile ? receiptFile.name : "Dosya seçmek için tıklayın"}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        (JPG, PNG, PDF - Maksimum 10MB)
                      </p>
                    </label>
                  </div>

                  {receiptPreview && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">📷 Ön İzleme</h4>
                      {receiptFile?.type.startsWith("image") ? (
                        <img src={receiptPreview} alt="Receipt preview" className="max-w-full h-auto rounded-lg border border-gray-300" />
                      ) : (
                        <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg">
                          <FileText className="w-8 h-8 text-gray-600" />
                          <span className="font-semibold text-gray-700">{receiptFile?.name}</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="mt-3"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Dosyayı Değiştir
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Önemli</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Dekontuyu açık, okunaklı şekilde yükleyin</li>
                    <li>Tüm ödemeli bilgileri içermesi gerekir</li>
                    <li>Admin onayı 24 saat içinde tamamlanır</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Geri Dön
                </Button>
                <Button type="submit" disabled={loading || !receiptFile}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Dekontu Yükle ve Tamamla
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Step 6: Success */}
        {step === 6 && registeredUser && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Kayıt Başarılı!</CardTitle>
              <CardDescription>
                Kutbul Zaman İrfan sistemine hoş geldiniz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Hesap Bilgileriniz</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Ad Soyad:</strong> {registeredUser.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {registeredUser.email}
                  </p>
                  <p>
                    <strong>Referans Kodunuz:</strong>{" "}
                    {registeredUser.referralCode}
                  </p>
                  <p>
                    <strong>Seçilen Paket:</strong> {selectedPackage?.name}
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-4 text-lg">
                  💳 Ödeme Bilgileri
                </h3>
                <div className="space-y-3 bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex justify-between items-start pb-3 border-b border-purple-100">
                    <span className="font-semibold text-gray-700">Ödeme Alıcısı:</span>
                    <span className="text-right font-bold text-purple-900">Abdulkadir Kan</span>
                  </div>
                  <div className="flex justify-between items-start pb-3 border-b border-purple-100">
                    <span className="font-semibold text-gray-700">Banka:</span>
                    <span className="text-right font-bold text-purple-900">QNB Finans Bank</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-700">IBAN:</span>
                    <div className="text-right">
                      <code className="bg-purple-100 px-3 py-2 rounded font-mono font-bold text-purple-900 block">
                        TR32 0015 7000 0000 0091 7751 22
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  ✅ Ödeme Dekontu Yüklendi
                </h3>
                <p className="text-sm text-green-700">
                  Ödeme dekontu başarıyla sisteme yüklendi. Admin tarafından onay aşamasında incelenecektir.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">
                  Sonraki Adımlar
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Yukarıdaki ödeme bilgilerine göre havale/transfer yapın (belirtilen IBAN'a)</li>
                  <li>✅ Ödeme dekontu yüklendi - Admin onayı bekleniyor</li>
                  <li>Admin onayından sonra üyeliğiniz tamamen aktifleşecek (24 saat içinde)</li>
                  <li>Üyeliğiniz aktif olduğunda, klon sayfanızı paylaşarak alt ekip oluşturun</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">
                  Klon Sayfanız
                </h3>
                <p className="text-sm text-blue-700">
                  Referans linkiniz:
                  <code className="bg-blue-100 px-2 py-1 rounded ml-2">
                    {window.location.origin}/clone/
                    {registeredUser.referralCode.toLowerCase()}
                  </code>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link to="/login">
                <Button>Sisteme Giriş Yap</Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Terms of Use Dialog */}
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>📋 KULLANIM ŞARTLARI</span>
              </DialogTitle>
              <DialogDescription>
                Platform Adı: Kutbul Zaman | Abdulkadir Kan Yürürlük Tarihi: 23 Eylül 2025
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-bold text-base mb-2">İşletmeci: Kutbul Zaman Ticaret ve Organizasyon Sistemi</p>

                <h3 className="font-bold mt-4 mb-2">1. Giriş ve Kabul</h3>
                <p className="mb-3">Bu sözleşme, Kutbul Zaman platformuna erişen tüm kullanıcılar ile sistem yöneticileri arasında akdedilmiştir. Sisteme kayıt olan her birey, bu şartları önceden okuduğunu, anladığını ve hiçbir baskı altında kalmadan kabul ettiğini beyan eder.</p>

                <h3 className="font-bold mt-4 mb-2">2. Gönüllü Katılım ve Hak Reddi</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kullanıcı, sisteme tamamen kendi özgür iradesiyle katıldığını kabul eder.</li>
                  <li>Sisteme katılım, herhangi bir yönlendirme, baskı, vaat veya zorlamaya dayalı değildir.</li>
                  <li>Kullanıcı, sisteme katılımı nedeniyle hiçbir şekilde şikayette bulunmayacağını, hak talep etmeyeceğini, tazminat istemeyeceğini peşinen kabul eder.</li>
                  <li>Kullanıcı, sistemin işleyişini, kazanç modelini ve organizasyon yapısını koşulsuz olarak kabul eder.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">3. Sistem Tanımı</h3>
                <p className="mb-3">Kutbul Zaman, manevi yardımlaşma ve ticaret (irfan) sistemi modeliyle çalışan bir e-ticaret platformudur.</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Monoline yapı esas alınır: Her kullanıcı, sistemde tek bir hat üzerinden ilerler.</li>
                  <li>Kazançlar, ürün satışları ve ekip genişlemesine bağlı olarak dağıtılır.</li>
                  <li>Sistem, dijital ürünler, eğitimler, organizasyonlar ve ticari içerikler sunar.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">4. Kullanıcı Yükümlülükleri</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kullanıcı, sisteme verdiği bilgilerin doğru ve güncel olduğunu taahhüt eder.</li>
                  <li>Hesap güvenliği kullanıcının sorumluluğundadır.</li>
                  <li>Kullanıcı, sistemdeki hiçbir içeriği izinsiz kopyalayamaz, çoğaltamaz, dağıtamaz.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">5. Fikri Mülkiyet ve İçerik Hakları</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Tüm içerikler, eğitimler, yazılımlar ve organizasyon yapısı Kutbul Zaman'a aittir.</li>
                  <li>Kullanıcı, bu içerikler üzerinde hiçbir şekilde hak iddia edemez.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">6. Sorumluluk Reddi</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Sistem "olduğu gibi" sunulmaktadır.</li>
                  <li>Kazanç garantisi verilmez.</li>
                  <li>Kullanıcı, sistemin işleyişiyle ilgili hiçbir talepte bulunmayacağını kabul eder.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">7. Hesap İptali ve Erişim Engeli</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kurallara aykırı davranan kullanıcıların hesapları askıya alınabilir veya silinebilir.</li>
                  <li>Bu durumda kullanıcı, hiçbir hak veya tazminat talebinde bulunamaz.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">8. Gizli Hükümler</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kullanıcı, sistemdeki tüm işlem kayıtlarının izlenebileceğini kabul eder.</li>
                  <li>Kullanıcı, organizasyon yapısı, algoritma, kazanç planı gibi bilgileri üçüncü kişilerle paylaşamaz.</li>
                  <li>Kullanıcı, sistemin herhangi bir parçası üzerinde mülkiyet, ortaklık veya hak iddiasında bulunamaz.</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Policy Dialog */}
        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>🔒 GİZLİLİK POLİTİKASI</span>
              </DialogTitle>
              <DialogDescription>
                Platform Adı: Kutbul Zaman | Abdulkadir Kan Yürürlük Tarihi: 23 Eylül 2025
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-bold mt-4 mb-2">1. Toplanan Veriler</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Ad, soyad, e-posta, telefon numarası</li>
                  <li>IP adresi, cihaz bilgileri, işlem geçmişi</li>
                  <li>Konum verisi (kullanıcı izin verirse)</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">2. Veri Kullanımı</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Hizmet sunmak ve geliştirmek</li>
                  <li>Güvenlik ve denetim sağlamak</li>
                  <li>Yasal yükümlülükleri yerine getirmek</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">3. Veri Paylaşımı</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Veriler, yasal zorunluluklar dışında paylaşılmaz.</li>
                  <li>Teknik altyapı sağlayıcılarıyla sınırlı ölçüde paylaşılır.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">4. Veri Güvenliği</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Veriler, teknik ve idari tedbirlerle korunur.</li>
                  <li>Yetkisiz erişim ve kötüye kullanım riskine karşı önlemler alınır.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">5. Kullanıcı Hakları</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kullanıcı, verilerine erişme, düzeltme, silme talebinde bulunabilir.</li>
                  <li>Talepler destek@kutbulzaman.com adresine iletilmelidir.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">6. Gizli Hükümler</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kullanıcı, veri işleme süreçlerinin denetlenebileceğini kabul eder.</li>
                  <li>Kullanıcı, sistemdeki veri yapısı ve algoritmalar hakkında bilgi edinemez.</li>
                  <li>Kullanıcı, platforma dair hiçbir veri veya içerik üzerinde hak iddia edemez.</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Membership Agreement Dialog */}
        <Dialog open={showMembershipDialog} onOpenChange={setShowMembershipDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>📄 ÜYELİK SÖZLEŞMESİ</span>
              </DialogTitle>
              <DialogDescription>
                Yürürlük Tarihi: 23 Eylül 2025 | Platform Adı: Kutbul Zaman | Abdulkadir Kan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-bold text-base mb-3">İşletmeci: Kutbul Zaman Ticaret ve Organizasyon Sistemi</p>
                <p className="font-bold mb-2">Taraflar: Bu sözleşme, Kutbul Zaman platformuna üye olan gerçek kişi ("Üye") ile platformu işleten tüzel/gerçek kişi ("İşletmeci") arasında akdedilmiştir.</p>

                <h3 className="font-bold mt-4 mb-2">1. Üyelik Başvurusu ve Kabulü</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Üye, platforma kayıt olurken verdiği tüm bilgilerin doğru, eksiksiz ve güncel olduğunu beyan eder.</li>
                  <li>İşletmeci, üyelik başvurusunu kabul edip etmemekte serbesttir.</li>
                  <li>Üyelik, yalnızca bireysel kullanım içindir; üçüncü kişilere devredilemez.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">2. Gönüllü Katılım ve Rıza Beyanı</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Üye, platforma tamamen kendi özgür iradesiyle katıldığını, hiçbir yönlendirme, vaat, baskı veya zorlama altında kalmadan üyelik oluşturduğunu kabul eder.</li>
                  <li>Üye, bu katılım nedeniyle hiçbir şekilde şikayette bulunmayacağını, hak talep etmeyeceğini, tazminat istemeyeceğini peşinen kabul eder.</li>
                  <li>Üye, sistemin işleyişini, kazanç modelini, organizasyon yapısını ve dijital ürünlerini koşulsuz olarak kabul eder.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">3. Sistem Tanımı</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Kutbul Zaman, manevi yardımlaşma ve ticaret (irfan) sistemi modeliyle çalışan bir e-ticaret platformudur.</li>
                  <li>Monoline yapı esas alınır: Her üye, sistemde tek bir hat üzerinden ilerler.</li>
                  <li>Kazançlar, ürün satışları, ekip genişlemesi ve organizasyon performansına bağlı olarak dağıtılır.</li>
                  <li>Sistem, dijital ürünler, eğitim içerikleri, organizasyonlar ve ticari araçlar sunar.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">4. Üyenin Yükümlülükleri</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Üye, platformu yalnızca yasal ve etik amaçlarla kullanacağını taahhüt eder.</li>
                  <li>Üye, sistemdeki hiçbir içeriği izinsiz kopyalayamaz, çoğaltamaz, dağıtamaz.</li>
                  <li>Üye, diğer üyelerin haklarını ihlal edemez, sistemin işleyişini bozacak müdahalelerde bulunamaz.</li>
                  <li>Üye, kendi hesabının güvenliğinden sorumludur.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">5. Fikri Mülkiyet Hakları</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Platform üzerindeki tüm içerikler, yazılımlar, eğitimler ve organizasyon yapısı işletmeciye aittir.</li>
                  <li>Üye, bu içerikler üzerinde hiçbir şekilde mülkiyet, ortaklık veya hak iddiasında bulunamaz.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">6. Kazanç ve Sorumluluk Reddi</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Platformda sunulan kazanç planı, performansa ve organizasyon yapısına bağlıdır.</li>
                  <li>İşletmeci, herhangi bir gelir garantisi vermez.</li>
                  <li>Üye, sistemin işleyişiyle ilgili hiçbir maddi veya manevi talepte bulunmayacağını kabul eder.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">7. Üyelik İptali ve Askıya Alma</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>İşletmeci, kurallara aykırı davranan üyelerin hesabını askıya alma veya tamamen silme hakkına sahiptir.</li>
                  <li>Bu durumda üye, hiçbir hak, tazminat veya geri ödeme talebinde bulunamaz.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">8. Gizli Hükümler</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Üye, sistemdeki tüm işlem kayıtlarının işletmeci tarafından izlenebileceğini kabul eder.</li>
                  <li>Üye, organizasyon yapısı, algoritma, kazanç planı gibi bilgileri üçüncü kişilerle paylaşamaz.</li>
                  <li>Üye, sistemin herhangi bir parçası üzerinde hiçbir şekilde hak iddia edemez.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">9. Sözleşme Değişiklikleri</h3>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li>Bu sözleşme, işletmeci tarafından güncellenebilir.</li>
                  <li>Güncellenmiş hali, platformda yayınlandığı andan itibaren geçerli olur.</li>
                  <li>Üye, bu değişiklikleri önceden kabul ettiğini beyan eder.</li>
                </ul>

                <h3 className="font-bold mt-4 mb-2">10. Yetkili Yargı Mercileri</h3>
                <p className="mb-3">Bu sözleşmeden doğabilecek uyuşmazlıklarda, Şanlıurfa Mahkemeleri ve İcra Daireleri yetkilidir.</p>
                <p className="text-base font-bold">Bu sözleşme, platformun dijital ortamında elektronik olarak onaylandığında yürürlüğe girer. Üye, bu sözleşmeyi onaylayarak tüm maddeleri eksiksiz ve koşulsuz olarak kabul ettiğini beyan eder.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
