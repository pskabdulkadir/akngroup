import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Copy,
  Edit,
  Save,
  RefreshCw,
} from "lucide-react";

export default function BankAccountDemo() {
  // Bank Account Management States
  const [bankEditModal, setBankEditModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState({
    TRY: {
      bank: 'QNB Finans Bank',
      accountHolder: 'Abdulkadir Kan',
      iban: 'TR86 0011 1000 0000 0091 7751 22',
      branch: 'Merkez Şubesi',
      active: true
    },
    USD: {
      bank: 'Silicon Valley Bank',
      accountHolder: 'Kutbul Zaman Inc.',
      iban: 'US64 SVBK US6S 3300 9673 8637',
      swift: 'SVBKUS6S',
      active: true
    },
    EUR: {
      bank: 'Commerzbank AG',
      accountHolder: 'Kutbul Zaman GmbH',
      iban: 'DE89 3704 0044 0532 0130 00',
      swift: 'COBADEFF',
      active: true
    },
    BTC: {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      network: 'Bitcoin Mainnet',
      note: 'Sadece Bitcoin gönderin. Diğer kripto paralar kaybolabilir.',
      active: true
    }
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Admin Banka Hesapları Demo
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                size="sm"
              >
                Geri Dön
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Admin Bank Details Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center space-x-2">
                <Building className="w-6 h-6 text-blue-600" />
                <span>🏦 Admin Banka Hesapları</span>
              </div>
              <Button 
                variant="outline" 
                className="border-2 border-blue-300 hover:bg-blue-50"
                onClick={() => setBankEditModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Hesapları Düzenle
              </Button>
            </CardTitle>
            <CardDescription className="text-lg text-gray-800 font-medium">
              Para yatırma işlemleri için kullanılacak banka hesapları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TRY Account */}
              <Card className="border-2 border-blue-300">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">₺</span>
                      <span className="text-xl font-bold text-gray-900">Türk Lirası Hesabı</span>
                    </div>
                    <Switch 
                      checked={bankAccounts.TRY.active}
                      onCheckedChange={(checked) => 
                        setBankAccounts(prev => ({
                          ...prev,
                          TRY: { ...prev.TRY, active: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Banka:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.TRY.bank}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Hesap Sahibi:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.TRY.accountHolder}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">IBAN:</span>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="font-mono text-base tracking-wider text-gray-900">{bankAccounts.TRY.iban}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccounts.TRY.iban);
                          alert('📋 IBAN panoya kopyalandı!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={bankAccounts.TRY.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {bankAccounts.TRY.active ? "✅ Aktif" : "❌ Pasif"}
                  </Badge>
                </CardContent>
              </Card>

              {/* USD Account */}
              <Card className="border-2 border-green-300">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">$</span>
                      <span className="text-xl font-bold text-gray-900">Amerikan Doları Hesabı</span>
                    </div>
                    <Switch 
                      checked={bankAccounts.USD.active}
                      onCheckedChange={(checked) => 
                        setBankAccounts(prev => ({
                          ...prev,
                          USD: { ...prev.USD, active: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Banka:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.USD.bank}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Hesap Sahibi:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.USD.accountHolder}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">IBAN:</span>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="font-mono text-base tracking-wider text-gray-900">{bankAccounts.USD.iban}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccounts.USD.iban);
                          alert('📋 IBAN panoya kopyalandı!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">SWIFT:</span>
                    <p className="font-mono text-base tracking-wider bg-gray-50 p-2 rounded border text-gray-900">{bankAccounts.USD.swift}</p>
                  </div>
                  <Badge className={bankAccounts.USD.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {bankAccounts.USD.active ? "✅ Aktif" : "❌ Pasif"}
                  </Badge>
                </CardContent>
              </Card>

              {/* EUR Account */}
              <Card className="border-2 border-purple-300">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">€</span>
                      <span className="text-xl font-bold text-gray-900">Euro Hesabı</span>
                    </div>
                    <Switch 
                      checked={bankAccounts.EUR.active}
                      onCheckedChange={(checked) => 
                        setBankAccounts(prev => ({
                          ...prev,
                          EUR: { ...prev.EUR, active: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Banka:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.EUR.bank}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Hesap Sahibi:</span>
                      <p className="text-gray-900 font-medium">{bankAccounts.EUR.accountHolder}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">IBAN:</span>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="font-mono text-base tracking-wider text-gray-900">{bankAccounts.EUR.iban}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccounts.EUR.iban);
                          alert('📋 IBAN panoya kopyalandı!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">SWIFT:</span>
                    <p className="font-mono text-base tracking-wider bg-gray-50 p-2 rounded border text-gray-900">{bankAccounts.EUR.swift}</p>
                  </div>
                  <Badge className={bankAccounts.EUR.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {bankAccounts.EUR.active ? "✅ Aktif" : "❌ Pasif"}
                  </Badge>
                </CardContent>
              </Card>

              {/* BTC Wallet */}
              <Card className="border-2 border-orange-300">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">₿</span>
                      <span className="text-xl font-bold text-gray-900">Bitcoin Cüzdanı</span>
                    </div>
                    <Switch 
                      checked={bankAccounts.BTC.active}
                      onCheckedChange={(checked) => 
                        setBankAccounts(prev => ({
                          ...prev,
                          BTC: { ...prev.BTC, active: checked }
                        }))
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-600">Network:</span>
                    <p className="text-gray-900 font-medium">{bankAccounts.BTC.network}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Cüzdan Adresi:</span>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                      <span className="font-mono text-sm md:text-base break-all tracking-wider text-gray-900">{bankAccounts.BTC.address}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccounts.BTC.address);
                          alert('📋 Bitcoin adresi panoya kopyalandı!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                    <p className="text-sm text-orange-700">
                      ⚠️ {bankAccounts.BTC.note}
                    </p>
                  </div>
                  <Badge className={bankAccounts.BTC.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {bankAccounts.BTC.active ? "✅ Aktif" : "❌ Pasif"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">⚡ E-Cüzdan Sistem Entegrasyonu</h3>
                  <p className="text-sm text-gray-700">Tüm finansal işlemler gerçek zamanlı olarak takip edilir ve işlenir</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-700">🔄 Canlı Entegrasyon Aktif</p>
                <p className="text-xs text-gray-600">Admin onayları anında sisteme yansır</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Edit Modal */}
      <Dialog open={bankEditModal} onOpenChange={setBankEditModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-2xl">
              <Building className="w-6 h-6 text-blue-600" />
              <span>🏦 Banka Hesapları Yönetimi</span>
            </DialogTitle>
            <DialogDescription>
              Para yatırma işlemleri için kullanılacak banka hesaplarını düzenleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* TRY Account Edit */}
            <Card className="border-2 border-blue-300">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">₺</span>
                    <span className="text-xl font-bold text-gray-900">Türk Lirası Hesabı</span>
                  </div>
                  <Switch
                    checked={bankAccounts.TRY.active}
                    onCheckedChange={(checked) => 
                      setBankAccounts(prev => ({
                        ...prev,
                        TRY: { ...prev.TRY, active: checked }
                      }))
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="try-bank">Banka Adı</Label>
                    <Input
                      id="try-bank"
                      value={bankAccounts.TRY.bank}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        TRY: { ...prev.TRY, bank: e.target.value }
                      }))}
                      placeholder="Banka adını girin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="try-holder">Hesap Sahibi</Label>
                    <Input
                      id="try-holder"
                      value={bankAccounts.TRY.accountHolder}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        TRY: { ...prev.TRY, accountHolder: e.target.value }
                      }))}
                      placeholder="Hesap sahibi adı"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="try-iban">IBAN</Label>
                  <Input
                    id="try-iban"
                    value={bankAccounts.TRY.iban}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      TRY: { ...prev.TRY, iban: e.target.value }
                    }))}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="try-branch">Şube</Label>
                  <Input
                    id="try-branch"
                    value={bankAccounts.TRY.branch}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      TRY: { ...prev.TRY, branch: e.target.value }
                    }))}
                    placeholder="Şube adı"
                  />
                </div>
              </CardContent>
            </Card>

            {/* USD Account Edit */}
            <Card className="border-2 border-green-300">
              <CardHeader className="bg-gradient-to-r from-green-100 to-green-200">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">$</span>
                    <span className="text-xl font-bold text-gray-900">Amerikan Doları Hesabı</span>
                  </div>
                  <Switch
                    checked={bankAccounts.USD.active}
                    onCheckedChange={(checked) => 
                      setBankAccounts(prev => ({
                        ...prev,
                        USD: { ...prev.USD, active: checked }
                      }))
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usd-bank">Banka Adı</Label>
                    <Input
                      id="usd-bank"
                      value={bankAccounts.USD.bank}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        USD: { ...prev.USD, bank: e.target.value }
                      }))}
                      placeholder="Bank name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usd-holder">Hesap Sahibi</Label>
                    <Input
                      id="usd-holder"
                      value={bankAccounts.USD.accountHolder}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        USD: { ...prev.USD, accountHolder: e.target.value }
                      }))}
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="usd-iban">IBAN</Label>
                  <Input
                    id="usd-iban"
                    value={bankAccounts.USD.iban}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      USD: { ...prev.USD, iban: e.target.value }
                    }))}
                    placeholder="US00 BANK CODE ACCOUNT NUMBER"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="usd-swift">SWIFT Code</Label>
                  <Input
                    id="usd-swift"
                    value={bankAccounts.USD.swift}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      USD: { ...prev.USD, swift: e.target.value }
                    }))}
                    placeholder="SWIFT/BIC Code"
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* EUR Account Edit */}
            <Card className="border-2 border-purple-300">
              <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-200">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">€</span>
                    <span className="text-xl font-bold text-gray-900">Euro Hesabı</span>
                  </div>
                  <Switch
                    checked={bankAccounts.EUR.active}
                    onCheckedChange={(checked) => 
                      setBankAccounts(prev => ({
                        ...prev,
                        EUR: { ...prev.EUR, active: checked }
                      }))
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eur-bank">Banka Adı</Label>
                    <Input
                      id="eur-bank"
                      value={bankAccounts.EUR.bank}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        EUR: { ...prev.EUR, bank: e.target.value }
                      }))}
                      placeholder="Bank name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eur-holder">Hesap Sahibi</Label>
                    <Input
                      id="eur-holder"
                      value={bankAccounts.EUR.accountHolder}
                      onChange={(e) => setBankAccounts(prev => ({
                        ...prev,
                        EUR: { ...prev.EUR, accountHolder: e.target.value }
                      }))}
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="eur-iban">IBAN</Label>
                  <Input
                    id="eur-iban"
                    value={bankAccounts.EUR.iban}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      EUR: { ...prev.EUR, iban: e.target.value }
                    }))}
                    placeholder="DE00 0000 0000 0000 0000 00"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="eur-swift">SWIFT Code</Label>
                  <Input
                    id="eur-swift"
                    value={bankAccounts.EUR.swift}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      EUR: { ...prev.EUR, swift: e.target.value }
                    }))}
                    placeholder="SWIFT/BIC Code"
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* BTC Wallet Edit */}
            <Card className="border-2 border-orange-300">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">₿</span>
                    <span className="text-xl font-bold text-gray-900">Bitcoin Cüzdanı</span>
                  </div>
                  <Switch
                    checked={bankAccounts.BTC.active}
                    onCheckedChange={(checked) => 
                      setBankAccounts(prev => ({
                        ...prev,
                        BTC: { ...prev.BTC, active: checked }
                      }))
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="btc-address">Bitcoin Cüzdan Adresi</Label>
                  <Input
                    id="btc-address"
                    value={bankAccounts.BTC.address}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      BTC: { ...prev.BTC, address: e.target.value }
                    }))}
                    placeholder="Bitcoin wallet address"
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="btc-network">Network</Label>
                  <Select
                    value={bankAccounts.BTC.network}
                    onValueChange={(value) => setBankAccounts(prev => ({
                      ...prev,
                      BTC: { ...prev.BTC, network: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bitcoin Mainnet">Bitcoin Mainnet</SelectItem>
                      <SelectItem value="Bitcoin Testnet">Bitcoin Testnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="btc-note">Uyarı Notu</Label>
                  <Textarea
                    id="btc-note"
                    value={bankAccounts.BTC.note}
                    onChange={(e) => setBankAccounts(prev => ({
                      ...prev,
                      BTC: { ...prev.BTC, note: e.target.value }
                    }))}
                    placeholder="Kullanıcılara gösterilecek uyarı notu"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setBankEditModal(false)}
              className="border-2 border-gray-300"
            >
              ❌ İptal
            </Button>
            <Button
              onClick={() => {
                console.log('💰 Bank accounts updated:', bankAccounts);
                setBankEditModal(false);
                alert('✅ Banka hesap bilgileri başarıyla güncellendi! Değişiklikler E-Cüzdan sistemine anında yansıdı.');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Değişiklikleri Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
