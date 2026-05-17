import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  Target,
  TrendingUp,
  Users,
  Wallet,
  ShieldCheck,
  Star,
  Heart,
  Zap,
  Award,
  Globe,
  Flame,
  Brain,
  ArrowRight,
  Eye,
  Moon,
  Sparkles,
  Copy,
  Activity,
  ShieldAlert,
  Infinity as InfinityIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  color: string;
}

export function SystemPresentation({ open, onOpenChange, referralCode }: { open: boolean; onOpenChange: (open: boolean) => void; referralCode?: string }) {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      title: "Manevi, Zahiri ve Batıni Dengesi",
      description: "Üçlü Sistem Mimarisi ile Tam Tekamül.",
      icon: <InfinityIcon className="w-10 h-10 text-white" />,
      color: "bg-emerald-900",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 leading-relaxed text-sm">
            Kutbul Zaman sistemi, insanın üç ana boyutunu (Madde, Mana ve Enerji) birleştiren dünyadaki ilk <b>"Hibrit Tekamül"</b> modelidir.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <Heart className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <h4 className="font-bold text-emerald-800 text-[9px] uppercase">Manevi</h4>
              <p className="text-[8px] text-emerald-600">Ruhun Gıdası</p>
            </div>
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-center">
              <Zap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <h4 className="font-bold text-blue-800 text-[9px] uppercase">Zahiri</h4>
              <p className="text-[8px] text-blue-600">Maddi Güç</p>
            </div>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
              <Eye className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <h4 className="font-bold text-indigo-800 text-[9px] uppercase">Batıni</h4>
              <p className="text-[8px] text-indigo-600">Enerji Boyutu</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-2 text-center">
            "Sağlam bir ruh, güçlü bir enerji alanı ve bereketli bir ticari akış..."
          </p>
        </div>
      )
    },
    {
      title: "Manevi Panel: Ruhsal Check-Up",
      description: "Kalbinizi her gün arındırın ve parlatın.",
      icon: <Sparkles className="w-10 h-10 text-white" />,
      color: "bg-emerald-700",
      content: (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm leading-relaxed">
            Manevi paneliniz, size özel <b>Esma-ül Hüsna</b> algoritmaları ve ruhsal takip çizelgeleri ile çalışır:
          </p>
          <div className="grid grid-cols-1 gap-2">
             {[
               { icon: <BookOpen className="w-3 h-3 text-emerald-600"/>, t: "İlim ve Adab Kütüphanesi", d: "Yüzlerce yıllık manevi birikime ve adab kitaplarına tek tıkla ulaşın." },
               { icon: <ShieldCheck className="w-3 h-3 text-emerald-600"/>, t: "Vird-i Zeban Takibi", d: "Size özel atanan virdleri günlük olarak takip edin ve ruhsal notlar alın." },
               { icon: <Activity className="w-3 h-3 text-emerald-600"/>, t: "Ruhsal Check-Up", d: "Haftalık manevi durumunuzu analiz eden ve size özel zikir öneren akıllı sistem." },
               { icon: <Heart className="w-3 h-3 text-emerald-600"/>, t: "Ortak Hatim Platformu", d: "Dünyanın her yerindeki üyelerle eş zamanlı hatimlere ve dualara katılın." }
             ].map((item, i) => (
               <div key={i} className="flex gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                 <div className="mt-1">{item.icon}</div>
                 <div>
                   <h5 className="text-[10px] font-black text-emerald-900 uppercase">{item.t}</h5>
                   <p className="text-[10px] text-emerald-700 leading-tight">{item.d}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )
    },
    {
      title: "Batıni Panel: Sırlar and Enerjiler",
      description: "Görünmeyenin ardındaki hikmeti keşfedin.",
      icon: <Moon className="w-10 h-10 text-white" />,
      color: "bg-indigo-900",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">
            Hücrelerinizi ve enerji alanınızı koruyan <b>Kozmik Frekans ve Ebced</b> altyapısı:
          </p>
          <div className="space-y-2">
             <div className="p-3 bg-indigo-800/40 border border-indigo-500/30 rounded-2xl">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-indigo-300">EBCED VE NUMEROLOJİ</span>
                 <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="text-[9px] text-indigo-100 px-2 py-1 bg-indigo-500/20 rounded">İsim Analizi: Kaderin Şifresi</div>
                  <div className="text-[9px] text-indigo-100 px-2 py-1 bg-indigo-500/20 rounded">Esma Hesaplama: Size Özel Frekans</div>
                  <div className="text-[9px] text-indigo-100 px-2 py-1 bg-indigo-500/20 rounded">Zaman Analizi: Eşref Saatleri</div>
                  <div className="text-[9px] text-indigo-100 px-2 py-1 bg-indigo-500/20 rounded">Rüya Tabiri: Sembollerin Dili</div>
               </div>
             </div>
             <div className="flex gap-3 p-3 bg-indigo-950/50 rounded-2xl border border-indigo-500/20">
               <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
               <p className="text-[10px] text-indigo-200">Negatif enerjilere ve metafizik saldırılara karşı <b>"Manevi Zırh"</b> frekanslarını kullanarak alanınızı koruyun.</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Zahiri Panel: Finansal Özgürlük",
      description: "Dünyevi rızkınızı akıllı sistemlerle yönetin.",
      icon: <Zap className="w-10 h-10 text-white" />,
      color: "bg-orange-600",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            Sisteme dahil olduğunuz an, teknoloji destekli bir <b>Global Ticaret Mağazası</b> sahibi olursunuz:
          </p>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl">
                <Target className="w-4 h-4 text-orange-600 mb-2" />
                <h6 className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">Akıllı CRM Paneli</h6>
                <p className="text-[9px] text-orange-700 leading-tight">Yol arkadaşlarınızın gelişimini ve satışlarınızı anlık olarak yapay zeka ile izleyin.</p>
             </div>
             <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl">
                <TrendingUp className="w-4 h-4 text-orange-600 mb-2" />
                <h6 className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">Bonus Simülatörü</h6>
                <p className="text-[9px] text-orange-700 leading-tight">Gelecek kazançlarınızı planlayın ve kariyer hedeflerinize nasıl ulaşacağınızı görün.</p>
             </div>
          </div>
          <div className="p-3 bg-orange-100/50 rounded-xl border border-orange-200 flex items-center gap-3">
             <Globe className="w-5 h-5 text-orange-600 shrink-0" />
             <p className="text-[10px] text-orange-800"><b>Lojistik ve Tahsilat Yok:</b> Her şey sizin yerinize sistem tarafından otomatik olarak yönetilir.</p>
          </div>
        </div>
      )
    },
    {
      title: "Kişisel Manevi Rehber Yolculuğu",
      description: "Yalnız değilsiniz, bir rehber eşliğinde ilerleyin.",
      icon: <Users className="w-10 h-10 text-white" />,
      color: "bg-emerald-800",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed text-left">
            Bu sistemde sadece bir üye değil, bir <b>"Yol Arkadaşı"</b> olursunuz. Manevi rehberiniz size şu konularda ışık tutar:
          </p>
          <div className="grid grid-cols-2 gap-3">
             {[
               { t: "Nefis Terbiyesi", d: "Kötü huylardan arınma ve güzel ahlak edinme." },
               { t: "Hikmet Arayışı", d: "Olayların arkasındaki ilahi sırları anlama." },
               { t: "Hizmet Bilinci", d: "Başkalarına faydalı olmanın manevi hazzı." },
               { t: "İçsel Huzur", d: "Stres ve kaygıdan uzak, tevekkül dolu bir yaşam." }
             ].map((item, i) => (
               <div key={i} className="p-3 bg-white border border-emerald-100 rounded-2xl shadow-sm">
                 <h5 className="text-[10px] font-black text-emerald-700 uppercase">{item.t}</h5>
                 <p className="text-[9px] text-slate-500 leading-tight mt-1">{item.d}</p>
               </div>
             ))}
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 font-medium">
             🌟 "Rehberi olanın yolu kısalır, menzili yakınlaşır."
          </div>
        </div>
      )
    },
    {
      title: "Monoline: Global Büyüme Hattı",
      description: "Neden başkalarının başarısı sizin de başarınızdır?",
      icon: <Target className="w-10 h-10 text-white" />,
      color: "bg-blue-800",
      content: (
        <div className="space-y-5">
          <p className="text-gray-600 text-sm leading-relaxed">
            Geleneksel İkili Denge veya Ağ yapılarının aksine, bizde <b>tek bir dünya hattı</b> vardır. Siz kaydınızı aldığınız an, sistemden saniyeler sonra kayıt olan Ümraniye'deki bir kişi veya New York'taki bir yabancı sizin alt hattınıza düşer.
          </p>
          <div className="flex flex-col items-center py-2">
             <div className="relative flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-blue-500 rotate-3 flex items-center justify-center text-white font-bold text-xs shadow-lg">SİZ</div>
               <ArrowRight className="w-4 h-4 text-blue-300" />
               <div className="w-10 h-10 rounded-2xl bg-slate-200" />
               <ArrowRight className="w-4 h-4 text-slate-300" />
               <div className="w-10 h-10 rounded-2xl bg-slate-100" />
               <div className="absolute -top-8 left-full whitespace-nowrap text-[10px] font-black text-blue-700 bg-white px-3 py-1 rounded-full border shadow-sm">
                 DÜNYA SİZİN İÇİN ÇALIŞIYOR
               </div>
             </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-800 italic text-center">
            "Birlikte giriş yaptığımız bu yolda, global büyümeden herkes adil payını alır."
          </div>
        </div>
      )
    },
    {
      title: "Anlık %15 Yol Arkadaşlığı Hediyesi",
      description: "Hızlı nakit akışının en kolay yolu.",
      icon: <Users className="w-10 h-10 text-white" />,
      color: "bg-blue-600",
      content: (
        <div className="space-y-4 text-center">
          <div className="relative inline-block">
             <div className="p-8 bg-white rounded-[2rem] border-4 border-blue-100 shadow-xl">
               <h3 className="text-5xl font-black text-blue-600 tracking-tighter">%15</h3>
               <p className="text-xs font-bold text-blue-400 mt-1 uppercase tracking-widest">Yol Arkadaşlığı</p>
             </div>
             <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md animate-bounce">
                <Zap className="w-5 h-5 fill-white" />
             </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed max-w-sm mx-auto">
            Referans kodunuzla kayıt olan her yeni iş ortağının yaptığı her paket veya ürün alımının <b>tam %15'i anında</b> cüzdanınıza yansır. Nakit ihtiyacınızı anında karşılar.
          </p>
          <div className="flex justify-center gap-4 mt-2">
             <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">GÜNLÜK ÖDEME</div>
             <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">SINIRSIZ REFERANS</div>
          </div>
        </div>
      )
    },
    {
      title: "7 Katmanlı Derinlik Kazancı",
      description: "Ekibiniz sizden bağımsız büyürken kazanın.",
      icon: <TrendingUp className="w-10 h-10 text-white" />,
      color: "bg-emerald-600",
      content: (
        <div className="space-y-2">
          <div className="max-h-[220px] overflow-y-auto pr-2 space-y-1">
            {[
              { l: "1. Nesil", p: "%10", d: "Sizin referanslarınız." },
              { l: "2. Nesil", p: "%5", d: "Onların getirdiği üyeler." },
              { l: "3. Nesil", p: "%3", d: "Ekibinizin ekibi." },
              { l: "4. Nesil", p: "%2", d: "Pasif gelire geçiş noktası." },
              { l: "5. Nesil", p: "%1.5", d: "Derinleşen organizasyon." },
              { l: "6. Nesil", p: "%1", d: "Liderlik vizyonu." },
              { l: "7. Nesil", p: "%0.5", d: "Maksimum global erişim." },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                <div>
                  <span className="text-[11px] font-black text-slate-800">{item.l}</span>
                  <p className="text-[9px] text-slate-500">{item.d}</p>
                </div>
                <div className="text-sm font-black text-emerald-600">{item.p}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center italic">
            "7 Seviyede katlanma etkisiyle 5 kişiden binlerce kişilik orduya dönüşürsünüz."
          </p>
        </div>
      )
    },
    {
      title: "Kariyer: Nefis Mertebeleri",
      description: "Karakteriniz geliştikçe kazancınız artar.",
      icon: <Award className="w-10 h-10 text-white" />,
      color: "bg-amber-600",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { n: "Emmare", r: "%1 Ek"},
              { n: "Levvame", r: "%2 Ek"},
              { n: "Mülhime", r: "%3 Ek"},
              { n: "Mutmainne", r: "Havuz + %4"},
              { n: "Radiye", r: "Havuz + %5"},
              { n: "Merdiye", r: "VIP + %6"},
            ].map((item, i) => (
              <div key={i} className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl flex flex-col items-center">
                 <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Kademe {i+1}</span>
                 <span className="text-xs font-bold text-amber-900">{item.n}</span>
                 <span className="text-[10px] font-medium text-amber-700 bg-white/80 px-2 py-0.5 rounded-full mt-1">{item.r}</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white text-center shadow-lg">
             <div className="flex items-center justify-center gap-2">
               <Star className="w-4 h-4 fill-white" />
               <h4 className="text-sm font-black italic">Maksimum Tekamül Mertebesi</h4>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Zirve Mertebesi: KAMİL LİDER",
      description: "Şirketin küresel ortağı olma vakti.",
      icon: <Star className="w-10 h-10 text-white" />,
      color: "bg-slate-900",
      content: (
        <div className="relative p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[2.5rem] overflow-hidden text-center space-y-5 border border-slate-700">
          <div className="relative z-10">
            <div className="inline-block px-4 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
               VİZYON ORTAĞI
            </div>
            <h3 className="text-3xl font-black text-white mb-4">KAMİL ÜNVANI</h3>
            <div className="grid grid-cols-1 gap-3 px-4">
               {[
                 "Global Cirodan %1 Ekstra Ömür Boyu Pay",
                 "Uluslararası Tatiller ve Eğitim Kampları",
                 "Şirket Yönetiminde Danışma Hakkı",
                 "Süresiz ve Limitsiz Gelir Potansiyeli"
               ].map((text, i) => (
                 <div key={i} className="flex items-center gap-3 text-left">
                   <div className="w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-3 h-3 text-black" />
                   </div>
                   <span className="text-xs text-slate-300 font-medium">{text}</span>
                 </div>
               ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 opacity-10">
            <Star className="w-48 h-48 text-amber-500 rotate-12" />
          </div>
        </div>
      )
    },
    {
      title: "Global Kazanç Havuzu: Yardımlaşma",
      description: "Kimsesiz ve sahipsiz üye bırakmıyoruz.",
      icon: <Globe className="w-10 h-10 text-white" />,
      color: "bg-purple-700",
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-purple-50 border border-purple-100 rounded-[2rem] relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-2xl font-black text-purple-700 tracking-tighter">BÜYÜK HAVUZ</h3>
               <p className="text-xs text-purple-600 mt-2 leading-relaxed">
                 Hattınızda kimse olmasa bile, aktif olan her üyemiz şirketin dünya cirosundan pay aldığı <b>%0.5</b>'lik ortak havuzdan yararlanır. Bu bizim "Kardeş Payı" modelimizdir.
               </p>
             </div>
             <Wallet className="absolute -right-8 -bottom-8 w-24 h-24 text-purple-200 opacity-40 rotate-[30deg]" />
          </div>
          <div className="flex gap-2">
             <div className="flex-1 p-3 bg-white border border-purple-100 rounded-2xl">
               <span className="text-[9px] font-black text-slate-400 uppercase">Periyot</span>
               <p className="text-xs font-bold text-slate-700">Her Ay Başı</p>
             </div>
             <div className="flex-1 p-3 bg-white border border-purple-100 rounded-2xl">
               <span className="text-[9px] font-black text-slate-400 uppercase">Aktiflik</span>
               <p className="text-xs font-bold text-slate-700">Son 30 Gün</p>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Helal Ürün ve Pazar Gücü",
      description: "Kaliteli ürün, dürüst ticaret.",
      icon: <ShieldCheck className="w-10 h-10 text-white" />,
      color: "bg-rose-700",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            Marketimizdeki her ürün <b>helal sertifikalı</b> ve insan sağlığına/ruhuna faydalı olarak seçilmiştir:
          </p>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <h6 className="text-[10px] font-black text-rose-800 uppercase">Doğal Takviyeler</h6>
                <p className="text-[8px] text-rose-600">Vücut frekansını yükselten bitkisel çözümler.</p>
             </div>
             <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                <BookOpen className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                <h6 className="text-[10px] font-black text-rose-800 uppercase">Eğitim Paketleri</h6>
                <p className="text-[8px] text-rose-600">Kişisel gelişim ve finansal okuryazarlık.</p>
             </div>
          </div>
          <div className="p-3 bg-rose-100/50 rounded-xl text-[10px] text-rose-900 font-bold border border-rose-200">
             💰 Mağazanızdan yapılan her alışverişte hem perakende karı hem de ekip komisyonu kazanırsınız.
          </div>
        </div>
      )
    },
    {
      title: "Üçlü Sistem: Neden Kazanıyorsunuz?",
      description: "Algoritma sizi başarıya itiyor.",
      icon: <Zap className="w-10 h-10 text-white" />,
      color: "bg-amber-700",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
             <div className="flex gap-4 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0 font-bold">M</div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-amber-800 uppercase">Manevi Arınma</h4>
                  <p className="text-[9px] text-amber-700">Bereketin önündeki manevi engelleri kaldırır.</p>
                </div>
             </div>
             <div className="flex gap-4 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0 font-bold">B</div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-amber-800 uppercase">Batıni Enerji</h4>
                  <p className="text-[9px] text-amber-700">Odaklanmanızı ve kararlılığınızı frekansla destekler.</p>
                </div>
             </div>
             <div className="flex gap-4 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0 font-bold">Z</div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-amber-800 uppercase">Zahiri Eylem</h4>
                  <p className="text-[9px] text-amber-700">Klon mağaza ve Monoline ile eyleminizi kazanca dönüştürür.</p>
                </div>
             </div>
          </div>
        </div>
      )
    },
    {
      title: "Karar Vermek Kaderdir!",
      description: "Değişimin bir tık uzağındasınız.",
      icon: <Flame className="w-10 h-10 text-white" />,
      color: "bg-red-600",
      content: (
        <div className="space-y-6 text-center py-2">
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900">Hazır mısınız?</h4>
            <p className="text-slate-600 text-sm max-w-xs mx-auto">
              Ruhunuzu ilimle, cüzdanınızı teknolojiyle dolduracağınız bu benzersiz yolculuğa şimdi davetlisiniz.
            </p>
          </div>
          
          <div className="space-y-3">
             <div 
               onClick={() => {
                 if (referralCode) {
                   window.open(`${window.location.origin}/register?sponsor=${referralCode}`, "_blank");
                 }
               }}
               className="group p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors cursor-pointer"
             >
               <div className="text-left">
                 <h4 className="text-xs font-black text-red-700 uppercase tracking-tighter">Hemen Kaydol</h4>
                 <p className="text-[10px] text-red-600">Sıranızı en önden alın.</p>
               </div>
               <ArrowRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
             </div>
             <div className="group p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between hover:bg-blue-100 transition-colors cursor-pointer">
               <div className="text-left">
                 <h4 className="text-xs font-black text-blue-700 uppercase tracking-tighter">Rehberi Oku</h4>
                 <p className="text-[10px] text-blue-600">Stratejileri şimdiden belirle.</p>
               </div>
               <BookOpen className="w-5 h-5 text-blue-500" />
             </div>
          </div>
          
          <Button 
            onClick={() => {
              if (referralCode) {
                window.open(`${window.location.origin}/register?sponsor=${referralCode}`, "_blank");
              } else {
                onOpenChange(false);
              }
            }} 
            className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl font-black text-lg shadow-xl mt-4"
          >
             BİSMİLLAH DE VE BAŞLA
          </Button>
        </div>
      )
    }
  ];

  const next = () => setCurrentSlide((s) => (s + 1) % slides.length);
  const prev = () => setCurrentSlide((s) => (s - 1 + slides.length) % slides.length);

  const copyPresentationLink = () => {
    const text = `
🚀 KUTBUL ZAMAN - SİSTEM TANITIM VE KAZANÇ SUNUMU 🚀

Manevi Tekamül ile Zahiri Kazancı birleştiren vizyonumuzla tanışın!

✨ SİSTEM ÖZELLİKLERİ:
• 🧘 Manevi Yol: Ruhsal Check-up ve Esma Çalışmaları
• 🌌 Batıni Sırlar: Kozmik Frekans ve Ebced Analizleri
• 💰 Zahiri Kazanç: Global Monoline ve Adil Paylaşım

💎 KAZANÇ PLANI:
• %15 Doğrudan Sponsor Primi (Anında!)
• 7 Derinlikte Ekip Geliri
• Global Havuzdan Kardeş Payı

Yerinizi erkenden alın, bu büyük vizyonun bir parçası olun!

🔗 SUNUM VE KAYIT LİNKİ:
${window.location.origin}/register?sponsor=${referralCode || "Merkez"}

Sponsor Kodu: ${referralCode || "Merkez"}
    `;

    navigator.clipboard.writeText(text.trim());
    toast({
      title: "✅ Kopyalandı",
      description: "Tanıtım metni ve referans linkiniz kopyalandı!",
    });
  };

  const downloadPresentation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/member/documents/doc-001-pdf/download', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('PDF indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kutbul_Zaman_Sistem_Sunumu_${referralCode || "Genel"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Presentation download error:', error);
      // Fallback to text if API fails
      const content = `
***********************************************************
SİSTEM TANITIM VE KAZANÇ SUNUMU - ÖZEL REHBER
***********************************************************

Bu doküman üyemize özel olarak oluşturulmuştur.

Davet Eden: ${referralCode ? `Üye Kodunuz: ${referralCode}` : "Sistem Sahibi"}
Kayıt Linki: ${window.location.origin}/register?sponsor=${referralCode || ""}

-----------------------------------------------------------
SİSTEM ÖZETİ:
-----------------------------------------------------------
1. Manevi Yol: Ruhsal tekamül ve esma çalışmaları.
2. Zahiri Sistem: Monoline global kazanç ve ticaret.
3. Batıni Sistem: Derin irfan ve sır ehliyet.

DETAYLI KAZANÇ PLANI:
- %15 Doğrudan Sponsor Primi
- 7 Derinlikte Ekip Kazancı
- Global Cirodan Pay (Monoline Havuzu)
- Kariyer Bonusları (Nefis Mertebeleri)

HAYIRLI VE BEREKETLİ KAZANÇLAR DİLERİZ.
***********************************************************
      `;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sistem_Tanitim_Rehberi_${referralCode || "Genel"}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("Üye kodunuzu içeren özel tanıtım rehber dosyası indirildi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogTitle className="sr-only">Sistem Tanıtımı</DialogTitle>
        <div className={cn("p-12 text-white transition-colors duration-1000 relative", slides[currentSlide].color)}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-3">
              <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-[9px] font-black tracking-widest uppercase backdrop-blur-md">
                 ADIM {currentSlide + 1} / {slides.length}
              </div>
              <h2 className="text-4xl font-black tracking-tighter leading-none">{slides[currentSlide].title}</h2>
              <p className="text-white/80 text-sm font-semibold">{slides[currentSlide].description}</p>
            </div>
            <motion.div 
              key={currentSlide}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-3xl border border-white/30 shadow-2xl"
            >
              {slides[currentSlide].icon}
            </motion.div>
          </div>
        </div>

        <div className="p-10 bg-white min-h-[380px] flex flex-col shadow-inner">
          <div className="flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full"
              >
                {slides[currentSlide].content}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prev} 
                className="w-12 h-12 rounded-2xl border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={next} 
                className="w-12 h-12 rounded-2xl border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-full">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-700",
                    i === currentSlide ? "w-10 bg-slate-900" : "w-1.5 bg-slate-300"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={copyPresentationLink} variant="ghost" className="gap-2 text-slate-400 hover:text-blue-600 font-black transition-colors group">
                <Copy className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-widest hidden lg:inline">SUNUMU PAYLAŞ</span>
              </Button>
              <Button onClick={downloadPresentation} variant="ghost" className="gap-2 text-slate-400 hover:text-red-600 font-black transition-colors group">
                <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-widest hidden lg:inline">PDF REHBER</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
