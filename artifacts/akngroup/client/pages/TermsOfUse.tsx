import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
            <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-300">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-green-600" />
                  <span>📜 Kullanım Koşulları</span>
                </CardTitle>
                <p className="text-center text-gray-700 text-lg">
                  Ruhsal Gelişim sistemi kullanım şartları ve koşulları
                </p>
              </CardHeader>
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Kabul Edilen Kullanım</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Ruhsal Gelişim sistemi üyesi olarak aşağıdaki kurallara uymayı kabul ediyorsunuz:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Sistemde gerçek ve doğru bilgiler kullanmak</li>
                  <li>Yasal olmayan faaliyetlerde bulunmamak</li>
                  <li>Diğer üyelere saygılı davranmak</li>
                  <li>Sistemin kurallarına ve etiğine uygun hareket etmek</li>
                  <li>Finansal yükümlülükleri zamanında yerine getirmek</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Ruhsal Gelişim Ağı Kuralları</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Ruhsal Gelişim Ağı sistemi kuralları:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Sponsor sistemi ile yeni üye kayıtları</li>
                  <li>Komisyon ve bonus dağıtım kuralları</li>
                  <li>Kariyer seviyeleri ve gereksinimleri</li>
                  <li>Minimum aktivite koşulları</li>
                  <li>Ruhsal Gelişim Ağı yapısında etik davranış kuralları</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Yasaklanan Faaliyetler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 font-semibold text-red-600">
                  Aşağıdaki faaliyetler kesinlikle yasaktır:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Sahte bilgi ve belgelerle üyelik</li>
                  <li>Sistemde manipülasyon ve hile</li>
                  <li>Diğer üyelerin bilgilerini kötüye kullanma</li>
                  <li>Spam ve istenmeyen mesaj gönderme</li>
                  <li>Sistemi zarar verecek faaliyetler</li>
                  <li>Finansal dolandırıcılık girişimleri</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>Finansal Koşullar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Finansal işlemler ve koşullar:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Giriş paketi ödemeleri ve koşulları</li>
                  <li>Komisyon hesaplama ve ödeme tarihleri</li>
                  <li>Minimum çekim tutarları</li>
                  <li>İade ve iptal koşulları</li>
                  <li>Vergi yükümlülükleri ve beyanları</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-yellow-800">⚠️ Önemli Uyarı</h3>
                <p className="text-gray-700 mb-4">
                  Ruhsal Gelişim sistemi yasal bir iş modeli olup, piramit şeması değildir. Kazançlar,
                  kişisel performans ve Ruhsal Gelişim Ağı aktivitesine bağlıdır. Garantili kazanç
                  vaat edilmez.
                </p>
                <p className="text-sm text-gray-600">
                  Bu sistemde yer almak, finansal risk içerebilir. Kararınızı vermeden
                  önce tüm koşulları dikkatlice okuyun ve anlayın.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-green-800">📞 Destek ve İletişim</h3>
                <p className="text-gray-700 mb-4">
                  Kullanım koşulları ile ilgili sorularınız için:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>E-posta:</strong> destek@kutbulzaman.com</p>
                  <p><strong>WhatsApp:</strong> +90 555 123 4567</p>
                  <p><strong>Çalışma Saatleri:</strong> 09:00 - 18:00 (Hafta içi)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 text-center">
                  Son güncelleme: {new Date().toLocaleDateString('tr-TR')} • Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
