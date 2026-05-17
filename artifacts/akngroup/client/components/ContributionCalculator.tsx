import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  Heart, 
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ContributionCalculator() {
  const [teamSize, setTeamSize] = useState(5);
  const [activeRate, setActiveRate] = useState(60);
  const [avgContribution, setAvgContribution] = useState(100);
  const [depth, setDepth] = useState(3);

  // Simple calculation logic for "Ruhsal Gelişim Katkı Payı"
  // This is a simulation of potential earnings and spiritual impact
  const calculateResults = () => {
    // Basic formula: Team Size * Active Rate * Avg Contribution * (Depth Factor)
    // Plus a "Spiritual Factor"
    const totalActive = Math.round(teamSize * (activeRate / 100));
    const monthlyTotal = Math.round(totalActive * avgContribution * (1 + depth * 0.1));
    const potentialEarnings = Math.round(monthlyTotal * 0.15); // 15% average commission
    const spiritualImpactScore = Math.round(totalActive * (avgContribution / 20) * (depth / 2));

    return {
      totalActive,
      monthlyTotal,
      potentialEarnings,
      spiritualImpactScore
    };
  };

  const results = calculateResults();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Simülasyon Parametreleri
            </CardTitle>
            <CardDescription>Ekip yapınızı ve katkı payı hedeflerinizi belirleyin</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-gray-700">Toplam Direkt Üye Sayısı</Label>
                <span className="text-indigo-600 font-black">{teamSize}</span>
              </div>
              <Slider 
                value={[teamSize]} 
                onValueChange={(val) => setTeamSize(val[0])} 
                max={50} 
                step={1} 
                className="py-2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-gray-700">Ekip Aktifliği (%)</Label>
                <span className="text-emerald-600 font-black">%{activeRate}</span>
              </div>
              <Slider 
                value={[activeRate]} 
                onValueChange={(val) => setActiveRate(val[0])} 
                max={100} 
                step={5} 
                className="py-2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-gray-700">Ort. Aylık Katkı Payı ($)</Label>
                <span className="text-blue-600 font-black">${avgContribution}</span>
              </div>
              <Slider 
                value={[avgContribution]} 
                onValueChange={(val) => setAvgContribution(val[0])} 
                min={25}
                max={1000} 
                step={25} 
                className="py-2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-gray-700">Derinlik Seviyesi</Label>
                <span className="text-purple-600 font-black">{depth}. Seviye</span>
              </div>
              <Slider 
                value={[depth]} 
                onValueChange={(val) => setDepth(val[0])} 
                min={1}
                max={7} 
                step={1} 
                className="py-2"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 blur-2xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-300" />
                Tahmini Aylık Sonuç
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center py-4">
                <span className="text-5xl font-black tracking-tighter mb-1">${results.potentialEarnings.toLocaleString()}</span>
                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Pasif Gelir Potansiyeli</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 uppercase font-black">Aktif Üye</p>
                  <p className="text-lg font-bold">{results.totalActive}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 uppercase font-black">Gelişim Puanı</p>
                  <p className="text-lg font-bold">+{results.spiritualImpactScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100 bg-emerald-50/30">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                  Ruhsal Katkı Etkisi
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                  Yaptığınız her katkı payı harcaması, sistemdeki diğer üyelerin ruhsal gelişimine ve eğitim fonuna aktarılır. Maddi kazancınız arttıkça, manevi etkiniz de aynı oranda katlanır.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center gap-3">
             <Info className="w-5 h-5 text-orange-500 shrink-0" />
             <p className="text-[10px] text-orange-800 italic leading-tight">
               * Bu hesaplamalar bir taahhüt değil, sistemin matematiksel modeline dayalı bir simülasyondur. Gerçek kazançlar ekip performansına göre değişiklik gösterir.
             </p>
          </div>
        </div>
      </div>

      <Card className="border-2 border-slate-200 bg-white">
        <CardContent className="p-6">
          <h3 className="font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Nasıl Daha Fazla Kazanırsınız?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-600 uppercase">Kaldıraç Etkisi</div>
              <p className="text-[11px] text-slate-600">Direkt üyelerinizin kendi ekiplerini kurmalarına yardımcı olun (Derinlik stratejisi).</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-600 uppercase">Süreklilik</div>
              <p className="text-[11px] text-slate-600">Aktiflik oranını %80 üzerine taşıyarak monoline havuz kazançlarını maksimize edin.</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-600 uppercase">Kariyer Atlaması</div>
              <p className="text-[11px] text-slate-600">Nefis mertebelerindeki kariyerinizi yükselterek her katmandan ek +%1-6 prim alın.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
