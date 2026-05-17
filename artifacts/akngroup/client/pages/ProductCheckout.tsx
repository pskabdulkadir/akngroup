import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Zap,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  features: string[];
  isDigital?: boolean;
  downloadUrl?: string;
}

interface ShippingAddress {
  fullName: string;
  company?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email?: string;
  addressType: "home" | "work" | "other";
  instructions?: string;
}

const ProductCheckout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const productId = searchParams.get("product");
  const referralCode = searchParams.get("ref") || "ak0000001";

  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    company: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Türkiye",
    phone: "",
    email: buyerEmail,
    addressType: "home",
    instructions: "",
  });

  const shippingOptions = [
    {
      id: "standard",
      name: "Standart Kargo",
      description: "3-5 iş günü teslimat",
      price: 0,
      estimatedDays: "3-5 iş günü",
      provider: "PTT Kargo"
    },
    {
      id: "express",
      name: "Hızlı Kargo",
      description: "1-2 iş günü teslimat",
      price: 15,
      estimatedDays: "1-2 iş günü",
      provider: "MNG Kargo"
    },
    {
      id: "same-day",
      name: "Aynı Gün Teslimat",
      description: "İstanbul içi aynı gün",
      price: 25,
      estimatedDays: "Aynı gün",
      provider: "Getir"
    }
  ];

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.product);
      } else {
        setError("Ürün bulunamadı.");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setError("Ürün yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const isDigital = product.isDigital || false;
    if (!product || !buyerEmail || (!isDigital && !shippingAddress.fullName)) {
      setError("Lütfen tüm gerekli alanları doldurun.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      setError("Geçerli bir email adresi girin.");
      return;
    }

    setProcessing(true);
    setError("");

    // Calculate totals
    const selectedShippingOption = isDigital ? { price: 0 } : shippingOptions.find(opt => opt.id === selectedShipping);
    const shippingCost = selectedShippingOption?.price || 0;
    const totalAmount = product.price + shippingCost;
    const purchaseAmount = product.price;

    // Aktivasyon Kuralı Simülasyonu (Frontend tarafında gösterim amaçlı)
    // Gerçek işlem backend'de 'applyUserActivation' servisi ile yapılır.
    const simulateActivation = () => {
      const isFirstPurchase = true; // Bu bilgi kullanıcı profilinden gelir
      let monthsToAdd = 0;

      if (totalAmount >= 200 && !isFirstPurchase) monthsToAdd = 12; // Kural 3
      else if (isFirstPurchase && totalAmount >= 100) monthsToAdd = 1; // Kural 1
      else if (totalAmount >= 100) monthsToAdd = Math.floor(totalAmount / 100); // Kural 2

      console.log(`🛒 Sipariş Tutarı: $${totalAmount}`);
      console.log(`📅 Kazanılan Aktiflik: +${monthsToAdd} Ay`);
    };

    try {
      const response = await fetch("/api/products/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          buyerEmail,
          referralCode,
          shippingAddress,
          paymentMethod,
          purchaseAmount,
          shippingOption: selectedShipping,
          shippingCost,
          totalAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Clear localStorage
        simulateActivation();
        localStorage.removeItem('pendingPurchase');
      } else {
        setError(data.error || "Satın alma işlemi başarısız.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setError("Satın alma işlemi sırasında hata oluştu.");
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    const isDigital = product.isDigital || false;
    if (!product || !buyerEmail || (!isDigital && !shippingAddress.fullName)) {
      setError("Lütfen tüm gerekli alanları doldurun.");
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: product.id,
          buyerEmail,
          metadata: {
            referralCode,
            shippingAddress: JSON.stringify(shippingAddress),
            shippingOption: selectedShipping,
            userId: localStorage.getItem('userId') || undefined
          }
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Stripe ödeme sayfası oluşturulamadı.");
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      setError("Ödeme sırasında bir hata oluştu.");
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ürün Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">İstediğiniz ürün mevcut değil.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-green-600">Satın Alma Başarılı!</h2>
            <p className="text-muted-foreground mb-6">
              <strong>{product.name}</strong> siparişiniz alınmıştır.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Komisyon Dağıtımı Tamamlandı</h3>
              <p className="text-sm text-green-700">
                Referans kodu: <strong>{referralCode}</strong><br />
                Komisyon tutarı: <strong>${Math.round(product.price * 0.4)}</strong><br />
                Sistem fonu: <strong>${Math.round(product.price * 0.6)}</strong>
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
              <Button onClick={() => navigate("/register")} className="bg-gradient-to-r from-primary to-spiritual-purple">
                Sisteme Katıl
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
  const shippingCost = selectedShippingOption?.price || 0;
  const subtotal = product.price;
  const totalAmount = subtotal + shippingCost;
  // Monoline System Distribution (50% Members, 50% System)
  const directSponsorBonus = totalAmount * 0.15; // %15 Direkt Sponsor
  const networkBonus = totalAmount * 0.35;       // %34.5 Derinlik + %0.5 Pasif
  const systemFund = totalAmount * 0.50;         // %45 Şirket + %5 Giderler

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-3xl font-bold">Ürün Satın Al</h1>
          <p className="text-muted-foreground">Güvenli ödeme ile hemen sipariş verin</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Ürün Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">{product.name}</h3>
                <p className="text-muted-foreground mb-2">{product.description}</p>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                  {product.category}
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Özellikler:</h4>
                <ul className="space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span>Ürün Fiyatı:</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">${product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {!product.isDigital && (
                  <div className="flex items-center justify-between">
                    <span>Kargo:</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? "Ücretsiz" : `$${shippingCost}`}
                    </span>
                  </div>
                )}

                {product.isDigital && (
                  <div className="flex items-center justify-between text-purple-600 font-bold">
                    <span>Teslimat:</span>
                    <span>Dijital (Anında)</span>
                  </div>
                )}

                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold">Toplam:</span>
                  <span className="text-2xl font-bold text-primary">${totalAmount}</span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Direkt Sponsor: ${directSponsorBonus.toFixed(2)} (%15)</p>
                  <p>• Network Dağıtımı: ${networkBonus.toFixed(2)} (%35)</p>
                  <p>• Sistem/Şirket Payı: ${systemFund.toFixed(2)} (%50)</p>
                  <p>• Referans kodu: {referralCode}</p>
                  <p>• Kargo: {selectedShippingOption?.name} ({selectedShippingOption?.estimatedDays})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Sipariş Formu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Buyer Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">İletişim Bilgileri</h3>
                <div>
                  <Label htmlFor="email">Email Adresi *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address */}
              {!product.isDigital ? (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Teslimat Adresi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="fullName">Ad Soyad *</Label>
                      <Input
                        id="fullName"
                        value={shippingAddress.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Ad Soyad"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="company">Şirket (Opsiyonel)</Label>
                      <Input
                        id="company"
                        value={shippingAddress.company || ""}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Şirket adı"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="addressType">Adres Tipi</Label>
                      <Select
                        value={shippingAddress.addressType}
                        onValueChange={(value: "home" | "work" | "other") => handleInputChange("addressType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Ev</SelectItem>
                          <SelectItem value="work">İş</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="Sokak, mahalle, bina no, daire no"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address2">Adres 2 (Opsiyonel)</Label>
                      <Input
                        id="address2"
                        value={shippingAddress.address2 || ""}
                        onChange={(e) => handleInputChange("address2", e.target.value)}
                        placeholder="Ek adres bilgisi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Şehir *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="İstanbul"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">İl/Bölge *</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        placeholder="Marmara"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Posta Kodu *</Label>
                      <Input
                        id="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                        placeholder="34000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+90 555 123 4567"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="instructions">Teslimat Talimatları</Label>
                      <Input
                        id="instructions"
                        value={shippingAddress.instructions || ""}
                        onChange={(e) => handleInputChange("instructions", e.target.value)}
                        placeholder="Kapıcıya bırakabilirsiniz, 3. kat..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col items-center text-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-600" />
                   </div>
                   <div>
                     <h3 className="font-bold text-purple-900">Dijital Ürün Erişimi</h3>
                     <p className="text-sm text-purple-700">
                       Bu ürün dijitaldir. Ödeme sonrası indirme linki anında panelinizde aktif olacaktır.
                       Lütfen geçerli bir e-posta adresi girdiğinizden emin olun.
                     </p>
                   </div>
                </div>
              )}

              {/* Shipping Options */}
              {!product.isDigital && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Kargo Seçenekleri</h3>
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedShipping === option.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                        onClick={() => setSelectedShipping(option.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={selectedShipping === option.id}
                              onChange={() => setSelectedShipping(option.id)}
                              className="text-primary"
                            />
                            <div>
                              <h4 className="font-medium">{option.name}</h4>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                              <p className="text-xs text-muted-foreground">{option.provider}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {option.price === 0 ? "Ücretsiz" : `$${option.price}`}
                            </p>
                            <p className="text-sm text-muted-foreground">{option.estimatedDays}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Ödeme Yöntemi
                </h3>
                <div className="space-y-3">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "stripe"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setPaymentMethod("stripe")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === "stripe"}
                        onChange={() => setPaymentMethod("stripe")}
                        className="text-primary"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">Stripe (Kart / Apple Pay / Google Pay)</h4>
                        <p className="text-sm text-muted-foreground">Dünya çapında güvenli ve hızlı ödeme</p>
                        <div className="flex gap-2 mt-2">
                          <img src="https://img.icons8.com/color/24/visa.png" alt="Visa" className="h-6" />
                          <img src="https://img.icons8.com/color/24/mastercard.png" alt="Mastercard" className="h-6" />
                          <img src="https://img.icons8.com/color/24/stripe.png" alt="Stripe" className="h-6" />
                        </div>
                      </div>
                      <Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "bank_transfer"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setPaymentMethod("bank_transfer")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer")}
                        className="text-primary"
                      />
                      <div>
                        <h4 className="font-medium">Banka Havalesi/EFT</h4>
                        <p className="text-sm text-muted-foreground">Banka hesabına transfer</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "crypto"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setPaymentMethod("crypto")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === "crypto"}
                        onChange={() => setPaymentMethod("crypto")}
                        className="text-primary"
                      />
                      <div>
                        <h4 className="font-medium">Kripto Para</h4>
                        <p className="text-sm text-muted-foreground">Bitcoin, Ethereum, USDT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Info */}
              <div className="bg-gradient-to-r from-primary/10 to-spiritual-purple/10 rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">Sipariş Özeti</h4>
                <div className="text-sm space-y-1">
                  <p>• Ürün fiyatı: <strong>${product.price}</strong></p>
                  <p>• Kargo ücreti: <strong>${shippingCost === 0 ? "Ücretsiz" : "$" + shippingCost}</strong></p>
                  <p>• Toplam tutar: <strong>${totalAmount}</strong></p>
                  <hr className="my-2" />
                  <p>• Direkt Sponsor (%15): <strong>${directSponsorBonus.toFixed(2)}</strong></p>
                  <p>• Network Dağıtımı (%35): <strong>${networkBonus.toFixed(2)}</strong></p>
                  <p>• Sistem/Şirket (%50): <strong>${systemFund.toFixed(2)}</strong></p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Satın alma işleminiz tamamlandığında komisyonlar otomatik olarak dağıtılacaktır.
                  </p>
                </div>
              </div>

              {paymentMethod === "stripe" ? (
                <Button
                  onClick={handleStripePayment}
                  disabled={processing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      İşlem Yapılıyor...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                       <Zap className="w-5 h-5 text-yellow-300" />
                       <span>{totalAmount} $ Stripe ile Güvenli Öde</span>
                    </div>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handlePurchase}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-primary to-spiritual-purple hover:opacity-90"
                  size="lg"
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      İşlem Yapılıyor...
                    </div>
                  ) : (
                    `${totalAmount} $ Öde ve Satın Al`
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Siparişinizi tamamlayarak{" "}
                <a href="#" className="text-primary hover:underline">Kullanım Şartları</a>
                {" "}ve{" "}
                <a href="#" className="text-primary hover:underline">Gizlilik Politikası</a>
                'nı kabul etmiş olursunuz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductCheckout;
