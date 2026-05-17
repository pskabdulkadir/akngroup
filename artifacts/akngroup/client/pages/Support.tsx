import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, User, Send } from "lucide-react";
import { Link } from "react-router-dom";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`📧 Destek talebiniz alındı!\n\nAdınız: ${formData.name}\nKonu: ${formData.subject}\n\n✅ En kısa sürede size dönüş yapacağız.\n📱 WhatsApp: +90 555 123 4567\n📧 E-posta: destek@kutbulzaman.com`);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </Link>
            <Card className="bg-gradient-to-r from-blue-100 to-green-100 border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center flex items-center justify-center space-x-3">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                  <span>🛟 Destek Merkezi</span>
                </CardTitle>
                <p className="text-center text-gray-700 text-lg">
                  Size yardımcı olmak için buradayız! Herhangi bir sorunuz için bizimle iletişime geçin.
                </p>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>📞 İletişim Bilgileri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold">WhatsApp Destek</p>
                      <p className="text-sm text-gray-600">+90 555 123 4567</p>
                      <p className="text-xs text-green-600">En hızlı yöntem - Anında yanıt</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold">E-posta Destek</p>
                      <p className="text-sm text-gray-600">destek@kutbulzaman.com</p>
                      <p className="text-xs text-blue-600">Detaylı sorular için ideal</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold">Çalışma Saatleri</p>
                      <p className="text-sm text-gray-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                      <p className="text-xs text-purple-600">Hafta sonu acil durumlarda WhatsApp</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔧 Sık Sorulan Sorular</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="font-semibold cursor-pointer">Üyelik nasıl oluşturabilirim?</summary>
                      <p className="text-sm text-gray-600 mt-2">
                        Ana sayfadan "Üye Ol" butonuna tıklayarak veya bir sponsorun referans linki ile kayıt olabilirsiniz.
                      </p>
                    </details>
                    
                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="font-semibold cursor-pointer">Komisyonlar ne zaman ödenir?</summary>
                      <p className="text-sm text-gray-600 mt-2">
                        Komisyonlar haftalık olarak hesaplanır ve onaylandıktan sonra cüzdanınıza aktarılır.
                      </p>
                    </details>
                    
                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="font-semibold cursor-pointer">Clone sayfam nasıl çalışır?</summary>
                      <p className="text-sm text-gray-600 mt-2">
                        Her üyeye özel clone sayfa ve mağaza oluşturulur. Kendi linklerinizle ürün satışı yapabilirsiniz.
                      </p>
                    </details>

                    <details className="p-3 bg-gray-50 rounded-lg">
                      <summary className="font-semibold cursor-pointer">Minimum çekim tutarı nedir?</summary>
                      <p className="text-sm text-gray-600 mt-2">
                        Minimum çekim tutarı 100 TL'dir. E-cüzdan bölümünden çekim talebinde bulunabilirsiniz.
                      </p>
                    </details>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    <span>📧 Bize Yazın</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Sorunuzu detaylı olarak yazın, en kısa sürede size dönüş yapalım.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Adınızı ve soyadınızı girin"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="E-posta adresinizi girin"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Konu</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="Sorununuzun konusunu yazın"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Mesajınız</Label>
                      <Textarea
                        id="message"
                        placeholder="Sorununuzu detaylı olarak açıklayın..."
                        className="min-h-32"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Mesajı Gönder
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h3 className="font-bold text-yellow-800 mb-2">⚡ Acil Durumlar İçin</h3>
                  <p className="text-sm text-gray-700">
                    Hesap güvenliği, ödeme sorunları veya teknik arızalar için 
                    doğrudan WhatsApp hattımızdan <strong>+90 555 123 4567</strong> 
                    numarasından bize ulaşabilirsiniz.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Help Topics */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🎯 Yardım Kategorileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-800">Hesap Yönetimi</h3>
                    <p className="text-xs text-gray-600 mt-1">Üyelik, profil ve güvenlik</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-800">MLM Network</h3>
                    <p className="text-xs text-gray-600 mt-1">Sponsor sistemi ve komisyonlar</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-800">Ürün Satışları</h3>
                    <p className="text-xs text-gray-600 mt-1">Clone mağaza ve satış desteği</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Phone className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-orange-800">Teknik Destek</h3>
                    <p className="text-xs text-gray-600 mt-1">Platform ve sistem sorunları</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
