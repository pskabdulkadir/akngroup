import { useState, useEffect, useRef, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  ArrowLeft,
  Heart,
  Book,
  Play,
  Pause,
  Plus,
  Minus,
  BookOpen,
  Video,
  Headphones,
  Star,
  Trophy,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Upload,
  Volume2,
  Moon,
  Sun,
  Bookmark,
  Search,
  Globe,
  Quote,
  Lightbulb,
  MessageCircle,
  PenTool,
  Archive,
  Filter,
  ExternalLink,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Users,
  Sparkles,
  Calculator,
  MapPin,
  CheckCircle2,
  Info,
  Smile,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SystemPresentation } from "@/components/SystemPresentation";


interface User {
  id: string;
  referralCode: string;
}

// Types
interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface HijriDate {
  date: string;
  month: {
    en: string;
    ar: string;
  };
  year: string;
  day: string;
}

// Esma-ül Hüsna Data (Sample of first 33)
const esmaulHusna = [
  { name: "Allah", meaning: "Eşi benzeri olmayan, bütün noksan sıfatlardan münezzeh tek ilah.", benefit: "İmanın kuvvetlenmesi için" },
  { name: "Er-Rahman", meaning: "Dünyada bütün mahlûkata merhamet eden, şefkat gösteren, ihsan eden.", benefit: "Dünya ve ahiret mutluluğu için" },
  { name: "Er-Rahim", meaning: "Ahirette müminlere sonsuz ikram, lütuf ve ihsanda bulunan.", benefit: "Maddi ve manevi rızık için" },
  { name: "El-Melik", meaning: "Mülkün, kâinatın sahibi, mülk ve saltanatı devamlı olan.", benefit: "Maddi ve manevi güç için" },
  { name: "El-Kuddüs", meaning: "Her noksanlıktan uzak ve her türlü takdise layık olan.", benefit: "Günahlardan arınmak için" },
  { name: "Es-Selam", meaning: "Her türlü tehlikelerden selamete erdiren.", benefit: "Korkulardan emin olmak için" },
  { name: "El-Mümin", meaning: "Güven veren, emin kılan, koruyan.", benefit: "Güvende olmak için" },
  { name: "El-Müheymin", meaning: "Her şeyi görüp gözeten, her varlığın yaptıklarından haberdar olan.", benefit: "İnsanların sevgisini kazanmak için" },
  { name: "El-Aziz", meaning: "İzzet sahibi, her şeye galip olan.", benefit: "İzzet ve şeref için" },
  { name: "El-Cebbar", meaning: "Azamet ve kudret sahibi. Dilediğini yapan ve yaptıran.", benefit: "İsteklerin kabulü için" },
  { name: "El-Mütekebbir", meaning: "Büyüklükte eşi, benzeri olmayan.", benefit: "İzzet ve refah için" },
  { name: "El-Halık", meaning: "Yaratan, yoktan var eden.", benefit: "Üzüntüden kurtulmak için" },
  { name: "El-Bari", meaning: "Her şeyi kusursuz ve uyumlu yaratan.", benefit: "İşlerin başarısı için" },
  { name: "El-Musavvir", meaning: "Varlıklara şekil veren.", benefit: "Maksada ulaşmak için" },
  { name: "El-Gaffar", meaning: "Günahları örten ve çok mağfiret eden.", benefit: "Bağışlanmak için" },
  { name: "El-Kahhar", meaning: "Her şeye, her istediğini yapacak surette galip ve hakim olan.", benefit: "Nefsi terbiye için" },
  { name: "El-Vehhab", meaning: "Karşılıksız hibeler veren, çok fazla ihsan eden.", benefit: "Bol rızık için" },
  { name: "El-Rezzak", meaning: "Bütün mahlukatın rızkını veren ve ihtiyacını karşılayan.", benefit: "Rızık genişliği için" },
  { name: "El-Fettah", meaning: "Her türlü müşkülleri açan ve kolaylaştıran, darlıktan kurtaran.", benefit: "Maddi manevi kapıların açılması için" },
  { name: "El-Alim", meaning: "Her şeyi en ince noktasına kadar bilen, ilmi ebedi ve ezeli olan.", benefit: "İlim sahibi olmak için" },
  { name: "El-Kabız", meaning: "Dilediğine darlık veren, sıkan, daraltan.", benefit: "Zalimden korunmak için" },
  { name: "El-Basıt", meaning: "Dilediğine bolluk veren, açan, genişleten.", benefit: "Rızkın genişlemesi için" },
  { name: "El-Hafıd", meaning: "Dereceleri alçaltan, aşağıya indiren.", benefit: "Kötülüklerden korunmak için" },
  { name: "Er-Rafi", meaning: "Şeref verip yükselten.", benefit: "İnsanlar arasında yükselmek için" },
  { name: "El-Muiz", meaning: "Dilediğini aziz eden, izzet veren.", benefit: "İzzet ve şeref bulmak için" },
  { name: "El-Muzil", meaning: "Dilediğini zillete düşüren.", benefit: "Düşmandan korunmak için" },
  { name: "Es-Semi", meaning: "Her şeyi en iyi işiten.", benefit: "Duaların kabulü için" },
  { name: "El-Basır", meaning: "Gizli açık her şeyi en iyi gören.", benefit: "Acziyetten kurtulmak için" },
  { name: "El-Hakem", meaning: "Mutlak hakim, hakkı batıldan ayıran.", benefit: "Haklı davayı kazanmak için" },
  { name: "El-Adl", meaning: "Mutlak adil, çok adaletli.", benefit: "Adaletli olmak için" },
  { name: "El-Latif", meaning: "Lütuf ve ihsan sahibi olan.", benefit: "Arzuların gerçekleşmesi için" },
  { name: "El-Habir", meaning: "Her şeyden haberdar olan.", benefit: "Hafıza kuvveti için" },
  { name: "El-Halim", meaning: "Cezada acele etmeyen, yumuşak davranan.", benefit: "Ahlak güzelliği için" }
];

// Ahmet el Acemi YouTube Kur'an Cüzleri - Gerçek Playlist ve Başlangıç Sayfaları
const quranJuzList = [
  { id: 1, name: "1. Cüz", startSura: "Fatiha", endSura: "Bakara 141", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=1", duration: "45:30", startPage: 1 },
  { id: 2, name: "2. Cüz", startSura: "Bakara 142", endSura: "Bakara 252", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=2", duration: "48:20", startPage: 22 },
  { id: 3, name: "3. Cüz", startSura: "Bakara 253", endSura: "Âl-i İmran 92", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=3", duration: "47:15", startPage: 42 },
  { id: 4, name: "4. Cüz", startSura: "Âl-i İmran 93", endSura: "Nisa 23", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=4", duration: "46:45", startPage: 62 },
  { id: 5, name: "5. Cüz", startSura: "Nisa 24", endSura: "Nisa 147", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=5", duration: "49:10", startPage: 82 },
  { id: 6, name: "6. Cüz", startSura: "Nisa 148", endSura: "Maide 81", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=6", duration: "48:35", startPage: 102 },
  { id: 7, name: "7. Cüz", startSura: "Maide 82", endSura: "Enam 110", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=7", duration: "47:55", startPage: 122 },
  { id: 8, name: "8. Cüz", startSura: "Enam 111", endSura: "Araf 87", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=8", duration: "46:20", startPage: 142 },
  { id: 9, name: "9. Cüz", startSura: "Araf 88", endSura: "Enfal 40", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=9", duration: "48:40", startPage: 162 },
  { id: 10, name: "10. Cüz", startSura: "Enfal 41", endSura: "Tevbe 92", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=10", duration: "47:25", startPage: 182 },
  { id: 11, name: "11. Cüz", startSura: "Tevbe 93", endSura: "Hud 5", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=11", duration: "49:15", startPage: 202 },
  { id: 12, name: "12. Cüz", startSura: "Hud 6", endSura: "Yusuf 52", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=12", duration: "48:00", startPage: 222 },
  { id: 13, name: "13. Cüz", startSura: "Yusuf 53", endSura: "İbrahim 52", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=13", duration: "47:30", startPage: 242 },
  { id: 14, name: "14. Cüz", startSura: "Hicr 1", endSura: "Nahl 128", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=14", duration: "46:50", startPage: 262 },
  { id: 15, name: "15. Cüz", startSura: "İsra 1", endSura: "Kehf 74", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=15", duration: "48:10", startPage: 282 },
  { id: 16, name: "16. Cüz", startSura: "Kehf 75", endSura: "Taha 135", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=16", duration: "47:45", startPage: 302 },
  { id: 17, name: "17. Cüz", startSura: "Enbiya 1", endSura: "Hac 78", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=17", duration: "49:05", startPage: 322 },
  { id: 18, name: "18. Cüz", startSura: "Mü'minun 1", endSura: "Furkan 20", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=18", duration: "48:25", startPage: 342 },
  { id: 19, name: "19. Cüz", startSura: "Furkan 21", endSura: "Neml 55", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=19", duration: "47:55", startPage: 362 },
  { id: 20, name: "20. Cüz", startSura: "Neml 56", endSura: "Ankebut 45", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=20", duration: "46:35", startPage: 382 },
  { id: 21, name: "21. Cüz", startSura: "Ankebut 46", endSura: "Ahzab 30", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=21", duration: "48:15", startPage: 402 },
  { id: 22, name: "22. Cüz", startSura: "Ahzab 31", endSura: "Yasin 27", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=22", duration: "47:40", startPage: 422 },
  { id: 23, name: "23. Cüz", startSura: "Yasin 28", endSura: "Zümer 31", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=23", duration: "49:20", startPage: 442 },
  { id: 24, name: "24. Cüz", startSura: "Zümer 32", endSura: "Fussilet 46", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=24", duration: "48:05", startPage: 462 },
  { id: 25, name: "25. Cüz", startSura: "Fussilet 47", endSura: "Casiye 37", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=25", duration: "47:20", startPage: 482 },
  { id: 26, name: "26. Cüz", startSura: "Ahkaf 1", endSura: "Zariyat 30", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=26", duration: "46:45", startPage: 502 },
  { id: 27, name: "27. Cüz", startSura: "Zariyat 31", endSura: "Hadid 29", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=27", duration: "48:30", startPage: 522 },
  { id: 28, name: "28. Cüz", startSura: "Mücadele 1", endSura: "Tahrim 12", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=28", duration: "47:10", startPage: 542 },
  { id: 29, name: "29. Cüz", startSura: "Mülk 1", endSura: "Mürselat 50", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=29", duration: "49:00", startPage: 562 },
  { id: 30, name: "30. Cüz", startSura: "Nebe 1", endSura: "Nas 6", playlistUrl: "https://www.youtube.com/watch?v=B5KwA5gukHA&list=PLUJuhUbtCMFPO3bAPVeG_taebSHH3KIS7&index=30", duration: "48:50", startPage: 582 }
];

// Burç bilgileri ve hesaplama
const zodiacSigns = [
  {
    name: "Koç",
    dates: "21 Mart - 19 Nisan",
    element: "Ateş",
    planet: "Mars",
    traits: ["Cesur", "Enerjik", "Lider ruhlu", "Hızlı karar veren", "Rekabetçi"],
    compatibility: ["Aslan", "Yay", "İkizler", "Kova"],
    luckyNumbers: [1, 8, 17],
    luckyColors: ["Kırmızı", "Turuncu"],
    description: "Koç burcu, zodyak'ın ilk burcu olarak doğal liderlik özelliklerine sahiptir. Ateş elementi sayesinde enerjik ve dinamik yapıya sahiplerdir."
  },
  {
    name: "Boğa",
    dates: "20 Nisan - 20 Mayıs",
    element: "Toprak",
    planet: "Venüs",
    traits: ["Kararlı", "Güvenilir", "Sabırlı", "Sanat sever", "Lüks düşkünü"],
    compatibility: ["Başak", "Oğlak", "Yengeç", "Balık"],
    luckyNumbers: [2, 6, 9],
    luckyColors: ["Yeşil", "Pembe"],
    description: "Boğa burcu, toprak elementi ile kararlı ve güvenilir yapıya sahiptir. Venüs'ün etkisiyle estetik ve güzellik anlayışları gelişmiştir."
  },
  {
    name: "İkizler",
    dates: "21 Mayıs - 20 Haziran",
    element: "Hava",
    planet: "Merkür",
    traits: ["Zeki", "İletişim kuvvetli", "Meraklı", "Değişken", "Sosyal"],
    compatibility: ["Terazi", "Kova", "Koç", "Aslan"],
    luckyNumbers: [5, 7, 14],
    luckyColors: ["Sarı", "Gümüş"],
    description: "İkizler burcu, hava elementi ile zeki ve iletişim yetenekleri güçlü bireylerdir. Merkür'ün etkisiyle düşünce ve konuşma yetenekleri gelişmiştir."
  },
  {
    name: "Yengeç",
    dates: "21 Haziran - 22 Temmuz",
    element: "Su",
    planet: "Ay",
    traits: ["Duygusal", "Koruyucu", "Sezgileri güçlü", "Aile yanlısı", "Empatik"],
    compatibility: ["Balık", "Akrep", "Boğa", "Başak"],
    luckyNumbers: [2, 7, 11],
    luckyColors: ["Gümüş", "Beyaz"],
    description: "Yengeç burcu, su elementi ile duygusal ve sezgileri güçlü yapıya sahiptir. Ay'ın etkisiyle koruyucu ve aile odaklı özellikler taşır."
  },
  {
    name: "Aslan",
    dates: "23 Temmuz - 22 Ağustos",
    element: "Ateş",
    planet: "Güneş",
    traits: ["Gururlu", "Cömert", "Yaratıcı", "Dramatik", "Güven verici"],
    compatibility: ["Koç", "Yay", "İkizler", "Terazi"],
    luckyNumbers: [1, 3, 10],
    luckyColors: ["Altın", "Turuncu"],
    description: "Aslan burcu, ateş elementi ve Güneş'in etkisiyle doğal karizma ve liderlik özelliklerine sahiptir. Yaratıcı ve cömert yapıdadırlar."
  },
  {
    name: "Başak",
    dates: "23 Ağustos - 22 Eylül",
    element: "Toprak",
    planet: "Merkür",
    traits: ["Mükemmeliyetçi", "Analitik", "Pratik", "Hizmet odaklı", "Detaycı"],
    compatibility: ["Boğa", "Oğlak", "Yengeç", "Akrep"],
    luckyNumbers: [6, 14, 23],
    luckyColors: ["Lacivert", "Gri"],
    description: "Başak burcu, toprak elementi ile pratik ve analitik düşünce yapısına sahiptir. Merkür'ün etkisiyle detaylara önem verir ve mükemmeliyetçidir."
  },
  {
    name: "Terazi",
    dates: "23 Eylül - 22 Ekim",
    element: "Hava",
    planet: "Venüs",
    traits: ["Dengeli", "Adil", "Diplomatik", "Estetik", "Sosyal"],
    compatibility: ["İkizler", "Kova", "Aslan", "Yay"],
    luckyNumbers: [6, 15, 24],
    luckyColors: ["Pembe", "Mavi"],
    description: "Terazi burcu, hava elementi ile dengeli ve adil yapıya sahiptir. Venüs'ün etkisiyle estetik anlayışları gelişmiş ve diplomatik yaklaşım sergilerler."
  },
  {
    name: "Akrep",
    dates: "23 Ekim - 21 Kasım",
    element: "Su",
    planet: "Plüton",
    traits: ["Yoğun", "Gizemli", "Kararlı", "Dönüştürücü", "Sezgileri güçlü"],
    compatibility: ["Yengeç", "Balık", "Başak", "Oğlak"],
    luckyNumbers: [4, 13, 27],
    luckyColors: ["Kırmızı", "Siyah"],
    description: "Akrep burcu, su elementi ile yoğun duygusal derinliğe sahiptir. Plüton'un etkisiyle dönüştürücü güç ve güçlü sezgilere sahiplerdir."
  },
  {
    name: "Yay",
    dates: "22 Kasım - 21 Aralık",
    element: "Ateş",
    planet: "Jüpiter",
    traits: ["Özgür", "Macera sever", "Felsefik", "İyimser", "Doğru sözlü"],
    compatibility: ["Koç", "Aslan", "Terazi", "Kova"],
    luckyNumbers: [3, 9, 22],
    luckyColors: ["Mor", "Turkuaz"],
    description: "Yay burcu, ateş elementi ile özgürlük seven ve macera dolu yaşam tarzına sahiptir. Jüpiter'in etkisiyle felsefik düşünce ve iyimserlik taşır."
  },
  {
    name: "Oğlak",
    dates: "22 Aralık - 19 Ocak",
    element: "Toprak",
    planet: "Satürn",
    traits: ["Disiplinli", "Hırslı", "Sorumluluk sahibi", "Pratik", "Kararlı"],
    compatibility: ["Boğa", "Başak", "Akrep", "Balık"],
    luckyNumbers: [10, 8, 26],
    luckyColors: ["Siyah", "Kahverengi"],
    description: "Oğlak burcu, toprak elementi ile disiplinli ve sorumluluk sahibi yapıya sahiptir. Satürn'ün etkisiyle uzun vadeli hedefler koyan kararlı bireylerdir."
  },
  {
    name: "Kova",
    dates: "20 Ocak - 18 Şubat",
    element: "Hava",
    planet: "Uranüs",
    traits: ["Yenilikçi", "Bağımsız", "İnsancıl", "Orijinal", "Vizyoner"],
    compatibility: ["İkizler", "Terazi", "Koç", "Yay"],
    luckyNumbers: [4, 7, 11],
    luckyColors: ["Mavi", "Gümüş"],
    description: "Kova burcu, hava elementi ile yenilikçi ve bağımsız yapıya sahiptir. Uranüs'ün etkisiyle orijinal düşünceler ve insancıl yaklaşım sergiler."
  },
  {
    name: "Balık",
    dates: "19 Şubat - 20 Mart",
    element: "Su",
    planet: "Neptün",
    traits: ["Hayal gücü kuvvetli", "Empatik", "Sanatsal", "Ruhani", "Sezgileri güçlü"],
    compatibility: ["Yengeç", "Akrep", "Boğa", "Oğlak"],
    luckyNumbers: [7, 12, 29],
    luckyColors: ["Deniz mavisi", "Mor"],
    description: "Balık burcu, su elementi ile güçlü hayal gücü ve empati yeteneğine sahiptir. Neptün'ün etkisiyle sanatsal ve ruhani eğilimleri bulunur."
  }
];

// Kur'an Sureleri (seçilmiş)
const quranSuras = [
  {
    id: 1,
    name: "Al-Fatiha",
    arabicName: "الفاتحة",
    meaning: "Açılış",
    verses: 7,
    type: "Mekkî",
    content: {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾",
      translation: "Rahman ve Rahim olan Allah'ın adıyla. Hamd, âlemlerin Rabbi Allah'a mahsustur. O Rahman'dır, Rahim'dir. Din (ceza ve mükâfat) gününün sahibidir. (Ey Rabbimiz!) Yalnız sana kulluk eder ve yalnız senden yardım dileriz. Bizi doğru yola ilet; kendilerine nimet verdiklerinin yoluna; gazaba uğrayanların ve sapıtanların yoluna değil!",
      commentary: "Fatiha suresi, Kur'an'ın özeti ve namaz için vazgeçilmez bir suredir. İçerdiği dua, kulluk, tevhid ve hidayet temaları tüm Müslümanların günlük yaşamının temelini oluşturur."
    }
  },
  {
    id: 2,
    name: "Al-Ikhlas",
    arabicName: "الإخلاص",
    meaning: "İhlas",
    verses: 4,
    type: "Mekkî",
    content: {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾",
      translation: "De ki: O Allah birdir. Allah Samed'dir (her şey O'na muhtaçtır, O hiçbir şeye muhtaç değildir). O doğurmamış ve doğmamıştır. Hiçbir şey O'na denk değildir.",
      commentary: "İhlas suresi, tevhidin en saf ifadesidir. Allah'ın birliği ve eşsizliğini vurgular. Bu sure, Kur'an'ın üçte birine eşdeğer sevaptadır."
    }
  },
  {
    id: 3,
    name: "Al-Falaq",
    arabicName: "الفلق",
    meaning: "Şafak",
    verses: 5,
    type: "Mekkî",
    content: {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾",
      translation: "De ki: Şafağın Rabbine sığınırım; yarattığı şeylerin şerrinden, karanlık bastırdığında gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve haset ettiği zaman hasetçinin şerrinden.",
      commentary: "Falak suresi, korunma duasıdır. Her türlü kötülükten, büyüden ve hasetten Allah'a sığınmayı öğretir."
    }
  },
  {
    id: 4,
    name: "An-Nas",
    arabicName: "الناس",
    meaning: "İnsanlar",
    verses: 6,
    type: "Mekkî",
    content: {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾",
      translation: "De ki: İnsanların Rabbine, İnsanların Kralına, İnsanların İlahına sığınırım; sinsi vesvesenin şerrinden; o insanların kalplerine vesvese verenin şerrinden; cinlerden ve insanlardan.",
      commentary: "Nas suresi, şeytanın vesveselerinden korunma duasıdır. Kalpteki kötü düşünceler ve şeytani fısıltılardan Allah'a sığınmayı öğretir."
    }
  }
];

// Kapsamlı Hadis Arşivi - Genişletilmiş
const hadiths = [
  // Temel İman ve İhlas
  {
    id: 1,
    arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    translation: "Ameller niyetlere göredir. Herkesin niyetinde ne varsa, eline geçecek olan odur.",
    source: "Buhari, İman 41",
    category: "İman",
    explanation: "İslam'da her işin başı niyettir. Halis bir niyetle yapılan küçük bir iş, niyetsiz yapılan büyük işten değerlidir.",
    narrator: "Hz. Ömer (r.a.)",
    bookNumber: "Buhari 1"
  },
  {
    id: 2,
    arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    translation: "Allah'a ve ahiret gününe iman eden kimse, ya hayır söylesin ya da sussun.",
    source: "Buhari, Edeb 31",
    category: "Ahlak",
    explanation: "Dilin afeti büyüktür. Mümin, konuşmadan önce sözünün hayır mı şer mi olduğunu düşünmelidir.",
    narrator: "Ebu Hüreyre (r.a.)",
    bookNumber: "Buhari 6018"
  },

  // Ahlak ve İnsan İlişkileri
  {
    id: 3,
    arabic: "اَلدِّينُ النَّصِيحَةُ",
    translation: "Din nasihattir (samimiyettir).",
    source: "Müslim, İman 95",
    category: "Samimiyet",
    explanation: "Din; Allah'a, Kitabına, Peygamberine, Müslümanların yöneticilerine ve tüm Müslümanlara karşı samimi olmaktır.",
    narrator: "Temîm ed-Dârî (r.a.)",
    bookNumber: "Muslim 55"
  },
  {
    id: 4,
    arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation: "Sizden biriniz, kendisi için istediği hayrı kardeşi için de istemedikçe (tam) iman etmiş olmaz.",
    source: "Buhari, İman 7",
    category: "Kardeşlik",
    explanation: "İmanın kemali, bencilliği terk edip diğerkam (başkalarını düşünen) olmaktan geçer.",
    narrator: "Enes bin Malik (r.a.)",
    bookNumber: "Buhari 13"
  },
  {
    id: 5,
    arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    translation: "Müslüman, elinden ve dilinden diğer Müslümanların emin olduğu kimsedir.",
    source: "Buhari, İman 4",
    category: "Güven",
    explanation: "Müslüman güvenilir insandır. Zarar vermek, incitmek, dedikodu yapmak Müslümana yakışmaz.",
    narrator: "Abdullah bin Amr (r.a.)",
    bookNumber: "Buhari 10"
  },

  // Aile ve Sosyal Hayat
  {
    id: 6,
    arabic: "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ",
    translation: "Sizin en hayırlınız, ailesine karşı en hayırlı olanınızdır. Ben de ailesine karşı en hayırlı olanınızım.",
    source: "Tirmizi, Menakıb 63",
    category: "Aile",
    explanation: "Gerçek ahlak, kişinin evi içindeki, en yakınlarına karşı olan davranışlarıyla ölçülür.",
    narrator: "Hz. Aişe (r.a.)",
    bookNumber: "Tirmizi 3895"
  },
  {
    id: 7,
    arabic: "أَنَا وَكَافِلُ الْيَتِيمِ فِي الْجَنَّةِ هَكَذَا",
    translation: "Ben ve yetimi himaye eden kimse, cennette şöylece (işaret parmağı ve orta parmağını göstererek) beraberiz.",
    source: "Buhari, Talak 25",
    category: "Yardımlaşma",
    explanation: "Yetimlere sahip çıkmak, Peygamber Efendimiz'e (SAV) komşu olmayı sağlayan çok yüce bir ameldir.",
    narrator: "Sehl bin Sad (r.a.)",
    bookNumber: "Buhari 6005"
  },

  // İlim ve Hikmet
  {
    id: 8,
    arabic: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    translation: "Kim ilim tahsil etmek için bir yola girerse, Allah o kişiye cennetin yolunu kolaylaştırır.",
    source: "Müslim, Zikir 39",
    category: "İlim",
    explanation: "İlim öğrenmek bir ibadettir ve insanı Allah'a yaklaştıran en kısa yollardan biridir.",
    narrator: "Ebu Hüreyre (r.a.)",
    bookNumber: "Muslim 2699"
  },

  // Sabır ve Şükür
  {
    id: 9,
    arabic: "عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرُهُ كُلَّهُ خَيْرٌ",
    translation: "Müminin durumu ne hoştur! Her hali kendisi için hayırlıdır. Bu durum yalnız mümine hastır.",
    source: "Müslim, Zühd 64",
    category: "Sabır/Şükür",
    explanation: "Mümin bollukta şükreder kazanır, darlıkta sabreder yine kazanır. İman hayata pozitif bakmayı sağlar.",
    narrator: "Suheyb-i Rumi (r.a.)",
    bookNumber: "Muslim 2999"
  },

  // Ticaret ve Çalışma
  {
    id: 10,
    arabic: "الْعَامِلُ عَلَى الصَّدَقَةِ بِالحَقِّ كَالغَازِي فِي سَبِيلِ اللَّهِ",
    translation: "Helal kazanç peşinde koşan kimse, Allah yolunda cihat eden gibidir.",
    source: "İbn Mace, Ticaret",
    category: "Çalışma",
    explanation: "Rızkını helal yoldan temin etmek için çalışmak, ailesine bakmak da bir nevi ibadettir.",
    narrator: "Ka'b bin Ucre (r.a.)",
    bookNumber: "İbn Mace"
  },

  // Namaz ve İbadet
  {
    id: 11,
    arabic: "أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ الصَّلَاةُ",
    translation: "Kıyamet günü kulun ilk hesaba çekileceği amel namazdır.",
    source: "Tirmizi, Salat 188",
    category: "İbadet",
    explanation: "Namaz dinin direğidir ve diğer amellerin kabulü namazın düzgün olmasına bağlıdır.",
    narrator: "Ebu Hüreyre (r.a.)",
    bookNumber: "Tirmizi 413"
  },
  {
    id: 12,
    arabic: "الدُّعَاءُ هُوَ الْعِبَادَةُ",
    translation: "Dua, ibadetin ta kendisidir (özüdür).",
    source: "Tirmizi, Dua 1",
    category: "Dua",
    explanation: "Dua etmek, kulun acizliğini itiraf edip Kudret Sahibine sığınmasıdır ki bu kulluğun zirvesidir.",
    narrator: "Nu'man bin Beşir (r.a.)",
    bookNumber: "Tirmizi 3372"
  }
];

// Kapsamlı Sünnet Arşivi - Genişletilmiş
const sunnahs = [
  // Temizlik ve Bakım
  {
    id: 1,
    title: "Misvak Kullanmak",
    description: "Ağız ve diş sağlığı için doğal bir temizleyici olan misvak kullanmak.",
    time: "Her namaz öncesi, uykudan uyanınca, eve girince",
    reward: "Ağzı temizler, Rabbi hoşnut eder, namazın sevabını artırır.",
    evidence: "Misvak ağzı temizler ve Rabb'i razı eder. (Nesai)",
    subcategory: "Temizlik",
    details: ["Ağız kokusunu giderir", "Diş etlerini güçlendirir", "Sünnete ittiba sevabı kazandırır"]
  },
  {
    id: 2,
    title: "Sağ Taraftan Başlamak",
    description: "Hayırlı işlere sağdan başlamak (yemek, giyinmek, girmek).",
    time: "Günlük hayatta sürekli",
    reward: "Sünnet sevabı ve işlerde bereket.",
    evidence: "Hz. Aişe: Resûlullah temizlikte, taranmada ve ayakkabı giymede sağdan başlamayı severdi. (Buhari)",
    subcategory: "Günlük Yaşam",
    details: ["Ayakkabı giyerken sağ", "Camiye girerken sağ", "Yemek yerken sağ el"]
  },
  {
    id: 3,
    title: "Beyaz Giyinmek",
    description: "Mümkün olduğunca temiz ve beyaz elbiseler tercih etmek.",
    time: "Özellikle Cuma ve bayram günleri",
    reward: "Peygamber Efendimiz'in (SAV) sevdiği kıyafeti giyme sevabı.",
    evidence: "Elbiselerinizin en hayırlısı beyaz olanıdır. (Ebu Davud)",
    subcategory: "Giyim",
    details: ["Temizliği simgeler", "Sade ve şıktır", "Ölüler de beyazla kefenlenir"]
  },
  {
    id: 4,
    title: "Güzel Koku Sürünmek",
    description: "Çevreyi rahatsız etmeyecek güzel kokular kullanmak (Erkekler için).",
    time: "Cuma günleri ve topluluk içine girerken",
    reward: "Meleklerin ve insanların hoşnutluğu.",
    evidence: "Bana dünyanızdan üç şey sevdirildi: Kadın, güzel koku ve namaz. (Nesai)",
    subcategory: "Temizlik",
    details: ["Ferahlık verir", "Kötü kokuları bastırır", "Sünnettir"]
  },

  // İbadet ve Dua
  {
    id: 5,
    title: "Duha (Kuşluk) Namazı",
    description: "Güneş doğduktan yaklaşık 45 dk sonra kılınan nafile namaz.",
    time: "Kuşluk vakti (Güneş doğuşu ile öğle arası)",
    reward: "360 eklem için sadaka yerine geçer.",
    evidence: "Kim kuşluk vaktinde iki rekat namaz kılarsa, o günkü sadaka borcunu ödemiş olur. (Muslim)",
    subcategory: "Namaz",
    details: ["En az 2, en çok 12 rekat", "Rızkı artırır", "Günahları döker"]
  },
  {
    id: 6,
    title: "Teheccüd Namazı",
    description: "Gece uykudan uyanıp kılınan çok faziletli nafile namaz.",
    time: "Yatsıdan sonra, imsaktan önce (uyuyup uyanmak şarttır)",
    reward: "Makam-ı Mahmud'a (övülmüş makam) ulaştırır.",
    evidence: "Gecenin bir kısmında uyanıp namaz kıl. (İsra, 79)",
    subcategory: "Namaz",
    details: ["Duaların en çok kabul olduğu vakit", "Manevi dereceyi yükseltir"]
  },
  {
    id: 7,
    title: "Yatmadan Önce Felak-Nas",
    description: "Uyumadan önce İhlas, Felak ve Nas surelerini okuyup vücuda mesh etmek.",
    time: "Her gece yatmadan önce",
    reward: "Sabaha kadar her türlü şerden ve zarardan korunma.",
    evidence: "Hz. Peygamber yatacağı zaman avuçlarına üfler, sureleri okur ve vücuduna sürerdi. (Buhari)",
    subcategory: "Zikir",
    details: ["Nazara karşı kalkan", "Şeytanın şerrinden korur", "Huzurlu uyku sağlar"]
  },

  // Sosyal İlişkiler
  {
    id: 8,
    title: "Selamı Yaymak",
    description: "Tanıdık tanımadık her Müslümana selam vermek.",
    time: "Karşılaşma anında",
    reward: "Kalplerdeki sevgiyi artırır, imanı olgunlaştırır.",
    evidence: "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe iman etmiş olmazsınız. Selamı aranızda yayın. (Muslim)",
    subcategory: "Sosyal",
    details: ["Önce selam veren kibre düşmez", "Barış ve esenlik dileğidir"]
  },
  {
    id: 9,
    title: "Hediyeleşmek",
    description: "İnsanlar arasındaki muhabbeti artırmak için karşılıklı hediyeleşmek.",
    time: "Özel günlerde veya sebepsiz",
    reward: "Kalplerdeki kini giderir, sevgi bağını güçlendirir.",
    evidence: "Hediyeleşin ki birbirinizi sevesiniz. (Buhari)",
    subcategory: "Sosyal",
    details: ["Maddi değeri önemli değildir", "Hatırlanmak kıymetlidir"]
  },
  {
    id: 10,
    title: "Hasta Ziyareti",
    description: "Rahatsızlığı olan din kardeşini ziyaret edip dua etmek.",
    time: "Hastalık süresince (kısa tutmak kaydıyla)",
    reward: "70 bin melek sabah/akşam dua eder.",
    evidence: "Kim bir hastayı ziyaret ederse, dönünceye kadar cennet yolundadır. (Muslim)",
    subcategory: "Sosyal",
    details: ["Hastaya moral verir", "Şifa duası yapılır", "Kısa ve öz olmalıdır"]
  },

  // Yeme İçme Adabı
  {
    id: 11,
    title: "Yemeğe Besmeleyle Başlamak",
    description: "Her yemeğin başında 'Bismillahirrahmanirrahim' demek.",
    time: "Yemek başlangıcında",
    reward: "Yemeğin bereketi artar, şeytan ortak olamaz.",
    evidence: "Besmele çekilmeyen yemeğe şeytan ortak olur. (Muslim)",
    subcategory: "Yeme İçme",
    details: ["Unutulursa 'Bismillahi evvelehu ve ahirehu' denir", "Nimetin Şükrüdür"]
  },
  {
    id: 12,
    title: "Suyu Oturarak İçmek",
    description: "Suyu ayakta değil, oturarak ve üç yudumda içmek.",
    time: "Su içerken",
    reward: "Vücut sağlığı için faydalıdır, sünnet sevabı.",
    evidence: "Sizden biriniz ayakta su içmesin. (Muslim)",
    subcategory: "Yeme İçme",
    details: ["Mideye zarar vermez", "Şükür hissini artırır"]
  },
  {
    id: 13,
    title: "Tabağı Sünnetlemek",
    description: "Tabakta yemek artığı bırakmamak, israftan kaçınmak.",
    time: "Yemek sonunda",
    reward: "Bereketin yemeğin neresinde olduğu bilinmez, israf önlenir.",
    evidence: "Tabağın dibini sıyıran kimse için tabak istiğfar eder. (Tirmizi)",
    subcategory: "Yeme İçme",
    details: ["Nimetin kıymetini bilmektir", "Tevazu göstergesidir"]
  }
];

// Manevi İlimler - Genişletilmiş ve Kategorize Edilmiş
const spiritualSciences = [
  {
    id: 1,
    title: "Tasavvuf (Gönül İlmi)",
    description: "İnsanın kalbini manevi hastalıklardan arındırıp Allah'a yaklaştırma yolu.",
    topics: ["Nefis Terbiyesi", "Kalp Tasfiyesi", "Seyr-u Süluk", "Zikir Adabı", "Marifetullah"],
    importance: "İman, İslam ve İhsan üçlüsünün 'İhsan' boyutunu yaşatır.",
    scholars: ["Abdülkadir Geylani", "Şah-ı Nakşibend", "İmam Rabbani", "Mevlana Celaleddin", "Yunus Emre"],
    color: "bg-rose-50 border-rose-200 text-rose-900"
  },
  {
    id: 2,
    title: "Kelâm (İnanç İlmi)",
    description: "İslam inanç esaslarını (akaid) akli ve nakli delillerle ispat eden ilim.",
    topics: ["Uluhiyet (Allah'ın varlığı)", "Nübüvvet (Peygamberlik)", "Mead (Ahiret)", "Kader ve Kaza"],
    importance: "İmanı şüphelerden korur ve sağlam bir itikat oluşturur.",
    scholars: ["İmam Maturidi", "İmam Eşari", "Fahreddin Razi", "İmam Gazali"],
    color: "bg-blue-50 border-blue-200 text-blue-900"
  },
  {
    id: 3,
    title: "Fıkıh (Yaşam İlmi)",
    description: "İbadetler ve günlük hayattaki (muamelat) dini hükümlerin detaylı bilgisi.",
    topics: ["İbadetler (Namaz, Oruç)", "Aile Hukuku", "Ticaret Hukuku", "Helal ve Haramlar"],
    importance: "Müslümanın günlük hayatını Allah'ın rızasına uygun yaşaması için şarttır.",
    scholars: ["İmam-ı Azam Ebu Hanife", "İmam Şafi", "İmam Malik", "Ahmed bin Hanbel"],
    color: "bg-emerald-50 border-emerald-200 text-emerald-900"
  },
  {
    id: 4,
    title: "Siyer (Peygamber Tarihi)",
    description: "Hz. Muhammed'in (SAV) hayatı, ahlakı, savaşları ve tebliğ metodunu inceleyen ilim.",
    topics: ["Mekke Dönemi", "Medine Dönemi", "Sahabe Hayatları", "Hicret", "Veda Haccı"],
    importance: "Peygamberimizi tanımak, O'nu sevmek ve örnek almak için temel kaynaktır.",
    scholars: ["İbn İshak", "İbn Hişam", "Vakidi", "Taberi"],
    color: "bg-amber-50 border-amber-200 text-amber-900"
  },
  {
    id: 5,
    title: "Tefsir (Kur'an Yorumu)",
    description: "Kur'an ayetlerinin manalarını, indirilme sebeplerini ve hükümlerini açıklayan ilim.",
    topics: ["Dirayet Tefsiri", "Rivayet Tefsiri", "Esbab-ı Nüzul", "Ahkam Ayetleri"],
    importance: "Allah'ın kelamını doğru anlamak ve hayatımıza tatbik etmek için gereklidir.",
    scholars: ["Taberi", "Kurtubi", "Fahreddin Razi", "Elmalılı Hamdi Yazır"],
    color: "bg-indigo-50 border-indigo-200 text-indigo-900"
  },
  {
    id: 6,
    title: "Hadis (Sünnet İlmi)",
    description: "Peygamber Efendimiz'in söz, fiil ve takrirlerinin tespiti ve yorumlanması.",
    topics: ["Ravi Zinciri", "Metin Analizi", "Sıhhat Dereceleri (Sahih, Zayıf)", "Kütüb-i Sitte"],
    importance: "Kur'an'dan sonra dinin ikinci ana kaynağıdır ve Kur'an'ın canlı tefsiridir.",
    scholars: ["İmam Buhari", "İmam Müslim", "Ebu Davud", "Tirmizi", "Nesai"],
    color: "bg-cyan-50 border-cyan-200 text-cyan-900"
  }
];

// Anlamlı Sözler
const meaningfulQuotes = [
  {
    id: 1,
    text: "Kalbin en büyük zikri, Allah'ı unutmamaktır.",
    author: "İmam Gazzali",
    category: "Zikir"
  },
  {
    id: 2,
    text: "Sabır, imanın yarısıdır.",
    author: "Hz. Ali",
    category: "Sabır"
  },
  {
    id: 3,
    text: "İlim öğrenin, besinden uzaklarda da olsa.",
    author: "Hz. Muhammed (SAV)",
    category: "İlim"
  },
  {
    id: 4,
    text: "Gönlünde Allah sevgisi olan, dünyada cenneti bulmuştur.",
    author: "Mevlana",
    category: "Aşk"
  },
  {
    id: 5,
    text: "Nefsinizi tanıyın, Rabbinizi tanırsınız.",
    author: "Hz. Ali",
    category: "Marifet"
  },
  {
    id: 6,
    text: "Dünya mümin için hapishane, kafir için cennettir.",
    author: "Hz. Muhammed (SAV)",
    category: "Dünya"
  },
  {
    id: 7,
    text: "Allah'a yakın olmak istersen, O'nun sevdiklerine yakın ol.",
    author: "İmam Gazzali",
    category: "Yakınlık"
  },
  {
    id: 8,
    text: "Tevekküllü olmak, sebepleri bırakmak değil, sonuçları Allah'a bırakmaktır.",
    author: "İbn Teymiye",
    category: "Tevekkül"
  }
];

// Günlük zikir listesi
const dailyAdhkar = [
  { name: "La ilahe illallah", target: 100, current: 0, meaning: "Allah'tan başka ilah yoktur" },
  { name: "Estağfirullah", target: 100, current: 0, meaning: "Allah'tan mağfiret dilerim" },
  { name: "Subhanallah", target: 33, current: 0, meaning: "Allah eksikliklerden münezzehtir" },
  { name: "Elhamdülillah", target: 33, current: 0, meaning: "Hamd Allah'a mahsustur" },
  { name: "Allahu Ekber", target: 34, current: 0, meaning: "Allah en büyüktür" },
  { name: "Salli Ala Muhammed", target: 100, current: 0, meaning: "Muhammed'e salat gönder" },
];

// Rüya Tabiri Veritabanı - Genişletilmiş
const dreamSymbols = {
  // Doğa ve Elementler
  "su": {
    meaning: "Hayat, temizlik, bereket ve maneviyat",
    interpretations: ["Bereket ve bolluk gelecek", "Manevi temizlenme", "Hayırlı değişiklikler", "İlim ve hikmet artışı"],
    context: "Suyun durumu önemlidir: Temiz su hayır, bulanık su sıkıntı işareti olabilir."
  },
  "deniz": {
    meaning: "Büyük olanaklar, bilinmeyen derinlikler ve macera",
    interpretations: ["Geniş fırsatlar", "Manevi derinlik", "Macera ve keşif", "Duyguların derinliği"],
    context: "Sakin deniz barış, fırtınalı deniz zorluk işaret eder."
  },
  "yüzmek": {
    meaning: "Hayatta akıp gitmek, kontrol ve çabukluk",
    interpretations: ["Hayatın akışına uyum", "Güç ve dayanıklılık", "Hedefe doğru ilerleme", "Özgür hareket"],
    context: "Rahat yüzmek başarı, zorla yüzmek mücadele işaret eder."
  },
  "ateş": {
    meaning: "Güç, arzu, değişim ve bazen tehlike",
    interpretations: ["Güçlü duygular", "Önemli değişiklikler", "Manevi aydınlanma", "Dikkat edilmesi gereken durumlar"],
    context: "Kontrollü ateş hayır, kontrolsüz ateş dikkat gerektirir."
  },
  "rüzgar": {
    meaning: "Değişim, hareket ve Allah'ın rahmeti",
    interpretations: ["Yeni fırsatlar", "Değişim zamanı", "Manevi rehberlik", "Seyahat imkanları"],
    context: "Hafif rüzgar rahmet, fırtına ise zorlukları işaret eder."
  },
  "yağmur": {
    meaning: "Bereket, rahmet, nefesin ve yenileme",
    interpretations: ["Bereket yağacak", "Dua kabul olacak", "Zorlukların geçeceği", "Manevi ferahlık"],
    context: "Yağmurun türü önemlidir: Hafif yağmur bereket, sel veya kötü yağmur tehlike işaret eder."
  },
  "toprak": {
    meaning: "Bereket, sağlamlık ve maddi kazanç",
    interpretations: ["Maddi kazanç", "Sağlam temeller", "Tarım ve bereket", "Ev bark sahibi olma"],
    context: "Verimli toprak bereket, çorak toprak zorluk işareti."
  },
  "bulut": {
    meaning: "Belirsizlik, umut ve geçici zorluklar",
    interpretations: ["Geçici zorluklar", "Umut ve beklenti", "Değişim öncesi", "Manevi araştırma"],
    context: "Beyaz bulut umut, siyah bulut zorluk, renkli bulut başarı işaret eder."
  },

  // Hayvanlar
  "kedi": {
    meaning: "Kadın, zerafet ve bazen hırsızlık",
    interpretations: ["Ev hanımı ile ilgili durumlar", "Nazik yaklaşımlar", "Dikkatli olmak gerekir", "Samimiyet"],
    context: "Kedinin davranışı önemlidir: Sevimli kedi hayır, saldırgan kedi dikkat."
  },
  "köpek": {
    meaning: "Dostluk, sadakat ve koruma",
    interpretations: ["Sadık dostlar", "Koruyucu çevre", "Güvenlik", "Aile bağları"],
    context: "Köpeğin davranışı belirleyicidir: Dost köpek sadakat, saldırgan köpek düşman."
  },
  "yılan": {
    meaning: "Düşman, gizli tehlike veya büyük değişim",
    interpretations: ["Gizli düşmanlar", "Dikkat edilmesi gerekenler", "Büyük değişimler", "İç savaşlar"],
    context: "Yılanın öldürülmesi düşmana galibiyeti, yaşaması ise devam eden tehdidi işaret eder."
  },
  "kuş": {
    meaning: "Ruh, özgürlük ve mesajlar",
    interpretations: ["Manevi mesajlar", "Özgürleşme", "Yeni haberler", "Ruhsal yükseliş"],
    context: "Kuşun türü önemlidir: Güzel kuşlar müjde, kara kuşlar kötü haber olabilir."
  },
  "aslan": {
    meaning: "Güç, otorite ve liderlik",
    interpretations: ["Liderlik pozisyonu", "Güç ve kudret", "Cesaret", "Saygınlık"],
    context: "Aslanla dostluk güç kazanımı, saldırısı ise güçlü düşmanları işaret eder."
  },

  // İnsanlar ve İlişkiler
  "anne": {
    meaning: "Sevgi, koruma ve manevi destek",
    interpretations: ["Aile bağları güçlenecek", "Manevi destek", "Şifa ve iyileşme", "Bereket ve dua"],
    context: "Annenin durumu rüya sahibinin duygusal haline işaret eder."
  },
  "baba": {
    meaning: "Otorite, rehberlik ve koruma",
    interpretations: ["İş hayatında gelişme", "Rehberlik alacağı kişi", "Koruma altında olma", "Saygınlık"],
    context: "Babanın durumu rüya sahibinin otoriteye yaklaşımını gösterir."
  },
  "çocuk": {
    meaning: "Yeni başlangıçlar, masumiyet ve potansiyel",
    interpretations: ["Yeni projeler", "Temiz kalp", "Gelecek umutları", "Yenilenme"],
    context: "Çocuğun mutluluğu gelecek umutlarını, üzüntüsü ise endişeleri yansıtır."
  },

  // Nesneler ve Durumlar
  "ev": {
    meaning: "Kişinin iç dünyası, güvenlik ve aile",
    interpretations: ["Aile hayatı", "İç huzur", "Güvenlik", "Maddi durum"],
    context: "Evin durumu kişinin ruhsal ve maddi durumunu yansıtır."
  },
  "para": {
    meaning: "Değer, güç ve bazen endişe",
    interpretations: ["Maddi kazanç", "Değer artışı", "Güç elde etme", "Endişeler"],
    context: "Para bulma kazanç, kaybetme ise kayıp anlamına gelir."
  },
  "kitap": {
    meaning: "İlim, hikmet ve manevi rehberlik",
    interpretations: ["İlim öğrenme", "Manevi gelişim", "Yeni bilgiler", "Rehberlik"],
    context: "Kutsal kitap manevi gelişimi, diğer kitaplar genel ilmi işaret eder."
  },
  "elbise": {
    meaning: "Sosyal statü, kişilik ve görünüm",
    interpretations: ["Sosyal konum", "Kişilik değişimi", "İtibar", "Dış görünüş"],
    context: "Güzel elbise itibar artışı, yırtık elbise saygınlık kaybını işaret eder."
  },
  "uçurum": {
    meaning: "Büyük risk, tehlike ve endişe",
    interpretations: ["Riskli durumlar", "Endişe ve kaygı", "Dikkat edilmesi gereken noktalar", "Hayatsal krizler"],
    context: "Uçurumdan düşmek bilgisizlikten uyarı, kurtulma ise tehlikeden kurtulma işaret eder."
  },
  "düşmek": {
    meaning: "Kaygı, kontrol kaybı ve değişim",
    interpretations: ["Endişe ve stres", "Kontrolü kaybetme", "Bilinçaltı korkular", "Hızlı değişimler"],
    context: "Nereye düştüğü ve ne kadar kötü olduğu önemlidir: Hafif düşüş küçük kayıp, derin düşüş büyük sorun işaret eder."
  },

  // Renkler
  "beyaz": {
    meaning: "Temizlik, saflık ve iyilik",
    interpretations: ["Temiz kalp", "İyi niyetler", "Barış", "Manevi temizlik"],
    context: "Beyaz renk genellikle olumlu anlam taşır."
  },
  "siyah": {
    meaning: "Gizem, bilinmeyen ve bazen kötülük",
    interpretations: ["Gizli durumlar", "Bilinmeyen faktörler", "Dikkat gerektirir", "Derin düşünceler"],
    context: "Siyah rengin bağlamı önemlidir, her zaman olumsuz değildir."
  },
  "yeşil": {
    meaning: "Bereket, huzur ve İslami değerler",
    interpretations: ["Bereket artışı", "Manevi huzur", "Doğa ile bağ", "İslami gelişim"],
    context: "Yeşil renk genellikle bereket ve huzuru işaret eder."
  },
  "kırmızı": {
    meaning: "Güç, tutku ve bazen tehlike",
    interpretations: ["Güçlü duygular", "Enerji artışı", "Dikkat çekme", "Tutku"],
    context: "Kırmızının tonu ve bağlamı önemlidir."
  }
};

// Rüya tabiri kategorileri
const dreamCategories = [
  "Doğa ve Elementler",
  "Hayvanlar",
  "İnsanlar ve İlişkiler",
  "Nesneler",
  "Renkler",
  "Duygular",
  "Mekânlar",
  "Yiyecek ve İçecek",
  "Dinî Semboller",
  "Sayılar"
];

export default function ManeviPanel() {
  const { toast } = useToast();
  const [dynamicPanelContent, setDynamicPanelContent] = useState<any[]>([]);

  useEffect(() => {
    const fetchDynamicContent = async () => {
      try {
        const response = await fetch('/api/panel-content/manevi');
        if (response.ok) {
          const data = await response.json();
          setDynamicPanelContent(data.content || []);
        }
      } catch (error) {
        console.error("Error fetching manevi panel content:", error);
      }
    };
    fetchDynamicContent();
  }, []);

  const displayEsmaulHusna = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'esmaul-husna' || c.category === 'Esma-ül Hüsna') && c.isActive)
      .map(c => ({
        name: c.title,
        meaning: c.content,
        benefit: c.details?.benefit || c.details?.hikmet || ""
      }));
    return dynamic.length > 0 ? dynamic : esmaulHusna;
  }, [dynamicPanelContent]);

  const displayHadiths = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'hadisler' || c.category === 'Hadisler') && c.isActive)
      .map((c, i) => ({
        id: c.id || `dyn-${i}`,
        arabic: c.details?.arabic || "",
        translation: c.content,
        source: c.details?.source || "",
        category: c.details?.category || "Genel",
        explanation: c.details?.explanation || "",
        narrator: c.details?.narrator || "",
        bookNumber: c.details?.bookNumber || ""
      }));
    return dynamic.length > 0 ? [...dynamic, ...hadiths] : hadiths;
  }, [dynamicPanelContent]);

  const displaySunnahs = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'sunnetler' || c.category === 'Sünnetler') && c.isActive)
      .map((c, i) => ({
        id: c.id || `dyn-s-${i}`,
        title: c.title,
        description: c.content,
        time: c.details?.time || "",
        reward: c.details?.reward || "",
        evidence: c.details?.evidence || "",
        subcategory: c.details?.subcategory || "Genel",
        details: Array.isArray(c.details?.details) ? c.details.details : []
      }));
    return dynamic.length > 0 ? [...dynamic, ...sunnahs] : sunnahs;
  }, [dynamicPanelContent]);

  const displaySpiritualSciences = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'manevi-ilimler' || c.category === 'Manevi İlimler') && c.isActive)
      .map((c, i) => ({
        id: c.id || `dyn-ss-${i}`,
        title: c.title,
        description: c.content,
        topics: Array.isArray(c.details?.topics) ? c.details.topics : [],
        importance: c.details?.importance || "",
        scholars: Array.isArray(c.details?.scholars) ? c.details.scholars : [],
        color: c.details?.color || "bg-indigo-50 border-indigo-200 text-indigo-900"
      }));
    return dynamic.length > 0 ? [...dynamic, ...spiritualSciences] : spiritualSciences;
  }, [dynamicPanelContent]);

  const displayQuotes = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'anlamli-sozler' || c.category === 'Anlamlı Sözler') && c.isActive)
      .map((c, i) => ({
        id: c.id || `dyn-q-${i}`,
        text: c.content,
        author: c.title,
        category: c.details?.category || "Genel"
      }));
    return dynamic.length > 0 ? [...dynamic, ...meaningfulQuotes] : meaningfulQuotes;
  }, [dynamicPanelContent]);

  const displayAdhkar = useMemo(() => {
    const dynamic = dynamicPanelContent
      .filter(c => (c.category === 'zikirler' || c.category === 'Zikirler') && c.isActive)
      .map((c, i) => ({
        name: c.title,
        target: parseInt(c.details?.target || "100"),
        current: 0,
        meaning: c.content
      }));
    // Standardize dailyAdhkar to make sure we don't have duplicates
    const combined = [...dailyAdhkar];
    dynamic.forEach(item => {
      if (!combined.some(c => c.name === item.name)) {
        combined.push(item);
      }
    });
    return combined;
  }, [dynamicPanelContent]);

  const [user, setUser] = useState<User | null>(null);
  const [activeQuran, setActiveQuran] = useState(0);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [dhikrCounts, setDhikrCounts] = useState(dailyAdhkar);

  useEffect(() => {
    if (displayAdhkar.length > 0) {
      setDhikrCounts(prev => {
        // Keep existing progress if names match
        return displayAdhkar.map(item => {
          const existing = prev.find(p => p.name === item.name);
          return existing ? { ...item, current: existing.current } : item;
        });
      });
    }
  }, [displayAdhkar]);
  const [dailyNote, setDailyNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hatmProgress, setHatmProgress] = useState(0); // Yüzde olarak hatim ilerlemesi
  const [currentPage, setCurrentPage] = useState(1); // Kur'an'dan hangi sayfada
  const [currentJuz, setCurrentJuz] = useState(1); // Hangi cüz
  const [selectedZodiac, setSelectedZodiac] = useState(null);
  const [userBirthInfo, setUserBirthInfo] = useState({
    name: "",
    motherName: "",
    birthDate: ""
  });
  const [calculatedSign, setCalculatedSign] = useState(null);

  // Dynamic content states
  const [dynamicHadiths, setDynamicHadiths] = useState(hadiths);
  const [dynamicSunnahs, setDynamicSunnahs] = useState(sunnahs);
  const [dynamicQuotes, setDynamicQuotes] = useState(meaningfulQuotes);
  const [lastUpdateTime, setLastUpdateTime] = useState(localStorage.getItem('lastUpdateTime') || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [quranPages, setQuranPages] = useState([
    { page: 1, content: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", sura: "Fatiha", imageUrl: "https://www.quranpages.com/images/pages/page001.jpg" },
    { page: 2, content: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", sura: "Fatiha", imageUrl: "https://www.quranpages.com/images/pages/page002.jpg" },
    { page: 3, content: "الرَّحْمَٰنِ الرَّحِيمِ", sura: "Bakara", imageUrl: "https://www.quranpages.com/images/pages/page003.jpg" },
    { page: 4, content: "مَالِكِ يَوْمِ الدِّينِ", sura: "Bakara", imageUrl: "https://www.quranpages.com/images/pages/page004.jpg" },
    { page: 5, content: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", sura: "Bakara", imageUrl: "https://www.quranpages.com/images/pages/page005.jpg" },
  ]);

  // Real Quran page images (sample URLs)
  const quranPageImages = Array.from({ length: 604 }, (_, i) => ({
    page: i + 1,
    imageUrl: `https://everyayah.com/data/quran_pages_images/${i + 1}.png`,
    alternativeUrl: `https://quran.com/assets/images/pages/page${String(i + 1).padStart(3, '0')}.png`
  }));

  // Dream interpretation states
  const [dreamText, setDreamText] = useState("");
  const [dreamInterpretation, setDreamInterpretation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dreamHistory, setDreamHistory] = useState([]);

  // Quran page viewer states
  const [showQuranPageModal, setShowQuranPageModal] = useState(false);
  const [currentQuranPageImage, setCurrentQuranPageImage] = useState("");
  const [pageTranslation, setPageTranslation] = useState<string>("");
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);

  // New States for Improvements
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; timeLeft: string } | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [userLocation, setUserLocation] = useState("Istanbul"); // Default
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [diaryMood, setDiaryMood] = useState("");
  const [diaryGoal, setDiaryGoal] = useState("");
  const [duaRequests, setDuaRequests] = useState<any[]>([]);
  const [isDuaLoading, setIsDuaLoading] = useState(false);
  const [duaForm, setDuaForm] = useState({ title: "", content: "", targetCount: 100, category: "Genel" });

  // Persistence Effects
  useEffect(() => {
    // Load persisted data
    const savedDhikr = localStorage.getItem('dhikrCounts');
    if (savedDhikr) setDhikrCounts(JSON.parse(savedDhikr));

    const savedDreamHistory = localStorage.getItem('dreamHistory');
    if (savedDreamHistory) setDreamHistory(JSON.parse(savedDreamHistory));

    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) setUserLocation(savedLocation);

    const savedDiaryRequest = localStorage.getItem('diaryEntries');
    if (savedDiaryRequest) {
      setDiaryEntries(JSON.parse(savedDiaryRequest));
    }

    loadServerSpiritualContent();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const loadServerSpiritualContent = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/auth/spiritual-content", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.content) {
          const { hadiths: sHadiths = [], sunnahs: sSunnahs = [], quotes: sQuotes = [] } = data.content;
          
          if (sHadiths.length > 0) {
            setDynamicHadiths(prev => {
              const combined = [...prev];
              sHadiths.forEach((nh: any) => {
                if (!combined.some(h => h.id === nh.id || (h as any).arabic === nh.arabic)) {
                  combined.push({ ...nh, id: nh.id || nh._id });
                }
              });
              return combined;
            });
          }
          
          if (sSunnahs.length > 0) {
            setDynamicSunnahs(prev => {
              const combined = [...prev];
              sSunnahs.forEach((ns: any) => {
                if (!combined.some(s => s.id === ns.id || s.title === ns.title)) {
                  combined.push({ ...ns, id: ns.id || ns._id });
                }
              });
              return combined;
            });
          }
          
          if (sQuotes.length > 0) {
            setDynamicQuotes(prev => {
              const combined = [...prev];
              sQuotes.forEach((nq: any) => {
                if (!combined.some(q => q.id === nq.id || q.text === nq.text)) {
                  combined.push({ ...nq, id: nq.id || nq._id });
                }
              });
              return combined;
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading server spiritual content:", error);
    }
  };

  useEffect(() => {
    localStorage.setItem('dhikrCounts', JSON.stringify(dhikrCounts));
  }, [dhikrCounts]);

  useEffect(() => {
    localStorage.setItem('dreamHistory', JSON.stringify(dreamHistory));
  }, [dreamHistory]);

  // Fetch Prayer Times & Hijri Date
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${userLocation}&country=Turkey&method=13`);
        const data = await response.json();
        if (data.code === 200) {
          setPrayerTimes(data.data.timings);
          setHijriDate(data.data.date.hijri);
          calculateNextPrayer(data.data.timings);
        }
      } catch (error) {
        console.error("Error fetching prayer times:", error);
      }
    };

    fetchPrayerTimes();
    const interval = setInterval(() => {
      if (prayerTimes) calculateNextPrayer(prayerTimes);
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [userLocation]);

  const calculateNextPrayer = (timings: PrayerTimes) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "İmsak", time: timings.Fajr },
      { name: "Güneş", time: timings.Sunrise },
      { name: "Öğle", time: timings.Dhuhr },
      { name: "İkindi", time: timings.Asr },
      { name: "Akşam", time: timings.Maghrib },
      { name: "Yatsı", time: timings.Isha }
    ];

    let next = null;
    let minDiff = Infinity;

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      let diff = prayerMinutes - currentTime;

      if (diff < 0) diff += 24 * 60; // Next day

      if (diff < minDiff) {
        minDiff = diff;
        const hoursLeft = Math.floor(diff / 60);
        const minutesLeft = diff % 60;
        next = {
          name: prayer.name,
          time: prayer.time,
          timeLeft: `${hoursLeft}s ${minutesLeft}dk`
        };
      }
    }
    setNextPrayer(next);
  };

  const loadHatimProgress = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/auth/manevi/hatim", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.progress) {
        setCurrentPage(data.progress.currentPage);
        setHatmProgress(data.progress.progress);
      }
    } catch (error) {
      console.error("Hatim yukleme hatasi:", error);
    }
  };

  const syncHatimProgress = async (page: number) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      await fetch("/api/auth/manevi/hatim", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ page })
      });
    } catch (error) {
      console.error("Hatim senkronizasyon hatasi:", error);
    }
  };

  const loadDuaRequests = async () => {
    setIsDuaLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/auth/manevi/dua", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDuaRequests(data.duallar);
      }
    } catch (error) {
      console.error("Dua yukleme hatasi:", error);
    } finally {
      setIsDuaLoading(false);
    }
  };

  const handleCreateDua = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/auth/manevi/dua-request", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(duaForm)
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Dua talebiniz paylaşıldı");
        setDuaForm({ title: "", content: "", targetCount: 100, category: "Genel" });
        loadDuaRequests();
      }
    } catch (error) {
      toast.error("Dua oluşturulurken hata oluştu");
    }
  };

  const handleJoinDua = async (duaId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`/api/auth/manevi/dua-join/${duaId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Duaya katıldınız, Allah kabul etsin");
        loadDuaRequests();
      } else {
        toast.error(data.message || "Duaya katılamadınız");
      }
    } catch (error) {
      toast.error("İşlem sırasında hata oluştu");
    }
  };

  useEffect(() => {
    loadHatimProgress();
    loadDuaRequests();
    loadServerSpiritualContent();
  }, []);


  // Updates disabled - using built-in hadiths and sunnahs instead of fetching from external APIs
  // This avoids CSP violations and improves performance

  const updateDhikr = (index: number, increment: boolean) => {
    setDhikrCounts(prev =>
      prev.map((dhikr, i) =>
        i === index
          ? { ...dhikr, current: Math.max(0, increment ? dhikr.current + 1 : dhikr.current - 1) }
          : dhikr
      )
    );
  };

  const resetDhikr = () => {
    setDhikrCounts(prev => prev.map(dhikr => ({ ...dhikr, current: 0 })));
  };

  const filteredQuotes = displayQuotes.filter(quote =>
    selectedCategory === "all" || quote.category === selectedCategory
  );

  const filteredHadiths = displayHadiths.filter(hadith =>
    hadith.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hadith.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateZodiacSign = () => {
    if (!userBirthInfo.birthDate) return;

    const birthDate = new Date(userBirthInfo.birthDate);
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    let sign = null;

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = zodiacSigns[0]; // Koç
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = zodiacSigns[1]; // Boğa
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = zodiacSigns[2]; // İkizler
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = zodiacSigns[3]; // Yengeç
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = zodiacSigns[4]; // Aslan
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = zodiacSigns[5]; // Başak
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = zodiacSigns[6]; // Terazi
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = zodiacSigns[7]; // Akrep
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = zodiacSigns[8]; // Yay
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sign = zodiacSigns[9]; // Oğlak
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = zodiacSigns[10]; // Kova
    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) sign = zodiacSigns[11]; // Balık

    setCalculatedSign(sign);
  };

  // Rüya sembollerini analiz etmek için Levenshtein Distance kullanarak benzerlik ara
  const findSimilarSymbols = (word, threshold = 0.6) => {
    const symbolKeys = Object.keys(dreamSymbols);
    const similar = [];

    for (const key of symbolKeys) {
      const distance = calculateLevenshteinDistance(word, key);
      const maxLen = Math.max(word.length, key.length);
      const similarity = 1 - (distance / maxLen);

      if (similarity >= threshold) {
        similar.push({ symbol: key, similarity });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
  };

  // Levenshtein Distance hesaplama
  const calculateLevenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    return track[str2.length][str1.length];
  };

  const interpretDream = () => {
    if (!dreamText.trim()) return;

    setIsAnalyzing(true);

    // Call AI-based dream interpretation
    interpretDreamWithAI();
  };

  const interpretDreamWithAI = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Yorum için giriş yapmalısınız");
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch("/api/auth/manevi/interpret-dream", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ dreamText })
      });

      const data = await response.json();
      if (data.success) {
        setDreamInterpretation(data.interpretation);
        setDreamHistory(prev => [data.interpretation, ...prev]);
      } else {
        toast.error(data.error || "Rüya tabir edilemedi");
      }
    } catch (error) {
      console.error("Dream API error:", error);
      toast.error("Servis şu an meşgul, lütfen sonra tekrar deneyin.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Daha iyi genel yorumlar oluştur
  const generateGeneralInterpretation = (foundSymbols, allInterpretations, isPositive) => {
    if (foundSymbols.length === 0) {
      return isPositive
        ? "Rüyanız genel olarak olumlu duygularla yüklü olarak gözükmektedir. Her rüya kişinin iç dünyasının bir yansımasıdır."
        : "Rüyanız endişe ve dikkat gerektiren durumlar içeriyor olabilir. Allah'a dua etmek faydalı olur.";
    }

    const symbolMeanings = foundSymbols.slice(0, 3).map(s => s.data.meaning).join(', ');
    return `Rüyanızda ${foundSymbols.length} önemli sembol tespit edildi: ${symbolMeanings}. ${isPositive ? 'Bu semboller genel olarak olumlu gelişmeleri işaret eder.' : 'Bu semboller dikkat gerektirir.'}`;
  };

  // Pozitif/negatif rüya kontrolü
  const checkPositiveDream = (text, symbols) => {
    const negativWords = ["düşmek", "kötü", "tehlike", "ölmek", "öldü", "saldırı", "kanama", "patlama", "yangın", "kan", "kan", "endişe", "korku", "hata", "başarısız"];
    const positiveWords = ["mutlu", "sevinç", "bereket", "kazanç", "başarı", "sevgi", "huzur", "güzel", "iyilik", "dua", "sevdik", "hediye"];

    const textLower = text.toLowerCase();
    const negCount = negativWords.filter(w => textLower.includes(w)).length;
    const posCount = positiveWords.filter(w => textLower.includes(w)).length;

    return posCount >= negCount;
  };

  // Yapay zeka tabanlı analiz oluştur
  const generateAIBasedAnalysis = (dreamText, foundSymbols) => {
    const detailedParts = [];

    if (foundSymbols.length > 0) {
      detailedParts.push("Tespit Edilen Semboller Analizi:");
      foundSymbols.forEach(s => {
        detailedParts.push(`\n• ${s.symbol.toUpperCase()}: ${s.data.meaning}`);
        detailedParts.push(`  ${s.data.context}`);
      });
    }

    // Rüyanın duygusal analizi
    detailedParts.push("\n\nDuygusal Analiz:");
    if (dreamText.toLowerCase().includes("düşmek") || dreamText.toLowerCase().includes("uçurum")) {
      detailedParts.push("Rüyanızda yükseklikten düşme motifi vardır. Bu genellikle endişe, kontrol kaybı veya hayattaki belirsizlikleri sembolize eder. İçinde bulunduğunuz durumlar hakkında düşünmek ve dua etmek faydalı olur.");
    } else if (dreamText.toLowerCase().includes("deniz") || dreamText.toLowerCase().includes("yüzmek")) {
      detailedParts.push("Rüyanızda su ve hareket temalarıyla karşılaşıyoruz. Bu, hayatın akışına uyum sağlamak ve emosyonel derinliklerle yüzleşmek anlamına gelebilir. Bu, pozitif bir manevi yolculuğun işareti olabilir.");
    } else if (dreamText.toLowerCase().includes("yağmur")) {
      detailedParts.push("Rüyanızda yağmur motifi vardır. İslami rüya tabirinde yağmur genellikle bereket, rahmet ve Allah'ın lütfunun sembolüdür. Zorlukların geçeceği ve yeni bir dönemin başlayacağı işareti olabilir.");
    } else {
      detailedParts.push("Rüyanız içinde bulunduğunuz manevi durumu yansıtmaktadır. Rüyalar sık sık bilinçaltı duygularımız ve endişelerimiz hakkında bize bilgi verir.");
    }

    return detailedParts.join("\n");
  };

  // Öneriler oluştur
  const generateRecommendations = (isPositive) => {
    const baseRecommendations = [
      "Rüyanızın ardından Allah'a hamd edin ve teşekkür edin",
      "Rüyadaki mesajlar hakkında düşünmek için zaman ayırın",
      "Kur'an okumak ve dua etmek ilham verir",
      "Rüya günlüğü tutmak sembol tanımada yardımcı olur"
    ];

    if (isPositive) {
      baseRecommendations.push("Güzel rüya görünce sevdiklerinizle paylaşmak müstehaptır");
      baseRecommendations.push("Aldığınız müjde için şükür etmeyi unutmayın");
    } else {
      baseRecommendations.push("Kötü rüya görünce üç kez 'Euzübillah' deyin");
      baseRecommendations.push("Sol tarafınıza tükürün ve olumsuz yorum yapmayın");
      baseRecommendations.push("İki rekât namazveya duayla sonlandırın");
    }

    return baseRecommendations;
  };

  // Genel anlam oluştur
  const generateOverallMeaning = (foundSymbols, interpretations, dreamText) => {
    if (foundSymbols.length === 0) {
      return "Semboller veritabanımızda tam eşleşmese de, bu rüya size bir mesaj veriyor. Her rüya Allah'tan bir hikmettir. Sabah namazında dua etmek ve Kur'an okumak etkili olur.";
    }

    const uniqueInterpretations = [...new Set(interpretations)].slice(0, 4);
    return `Bu rüya genel olarak: ${uniqueInterpretations.join(", ")}. Rüya tabirinde en önemli şey, rüyanızın size kişisel olarak ne hissettirendir. İçinizdeki seslemek için, dua ve istikareniz en iyi rehberinizdir.`;
  };

  const fetchPageTranslation = async (pageNumber: number) => {
    setIsTranslationLoading(true);
    setPageTranslation("");
    try {
      const response = await fetch(`/api/quran/page/${pageNumber}`);
      const data = await response.json();
      if (data.code === 200 && data.data && data.data.ayahs) {
        const translationText = data.data.ayahs.map((ayah: any) =>
          `(${ayah.surah.name}, ${ayah.numberInSurah}. Ayet): ${ayah.text}`
        ).join('\n\n');
        setPageTranslation(translationText);
      }
    } catch (error) {
      console.error("Error fetching translation:", error);
      setPageTranslation("Meal yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setIsTranslationLoading(false);
    }
  };

  const showQuranPage = (pageNumber: number) => {
    // Sayfayı kaydet
    localStorage.setItem("lastReadPage", pageNumber.toString());
    localStorage.setItem("lastReadDate", new Date().toISOString());

    // Page state güncelle
    setCurrentPage(pageNumber);
    setHatmProgress(Math.round(((pageNumber) / 604) * 100));

    // Görseli güncelle - Direct URL construction for better reliability
    setCurrentQuranPageImage(`https://everyayah.com/data/quran_pages_images/${pageNumber}.png`);

    setShowQuranPageModal(true);
    fetchPageTranslation(pageNumber);
  };

  const saveDailyNote = () => {
    if (!dailyNote.trim()) {
      alert("Lütfen bir not giriniz.");
      return;
    }

    const noteEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('tr-TR'),
      note: dailyNote,
      mood: diaryMood,
      goal: diaryGoal
    };

    const savedEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const newEntries = [noteEntry, ...savedEntries];
    localStorage.setItem('diaryEntries', JSON.stringify(newEntries));
    setDiaryEntries(newEntries);

    // Basit bir bildirim (gerçek projede toast kullanılabilir)
    alert("Günlük notunuz kaydedildi!");
    setDailyNote("");
    setDiaryMood("");
    setDiaryGoal("");
  };

  const completeDailyDhikr = () => {
    // Toplam çekilen zikir sayısı
    const totalDhikr = dhikrCounts.reduce((acc, curr) => acc + curr.current, 0);

    if (totalDhikr === 0) {
      alert("Henüz hiç zikir çekmediniz.");
      return;
    }

    const today = new Date().toLocaleDateString('tr-TR');
    const history = JSON.parse(localStorage.getItem('dhikrHistory') || '[]');

    history.push({
      date: today,
      count: totalDhikr,
      details: dhikrCounts
    });

    localStorage.setItem('dhikrHistory', JSON.stringify(history));
    resetDhikr();
    alert(`Maşallah! Bugün toplam ${totalDhikr} zikir çektiniz ve kaydettiniz.`);
  };

  const downloadHatimProgram = () => {
    const programData = `
KUTBUL ZAMAN - HATİM-İ ŞERİF TAKİP ÇİZELGESİ
--------------------------------------------
Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}

Mevcut Durum:
- Bulunduğunuz Cüz: ${currentJuz}. Cüz
- Okunan Sayfa: ${currentPage}
- Toplam İlerleme: %${hatmProgress}
- Kalan Sayfa: ${604 - currentPage}

Hedefiniz: Kur'an-ı Kerim'i hatmetmek ve Allah'ın rızasını kazanmak.
Rabbim kabul etsin.

Notlar:
Bu dosya kişisel takip amaçlıdır.
    `;

    const blob = new Blob([programData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hatim_Programi_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if daily update is needed
  const checkForDailyUpdates = () => {
    const now = new Date();
    const today = now.toDateString();
    const lastUpdate = lastUpdateTime ? new Date(lastUpdateTime).toDateString() : null;

    if (!lastUpdate || lastUpdate !== today) {
      updateIslamicContent();
    }
  };

  // Fetch updated Islamic content from various sources
  const updateIslamicContent = async () => {
    setIsUpdating(true);
    setUpdateStatus('📡 İslami içerik güncelleniyor...');

    try {
      // Fetch new hadiths from multiple Islamic APIs
      const newHadiths = await fetchNewHadiths();
      const newSunnahs = await fetchNewSunnahs();

      if (newHadiths.length > 0) {
        // Add new hadiths to existing ones, avoiding duplicates
        const combinedHadiths = [...dynamicHadiths];
        newHadiths.forEach(newHadith => {
          if (!combinedHadiths.some(h => h.arabic === newHadith.arabic)) {
            combinedHadiths.push(newHadith);
          }
        });
        setDynamicHadiths(combinedHadiths);
      }

      if (newSunnahs.length > 0) {
        // Add new sunnahs to existing ones, avoiding duplicates
        const combinedSunnahs = [...dynamicSunnahs];
        newSunnahs.forEach(newSunnah => {
          if (!combinedSunnahs.some(s => s.title === newSunnah.title)) {
            combinedSunnahs.push(newSunnah);
          }
        });
        setDynamicSunnahs(combinedSunnahs);
      }

      const updateTime = new Date().toISOString();
      setLastUpdateTime(updateTime);
      localStorage.setItem('lastUpdateTime', updateTime);

      setUpdateStatus(`✅ İçerik güncellendi! ${newHadiths.length} yeni hadis, ${newSunnahs.length} yeni sünnet eklendi.`);

    } catch (error) {
      console.error('Error updating Islamic content:', error);
      setUpdateStatus('⚠️ Güncelleme sırasında hata oluştu. Varsayılan içerik kullanılıyor.');
    } finally {
      setIsUpdating(false);
      // Clear status after 5 seconds
      setTimeout(() => setUpdateStatus(''), 5000);
    }
  };

  // Fetch hadiths from Islamic APIs
  const fetchNewHadiths = async () => {
    const newHadiths = [];

    try {
      // Source 1: Hadith API (example implementation)
      const hadithSources = [
        {
          name: 'Buhari Collection',
          url: 'https://api.hadith.gading.dev/books/bukhari',
          category: 'İbadet'
        },
        {
          name: 'Muslim Collection',
          url: 'https://api.hadith.gading.dev/books/muslim',
          category: 'Ahlak'
        }
      ];

      for (const source of hadithSources) {
        try {
          const response = await fetch(`${source.url}?range=1-5`);
          if (response.ok) {
            const data = await response.json();

            if (data.data && data.data.hadiths) {
              (data.data.hadiths || []).slice(0, 2).forEach((hadith, index) => {
                newHadiths.push({
                  id: Date.now() + index + Math.random(),
                  arabic: hadith.arab || "حديث شريف",
                  translation: hadith.id || "Günlük hadis-i şerif",
                  source: source.name,
                  category: source.category,
                  explanation: `Bu hadis ${source.name} koleksiyonundan alınmış güncel bir hadistir. İslami hayatımızda önemli bir yere sahiptir.`,
                  narrator: "Hz. Sahabi",
                  bookNumber: `${source.name} - Günlük`
                });
              });
            }
          }
        } catch (apiError) {
          console.log(`Error fetching from ${source.name}:`, apiError);
        }
      }

      // If API fails, add some sample daily hadiths
      if (newHadiths.length === 0) {
        const dailyHadiths = [
          {
            id: Date.now() + 1000,
            arabic: "مَا نَقَصَ مَالُ عَبْدٍ مِنْ صَدَقَةٍ",
            translation: "Hiçbir kimsenin malı sadaka vermekle azalmaz.",
            source: "Tirmizi",
            category: "Sadaka",
            explanation: "Bu hadis, sadaka vermenin bereket getireceğini ve malın azalmayacağını öğretir.",
            narrator: "Hz. Ebu Hüreyre (r.a.)",
            bookNumber: "Tirmizi 2325"
          },
          {
            id: Date.now() + 1001,
            arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
            translation: "İnsanların en hayırlısı, insanlara en faydalı olanıdır.",
            source: "Taberani",
            category: "Hizmet",
            explanation: "Bu hadis, başkalarına fayda sağlamanın en büyük fazilet olduğunu belirtir.",
            narrator: "Hz. Abdullah bin Ömer (r.a.)",
            bookNumber: "Taberani 13646"
          }
        ];
        newHadiths.push(...dailyHadiths);
      }

    } catch (error) {
      console.error('Error in fetchNewHadiths:', error);
    }

    return newHadiths;
  };

  // Fetch sunnahs from Islamic sources
  const fetchNewSunnahs = async () => {
    const newSunnahs = [];

    try {
      // Add some daily sunnahs (these would come from APIs in real implementation)
      const dailySunnahs = [
        {
          id: Date.now() + 2000,
          title: "Sabah Akşam Ezkarı",
          description: "Her sabah ve akşam belirli duaları okumak",
          time: "Sabah ve akşam vakitlerinde",
          reward: "Günlük korunma ve bereket",
          evidence: "Kim sabah akşam ezkarını okursa, hiçbir şey ona zarar veremez. (Ebu Davud)",
          subcategory: "Günlük Zikir",
          details: [
            "Ayetel Kürsi (3 kez)",
            "İhlas, Felak, Nas (3'er kez)",
            "Sabah akşam duaları",
            "İstiğfar (100 kez)"
          ]
        },
        {
          id: Date.now() + 2001,
          title: "Temizlik ve Hijyen",
          description: "Bedensel ve ruhsal temizliğe önem vermek",
          time: "Günlük yaşamın her anında",
          reward: "Allah'ın sevgisi ve meleklerin duası",
          evidence: "Allah temiz olanları sever. (Tirmizi)",
          subcategory: "Temizlik",
          details: [
            "Düzenli gusül ve abdest",
            "Diş temizliği",
            "Temiz elbise giymek",
            "Çevre temizliği"
          ]
        }
      ];

      newSunnahs.push(...dailySunnahs);

    } catch (error) {
      console.error('Error in fetchNewSunnahs:', error);
    }

    return newSunnahs;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-spiritual-purple rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-spiritual-purple bg-clip-text text-transparent">
                  Kutbul Zaman
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Ana Sayfa
              </Link>
              <Link
                to="/manevi-panel"
                className="text-primary font-bold text-sm"
              >
                Manevi Panel
              </Link>
              <Link
                to="/zahiri-panel"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Zahiri Panel
              </Link>
              <Link
                to="/batini-panel"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Batıni Panel
              </Link>
              <Link
                to="/products"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                🛍️ Ürünler
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("isAuthenticated");
                  localStorage.removeItem("userEmail");
                  window.location.href = "/";
                }}
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-primary" />
                Manevi Panel
                {isUpdating && <div className="ml-3 animate-pulse">🔄</div>}
              </h1>
              <p className="text-foreground/60">
                İslami ilimler, Kur'an, hadisler, burç hesaplama ve manevi gelişim rehberiniz
              </p>
              {hijriDate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full w-fit border border-purple-100">
                  <Moon className="w-4 h-4" />
                  <span className="font-medium">{hijriDate.day} {hijriDate.month.en} {hijriDate.year}</span>
                  <span className="text-gray-400">|</span>
                  <span>{new Date().toLocaleDateString('tr-TR')}</span>
                </div>
              )}
            </div>

            {/* Prayer Times Card */}
            <Card className="w-full md:w-auto min-w-[300px] border-primary/20 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <select
                      value={userLocation}
                      onChange={(e) => {
                        setUserLocation(e.target.value);
                        localStorage.setItem('userLocation', e.target.value);
                      }}
                      className="bg-transparent text-sm font-semibold text-primary outline-none cursor-pointer"
                    >
                      <option value="Istanbul">İstanbul</option>
                      <option value="Ankara">Ankara</option>
                      <option value="Izmir">İzmir</option>
                      <option value="Bursa">Bursa</option>
                      <option value="Konya">Konya</option>
                      <option value="Antalya">Antalya</option>
                    </select>
                  </div>
                  {nextPrayer && (
                    <div className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded animate-pulse">
                      {nextPrayer.name}'e {nextPrayer.timeLeft}
                    </div>
                  )}
                </div>
                {prayerTimes ? (
                  <div className="grid grid-cols-6 gap-2 text-center">
                    {Object.entries({
                      İmsak: prayerTimes.Fajr,
                      Güneş: prayerTimes.Sunrise,
                      Öğle: prayerTimes.Dhuhr,
                      İkindi: prayerTimes.Asr,
                      Akşam: prayerTimes.Maghrib,
                      Yatsı: prayerTimes.Isha
                    }).map(([name, time]) => (
                      <div key={name} className={`flex flex-col p-1 rounded ${nextPrayer?.name === name ? 'bg-primary text-white scale-110 shadow-md transform transition' : 'hover:bg-gray-50'}`}>
                        <span className="text-[10px] opacity-80">{name}</span>
                        <span className="text-xs font-bold">{time.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-400 py-2">Vakitler yükleniyor...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-12 h-auto p-2 bg-white border border-slate-200 gap-1">
            <TabsTrigger value="system" className="flex flex-col items-center p-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-indigo-200">
              <BookOpen className="w-5 h-5 mb-1 text-indigo-600" />
              <span className="text-[10px] font-bold">Sistem</span>
            </TabsTrigger>
            <TabsTrigger value="quran" className="flex flex-col items-center p-2 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-amber-200">
              <BookOpen className="w-5 h-5 mb-1 text-amber-600" />
              <span className="text-[10px] font-bold">Kur'an</span>
            </TabsTrigger>
            <TabsTrigger value="esma" className="flex flex-col items-center p-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-emerald-200">
              <Sparkles className="w-5 h-5 mb-1 text-emerald-600" />
              <span className="text-[10px] font-bold">Esma</span>
            </TabsTrigger>
            <TabsTrigger value="hatm" className="flex flex-col items-center p-2 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-cyan-200">
              <Star className="w-5 h-5 mb-1 text-cyan-600" />
              <span className="text-[10px] font-bold">Hatim</span>
            </TabsTrigger>
            <TabsTrigger value="hadith" className="flex flex-col items-center p-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-indigo-200">
              <Quote className="w-5 h-5 mb-1 text-indigo-600" />
              <span className="text-[10px] font-bold">Hadisler</span>
            </TabsTrigger>
            <TabsTrigger value="sunnah" className="flex flex-col items-center p-2 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-rose-200">
              <Heart className="w-5 h-5 mb-1 text-rose-600" />
              <span className="text-[10px] font-bold">Sünnetler</span>
            </TabsTrigger>
            <TabsTrigger value="sciences" className="flex flex-col items-center p-2 data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-violet-200">
              <Lightbulb className="w-5 h-5 mb-1 text-violet-600" />
              <span className="text-[10px] font-bold">İlimler</span>
            </TabsTrigger>
            <TabsTrigger value="zodiac" className="flex flex-col items-center p-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-slate-200">
              <Moon className="w-5 h-5 mb-1 text-slate-600" />
              <span className="text-[10px] font-bold">Burçlar</span>
            </TabsTrigger>
            <TabsTrigger value="dreams" className="flex flex-col items-center p-2 data-[state=active]:bg-fuchsia-100 data-[state=active]:text-fuchsia-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-fuchsia-200">
              <Moon className="w-5 h-5 mb-1 text-fuchsia-600" />
              <span className="text-[10px] font-bold">Rüya</span>
            </TabsTrigger>
            <TabsTrigger value="dhikr" className="flex flex-col items-center p-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-orange-200">
              <Volume2 className="w-5 h-5 mb-1 text-orange-600" />
              <span className="text-[10px] font-bold">Zikir</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex flex-col items-center p-2 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-pink-200">
              <MessageCircle className="w-5 h-5 mb-1 text-pink-600" />
              <span className="text-[10px] font-bold">Sözler</span>
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex flex-col items-center p-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-blue-200">
              <Users className="w-5 h-5 mb-1 text-blue-600" />
              <span className="text-[10px] font-bold">Dua Kardeşliği</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6 mt-6">
            <Card className="bg-white text-indigo-900 border border-indigo-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BookOpen className="w-32 h-32 rotate-12 text-indigo-600" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-xs font-bold tracking-wider uppercase border border-indigo-100">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Yol Haritası
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-indigo-900">Kapsamlı Sistem Sunumu</h3>
                    <p className="text-indigo-700/80 text-lg leading-relaxed">
                      Manevi yolculuğunuzu maddi özgürlükle taçlandırmak için sistemin tüm detaylarını öğrenin. 
                      Kazanç planı, kariyer basamakları ve fazlası burada.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsPresentationOpen(true)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 font-black px-10 h-14 text-lg rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 shrink-0"
                  >
                    Sunumu Başlat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kur'an-ı Kerim Tab */}
          <TabsContent value="quran" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 text-xl font-bold">
                    <Video className="w-6 h-6" />
                    Ahmet el Acemi - Cüzler
                  </CardTitle>
                  <CardDescription className="text-amber-700/80">
                    YouTube'dan dinlemek için cüz seçiniz
                  </CardDescription>
                  {localStorage.getItem("lastReadPage") && (
                    <Button
                      variant="link"
                      className="text-amber-600 text-sm p-0 h-auto font-semibold mt-2 underline"
                      onClick={() => showQuranPage(parseInt(localStorage.getItem("lastReadPage") || "1"))}
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Kaldığım yerden devam et (Sayfa {localStorage.getItem("lastReadPage")})
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-2">
                      {quranJuzList.map((juz) => (
                        <div
                          key={juz.id}
                          className={`p-3 rounded-lg transition-all border ${currentJuz === juz.id ? 'border-amber-500 bg-amber-100 shadow-md' : 'border-amber-100/50 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between"
                            onClick={() => {
                              setCurrentJuz(juz.id);
                              // window.open(juz.playlistUrl, '_blank'); // Otomatik açılmasın
                            }}>
                            <div className="flex-1 cursor-pointer">
                              <h4 className={`font-bold flex items-center gap-2 ${currentJuz === juz.id ? 'text-amber-900' : 'text-gray-700'}`}>
                                <Play className={`w-4 h-4 ${currentJuz === juz.id ? 'text-amber-600' : 'text-gray-400'}`} />
                                {juz.name}
                              </h4>
                              <p className="text-xs text-slate-700 mt-1">
                                {juz.startSura} - {juz.endSura}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentJuz(juz.id);
                                  showQuranPage(juz.startPage);
                                }}
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                Oku
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-amber-400 hover:text-amber-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(juz.playlistUrl, '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-amber-200 shadow-lg bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-xl border-b border-amber-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold text-amber-900">
                        <Book className="w-8 h-8 text-amber-600" />
                        {quranSuras[activeQuran]?.name} Suresi
                      </CardTitle>
                      <CardDescription className="text-amber-700 font-medium mt-1">
                        {quranSuras[activeQuran]?.meaning} • {quranSuras[activeQuran]?.verses} ayet • {quranSuras[activeQuran]?.type} • <span className="font-arabic">{quranSuras[activeQuran]?.arabicName}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/95">
                  <ScrollArea className="h-[500px] pr-6">
                    <div className="space-y-8">
                      <div className="text-right bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                        <h3 className="text-3xl font-arabic leading-[2.5] text-gray-800 dir-rtl">
                          {quranSuras[activeQuran]?.content.arabic}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm">
                          <h4 className="font-bold text-amber-800 mb-2 text-lg">Türkçe Meali</h4>
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {quranSuras[activeQuran]?.content.translation}
                          </p>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-400 shadow-sm">
                          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Kısa Tefsir / Açıklama
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {quranSuras[activeQuran]?.content.commentary}
                          </p>
                        </div>
                      </div>

                      {/* YouTube Video Embed */}
                      <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                        <h4 className="font-semibold mb-4 text-gray-800">Dinlemek için tıklayın:</h4>
                        <Button
                          onClick={() => window.open(quranJuzList[currentJuz - 1]?.playlistUrl, '_blank')}
                          className="w-full max-w-md bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-md hover:shadow-lg transition-all"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          YouTube'da {currentJuz}. Cüzü Dinle (Ahmet el Acemi)
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Esma-ül Hüsna Tab */}
          <TabsContent value="esma" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="md:col-span-full bg-white border-emerald-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <Sparkles className="w-5 h-5" />
                    Esma-ül Hüsna
                  </CardTitle>
                  <CardDescription>
                    Allah'ın en güzel isimleri, anlamları ve faziletleri
                  </CardDescription>
                </CardHeader>
              </Card>
              {displayEsmaulHusna.map((item, index) => (
                <Card key={index} className="hover:shadow-md transition-all hover:border-emerald-200 group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-emerald-700 group-hover:text-emerald-600">{item.name}</h3>
                      <Badge variant="outline" className="text-xs text-slate-700">#{index + 1}</Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-3 min-h-[40px]">{item.meaning}</p>
                    <div className="bg-emerald-50 p-3 rounded text-xs text-emerald-800 border border-emerald-100">
                      <span className="font-bold">Fazilet:</span> {item.benefit}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Hatmi Şerif Tab */}
          <TabsContent value="hatm" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-cyan-200 bg-white shadow-md">
                <CardHeader className="bg-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <Star className="w-6 h-6" />
                    Hatim İlerlemesi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="text-center relative py-6">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Star className="w-32 h-32 text-cyan-500" />
                    </div>
                    <div className="text-7xl font-black text-cyan-700 mb-2 relative z-10">%{hatmProgress}</div>
                    <div className="w-full max-w-[200px] mx-auto mb-4">
                      <Progress value={hatmProgress} className="h-4 bg-cyan-100 [&>div]:bg-cyan-500 shadow-inner" />
                    </div>
                    <p className="text-sm font-bold text-cyan-800 relative z-10 bg-white/50 inline-block px-3 py-1 rounded-full border border-cyan-100">
                      {currentPage} / 604 Sayfa Tamamlandı
                    </p>
                    {localStorage.getItem("lastReadDate") && (
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Son okuma: {new Date(localStorage.getItem("lastReadDate") || "").toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-cyan-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-cyan-500 group-hover:scale-110 transition-transform" />
                      <p className="text-2xl font-black text-gray-800">30</p>
                      <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Hedef Gün</p>
                    </div>
                    <div className="text-center p-4 border border-cyan-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <p className="text-2xl font-black text-gray-800">20</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Günlük Hedef</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="text-base font-bold py-7 border-2 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 rounded-xl transition-all shadow-sm"
                        onClick={() => {
                          if (currentPage > 1) {
                            const newPage = currentPage - 1;
                            setCurrentPage(newPage);
                            setHatmProgress(Math.round(((newPage) / 604) * 100));
                            syncHatimProgress(newPage);
                          }
                        }}
                      >
                        <ArrowLeftIcon className="w-5 h-5 mr-1" />
                        Geri
                      </Button>
                      <Button
                        className="text-base font-bold py-7 bg-cyan-600 hover:bg-cyan-700 shadow-lg hover:shadow-cyan-200 rounded-xl transition-all"
                        onClick={() => {
                          const newPage = Math.min(604, currentPage + 1);
                          setCurrentPage(newPage);
                          setHatmProgress(Math.round(((newPage) / 604) * 100));
                          syncHatimProgress(newPage);
                        }}
                      >
                        İleri
                        <ArrowRight className="w-5 h-5 ml-1" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      className="w-full text-sm font-bold text-cyan-600 hover:bg-cyan-50 hover:text-cyan-800"
                      onClick={() => {
                        setCurrentPage(1);
                        setHatmProgress(0);
                        syncHatimProgress(1);
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Hatim İlerlemesini Sıfırla
                    </Button>

                    <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100/50">
                      <h4 className="text-xs font-bold text-cyan-800 uppercase mb-3 flex items-center gap-2">
                        <Star className="w-3 h-3" />
                        Hızlı Erişim (Cüzler)
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 5, 10, 15, 20, 25, 30].map(juz => (
                          <Button
                            key={juz}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-8 p-0 border-cyan-200 hover:bg-cyan-600 hover:text-white transition-colors"
                            onClick={() => {
                              const page = (juz - 1) * 20 + 2;
                              showQuranPage(page);
                              syncHatimProgress(page);
                            }}
                          >
                            {juz}.C
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-8 p-0 border-cyan-200 hover:bg-cyan-600 hover:text-white"
                          onClick={() => showQuranPage(604)}
                        >
                          Son
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-cyan-100" />
                    
                    <Button
                      variant="outline"
                      className="w-full text-base font-bold py-7 border-dashed border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400 group rounded-xl"
                      onClick={downloadHatimProgram}
                    >
                      <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                      Hatim Programı İndir (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 shadow-md bg-white overflow-hidden">
                <CardHeader className="bg-emerald-600 text-white border-b border-emerald-100">
                  <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <BookOpen className="w-6 h-6" />
                    Mushaf-ı Şerif Okuyucu
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-8">
                    <div
                      className="text-center p-10 border-2 border-dashed border-emerald-200 rounded-3xl bg-white cursor-pointer hover:border-emerald-400 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                      onClick={() => showQuranPage(currentPage)}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 transition-all duration-500 group-hover:h-2" />
                      <div className="text-5xl font-arabic leading-loose mb-8 text-slate-800 group-hover:scale-110 transition-transform duration-500">
                        ﷽
                      </div>
                      <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full mb-2">
                        <Badge className="bg-emerald-600 font-bold px-3">Sayfa {currentPage}</Badge>
                        <span className="text-sm font-bold text-emerald-800 tracking-tight">Mushaf-ı Şerif</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium italic group-hover:text-emerald-600 transition-colors">
                        (Tam sayfayı okumak ve mealini görmek için tıklayın)
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Şu Anki Konum</p>
                        <p className="text-3xl font-black text-emerald-700">Sayfa {currentPage}</p>
                      </div>
                      <div className="h-12 w-px bg-emerald-100" />
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kalan Sayfa</p>
                        <p className="text-3xl font-black text-slate-400">{604 - currentPage}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => showQuranPage(currentPage)}
                      className="w-full text-xl font-bold py-9 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl hover:shadow-emerald-200 transform hover:-translate-y-1.5 transition-all rounded-2xl"
                    >
                      <BookOpen className="w-7 h-7 mr-3" />
                      Sayfa {currentPage}'yi Görüntüle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rüya Tabiri Tab */}
          {/* Rüya Tabiri Tab */}
          <TabsContent value="dreams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-fuchsia-200 shadow-md bg-white">
                <CardHeader className="bg-white border-b border-fuchsia-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-fuchsia-900 text-xl font-bold">
                    <Moon className="w-6 h-6 text-fuchsia-600" />
                    Rüya Tabiriniz
                  </CardTitle>
                  <CardDescription className="text-fuchsia-700/80">
                    Rüyanızı detaylı olarak anlatın, size İslami rüya tabiri yapacağız
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="dreamText" className="text-fuchsia-900 font-semibold mb-2 block">Rüyanızı Anlatın</Label>
                    <Textarea
                      id="dreamText"
                      value={dreamText}
                      onChange={(e) => setDreamText(e.target.value)}
                      placeholder="Gördüğünüz rüyayı mümkün olduğunca detaylı şekilde anlatın. Hangi nesneleri, kişileri, hayvanları gördünüz, neler yaşadınız..."
                      className="min-h-[150px] border-fuchsia-200 focus:border-fuchsia-500 focus:ring-fuchsia-200 text-base"
                    />
                  </div>

                  <Button
                    onClick={interpretDream}
                    className="w-full text-lg font-bold py-6 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 shadow-lg transition-all transform hover:-translate-y-1"
                    disabled={isAnalyzing || !dreamText.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="w-5 h-5 mr-3 animate-spin" />
                        🔮 Rüya Tabir Ediliyor...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-3" />
                        Rüyamı Tabir Et
                      </>
                    )}
                  </Button>

                  {dreamInterpretation && (
                    <div className="mt-6 p-6 border border-fuchsia-200 rounded-xl bg-white shadow-inner">
                      <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-fuchsia-800">
                        <Sparkles className="w-6 h-6 text-fuchsia-500" />
                        Rüya Tabiriniz
                      </h3>

                      <div className="space-y-6">
                        <div>
                          <h4 className="font-bold text-fuchsia-900 mb-2 border-b border-fuchsia-200 pb-1">Genel Değerlendirme</h4>
                          <p className="text-gray-800 leading-relaxed">{dreamInterpretation.generalInterpretation}</p>
                        </div>

                        {dreamInterpretation.foundSymbols.length > 0 && (
                          <div>
                            <h4 className="font-bold text-fuchsia-900 mb-3 border-b border-fuchsia-200 pb-1">Tespit Edilen Semboller</h4>
                            <div className="space-y-3">
                              {dreamInterpretation.foundSymbols.map((symbol, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-fuchsia-100 shadow-sm">
                                  <h5 className="font-bold text-fuchsia-800 capitalize text-lg flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                                    {symbol.symbol}
                                  </h5>
                                  <p className="text-gray-700 mt-1 italic">{symbol.data.meaning}</p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {symbol.data.interpretations.map((interp, i) => (
                                      <Badge key={i} variant="secondary" className="bg-fuchsia-100 text-fuchsia-800 border-none">
                                        {interp}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-bold text-fuchsia-900 mb-2 border-b border-fuchsia-200 pb-1">Öneriler</h4>
                          <ul className="text-gray-800 space-y-2">
                            {dreamInterpretation.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-fuchsia-500 mt-1">➤</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold text-fuchsia-900 mb-2 border-b border-fuchsia-200 pb-1">Genel Anlam</h4>
                          <p className="text-gray-800 font-medium bg-white p-4 rounded-lg border border-fuchsia-100">
                            {dreamInterpretation.overallMeaning}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-fuchsia-200 shadow-md">
                <CardHeader className="bg-fuchsia-50 border-b border-fuchsia-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-fuchsia-900">
                    <Archive className="w-5 h-5 text-fuchsia-600" />
                    Rüya Tabir Geçmişi
                  </CardTitle>
                  <CardDescription>
                    Daha önce tabir ettiğiniz rüyalarınız
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {dreamHistory.length === 0 ? (
                        <div className="text-center text-slate-700 py-12">
                          <Moon className="w-16 h-16 mx-auto mb-4 text-fuchsia-200" />
                          <p className="text-fuchsia-400 font-medium">Henüz rüya tabiriniz bulunmuyor.</p>
                        </div>
                      ) : (
                        dreamHistory.map((dream) => (
                          <div key={dream.id} className="border border-fuchsia-100 rounded-xl p-4 hover:bg-fuchsia-50 transition-colors group bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-sm text-fuchsia-800">{dream.date}</p>
                              <Badge variant="outline" className="border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50">
                                {dream.foundSymbols.length} sembol
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-800 mb-3 italic border-l-2 border-fuchsia-300 pl-2">
                              "{dream.dreamText.length > 80
                                ? dream.dreamText.substring(0, 80) + "..."
                                : dream.dreamText
                              }"
                            </p>
                            <p className="text-xs text-fuchsia-600 font-bold group-hover:text-fuchsia-800">
                              ☁️ {dream.overallMeaning}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Rüya Sembolleri Rehberi */}
            <Card className="border-purple-200 mt-6 shadow-md">
              <CardHeader className="bg-purple-50 border-b border-purple-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Rüya Sembolleri Rehberi
                </CardTitle>
                <CardDescription>
                  Yaygın rüya sembollerinin İslami anlamları
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(dreamSymbols).map(([symbol, data]) => (
                    <div key={symbol} className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors bg-white shadow-sm hover:shadow group">
                      <h3 className="font-bold capitalize text-purple-800 mb-2 flex items-center gap-2">
                        <span className="text-xl">🌙</span> {symbol}
                      </h3>
                      <p className="text-sm text-gray-700 mb-3 leading-snug">{data.meaning}</p>
                      <div className="space-y-1 bg-purple-50/50 p-2 rounded">
                        {(data.interpretations || []).slice(0, 2).map((interp, index) => (
                          <p key={index} className="text-xs text-purple-700 font-medium flex items-start gap-1">
                            <span>•</span> {interp}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Burçlar Yıldızname Tab */}
          {/* Burçlar Yıldızname Tab */}
          <TabsContent value="zodiac" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-md bg-white text-slate-800">
                <CardHeader className="bg-white border-b border-slate-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-slate-900 text-xl font-bold">
                    <Calculator className="w-6 h-6 text-purple-600" />
                    Burç Hesaplayıcı
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    İsminiz, anne isminiz ve doğum tarihinizle burç hesaplama
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-700">Adınız</Label>
                    <Input
                      id="name"
                      value={userBirthInfo.name}
                      onChange={(e) => setUserBirthInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Adınızı giriniz"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="motherName" className="text-slate-700">Anne İsmi</Label>
                    <Input
                      id="motherName"
                      value={userBirthInfo.motherName}
                      onChange={(e) => setUserBirthInfo(prev => ({ ...prev, motherName: e.target.value }))}
                      placeholder="Anne isminizi giriniz"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="birthDate" className="text-slate-700">Doğum Tarihi</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={userBirthInfo.birthDate}
                      onChange={(e) => setUserBirthInfo(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="bg-slate-50 border-slate-200 text-slate-900"
                    />
                  </div>
                  <Button onClick={calculateZodiacSign} className="w-full text-lg font-bold py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    <Sparkles className="w-5 h-5 mr-3 text-yellow-300" />
                    ✨ Burcumu Hesapla
                  </Button>

                  {calculatedSign && (
                    <div className="mt-6 p-6 border border-purple-200 rounded-xl bg-white shadow-lg">
                      <h3 className="font-bold text-2xl mb-2 text-slate-900 flex items-center justify-between">
                        {calculatedSign.name} Burcu
                        <Badge className="bg-purple-600 text-white">{calculatedSign.element}</Badge>
                      </h3>
                      <p className="text-sm text-slate-500 mb-4 font-mono">{calculatedSign.dates}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <strong className="text-purple-700 block mb-1">Yönetici Gezegen</strong>
                          {calculatedSign.planet}
                        </div>
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <strong className="text-indigo-700 block mb-1">Element</strong>
                          {calculatedSign.element}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-lg">
                  <CardTitle className="text-slate-800 font-bold">Burç Özellikleri</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[550px] pr-4">
                    <div className="space-y-4">
                      {zodiacSigns.map((sign) => (
                        <div
                          key={sign.name}
                          className={`p-5 border rounded-xl cursor-pointer transition-all duration-300 ${selectedZodiac === sign.name ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-100 hover:bg-slate-50'
                            }`}
                          onClick={() => setSelectedZodiac(selectedZodiac === sign.name ? null : sign.name)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className={`font-bold text-lg ${selectedZodiac === sign.name ? 'text-purple-900' : 'text-slate-700'}`}>{sign.name}</h4>
                              <p className="text-xs text-slate-500 font-mono">{sign.dates}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={selectedZodiac === sign.name ? "default" : "outline"} className={selectedZodiac === sign.name ? "bg-purple-600" : ""}>
                                {sign.element}
                              </Badge>
                            </div>
                          </div>

                          {selectedZodiac === sign.name && (
                            <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded border border-purple-100 shadow-sm">{sign.description}</p>

                              <div>
                                <h5 className="font-bold text-purple-800 mb-2 text-xs uppercase tracking-wider">Özellikler</h5>
                                <div className="flex flex-wrap gap-1.5">
                                  {sign.traits.map((trait, index) => (
                                    <Badge key={index} variant="secondary" className="bg-white border border-purple-100 text-purple-700 text-xs">
                                      {trait}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                                  <h5 className="font-bold text-pink-800 mb-1">Uyumlu Burçlar:</h5>
                                  <p className="text-pink-700 text-xs">{sign.compatibility?.join(", ") || ""}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                  <h5 className="font-bold text-amber-800 mb-1">Şanslı Sayılar:</h5>
                                  <p className="text-amber-700 text-xs">{sign.luckyNumbers?.join(", ") || ""}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hadisler Tab */}
          {/* Hadisler Tab */}
          <TabsContent value="hadith" className="space-y-6 text-left">
            <Card className="border-indigo-200 shadow-lg bg-white">
              <CardHeader className="bg-white border-b border-indigo-100">
                <CardTitle className="flex items-center gap-3 text-2xl text-indigo-900 font-bold">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Quote className="w-6 h-6 text-indigo-600" />
                  </div>
                  Kapsamlı Hadis Arşivi
                  {isUpdating && <div className="animate-spin ml-2 text-indigo-500">🔄</div>}
                </CardTitle>
                <CardDescription className="text-indigo-700/80 font-medium text-base">
                  Hz. Muhammed (SAV)'in hadisleri ve açıklamaları - Günlük otomatik güncelleme ({dynamicHadiths.length} hadis)
                </CardDescription>
                {updateStatus && (
                  <div className="mt-2 p-3 bg-blue-100 border border-blue-200 rounded-lg animate-pulse">
                    <p className="text-sm text-blue-800 font-bold">{updateStatus}</p>
                  </div>
                )}
                {lastUpdateTime && (
                  <div className="mt-2 text-xs text-indigo-400 font-medium">
                    Son güncelleme: {new Date(lastUpdateTime).toLocaleDateString('tr-TR')} {new Date(lastUpdateTime).toLocaleTimeString('tr-TR')}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                    <Input
                      placeholder="Hadislerde ara (örn: Namaz, Sabır)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200 h-12 text-lg"
                    />
                  </div>
                  <Button
                    onClick={updateIslamicContent}
                    disabled={isUpdating}
                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all h-12 px-6"
                  >
                    {isUpdating ? (
                      <>🔄 Güncelleniyor...</>
                    ) : (
                      <>🔄 İçeriği Yenile</>
                    )}
                  </Button>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {filteredHadiths.map((hadith) => (
                      <Card key={hadith.id} className="border-l-[6px] border-l-indigo-500 border-t border-r border-b border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">{hadith.category}</Badge>
                              <Badge variant="outline" className="text-gray-700 text-xs">{hadith.narrator}</Badge>
                            </div>

                            <div className="text-right bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50">
                              <p className="text-2xl font-arabic leading-[2.2] text-gray-800 dir-rtl">{hadith.arabic}</p>
                            </div>

                            <div>
                              <p className="font-bold text-gray-800 text-lg leading-relaxed">
                                <span className="text-indigo-500 text-2xl mr-2">❝</span>
                                {hadith.translation}
                                <span className="text-indigo-500 text-2xl ml-2">❞</span>
                              </p>
                            </div>

                            <Separator className="bg-indigo-50" />

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-sm text-indigo-900 border border-blue-100 flex gap-3">
                              <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                              <p>{hadith.explanation}</p>
                            </div>

                            <div className="text-xs font-bold text-indigo-400 text-right">
                              Kaynak: {hadith.source} - {hadith.bookNumber}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sünnetler Tab */}
          {/* Sünnetler Tab */}
          <TabsContent value="sunnah" className="space-y-6 text-left">
            <Card className="border-rose-200 shadow-lg bg-white">
              <CardHeader className="bg-white border-b border-rose-100">
                <CardTitle className="flex items-center gap-3 text-2xl text-rose-900 font-bold">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Heart className="w-6 h-6 text-rose-600" />
                  </div>
                  Kapsamlı Sünnet Arşivi
                  {isUpdating && <div className="animate-spin ml-2 text-rose-500">🔄</div>}
                </CardTitle>
                <CardDescription className="text-rose-700/80 font-medium text-base">
                  Hz. Muhammed (SAV)'in uyguladığı günlük sünnetler ve adablar ({dynamicSunnahs.length} sünnet)
                </CardDescription>
                {updateStatus && (
                  <div className="mt-2 p-3 bg-green-100 border border-green-200 rounded-lg animate-pulse">
                    <p className="text-sm text-green-800 font-bold">{updateStatus}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={updateIslamicContent}
                    disabled={isUpdating}
                    className="font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                  >
                    {isUpdating ? <>🔄 Güncelleniyor...</> : <>🔄 İçeriği Yenile</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {displaySunnahs.map((sunnah) => (
                    <Card key={sunnah.id} className="border-l-4 border-l-rose-500 shadow-md hover:shadow-xl transition-all duration-300 group bg-white hover:border-l-8">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 font-bold px-3">
                              ✨ Sünnet
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                              {sunnah.subcategory}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-rose-700 transition-colors">{sunnah.title}</h3>
                        </div>

                        <p className="text-gray-800 font-medium mb-4 flex-grow">{sunnah.description}</p>

                        <div className="space-y-3 text-sm mb-4">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700"><strong className="text-rose-700">Zaman:</strong> {sunnah.time}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700"><strong className="text-emerald-700">Fazilet:</strong> {sunnah.reward}</span>
                          </div>
                        </div>

                        {sunnah.details && (
                          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 mb-4">
                            <h4 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wider">Detaylar:</h4>
                            <ul className="grid grid-cols-1 gap-1">
                              {sunnah.details.map((detail, index) => (
                                <li key={index} className="text-xs text-gray-700 flex items-center gap-1">
                                  <div className="w-1 h-1 rounded-full bg-amber-400"></div> {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <p className="text-sm italic text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Book className="w-3 h-3 inline mr-1 text-gray-400" /> "{sunnah.evidence}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manevi İlimler Tab */}
          {/* Manevi İlimler Tab */}
          <TabsContent value="sciences" className="space-y-6 text-left">
            <Card className="border-violet-200 shadow-lg bg-white">
              <CardHeader className="bg-white border-b border-violet-100">
                <CardTitle className="flex items-center gap-3 text-2xl text-violet-900 font-bold">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Lightbulb className="w-6 h-6 text-violet-600" />
                  </div>
                  Manevi İlimler
                </CardTitle>
                <CardDescription className="text-violet-700/80 text-base">
                  İslami ilimler ve ruhsal gelişim alanları
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {displaySpiritualSciences.map((science) => (
                    <Card key={science.id} className="border-l-[6px] border-l-violet-500 hover:shadow-lg transition-all duration-300 group shadow-md">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-bold text-violet-900 group-hover:text-violet-700">{science.title}</h3>
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200">İlim</Badge>
                          </div>

                          <p className="text-gray-700 font-medium leading-relaxed">{science.description}</p>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Konular:</h4>
                            <div className="flex flex-wrap gap-2">
                              {science.topics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="bg-white border border-gray-200 text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="bg-violet-50 p-4 rounded-lg border border-violet-100/50">
                            <h4 className="font-bold text-violet-800 mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" /> Önemi:
                            </h4>
                            <p className="text-sm text-violet-700 leading-relaxed font-medium">{science.importance}</p>
                          </div>

                          <div className="pt-2">
                            <h4 className="font-bold text-gray-800 mb-2 text-xs uppercase tracking-wider">Önemli Âlimler:</h4>
                            <div className="flex flex-wrap gap-2">
                              {science.scholars.map((scholar, index) => (
                                <Badge key={index} variant="outline" className="border-violet-200 text-violet-700 bg-violet-50/50">
                                  {scholar}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zikir Takibi Tab */}
          {/* Zikir Takibi Tab */}
          <TabsContent value="dhikr" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-orange-200 shadow-lg bg-white">
                <CardHeader className="bg-white border-b border-orange-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-orange-900 text-xl font-bold">
                    <Volume2 className="w-6 h-6 text-orange-600" />
                    Günlük Zikir Sayacı
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {dhikrCounts.map((dhikr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-orange-100 rounded-xl hover:bg-orange-50/50 transition-colors shadow-sm bg-white"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg">{dhikr.name}</p>
                        <p className="text-sm text-orange-600/80 italic mb-2">{dhikr.meaning}</p>
                        <Progress
                          value={(dhikr.current / dhikr.target) * 100}
                          className="h-2 bg-orange-100 [&>div]:bg-orange-500"
                        />
                        <p className="text-xs text-gray-700 mt-1 font-medium text-right">
                          {dhikr.current} / {dhikr.target}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4 bg-orange-50 p-2 rounded-lg border border-orange-100">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateDhikr(index, false)}
                          className="h-8 w-8 border-orange-200 text-orange-700 hover:bg-orange-200 hover:text-orange-900"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-bold text-xl text-orange-800 font-mono">
                          {dhikr.current}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateDhikr(index, true)}
                          className="h-8 w-8 border-orange-200 text-orange-700 hover:bg-orange-200 hover:text-orange-900 bg-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex space-x-3 mt-4 pt-4 border-t border-orange-100">
                    <Button onClick={resetDhikr} variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                      Sıfırla
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md"
                      onClick={completeDailyDhikr}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Günlük Tamamla
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 shadow-lg">
                <CardHeader className="bg-orange-50 border-b border-orange-100 rounded-t-lg">
                  <CardTitle className="text-orange-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                    Zikir Rehberi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5" /> Zikrin Adabı
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-2 font-medium">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Temiz bir yerde ve abdestli olarak yapın</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Kıbleye dönük oturun</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Kalbinizle ve zihninizle yapın</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Zikrini tesbihle sayın</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Düzenli ve istikrarlı devam edin</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-700">Zikir Faydaları:</h4>
                    <div className="grid gap-3">
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-red-100 rounded-full"><Heart className="w-5 h-5 text-red-500" /></div>
                        <span className="text-sm font-medium text-gray-700">Kalp huzuru ve manevi tatmin</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-yellow-100 rounded-full"><Star className="w-5 h-5 text-yellow-600" /></div>
                        <span className="text-sm font-medium text-gray-700">Ruhsal yükseliş ve dereceler</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-green-100 rounded-full"><Trophy className="w-5 h-5 text-green-600" /></div>
                        <span className="text-sm font-medium text-gray-700">Büyük sevap kazanımı</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-blue-100 rounded-full"><Moon className="w-5 h-5 text-blue-600" /></div>
                        <span className="text-sm font-medium text-gray-700">İç huzur ve stresin azalması</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anlamlı Sözler Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <Card className="border-pink-200 shadow-lg bg-white">
              <CardHeader className="bg-white border-b border-pink-100 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-pink-900 text-xl font-bold">
                  <MessageCircle className="w-6 h-6 text-pink-600" />
                  Anlamlı Sözler ve Hikmetler
                </CardTitle>
                <CardDescription className="text-pink-700/80">
                  İslam büyüklerinden manevi sözler ve hikmetler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-wrap gap-2 justify-center pb-4 border-b border-gray-100">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                    className={selectedCategory === "all" ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
                  >
                    Tümü
                  </Button>
                  {Array.from(new Set(displayQuotes.map(q => q.category))).map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-pink-600 hover:bg-pink-700 text-white" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {filteredQuotes.map((quote) => (
                    <Card key={quote.id} className="border-l-4 border-l-pink-500 hover:shadow-lg transition-all duration-300 group bg-white border-t border-r border-b border-gray-100 cursor-default">
                      <CardContent className="p-6 flex flex-col h-full justify-between">
                        <div className="space-y-4">
                          <div className="flex justify-center mb-2">
                            <Quote className="w-8 h-8 text-pink-200 rotate-180" />
                          </div>
                          <blockquote className="text-xl font-medium italic text-center text-gray-800 leading-relaxed font-serif">
                            "{quote.text}"
                          </blockquote>
                          <div className="flex justify-center mt-2">
                            <Quote className="w-8 h-8 text-pink-200" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                          <p className="font-bold text-pink-700 text-lg flex items-center gap-2">
                            <div className="w-8 h-[2px] bg-pink-300"></div> {quote.author}
                          </p>
                          <Badge variant="secondary" className="bg-pink-50 text-pink-700 border border-pink-100">
                            {quote.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manevi Günlük Tab */}
          <TabsContent value="diary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-200 shadow-lg bg-white text-left">
                <CardHeader className="bg-white border-b border-blue-100 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-blue-900 text-xl font-bold">
                    <Heart className="w-6 h-6 text-blue-600" />
                    Dua Talebi Oluştur
                  </CardTitle>
                  <CardDescription className="text-blue-700/80">
                    Manevi ailenizden sizin için dua etmelerini isteyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-blue-800 font-bold mb-2 block">Dua Başlığı</Label>
                      <Input
                        placeholder="Örn: Sınav başarısı için, Şifa talebi vb."
                        value={duaForm.title}
                        onChange={(e) => setDuaForm(prev => ({ ...prev, title: e.target.value }))}
                        className="border-blue-200"
                      />
                    </div>
                    <div>
                      <Label className="text-blue-800 font-bold mb-2 block">Dua İçeriği</Label>
                      <Textarea
                        placeholder="Niyetinizi ve özel dua isteğinizi buraya yazın..."
                        value={duaForm.content}
                        onChange={(e) => setDuaForm(prev => ({ ...prev, content: e.target.value }))}
                        className="min-h-[120px] border-blue-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-blue-800 font-bold mb-2 block">Hedef Katılımcı</Label>
                        <Input
                          type="number"
                          value={duaForm.targetCount}
                          onChange={(e) => setDuaForm(prev => ({ ...prev, targetCount: parseInt(e.target.value) }))}
                          className="border-blue-200"
                        />
                      </div>
                      <div>
                        <Label className="text-blue-800 font-bold mb-2 block">Kategori</Label>
                        <select
                          className="w-full p-2 border border-blue-200 rounded-md outline-none"
                          value={duaForm.category}
                          onChange={(e) => setDuaForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="Genel">Genel</option>
                          <option value="Şifa">Şifa</option>
                          <option value="Rızık">Rızık</option>
                          <option value="Başarı">Başarı</option>
                          <option value="Hidayet">Hidayet</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 shadow-md transition-all transform hover:-translate-y-1"
                    onClick={handleCreateDua}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Dua Talebini Paylaş
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-blue-200 shadow-md bg-white text-left">
                <CardHeader className="bg-white border-b border-blue-100 rounded-t-lg">
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Dua Kardeşliği Akışı
                  </CardTitle>
                  <CardDescription>Manevi ailenizdeki dua taleplerine katılın</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {isDuaLoading ? (
                        <div className="text-center py-10 text-slate-400">Yükleniyor...</div>
                      ) : duaRequests.length === 0 ? (
                        <div className="text-center text-slate-700 py-8">
                          <Heart className="w-12 h-12 mx-auto mb-3 text-blue-200" />
                          <p>Henüz aktif bir dua talebi yok.</p>
                        </div>
                      ) : (
                        duaRequests.map((dua) => (
                          <div key={dua.id} className="p-4 border border-blue-100 rounded-xl hover:bg-blue-50/50 transition-colors shadow-sm bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none mb-2">{dua.category}</Badge>
                                <h4 className="font-bold text-blue-900 text-lg">{dua.title}</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Katılım</span>
                                <p className="text-lg font-black text-blue-600">{dua.participantCount}{dua.targetCount > 0 ? ` / ${dua.targetCount}` : ''}</p>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
                              {dua.content}
                            </p>
                            
                            {dua.targetCount > 0 && (
                              <div className="w-full bg-blue-50 h-1.5 rounded-full mb-4">
                                <div 
                                  className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                                  style={{ width: `${Math.min(100, (dua.participantCount / dua.targetCount) * 100)}%` }}
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(dua.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                              <Button 
                                size="sm" 
                                variant={dua.participants?.includes(localStorage.getItem('userId')) ? "secondary" : "default"}
                                onClick={() => handleJoinDua(dua.id)}
                                className="h-8 gap-2"
                                disabled={dua.participants?.includes(localStorage.getItem('userId'))}
                              >
                                <Heart className={`w-3.5 h-3.5 ${dua.participants?.includes(localStorage.getItem('userId')) ? "fill-current" : ""}`} />
                                {dua.participants?.includes(localStorage.getItem('userId')) ? "Katıldınız" : "Amin De (Katıl)"}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <SystemPresentation open={isPresentationOpen} onOpenChange={setIsPresentationOpen} referralCode={user?.referralCode} />
      </div>

      {/* Quran Page Modal */}
      <Dialog open={showQuranPageModal} onOpenChange={setShowQuranPageModal}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-2 sm:p-6">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Kur'an-ı Kerim - Sayfa {currentPage}
            </DialogTitle>
            <DialogDescription className="text-center text-sm font-medium text-slate-500">
              Mushaf-ı Şerif {currentPage}. sayfa • Hatim İlerlemesi: %{hatmProgress}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 mt-4">
            {/* Quran Image Area */}
            <div className="flex-1 bg-slate-50 rounded-xl border-2 border-primary/20 p-2 flex flex-col items-center justify-center overflow-hidden">
              {currentQuranPageImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-auto scrollbar-hide">
                  <img
                    src={currentQuranPageImage}
                    alt={`Kur'an Sayfa ${currentPage}`}
                    className="max-h-full w-auto object-contain rounded shadow-2xl transition-all hover:scale-[1.02]"
                    onContextMenu={(e) => e.preventDefault()}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes("everyayah.com")) {
                        img.src = `https://quran.com/assets/images/pages/page${String(currentPage).padStart(3, '0')}.png`;
                      } else if (!img.src.includes("placeholder")) {
                        img.src = "https://via.placeholder.com/600x800?text=Sayfa+Yüklenemedi";
                      }
                    }}
                  />
                  <div className="absolute bottom-4 right-4 bg-primary/90 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                    Sayfa {currentPage}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-600 font-bold">Sayfa Yükleniyor...</p>
                </div>
              )}
            </div>

            {/* Translation Area */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <Card className="flex-1 flex flex-col border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-primary/5 py-3 px-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Türkçe Meali (Diyanet)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-full max-h-[300px] lg:max-h-full">
                    <div className="p-4 space-y-4">
                      {isTranslationLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500 font-medium">Meal Yükleniyor...</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                          {pageTranslation || "Meal bulunamadı. Lütfen daha sonra tekrar deneyiniz."}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button
                  variant="outline"
                  className="font-bold border-2"
                  onClick={() => {
                    if (currentPage > 1) showQuranPage(currentPage - 1);
                  }}
                  disabled={currentPage <= 1}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Önceki
                </Button>
                <Button
                  className="font-bold shadow-md"
                  onClick={() => {
                    if (currentPage < 604) showQuranPage(currentPage + 1);
                  }}
                  disabled={currentPage >= 604}
                >
                  Sonraki
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowQuranPageModal(false)}
            >
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
