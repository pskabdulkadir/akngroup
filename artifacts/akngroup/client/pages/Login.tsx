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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    sponsor: "",
    phone: "",
    motherName: "",
  });

  // Forgot Password States
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetMethod, setResetMethod] = useState<"email" | "sms">("email");
  const [resetStep, setResetStep] = useState<"method" | "input" | "verify">("method");
  const [resetInput, setResetInput] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const resetForgotPasswordState = () => {
    setResetStep("method");
    setResetInput("");
    setResetCode("");
    setNewPassword("");
    setResetMethod("email");
    setResetLoading(false);
  };

  const handleSendResetCode = async () => {
    if (!resetInput) {
      alert("Lütfen telefon veya email girin.");
      return;
    }
    setResetLoading(true);
    try {
      const endpoint = resetMethod === "email" ? "/api/auth/forgot-password-email" : "/api/auth/forgot-password-sms";
      const body = resetMethod === "email" ? { email: resetInput } : { phone: resetInput };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetStep("verify");
        alert(data.message || "Doğrulama kodu gönderildi.");
      } else {
        alert(data.error || "Kod gönderilemedi.");
      }
    } catch (error) {
      console.error("Reset code error:", error);
      alert("Bir hata oluştu.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!resetCode || !newPassword) {
      alert("Lütfen kod ve yeni şifrenizi girin.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setResetLoading(true);
    try {
      const endpoint = resetMethod === "email" ? "/api/auth/reset-password-email" : "/api/auth/reset-password-sms";
      const body = resetMethod === "email"
        ? { email: resetInput, code: resetCode, newPassword }
        : { phone: resetInput, code: resetCode, newPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert("Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.");
        setForgotPasswordOpen(false);
        resetForgotPasswordState();
      } else {
        alert(data.error || "Sıfırlama başarısız.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Bir hata oluştu.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      let data;

      try {
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId); // Clear timeout if request completes
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error("Fetch error:", fetchError);

        if (fetchError.name === "AbortError") {
          alert("Giriş isteği zaman aşımına uğradı. Lütfen tekrar deneyin.");
        } else {
          alert("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
        }

        setLoading(false);
        return;
      }

      // Handle response based on status
      if (!response.ok) {
        console.error("Response not ok:", response.status, response.statusText);

        try {
          const errorData = await response.json();
          alert(
            errorData.error ||
            "Geçersiz email veya şifre. Lütfen bilgilerinizi kontrol edin.",
          );
        } catch {
          alert(`Sunucu hatası: ${response.status} ${response.statusText}`);
        }

        setLoading(false);
        return;
      }

      // Response is ok, parse JSON
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        alert("Sunucu yanıtı işlenirken hata oluştu. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      if (response.ok && data.success) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("authToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Redirect based on user role
        if (data.user.role === "admin") {
          navigate("/admin-panel");
        } else {
          navigate("/member-panel");
        }
      } else {
        alert(
          data.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(
        "Giriş sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      alert("Şifreler eşleşmiyor!");
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      alert("Şifre en az 6 karakter olmalıdır!");
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: registerData.name,
            email: registerData.email,
            phone: registerData.phone,
            password: registerData.password,
            sponsorCode: registerData.sponsor || undefined,
            motherName: registerData.motherName,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          alert("Kayıt isteği zaman aşımına uğradı. Lütfen tekrar deneyin.");
        } else {
          alert("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Kayıt başarılı! Giriş yapabilirsiniz.");
        // Switch to login tab
        (document.querySelector('[value="login"]') as HTMLElement | null)?.click();
        // Clear register form
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          sponsor: "",
          phone: "",
          motherName: "",
        });
      } else {
        alert(
          data.error ||
          "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Kayıt sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <p className="text-foreground/60 mt-2">Manevi Rehberim</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
                <CardDescription>
                  Email ve şifrenizle sisteme giriş yapın
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Giriş Yap
                  </Button>
                  <div className="text-center text-sm">
                    <Dialog open={forgotPasswordOpen} onOpenChange={(open) => {
                      setForgotPasswordOpen(open);
                      if (!open) resetForgotPasswordState();
                    }}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-primary hover:underline">
                          Şifremi Unuttum
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Şifre Sıfırlama</DialogTitle>
                          <DialogDescription>
                            {resetStep === "method" && "Şifrenizi nasıl sıfırlamak istersiniz?"}
                            {resetStep === "input" && (resetMethod === "email" ? "Email adresinizi girin." : "Telefon numaranızı girin.")}
                            {resetStep === "verify" && "Gelen doğrulama kodunu ve yeni şifrenizi girin."}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                          {resetStep === "method" && (
                            <RadioGroup value={resetMethod} onValueChange={(v: "email" | "sms") => setResetMethod(v)}>
                              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="email" id="r-email" />
                                <Label htmlFor="r-email" className="cursor-pointer flex-1">Email ile Sıfırla</Label>
                              </div>
                              <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                                <RadioGroupItem value="sms" id="r-sms" />
                                <Label htmlFor="r-sms" className="cursor-pointer flex-1">SMS ile Sıfırla</Label>
                              </div>
                            </RadioGroup>
                          )}

                          {resetStep === "input" && (
                            <div className="space-y-2">
                              <Label htmlFor="reset-input">
                                {resetMethod === "email" ? "Email Adresi" : "Telefon No (+90...)"}
                              </Label>
                              <Input
                                id="reset-input"
                                value={resetInput}
                                onChange={(e) => setResetInput(e.target.value)}
                                placeholder={resetMethod === "email" ? "ornek@email.com" : "+90 555 ..."}
                              />
                            </div>
                          )}

                          {resetStep === "verify" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="reset-code">Doğrulama Kodu</Label>
                                <Input
                                  id="reset-code"
                                  value={resetCode}
                                  onChange={(e) => setResetCode(e.target.value)}
                                  placeholder="6 haneli kod"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-password">Yeni Şifre</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="En az 6 karakter"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          {resetStep !== "method" && (
                            <Button variant="outline" onClick={() => setResetStep(resetStep === "verify" ? "input" : "method")} disabled={resetLoading}>
                              Geri
                            </Button>
                          )}
                          {resetStep === "method" && (
                            <Button onClick={() => setResetStep("input")}>Devam Et</Button>
                          )}
                          {resetStep === "input" && (
                            <Button onClick={handleSendResetCode} disabled={resetLoading}>
                              {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Kod Gönder
                            </Button>
                          )}
                          {resetStep === "verify" && (
                            <Button onClick={handleVerifyAndReset} disabled={resetLoading}>
                              {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Şifreyi Güncelle
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Yeni Hesap Oluşturun</CardTitle>
                <CardDescription>
                  Manevi yolculuğunuza hemen başlayın
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+90 5XX XXX XX XX"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          phone: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor">Sponsor Kodu (Opsiyonel)</Label>
                    <Input
                      id="sponsor"
                      type="text"
                      placeholder="Sponsor kodunu girin"
                      value={registerData.sponsor}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          sponsor: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Şifre</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Şifre Tekrar</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Hesap Oluştur
                  </Button>
                  <div className="text-center text-xs text-muted-foreground">
                    Kayıt olarak{" "}
                    <a href="#" className="text-primary hover:underline">
                      Kullanım Şartları
                    </a>{" "}
                    ve{" "}
                    <a href="#" className="text-primary hover:underline">
                      Gizlilik Politikası
                    </a>
                    'nı kabul etmiş olursunuz.
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

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
