import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InterviewQACard, { type InterviewQA } from "@/components/interview/InterviewQACard";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase, Brain, Trophy, Sparkles, Lock, GraduationCap,
  Loader2, ChevronRight, Star, Globe, ArrowRight,
} from "lucide-react";

const INDUSTRY_KEYS = [
  "indTechnology", "indFinance", "indHealthcare", "indEducation",
  "indManufacturing", "indHospitality", "indLogistics",
  "indRetail", "indMarketing", "indConsulting",
  "indGovernment", "indEnergy", "indOther",
];

const EXPERIENCE_KEYS = [
  { value: "0", key: "exp01" },
  { value: "2", key: "exp23" },
  { value: "4", key: "exp45" },
  { value: "6", key: "exp610" },
  { value: "10", key: "exp10plus" },
];

const LANGUAGE_KEYS = [
  { id: "English", key: "langEnglish" },
  { id: "Arabic", key: "langArabic" },
  { id: "Korean", key: "langKorean" },
  { id: "Chinese", key: "langChinese" },
  { id: "Japanese", key: "langJapanese" },
  { id: "French", key: "langFrench" },
  { id: "Spanish", key: "langSpanish" },
  { id: "Hindi", key: "langHindi" },
  { id: "Malay", key: "langMalay" },
  { id: "Turkish", key: "langTurkish" },
];

export default function KoreanInterviewPage() {
  const { t } = useLanguage();
  useSEO({
    title: "Korean Interview Training — AI-Powered | Klovers",
    description: "Practice Korean job interview questions with AI-generated personalized Q&A. Get 2 free questions, upgrade for more.",
    canonical: "https://kloversegy.com/interview-training",
  });

  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Auth
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Form
  const [jobTitle, setJobTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("2");
  const [industry, setIndustry] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["English"]);

  // Session & results
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQA[]>([]);
  const [freeRemaining, setFreeRemaining] = useState(2);
  const [paidRemaining, setPaidRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"none" | "pending" | "paid">("none");

  // UI
  const [generating, setGenerating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle payment return
  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    const returnSessionId = searchParams.get("session_id");

    if (paymentResult === "success" && returnSessionId) {
      setSessionId(returnSessionId);
      toast({ title: t("koreanInterviewPage.toastPayTitle"), description: t("koreanInterviewPage.toastPayDesc") });
      // Poll for payment confirmation then generate
      const pollPayment = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data } = await supabase
            .from("interview_training_sessions" as any)
            .select("*")
            .eq("id", returnSessionId)
            .single();
          if (data && (data as any).payment_status === "paid") {
            setPaymentStatus("paid");
            setPaidRemaining(5);
            setQuestions((data as any).questions || []);
            // Generate the paid questions
            generateQuestions(returnSessionId, 5);
            return;
          }
        }
        toast({ title: t("koreanInterviewPage.toastPayProcTitle"), description: t("koreanInterviewPage.toastPayProcDesc"), variant: "destructive" });
      };
      pollPayment();
    } else if (paymentResult === "canceled") {
      toast({ title: t("koreanInterviewPage.toastPayCancelTitle"), description: t("koreanInterviewPage.toastPayCancelDesc") });
    }
  }, [searchParams]);

  // Load existing session on auth
  useEffect(() => {
    if (!user) return;
    const loadSession = async () => {
      const { data } = await supabase
        .from("interview_training_sessions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const s = data as any;
        setSessionId(s.id);
        setQuestions(s.questions || []);
        setJobTitle(s.job_title || "");
        setIndustry(s.industry || "");
        setYearsExperience(String(s.years_experience || 2));
        setSelectedLangs(s.languages_spoken?.length ? s.languages_spoken : ["English"]);
        setPaymentStatus(s.payment_status || "none");
        setFreeRemaining(Math.max(0, 2 - (s.free_used || 0)));
        setPaidRemaining(Math.max(0, (s.paid_purchased || 0) - Math.max(0, (s.questions?.length || 0) - 2)));
      }
    };
    loadSession();
  }, [user]);

  const generateQuestions = async (sid?: string, count = 2) => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setShowLoginDialog(true); return; }

      const res = await supabase.functions.invoke("generate-korean-interview", {
        body: {
          job_title: jobTitle,
          years_experience: Number(yearsExperience),
          industry,
          languages_spoken: selectedLangs,
          count,
          session_id: sid || sessionId,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      setSessionId(data.session_id);
      setQuestions(data.questions || []);
      setFreeRemaining(data.free_remaining ?? 0);
      setPaidRemaining(data.paid_remaining ?? 0);

      if (data.quota_reached && !sid) {
        toast({ title: t("koreanInterviewPage.toastQuotaTitle"), description: t("koreanInterviewPage.toastQuotaDesc") });
      }
    } catch (e: any) {
      toast({ title: t("koreanInterviewPage.toastGenFail"), description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (!jobTitle.trim()) {
      toast({ title: t("koreanInterviewPage.toastJobRequiredTitle"), description: t("koreanInterviewPage.toastJobRequiredDesc") });
      return;
    }
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    generateQuestions();
  };

  const handlePurchase = async () => {
    if (!sessionId || !user) return;
    setPurchasing(true);
    try {
      const res = await supabase.functions.invoke("create-interview-checkout", {
        body: { session_id: sessionId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      toast({ title: t("koreanInterviewPage.toastCheckoutFail"), description: e.message, variant: "destructive" });
    } finally {
      setPurchasing(false);
    }
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const totalUnlocked = questions.filter((_, i) => i < 2 || paymentStatus === "paid").length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main>
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden bg-secondary text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-8xl font-bold rotate-12">면접</div>
            <div className="absolute bottom-10 right-10 text-8xl font-bold -rotate-12">준비</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-bold opacity-50">합격</div>
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-white/30 text-sm">{t("koreanInterviewPage.heroBadgeAI")}</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-sm">{t("koreanInterviewPage.heroBadgeKo")}</Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t("koreanInterviewPage.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              {t("koreanInterviewPage.heroSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#skill-form" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:bg-[#E6E600] transition-colors">
                <Sparkles className="h-5 w-5" /> {t("koreanInterviewPage.heroCtaStart")}
              </a>
              <Link
                to="/practice-interview"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <GraduationCap className="h-5 w-5" /> {t("koreanInterviewPage.heroCtaDemo")}
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">{t("koreanInterviewPage.howTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: t("koreanInterviewPage.step1Title"), desc: t("koreanInterviewPage.step1Desc") },
              { icon: Brain, title: t("koreanInterviewPage.step2Title"), desc: t("koreanInterviewPage.step2Desc") },
              { icon: Trophy, title: t("koreanInterviewPage.step3Title"), desc: t("koreanInterviewPage.step3Desc") },
            ].map((step) => (
              <Card key={step.title} className="rounded-xl text-center">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Skill Input Form ── */}
        <section id="skill-form" className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> {t("koreanInterviewPage.formTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">{t("koreanInterviewPage.jobTitleLabel")}</Label>
                  <Input
                    id="jobTitle"
                    placeholder={t("koreanInterviewPage.jobTitlePlaceholder")}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("koreanInterviewPage.experienceLabel")}</Label>
                    <Select value={yearsExperience} onValueChange={setYearsExperience}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_KEYS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{t(`koreanInterviewPage.${opt.key}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("koreanInterviewPage.industryLabel")}</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("koreanInterviewPage.industryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_KEYS.map((ind) => (
                          <SelectItem key={ind} value={ind}>{t(`koreanInterviewPage.${ind}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("koreanInterviewPage.languagesLabel")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_KEYS.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => toggleLang(lang.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedLangs.includes(lang.id)
                            ? "bg-muted border-border text-foreground dark:bg-secondary dark:border-border dark:text-secondary-foreground"
                            : "bg-white border-gray-200 text-gray-600 hover:border-border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {t(`koreanInterviewPage.${lang.key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full gap-2 text-white h-12 text-base"
                >
                  {generating ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> {t("koreanInterviewPage.btnGenerating")}</>
                  ) : questions.length > 0 ? (
                    <><Sparkles className="h-5 w-5" /> {t("koreanInterviewPage.btnGenerateMore")}</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> {t("koreanInterviewPage.btnGenerate")}</>
                  )}
                </Button>
                {!user && !authLoading && (
                  <p className="text-xs text-center text-muted-foreground">
                    {t("koreanInterviewPage.authNotice")} <Link to="/login?redirect=/interview-training" className="text-primary underline">{t("koreanInterviewPage.authSignIn")}</Link>{t("koreanInterviewPage.authOr")}<Link to="/signup?redirect=/interview-training" className="text-primary underline">{t("koreanInterviewPage.authCreate")}</Link>{t("koreanInterviewPage.authPeriod")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Results Area ── */}
        {questions.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 py-16">
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-bold">{t("koreanInterviewPage.resultsTitle")}</h2>
              <div className="flex items-center gap-3">
                <Progress value={(totalUnlocked / Math.max(totalQuestions, 7)) * 100} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {totalUnlocked} / {Math.max(totalQuestions, 7)} {t("koreanInterviewPage.resultsUnlocked")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((qa, i) => (
                <InterviewQACard
                  key={qa.id}
                  qa={qa}
                  index={i}
                  locked={i >= 2 && paymentStatus !== "paid"}
                />
              ))}

              {/* Placeholder locked cards if less than 7 */}
              {questions.length < 7 && paymentStatus !== "paid" && (
                Array.from({ length: 7 - questions.length }).map((_, i) => (
                  <Card key={`placeholder-${i}`} className="rounded-xl relative overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">Q{questions.length + i + 1}</Badge>
                      </div>
                      <div className="space-y-3 blur-sm select-none pointer-events-none">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted/70 rounded w-1/2" />
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="h-4 bg-muted rounded w-full mb-2" />
                          <div className="h-3 bg-muted/70 rounded w-2/3" />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Lock className="h-8 w-8" />
                          <span className="text-sm font-medium">{t("koreanInterviewPage.unlockFor5")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Upgrade Prompt */}
            {paymentStatus !== "paid" && questions.length >= 2 && (
              <Card className="rounded-2xl mt-8 border-2 border-border bg-muted/50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="text-lg font-bold">{t("koreanInterviewPage.upgradeTitle")}</h3>
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("koreanInterviewPage.upgradeDesc")}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-foreground">{t("koreanInterviewPage.upgradePrice")}</span>
                    <span className="text-sm text-muted-foreground">{t("koreanInterviewPage.upgradeOneTime")}</span>
                  </div>
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="gap-2 text-white px-8 h-12 text-base"
                  >
                    {purchasing ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> {t("koreanInterviewPage.upgradeProcessing")}</>
                    ) : (
                      <><Lock className="h-5 w-5" /> {t("koreanInterviewPage.upgradeBtn")}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* ── Demo Teacher Section ── */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
            <GraduationCap className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold">{t("koreanInterviewPage.demoTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("koreanInterviewPage.demoDesc")}
            </p>
            <Link to="/practice-interview">
              <Button variant="outline" className="gap-2">
                <GraduationCap className="h-4 w-4" /> {t("koreanInterviewPage.demoBtn")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Trust Signals ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Brain, label: t("koreanInterviewPage.trustAI"), desc: t("koreanInterviewPage.trustAIDesc") },
              { icon: Globe, label: t("koreanInterviewPage.trustBilingual"), desc: t("koreanInterviewPage.trustBilingualDesc") },
              { icon: Trophy, label: t("koreanInterviewPage.trustReady"), desc: t("koreanInterviewPage.trustReadyDesc") },
              { icon: Star, label: t("koreanInterviewPage.trustStudents"), desc: t("koreanInterviewPage.trustStudentsDesc") },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <item.icon className="h-8 w-8 mx-auto text-primary" />
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("koreanInterviewPage.loginDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("koreanInterviewPage.loginDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Link to="/login?redirect=/interview-training">
              <Button className="w-full gap-2">
                <ChevronRight className="h-4 w-4" /> {t("koreanInterviewPage.loginDialogSignIn")}
              </Button>
            </Link>
            <Link to="/signup?redirect=/interview-training">
              <Button variant="outline" className="w-full gap-2">
                {t("koreanInterviewPage.loginDialogCreate")}
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
