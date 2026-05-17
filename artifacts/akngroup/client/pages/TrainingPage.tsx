import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle,
  Award,
  Home,
  Download,
  Share2,
  BookMarked,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TrainingModule, TrainingPage as TrainingPageType } from "@shared/training-content";
import { sadakaTrainingContent, tradeTrainingContent, zakahTrainingContent } from "@shared/training-content";

interface TrainingProgress {
  moduleId: string;
  currentPage: number;
  completedPages: number[];
  startedAt: string;
  completedAt?: string;
  totalTimeSpent: number;
}

export default function TrainingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const moduleId = searchParams.get('module') || 'sadaka-training';
  const pageParam = searchParams.get('page');

  const getModuleContent = (id: string) => {
    switch (id) {
      case 'trade-training': return tradeTrainingContent;
      case 'zakat-training': return zakahTrainingContent;
      case 'sadaka-training':
      default: return sadakaTrainingContent;
    }
  };

  const [currentModule, setCurrentModule] = useState<TrainingModule>(getModuleContent(moduleId));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [progress, setProgress] = useState<TrainingProgress>({
    moduleId: moduleId,
    currentPage: 1,
    completedPages: [],
    startedAt: new Date().toISOString(),
    totalTimeSpent: 0
  });
  const [startTime, setStartTime] = useState(Date.now());
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setCurrentModule(getModuleContent(moduleId));
  }, [moduleId]);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`training_progress_${moduleId}`);
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setProgress(parsed);
      setCurrentPageIndex(parsed.currentPage - 1);
    } else {
      // Reset for new module if no progress found
      setProgress({
        moduleId: moduleId,
        currentPage: 1,
        completedPages: [],
        startedAt: new Date().toISOString(),
        totalTimeSpent: 0
      });
      setCurrentPageIndex(0);
    }

    // Set initial page from URL parameter
    if (pageParam) {
      const pageIndex = parseInt(pageParam) - 1;
      if (pageIndex >= 0 && pageIndex < currentModule.pages.length) {
        setCurrentPageIndex(pageIndex);
      }
    }

    setStartTime(Date.now());
  }, [moduleId, pageParam]);

  useEffect(() => {
    // Save progress to localStorage whenever it changes
    localStorage.setItem(`training_progress_${moduleId}`, JSON.stringify(progress));
  }, [progress, moduleId]);

  useEffect(() => {
    // Update URL when page changes
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', (currentPageIndex + 1).toString());
    navigate(`/training?${newSearchParams.toString()}`, { replace: true });

    // Update progress
    setProgress(prev => ({
      ...prev,
      currentPage: currentPageIndex + 1
    }));
  }, [currentPageIndex]);

  const currentPage = currentModule.pages[currentPageIndex];
  const progressPercentage = ((progress.completedPages.length / currentModule.totalPages) * 100);

  const markPageCompleted = () => {
    const timeSpent = Date.now() - startTime;
    const pageNumber = currentPageIndex + 1;

    if (!progress.completedPages.includes(pageNumber)) {
      setProgress(prev => ({
        ...prev,
        completedPages: [...prev.completedPages, pageNumber],
        totalTimeSpent: prev.totalTimeSpent + timeSpent
      }));

      toast({
        title: "Sayfa Tamamlandı! ✅",
        description: `${pageNumber}. sayfa başarıyla tamamlandı.`,
      });

      // Check if all pages completed
      if (progress.completedPages.length + 1 === currentModule.totalPages) {
        setProgress(prev => ({
          ...prev,
          completedAt: new Date().toISOString()
        }));
        setShowCompleted(true);

        toast({
          title: "🎉 Eğitim Tamamlandı!",
          description: "Tebrikler! Tüm eğitimi başarıyla tamamladınız.",
        });
      }
    }

    setStartTime(Date.now());
  };

  const nextPage = () => {
    if (currentPageIndex < currentModule.pages.length - 1) {
      markPageCompleted();
      setCurrentPageIndex(prev => prev + 1);
    } else {
      markPageCompleted();
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      setStartTime(Date.now());
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < currentModule.pages.length) {
      setCurrentPageIndex(pageIndex);
      setStartTime(Date.now());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60000);
    const secs = Math.floor((seconds % 60000) / 1000);
    return `${mins}d ${secs}s`;
  };

  const shareProgress = () => {
    const shareText = `${currentModule.title} eğitiminde %${Math.round(progressPercentage)} ilerleme kaydettim! 📚✨`;
    if (navigator.share) {
      navigator.share({
        title: 'Eğitim İlerlemem',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText + ' ' + window.location.href);
      toast({
        title: "Paylaşım Bağlantısı Kopyalandı",
        description: "Bağlantı panoya kopyalandı!",
      });
    }
  };

  if (showCompleted) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-green-700 mb-4">
                🎉 Tebrikler! Eğitimi Tamamladınız!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{currentModule.totalPages}</div>
                  <div className="text-sm text-green-600">Sayfa Tamamlandı</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700">{formatTime(progress.totalTimeSpent)}</div>
                  <div className="text-sm text-blue-600">Toplam Süre</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700">%100</div>
                  <div className="text-sm text-purple-600">Tamamlanma</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">📜 Sertifika</h3>
                <p className="text-orange-700 mb-4">
                  "{currentModule.title}" eğitimini başarıyla tamamladınız.
                  Bu eğitimde öğrendiğiniz bilgileri hayatınızda uygulayarak hem dünya hem ahiret kazancınıza vesile olun.
                </p>
                <p className="text-sm text-orange-600 italic">
                  "Her öğrenilen bilgi, Allah'ın rızasına vesile olan bir sadakadır."
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Ana Sayfaya Dön
                </Button>
                <Button
                  onClick={shareProgress}
                  variant="outline"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Başarımı Paylaş
                </Button>
                <Button
                  onClick={() => setShowCompleted(false)}
                  variant="outline"
                  size="lg"
                >
                  <BookMarked className="w-5 h-5 mr-2" />
                  Eğitimi Tekrar Gözden Geçir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <div>
                <h1 className="font-semibold text-lg">{currentModule.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Sayfa {currentPageIndex + 1} / {currentModule.totalPages}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {currentModule.estimatedTime}
              </Badge>
              <div className="text-sm text-muted-foreground">
                %{Math.round(progressPercentage)} Tamamlandı
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Page Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  İçindekiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {currentModule.pages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => goToPage(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all text-sm ${index === currentPageIndex
                      ? 'bg-primary text-primary-foreground'
                      : progress.completedPages.includes(index + 1)
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'hover:bg-muted'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{index + 1}. {page.title}</span>
                      {progress.completedPages.includes(index + 1) && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="min-h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {currentPageIndex + 1}. {currentPage.title}
                  </CardTitle>
                  <Badge
                    variant={progress.completedPages.includes(currentPageIndex + 1) ? "default" : "secondary"}
                    className="bg-green-500 text-white"
                  >
                    {progress.completedPages.includes(currentPageIndex + 1) ? "Tamamlandı" : "Devam Ediyor"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Main Content */}
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {currentPage.content}
                  </div>
                </div>

                {/* Verses Section */}
                {currentPage.verses && currentPage.verses.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      📖 Kuran-ı Kerim Ayetleri
                    </h3>
                    {currentPage.verses.map((verse, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="text-right text-xl mb-3 text-green-900 font-arabic">
                          {verse.arabic}
                        </div>
                        <div className="text-green-700 mb-2 italic">
                          "{verse.turkish}"
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          - {verse.source}
                        </div>
                        {index < currentPage.verses!.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Hadiths Section */}
                {currentPage.hadiths && currentPage.hadiths.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      📚 Hadis-i Şerifler
                    </h3>
                    {currentPage.hadiths.map((hadith, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        {hadith.arabic && (
                          <div className="text-right text-lg mb-3 text-blue-900 font-arabic">
                            {hadith.arabic}
                          </div>
                        )}
                        <div className="text-blue-700 mb-2 italic">
                          "{hadith.turkish}"
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          - {hadith.source}
                        </div>
                        {index < currentPage.hadiths!.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Points Section */}
                {currentPage.keyPoints && currentPage.keyPoints.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                      ⭐ Önemli Noktalar
                    </h3>
                    <ul className="space-y-2">
                      {currentPage.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start text-orange-700">
                          <span className="text-orange-500 mr-2 mt-1">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevPage}
                    disabled={currentPageIndex === 0}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Önceki Sayfa
                  </Button>

                  <div className="flex items-center space-x-4">
                    <Button onClick={shareProgress} variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Paylaş
                    </Button>
                    {!progress.completedPages.includes(currentPageIndex + 1) && (
                      <Button onClick={markPageCompleted} variant="outline">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Tamamlandı Olarak İşaretle
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={nextPage}
                    className="flex items-center bg-gradient-to-r from-primary to-spiritual-purple"
                  >
                    {currentPageIndex === currentModule.pages.length - 1 ? 'Eğitimi Tamamla' : 'Sonraki Sayfa'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
