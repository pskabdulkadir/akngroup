import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </Link>
            <Card className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center flex items-center justify-center space-x-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <span>🔒 Gizlilik Politikası</span>
                </CardTitle>
                <p className="text-center text-gray-700 text-lg">
                  Kişisel verilerinizin korunması bizim önceliğimizdir
                </p>
              </CardHeader>
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span>Veri Toplama ve Kullanım</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Ruhsal Gelişim sistemi olarak topladığımız kişisel bilgiler:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Ad, soyad ve iletişim bilgileri</li>
                  <li>E-posta adresi ve telefon numarası</li>
                  <li>Kimlik doğrulama bilgileri</li>
                  <li>Finansal işlem geçmişi</li>
                  <li>Ruhsal Gelişim Ağı yapısı ve referans bilgileri</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  <span>Veri Güvenliği</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Verilerinizin güvenliği için aldığımız önlemler:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>SSL şifreleme ile güvenli veri iletimi</li>
                  <li>Şifreli veritabanı saklama</li>
                  <li>Düzenli güvenlik denetimleri</li>
                  <li>Erişim kontrolü ve yetkilendirme</li>
                  <li>KVKK uyumlu veri işleme</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <span>Veri Saklama ve Silme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Kişisel verilerinizle ilgili haklarınız:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Verilerinize erişim hakkı</li>
                  <li>Veri düzeltme ve güncelleme hakkı</li>
                  <li>Veri silme hakkı ("unutulma hakkı")</li>
                  <li>Veri taşınabilirlik hakkı</li>
                  <li>İşleme itiraz etme hakkı</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-blue-800">📞 İletişim</h3>
                <p className="text-gray-700 mb-4">
                  Gizlilik politikası ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>E-posta:</strong> gizlilik@kutbulzaman.com</p>
                  <p><strong>Telefon:</strong> +90 555 123 4567</p>
                  <p><strong>Adres:</strong> İstanbul, Türkiye</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 text-center">
                  Son güncelleme: {new Date().toLocaleDateString('tr-TR')} • Bu gizlilik politikası KVKK ve GDPR uyumludur.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
