import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PLACEMENT_QUESTIONS, SPEAKING_PROMPTS, LISTENING_EXAM, READING_EXAM, computePlacementResult, STUDY_ROADMAPS, type PlacementResult } from "@/constants/placementQuestions";
import { useSpeech } from "@/hooks/useSpeech";
import { drawPlacementCard, drawPlacementCertificate } from "@/lib/canvasRenderer";
import { SITE_URL, WHATSAPP_NUMBER } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { CheckCircle, ArrowRight, ArrowLeft, BookOpen, Gamepad2, Users, SkipForward, Undo2, ClipboardList, ChevronDown, ChevronUp, TrendingUp, Share2, RefreshCw, Timer, Download, MapPin, Volume2, Square, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const QUESTIONS_PER_PAGE = 6;
const TOTAL_PAGES = Math.ceil(PLACEMENT_QUESTIONS.length / QUESTIONS_PER_PAGE);
const STORAGE_KEY = "klovers_placement_draft_v2"; // v2: 30 questions (6 per band)

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// Keys match levelKey values returned by computePlacementResult
const LEVEL_META: Record<string, { emoji: string; tagline: string; description: string; nextLabel?: string; prevLabel?: string }> = {
  hangul: { emoji: "🌱", tagline: "Absolute Beginner", description: "You're just starting out. Our Foundation class will teach you Hangul, basic greetings, and everyday words.", nextLabel: "Level 1" },
  l1:    { emoji: "🌿", tagline: "Beginner (A1)", description: "You know the basics. Our Level 1 class builds simple sentences, numbers, and daily conversations.", nextLabel: "Level 2", prevLabel: "Foundation" },
  l2:    { emoji: "📚", tagline: "Elementary (A2)", description: "You can handle simple exchanges. Our Level 2 class covers grammar patterns and real-life dialogues.", nextLabel: "Level 3–4", prevLabel: "Level 1" },
  l3:    { emoji: "🎯", tagline: "Intermediate (B1–B2)", description: "You're comfortable in Korean. Our Level 3–4 class dives into nuanced grammar and natural speech.", nextLabel: "Level 5–6", prevLabel: "Level 2" },
  l5:    { emoji: "🏆", tagline: "Advanced (C1–C2)", description: "You speak Korean fluently. Our Level 5–6 class polishes academic and professional Korean for TOPIK II.", prevLabel: "Level 3–4" },
};

const LEVEL_META_AR: Record<string, { emoji: string; tagline: string; description: string; nextLabel?: string; prevLabel?: string }> = {
  hangul: { emoji: "🌱", tagline: "مبتدئ تماماً", description: "أنت في البداية. صفنا التأسيسي سيعلمك الهانغول والتحيات الأساسية والكلمات اليومية.", nextLabel: "مستوى 1" },
  l1:    { emoji: "🌿", tagline: "مبتدئ (A1)", description: "تعرف الأساسيات. صفنا مستوى 1 يبني جملاً بسيطة وأرقاماً ومحادثات يومية.", nextLabel: "مستوى 2", prevLabel: "تأسيس" },
  l2:    { emoji: "📚", tagline: "ابتدائي (A2)", description: "تستطيع التعامل مع المحادثات البسيطة. صفنا مستوى 2 يغطي أنماط القواعد والحوارات الواقعية.", nextLabel: "مستوى 3–4", prevLabel: "مستوى 1" },
  l3:    { emoji: "🎯", tagline: "متوسط (B1–B2)", description: "أنت مرتاح مع الكورية. صفنا مستوى 3–4 يتعمق في القواعد المتقدمة والكلام الطبيعي.", nextLabel: "مستوى 5–6", prevLabel: "مستوى 2" },
  l5:    { emoji: "🏆", tagline: "متقدم (C1–C2)", description: "تتحدث الكورية بطلاقة. صفنا مستوى 5–6 يصقل الكورية الأكاديمية والمهنية لـ TOPIK II.", prevLabel: "مستوى 3–4" },
};

// Plan recommendation — group classes for low/mid levels (peer practice + affordability),
// private 1-on-1 for advanced learners where personalised attention pays off.
type RecommendedPlan = {
  name: string;
  nameAr: string;
  format: string;
  formatAr: string;
  bullets: string[];
  bulletsAr: string[];
};

const RECOMMENDED_PLANS: Record<string, RecommendedPlan> = {
  hangul: {
    name: "Foundation Group Class",
    nameAr: "صف التأسيس الجماعي",
    format: "Small group · 4–8 students · Twice a week",
    formatAr: "مجموعة صغيرة · ٤–٨ طلاب · مرتين أسبوعياً",
    bullets: ["Master Hangul in 2 weeks", "Build everyday phrases with peers", "Most affordable plan"],
    bulletsAr: ["أتقن الهانغول في أسبوعين", "ابنِ الجمل اليومية مع زملائك", "الخطة الأكثر اقتصاداً"],
  },
  l1: {
    name: "Level 1 Group Class",
    nameAr: "صف المستوى الأول الجماعي",
    format: "Small group · 4–8 students · Twice a week",
    formatAr: "مجموعة صغيرة · ٤–٨ طلاب · مرتين أسبوعياً",
    bullets: ["Daily conversations & numbers", "Practice speaking with peers", "Great value for beginners"],
    bulletsAr: ["محادثات يومية وأرقام", "تدرّب على المحادثة مع الزملاء", "قيمة ممتازة للمبتدئين"],
  },
  l2: {
    name: "Level 2 Group Class",
    nameAr: "صف المستوى الثاني الجماعي",
    format: "Small group · 4–8 students · Twice a week",
    formatAr: "مجموعة صغيرة · ٤–٨ طلاب · مرتين أسبوعياً",
    bullets: ["Grammar patterns for real conversations", "K-drama listening practice", "Prep for TOPIK I"],
    bulletsAr: ["أنماط القواعد للمحادثات الحقيقية", "تمارين استماع من الدراما", "التحضير لـ TOPIK I"],
  },
  l3: {
    name: "Level 3–4 Group Class",
    nameAr: "صف المستوى ٣–٤ الجماعي",
    format: "Small group · 4–6 students · Twice a week",
    formatAr: "مجموعة صغيرة · ٤–٦ طلاب · مرتين أسبوعياً",
    bullets: ["Nuanced grammar & natural speech", "Discuss K-dramas in Korean", "TOPIK II prep track"],
    bulletsAr: ["قواعد متقدمة وكلام طبيعي", "ناقش الدراما بالكورية", "مسار التحضير لـ TOPIK II"],
  },
  l5: {
    name: "Private 1-on-1 Class",
    nameAr: "صف خاص فردي",
    format: "Private · Flexible schedule · Personalised",
    formatAr: "خاص · جدول مرن · مخصص لك",
    bullets: ["Tailored to your goals (TOPIK / business / academic)", "Native teacher, all feedback on you", "Fastest progress at this level"],
    bulletsAr: ["مخصص لأهدافك (TOPIK / أعمال / أكاديمي)", "معلم أصلي، كل التركيز عليك", "أسرع تقدم في هذا المستوى"],
  },
};

const SECTION_BANNERS: Record<number, { label: string; hint: string }> = {
  0: { label: "Foundation", hint: "Hangul, core vocabulary, reading passages & speaking basics" },
  1: { label: "TOPIK 1 — A1 Beginner", hint: "Grammar particles, reading sentences & spoken expressions" },
  2: { label: "TOPIK 2 — A2 Elementary", hint: "Connectors, reading passages & spoken grammar forms" },
  3: { label: "TOPIK 3–4 — B1/B2 Intermediate", hint: "Advanced grammar, reading comprehension & natural speech" },
  4: { label: "TOPIK 5–6 — C1/C2 Advanced", hint: "Nuanced grammar, academic reading & formal speech" },
};

const SECTION_BANNERS_AR: Record<number, { label: string; hint: string }> = {
  0: { label: "تأسيس", hint: "الهانغول، المفردات الأساسية، نصوص القراءة وأساسيات المحادثة" },
  1: { label: "TOPIK 1 — مبتدئ A1", hint: "جسيمات القواعد، قراءة الجمل والتعبيرات المنطوقة" },
  2: { label: "TOPIK 2 — ابتدائي A2", hint: "الروابط، نصوص القراءة وأشكال القواعد المنطوقة" },
  3: { label: "TOPIK 3–4 — متوسط B1/B2", hint: "القواعد المتقدمة، فهم القراءة والكلام الطبيعي" },
  4: { label: "TOPIK 5–6 — متقدم C1/C2", hint: "القواعد الدقيقة، القراءة الأكاديمية والكلام الرسمي" },
};

const BAND_LABELS = ["Foundation", "TOPIK 1", "TOPIK 2", "TOPIK 3–4", "TOPIK 5–6"];
const BAND_LABELS_AR = ["تأسيس", "TOPIK 1", "TOPIK 2", "TOPIK 3–4", "TOPIK 5–6"];

const JOURNEY_MESSAGES: Record<string, string> = {
  hangul: "Most Foundation students reach Level 1 in just 8 weeks with Klovers",
  l1:    "Most Level 1 students reach Level 2 in 12 weeks with Klovers",
  l2:    "Most Level 2 students reach Level 3–4 in 20 weeks with Klovers",
  l3:    "Advanced fluency typically takes 6–12 more months of focused practice",
  l5:    "You're already advanced — refine your Korean for TOPIK 5–6 certification",
};

const JOURNEY_MESSAGES_AR: Record<string, string> = {
  hangul: "معظم طلاب التأسيس يصلون للمستوى 1 في 8 أسابيع فقط مع Klovers",
  l1:    "معظم طلاب المستوى 1 يصلون للمستوى 2 في 12 أسبوعاً مع Klovers",
  l2:    "معظم طلاب المستوى 2 يصلون للمستوى 3–4 في 20 أسبوعاً مع Klovers",
  l3:    "الطلاقة المتقدمة تستغرق عادة 6–12 شهراً إضافية من التمرين المركز",
  l5:    "أنت متقدم بالفعل — صقّل كوريتك لشهادة TOPIK 5–6",
};

const SOCIAL_PROOF: Record<string, { quote: string; author: string }> = {
  hangul: { quote: "Starting from zero was scary, but Klovers made Hangul so easy. Best decision I made!", author: "Yasmine H., Alexandria" },
  l1:    { quote: "I could hold basic conversations in Korean after just 8 weeks. The classes are amazing!", author: "Ahmed K., Cairo" },
  l2:    { quote: "My pronunciation improved so much — my K-drama friends say I sound like a native now.", author: "Nour M., Cairo" },
  l3:    { quote: "I passed TOPIK II after studying with Klovers for 6 months. Highly recommend!", author: "Sara L., Giza" },
  l5:    { quote: "The advanced class helped me land a job at a Korean company in Egypt. Life-changing!", author: "Omar F., Cairo" },
};

const SOCIAL_PROOF_AR: Record<string, { quote: string; author: string }> = {
  hangul: { quote: "البدء من الصفر كان مخيفاً، لكن Klovers جعلت الهانغول سهلاً جداً. أفضل قرار اتخذته!", author: "ياسمين ح.، الإسكندرية" },
  l1:    { quote: "استطعت إجراء محادثات بسيطة بالكورية بعد 8 أسابيع فقط. الحصص مذهلة!", author: "أحمد ك.، القاهرة" },
  l2:    { quote: "نطقي تحسن كثيراً — أصدقائي يقولون أنني أبدو كأهل اللغة الآن.", author: "نور م.، القاهرة" },
  l3:    { quote: "اجتزت TOPIK II بعد الدراسة مع Klovers لمدة 6 أشهر. أنصح بشدة!", author: "سارة ل.، الجيزة" },
  l5:    { quote: "الصف المتقدم ساعدني في الحصول على وظيفة في شركة كورية في مصر. غيّر حياتي!", author: "عمر ف.، القاهرة" },
};

function subTestSummary(correct: number, total: number, skill: string, isAr = false): string {
  const pct = correct / total;
  if (isAr) {
    if (pct >= 0.8) return `فهم ${skill} ممتاز في هذا المستوى!`;
    if (pct >= 0.6) return `مهارات ${skill} جيدة — واصل التمرين للوصول للطلاقة الكاملة.`;
    return `فهم ${skill} يحتاج لمزيد من العمل — التمرين المركز سيساعد.`;
  }
  if (pct >= 0.8) return `Excellent ${skill} comprehension at this level!`;
  if (pct >= 0.6) return `Good ${skill} skills — keep practising for full fluency.`;
  return `${skill} comprehension needs more work — targeted practice will help.`;
}

function speakingSummary(ratings: (0 | 1 | 2)[], levelKey: string, isAr = false): string {
  const score = ratings.reduce((a, b) => a + b, 0);
  const label = levelKey.replace("_", " ");
  if (isAr) {
    if (score >= 8) return `ممتاز! كوريتك المنطوقة تتوافق مع تصنيفك ${label}.`;
    if (score >= 5) return "جهد جيد! واصل تمرين المحادثة بجانب القراءة والقواعد.";
    return "كوريتك المنطوقة تحتاج لمزيد من التمرين — فكّر في البدء بمستوى أقل.";
  }
  if (score >= 8) return `Excellent! Your spoken Korean matches your ${label} placement.`;
  if (score >= 5) return "Good effort! Keep practising speaking alongside your reading and grammar.";
  return "Your spoken Korean needs more practice — consider starting 1 level below your MCQ result.";
}

const PlacementTestPage = () => {
  useSEO({ title: "Korean Placement Test", description: "Take the free Klovers Korean placement test. Discover your level and find the perfect course for your learning journey.", canonical: "https://kloversegy.com/placement-test" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { speakKorean, isSpeaking, cancel: cancelSpeech } = useSpeech();
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"test" | "review" | "result" | "speaking_test" | "listening_test" | "reading_test">("test");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [focusedQId, setFocusedQId] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(() => localStorage.getItem("klovers_autoadvance") === "true");
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  // Listening exam state
  const [listeningIndex, setListeningIndex] = useState(0);
  const [listeningAnswers, setListeningAnswers] = useState<(number | null)[]>([]);
  const [listeningSelected, setListeningSelected] = useState<number | null>(null);
  const [listeningConfirmed, setListeningConfirmed] = useState(false);
  // Reading exam state
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<(number | null)[]>([]);
  const [readingSelected, setReadingSelected] = useState<number | null>(null);
  const [readingConfirmed, setReadingConfirmed] = useState(false);
  // Speaking assessment state
  const [speakingIndex, setSpeakingIndex] = useState(0);
  const [speakingRatings, setSpeakingRatings] = useState<(0 | 1 | 2)[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const skippedRef      = useRef(skipped);
  const autoAdvanceRef  = useRef(autoAdvance);
  const startTimeRef    = useRef<number | null>(null);
  const finalTimeRef    = useRef(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { logLeadEvent({ source_type: "placement_test", cta_label: "test_started" }); }, []);
  useEffect(() => { skippedRef.current = skipped; }, [skipped]);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
  // Cleanup advance timer when page or phase changes
  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, [page, phase]);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "placement-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Free Korean Language Placement Test",
      "description": "Take the free Klovers Korean placement test to discover your level from A1 beginner to C2 advanced and find the perfect course.",
      "url": "https://kloversegy.com/placement-test",
      "provider": { "@id": "https://kloversegy.com/#organization" },
      "educationalAlignment": {
        "@type": "AlignmentObject",
        "educationalFramework": "TOPIK",
        "targetName": "Korean Language Proficiency"
      }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("placement-schema")?.remove(); };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);
    };
    checkAuth();
  }, []);

  // Restore saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { answers: a, skipped: s, page: p, elapsed: e } = JSON.parse(saved);
      if (a && Object.keys(a).length > 0) {
        setAnswers(a);
        setSkipped(new Set(s ?? []));
        setPage(p ?? 0);
        setElapsedSeconds(e ?? 0);
        if (e) startTimeRef.current = Date.now() - e * 1000;
        toast({ title: isAr ? "تم استئناف الاختبار" : "Test resumed", description: isAr ? "تم استعادة تقدمك السابق." : "Your previous progress has been restored." });
      }
    } catch { /* ignore */ }
    localStorage.removeItem("klovers_placement_draft"); // clear old v1 key
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist progress to localStorage as user answers
  useEffect(() => {
    if (phase !== "test") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        skipped: [...skipped],
        page,
        elapsed: elapsedSeconds,
      }));
    } catch { /* ignore */ }
    localStorage.removeItem("klovers_placement_draft"); // clear old v1 key
  }, [answers, skipped, page, elapsedSeconds, phase]);

  // Tick elapsed timer (starts on first answer)
  useEffect(() => {
    if (phase !== "test") return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null)
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const currentQuestions = PLACEMENT_QUESTIONS.slice(
    page * QUESTIONS_PER_PAGE,
    (page + 1) * QUESTIONS_PER_PAGE
  );

  const totalAnswered  = Object.keys(answers).length;
  const totalSkipped   = skipped.size;
  const totalDone      = totalAnswered + totalSkipped;
  const totalRemaining = PLACEMENT_QUESTIONS.length - totalDone;
  const progressPercent = (totalDone / PLACEMENT_QUESTIONS.length) * 100;

  // Auto-focus first unanswered question when page changes
  useEffect(() => {
    const first = currentQuestions.find(q => !skippedRef.current.has(q.id) && answers[q.id] === undefined);
    setFocusedQId(first?.id ?? currentQuestions[0]?.id ?? null);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: 1-4 to answer focused question, then advance focus
  useEffect(() => {
    if (phase !== "test") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (focusedQId === null) return;
      const digit = parseInt(e.key);
      if (isNaN(digit) || digit < 1 || digit > 4) return;
      const q = PLACEMENT_QUESTIONS.find(q => q.id === focusedQId);
      if (!q || skippedRef.current.has(q.id) || digit > q.options.length) return;
      e.preventDefault();
      startTimer();
      setAnswers(prev => ({ ...prev, [focusedQId]: digit - 1 }));
      const idx = currentQuestions.findIndex(cq => cq.id === focusedQId);
      const next = currentQuestions.slice(idx + 1).find(cq => !skippedRef.current.has(cq.id));
      if (next) setFocusedQId(next.id);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedQId, phase, currentQuestions]);

  const startTimer = () => { if (!startTimeRef.current) startTimeRef.current = Date.now(); };

  const handleSkip = (id: number) => {
    startTimer();
    setAnswers((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setSkipped((prev) => new Set(prev).add(id));
  };

  const handleUnskip = (id: number) => {
    setSkipped((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleSubmit = async () => {
    if (totalAnswered === 0) {
      toast({ title: isAr ? "أجب على سؤال واحد على الأقل قبل الإرسال." : "Answer at least one question before submitting.", variant: "destructive" });
      return;
    }
    finalTimeRef.current = elapsedSeconds;
    localStorage.removeItem(STORAGE_KEY);
    const res = computePlacementResult(answers);
    // Always show result immediately — save to Supabase in background if logged in
    setResult(res);
    setPhase("result");
    track.custom("placement_recommendation_shown", { level: res.levelKey, score: res.score });
    logLeadEvent({ source_type: "placement", cta_label: "recommendation_shown", metadata: { level: res.levelKey, score: res.score } });
    if (userId) {
      setSubmitting(true);
      const { error } = await supabase.from("placement_tests").insert({
        user_id: userId, score: res.score, level: res.levelKey,
      });
      if (!error) {
        // Placement result is a machine-computed canonical key → store in
        // course_level_key. The free-form self-assessment column (profiles.level)
        // is left untouched so any user-reported label the learner set stays intact.
        await supabase.from("profiles").update({ course_level_key: res.levelKey } as any).eq("user_id", userId);
      }
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({}); setSkipped(new Set()); setPage(0);
    setFocusedQId(null); setResult(null); setShowExplanations(false); setShowRoadmap(false);
    setLeadSaved(false); setLeadName(""); setLeadEmail("");
    setElapsedSeconds(0); startTimeRef.current = null; finalTimeRef.current = 0;
    setPhase("test");
  };

  const handleShare = (res: PlacementResult) => {
    const text = `I scored ${res.score}/30 on the Klovers Korean Placement Test!\nMy level: ${res.levelLabel}\nFind yours → ${SITE_URL}/placement-test`;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: isAr ? "تم النسخ!" : "Copied to clipboard!", description: isAr ? "شارك مستواك مع أصدقائك." : "Share your level with friends." }))
      .catch(() => toast({ title: `${SITE_URL}/placement-test`, description: isAr ? "انسخ الرابط لمشاركة نتيجتك." : "Copy the link to share your result." }));
  };

  const handleWhatsApp = (res: PlacementResult) => {
    const text = encodeURIComponent(`I scored ${res.score}/30 on the Klovers Korean Placement Test! 🇰🇷\nMy level: ${res.levelLabel}\nTake the free test: ${SITE_URL}/placement-test`);
    trackAndOpenWhatsApp(`https://wa.me/?text=${text}`, { cta_label: "placement_share", metadata: { level: res.levelKey, score: res.score } });
  };

  const handleDownloadCard = (res: PlacementResult) => {
    const meta = LEVEL_META[res.levelKey] ?? { emoji: "🎓", tagline: "Korean Learner" };
    const canvas = document.createElement("canvas");
    drawPlacementCard(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: res.levelLabel,
      tagline: meta.tagline,
      score: res.score,
      total: PLACEMENT_QUESTIONS.length,
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-${res.levelKey}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل البطاقة!" : "Card downloaded!", description: isAr ? "شارك مستواك على مواقع التواصل." : "Share your level on social media." });
  };

  const handleWhatsAppEnroll = (res: PlacementResult) => {
    const text = encodeURIComponent(`مرحباً! أنهيت اختبار تحديد المستوى وحصلت على ${res.score}/30. مستواي: ${res.levelLabel}. هل يمكنني الحجز؟`);
    trackAndOpenWhatsApp(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, { cta_label: "placement_enroll", metadata: { level: res.levelKey, score: res.score } });
  };

  const handleDownloadCertificate = (res: PlacementResult) => {
    const meta = LEVEL_META[res.levelKey] ?? { emoji: "🎓", tagline: "Korean Learner" };
    const canvas = document.createElement("canvas");
    drawPlacementCertificate(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: res.levelLabel,
      tagline: meta.tagline,
      score: res.score,
      total: PLACEMENT_QUESTIONS.length,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-certificate-${res.levelKey}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل الشهادة!" : "Certificate downloaded!", description: isAr ? "شارك إنجازك على LinkedIn أو سيرتك الذاتية." : "Share your achievement on LinkedIn or CV." });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordingUrl(null);
    } catch {
      toast({ title: isAr ? "تم رفض الوصول للميكروفون" : "Microphone access denied", description: isAr ? "فعّل الوصول للميكروفون لتسجيل نفسك." : "Enable microphone access to record yourself.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSpeakingRate = (rating: 0 | 1 | 2) => {
    const next = [...speakingRatings, rating];
    setSpeakingRatings(next);
    setRecordingUrl(null);
    cancelSpeech();
    if (speakingIndex + 1 < 5) {
      setSpeakingIndex(i => i + 1);
    } else {
      setPhase("result");
    }
  };

  const advanceListening = (chosen: number) => {
    const next = [...listeningAnswers, chosen];
    setListeningAnswers(next);
    setListeningConfirmed(true);
    setTimeout(() => {
      if (listeningIndex + 1 < 5) {
        setListeningIndex(i => i + 1);
        setListeningSelected(null);
        setListeningConfirmed(false);
        cancelSpeech();
      } else {
        setPhase("result");
        setListeningSelected(null);
        setListeningConfirmed(false);
        cancelSpeech();
      }
    }, 1500);
  };

  const advanceReading = (chosen: number) => {
    const next = [...readingAnswers, chosen];
    setReadingAnswers(next);
    setReadingConfirmed(true);
    setTimeout(() => {
      if (readingIndex + 1 < 5) {
        setReadingIndex(i => i + 1);
        setReadingSelected(null);
        setReadingConfirmed(false);
      } else {
        setPhase("result");
        setReadingSelected(null);
        setReadingConfirmed(false);
      }
    }, 1500);
  };

  const handleLeadSubmit = async () => {
    if (!leadName.trim() || !leadEmail.trim()) {
      toast({ title: isAr ? "يرجى إدخال اسمك وبريدك الإلكتروني." : "Please enter your name and email.", variant: "destructive" }); return;
    }
    setLeadSaving(true);
    await supabase.from("leads").insert({
      name: leadName.trim(),
      email: leadEmail.trim(),
      level: result?.levelKey ?? "",
      source: "placement_test",
      status: "new",
    });
    setLeadSaving(false);
    setLeadSaved(true);
  };

  const toggleAutoAdvance = (val: boolean) => {
    setAutoAdvance(val);
    localStorage.setItem("klovers_autoadvance", String(val));
  };

  // ── Review screen ──────────────────────────────────────────
  if (phase === "review") {
    const statusOf = (id: number) =>
      skipped.has(id) ? "skipped" : answers[id] !== undefined ? "answered" : "unanswered";

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">{isAr ? "مراجعة إجاباتك" : "Review Your Answers"}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{isAr ? "اضغط على أي سؤال للعودة وتغييره." : "Click any question to go back and change it."}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mb-6 text-sm flex-wrap">
            <span className="flex items-center gap-1.5 bg-green-500/10 text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> {isAr ? `${totalAnswered} تمت الإجابة` : `${totalAnswered} answered`}
            </span>
            {totalSkipped > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> {isAr ? `${totalSkipped} تم التخطي` : `${totalSkipped} skipped`}
              </span>
            )}
            {totalRemaining > 0 && (
              <span className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" /> {isAr ? `${totalRemaining} لم يُحاول` : `${totalRemaining} not attempted`}
              </span>
            )}
          </div>

          {/* Question grid — grouped by TOPIK band */}
          <Card className="mb-6">
            <CardContent className="pt-5 pb-5">
              {(isAr ? BAND_LABELS_AR : BAND_LABELS).map((band, bi) => {
                const bandQs = PLACEMENT_QUESTIONS.slice(bi * 6, bi * 6 + 6);
                return (
                  <div key={band} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{band}</p>
                    <div className="grid grid-cols-6 gap-2">
                      {bandQs.map(q => {
                        const st = statusOf(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => { setPage(Math.floor(PLACEMENT_QUESTIONS.findIndex(pq => pq.id === q.id) / QUESTIONS_PER_PAGE)); setPhase("test"); }}
                            className={[
                              "rounded-lg border text-sm font-semibold py-2.5 transition-colors",
                              st === "answered"   ? "bg-green-500/15 border-green-500/30 text-green-800 dark:text-green-300 hover:bg-green-500/25" : "",
                              st === "skipped"    ? "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25" : "",
                              st === "unanswered" ? "bg-muted/60 border-border text-muted-foreground hover:bg-muted" : "",
                            ].join(" ")}
                          >
                            Q{q.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setPhase("test")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {isAr ? "العودة للاختبار" : "Back to Test"}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || totalAnswered === 0}>
              {submitting ? (isAr ? "جارٍ الإرسال..." : "Submitting…") : (isAr ? "إرسال الاختبار" : "Submit Test")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Listening exam screen ───────────────────────────────────
  if (phase === "listening_test" && result) {
    const questions = LISTENING_EXAM[result.levelKey] ?? LISTENING_EXAM["hangul"];
    const q = questions[listeningIndex];
    const isLast = listeningIndex === questions.length - 1;
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-10 max-w-xl mx-auto w-full space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "اختبار الاستماع" : "Listening Exam"}</p>
            <h1 className="text-xl font-bold">{isAr ? `السؤال ${listeningIndex + 1} من ${questions.length}` : `Question ${listeningIndex + 1} of ${questions.length}`}</h1>
            <Progress value={(listeningIndex / questions.length) * 100} className="h-1.5 mt-2" />
          </div>

          <Card>
            <CardContent className="pt-6 pb-6 space-y-5">
              {/* Audio prompt */}
              <div className="flex flex-col items-center gap-3 bg-primary/5 rounded-xl border border-primary/15 py-5 px-4">
                <p className="text-xs text-muted-foreground text-center">{isAr ? "استمع للصوت الكوري ثم أجب أدناه" : "Listen to the Korean audio, then answer below"}</p>
                <Button
                  className="gap-2"
                  variant="outline"
                  onClick={() => isSpeaking ? cancelSpeech() : speakKorean(q.audio!)}
                >
                  {isSpeaking
                    ? <><Square className="h-4 w-4" /> {isAr ? "إيقاف" : "Stop"}</>
                    : <><Volume2 className="h-4 w-4" /> {isAr ? "تشغيل الصوت" : "Play Audio"}</>}
                </Button>
              </div>

              {/* Question */}
              <p className="font-semibold text-sm">{q.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  let cls = "w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ";
                  if (!listeningConfirmed) {
                    cls += listeningSelected === i
                      ? "bg-primary/10 border-primary text-foreground font-medium"
                      : "border-border hover:bg-muted/60";
                  } else {
                    if (i === q.correctIndex) cls += "bg-green-500/10 border-green-500/50 text-green-800 dark:text-green-300 font-medium";
                    else if (i === listeningSelected && listeningSelected !== q.correctIndex) cls += "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300 line-through";
                    else cls += "border-border text-muted-foreground";
                  }
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={listeningConfirmed}
                      onClick={() => setListeningSelected(i)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (revealed after confirm) */}
              {listeningConfirmed && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                  {q.explanation}
                </p>
              )}

              {/* Confirm / Next */}
              {!listeningConfirmed ? (
                <Button
                  className="w-full"
                  disabled={listeningSelected === null}
                  onClick={() => listeningSelected !== null && advanceListening(listeningSelected)}
                >
                  {isLast ? (isAr ? "إنهاء اختبار الاستماع" : "Finish Listening Exam") : (isAr ? "تأكيد الإجابة" : "Confirm Answer")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  {isLast ? (isAr ? "جارٍ العودة للنتائج..." : "Returning to results…") : (isAr ? "جارٍ تحميل السؤال التالي..." : "Next question loading…")}
                </p>
              )}
            </CardContent>
          </Card>

          <button
            className="w-full text-xs text-muted-foreground hover:underline"
            onClick={() => { cancelSpeech(); setPhase("result"); }}
          >
            {isAr ? "تخطي اختبار الاستماع ← العودة للنتيجة" : "Skip listening exam → back to result"}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Reading exam screen ──────────────────────────────────────
  if (phase === "reading_test" && result) {
    const questions = READING_EXAM[result.levelKey] ?? READING_EXAM["hangul"];
    const q = questions[readingIndex];
    const isLast = readingIndex === questions.length - 1;
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-10 max-w-xl mx-auto w-full space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "اختبار القراءة" : "Reading Exam"}</p>
            <h1 className="text-xl font-bold">{isAr ? `السؤال ${readingIndex + 1} من ${questions.length}` : `Question ${readingIndex + 1} of ${questions.length}`}</h1>
            <Progress value={(readingIndex / questions.length) * 100} className="h-1.5 mt-2" />
          </div>

          <Card>
            <CardContent className="pt-6 pb-6 space-y-5">
              {/* Passage */}
              <div className="bg-muted/50 border-l-4 border-primary/40 rounded-r-lg px-4 py-3 text-sm leading-relaxed text-foreground font-medium">
                {q.passage}
              </div>

              {/* Question */}
              <p className="font-semibold text-sm">{q.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  let cls = "w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ";
                  if (!readingConfirmed) {
                    cls += readingSelected === i
                      ? "bg-primary/10 border-primary text-foreground font-medium"
                      : "border-border hover:bg-muted/60";
                  } else {
                    if (i === q.correctIndex) cls += "bg-green-500/10 border-green-500/50 text-green-800 dark:text-green-300 font-medium";
                    else if (i === readingSelected && readingSelected !== q.correctIndex) cls += "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300 line-through";
                    else cls += "border-border text-muted-foreground";
                  }
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={readingConfirmed}
                      onClick={() => setReadingSelected(i)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {readingConfirmed && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                  {q.explanation}
                </p>
              )}

              {/* Confirm / Next */}
              {!readingConfirmed ? (
                <Button
                  className="w-full"
                  disabled={readingSelected === null}
                  onClick={() => readingSelected !== null && advanceReading(readingSelected)}
                >
                  {isLast ? (isAr ? "إنهاء اختبار القراءة" : "Finish Reading Exam") : (isAr ? "تأكيد الإجابة" : "Confirm Answer")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  {isLast ? (isAr ? "جارٍ العودة للنتائج..." : "Returning to results…") : (isAr ? "جارٍ تحميل السؤال التالي..." : "Next question loading…")}
                </p>
              )}
            </CardContent>
          </Card>

          <button
            className="w-full text-xs text-muted-foreground hover:underline"
            onClick={() => setPhase("result")}
          >
            {isAr ? "تخطي اختبار القراءة ← العودة للنتيجة" : "Skip reading exam → back to result"}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Speaking test screen ────────────────────────────────────
  if (phase === "speaking_test" && result) {
    const prompts = SPEAKING_PROMPTS[result.levelKey] ?? SPEAKING_PROMPTS["hangul"];
    const currentPrompt = prompts[speakingIndex];
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-10 max-w-xl mx-auto w-full space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{isAr ? "تقييم المحادثة" : "Speaking Assessment"}</p>
            <h1 className="text-xl font-bold">{isAr ? `التمرين ${speakingIndex + 1} من 5` : `Prompt ${speakingIndex + 1} of 5`}</h1>
            <Progress value={(speakingIndex / 5) * 100} className="h-1.5 mt-2" />
          </div>

          <Card>
            <CardContent className="pt-6 pb-6 space-y-5 text-center">
              {/* Korean phrase */}
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-wide leading-relaxed">{currentPrompt.korean}</p>
                <p className="text-xs text-muted-foreground font-mono">{currentPrompt.romanisation}</p>
              </div>

              {/* Hear model pronunciation */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => isSpeaking ? cancelSpeech() : speakKorean(currentPrompt.korean)}
              >
                {isSpeaking
                  ? <><Square className="h-3.5 w-3.5" /> {isAr ? "إيقاف" : "Stop"}</>
                  : <><Volume2 className="h-3.5 w-3.5" /> {isAr ? "استمع للنطق النموذجي" : "Hear model pronunciation"}</>}
              </Button>

              {/* Record yourself */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{isAr ? "قلها بنفسك ثم قيّم أداءك:" : "Say it yourself, then rate how you did:"}</p>
                {!isRecording && !recordingUrl && (
                  <Button variant="outline" className="w-full gap-2" onClick={startRecording}>
                    <Mic className="h-4 w-4" /> {isAr ? "سجّل نفسك (اختياري)" : "Record yourself (optional)"}
                  </Button>
                )}
                {isRecording && (
                  <Button variant="destructive" className="w-full gap-2 animate-pulse" onClick={stopRecording}>
                    <Square className="h-4 w-4" /> {isAr ? "إيقاف التسجيل" : "Stop recording"}
                  </Button>
                )}
                {recordingUrl && !isRecording && (
                  <audio controls src={recordingUrl} className="w-full h-10 mt-1" />
                )}
              </div>

              {/* Self-rating */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-500/30 bg-green-500/5 hover:bg-green-500/15 font-semibold"
                  onClick={() => handleSpeakingRate(2)}
                >
                  {isAr ? "✓ أتقنتها" : "✓ Nailed it"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 font-semibold"
                  onClick={() => handleSpeakingRate(1)}
                >
                  {isAr ? "～ تقريباً" : "～ Almost"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-500/30 bg-red-500/5 hover:bg-red-500/15 font-semibold"
                  onClick={() => handleSpeakingRate(0)}
                >
                  {isAr ? "✗ واجهت صعوبة" : "✗ Struggled"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <button
            className="w-full text-xs text-muted-foreground hover:underline"
            onClick={() => { cancelSpeech(); setPhase("result"); }}
          >
            {isAr ? "تخطي اختبار المحادثة ← العودة للنتيجة" : "Skip speaking test → go back to result"}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Result screen ───────────────────────────────────────────
  if (phase === "result" && result) {
    const meta = (isAr ? LEVEL_META_AR : LEVEL_META)[result.levelKey] ?? { emoji: "🎓", tagline: isAr ? "مستواك" : "Your Level", description: isAr ? "مستعد لبدء رحلتك الكورية؟" : "Ready to start your Korean journey?" };

    const confidenceChip = result.confidence === "solid"
      ? { label: isAr ? "تصنيف واثق" : "Confident placement", color: "bg-green-500/10 text-green-800 dark:text-green-300" }
      : result.confidence === "borderline-up"
      ? { label: isAr ? `قريب من ${meta.nextLabel ?? "المستوى التالي"}` : `Close to ${meta.nextLabel ?? "next level"}`, color: "bg-amber-500/10 text-amber-800 dark:text-amber-300" }
      : { label: isAr ? `على حافة ${meta.prevLabel ?? "المستوى السابق"}` : `On the edge of ${meta.prevLabel ?? "previous level"}`, color: "bg-amber-500/10 text-amber-800 dark:text-amber-300" };

    // Section breakdown (5 Vocab, 10 Grammar, 10 Reading, 5 Speaking)
    const sectionTotal = { Vocabulary: 5, Grammar: 10, Reading: 5, Listening: 5, Speaking: 5 };

    // Band breakdown (6 per band)
    const bandBreakdown = (isAr ? BAND_LABELS_AR : BAND_LABELS).map((band, bi) => {
      const qs = PLACEMENT_QUESTIONS.slice(bi * 6, bi * 6 + 6);
      const correct = qs.filter(q => answers[q.id] === q.correctIndex).length;
      return { band, correct, total: 6 };
    });

    // Per-question results for explanations
    const questionResults = PLACEMENT_QUESTIONS.map(q => ({
      q,
      userAnswer: answers[q.id],
      wasSkipped: skipped.has(q.id),
      isCorrect: answers[q.id] === q.correctIndex,
    }));

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 py-10 max-w-xl mx-auto w-full space-y-4">

          {/* Result hero */}
          <Card className="text-center overflow-hidden">
            <div className="bg-primary/10 py-8 px-6">
              <div className="text-6xl mb-3">{meta.emoji}</div>
              <div className="inline-block bg-primary text-primary-foreground text-xl font-bold px-5 py-2 rounded-full mb-2">
                {result.levelLabel}
              </div>
              <p className="text-sm font-semibold text-foreground mt-1">{meta.tagline}</p>
              <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${confidenceChip.color}`}>
                {confidenceChip.label}
              </span>
            </div>
            <CardContent className="pt-5 pb-6 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
              {(isAr ? JOURNEY_MESSAGES_AR : JOURNEY_MESSAGES)[result.levelKey] && (
                <p className="text-xs text-primary font-medium flex items-center gap-1.5 justify-center">
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  {(isAr ? JOURNEY_MESSAGES_AR : JOURNEY_MESSAGES)[result.levelKey]}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "النتيجة:" : "Score:"} <strong className="text-foreground">{result.score} / {PLACEMENT_QUESTIONS.length}</strong>
                </span>
                {finalTimeRef.current > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    {formatTime(finalTimeRef.current)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended plan — top-of-result conversion card */}
          {(() => {
            const plan = RECOMMENDED_PLANS[result.levelKey];
            if (!plan) return null;
            const planName = isAr ? plan.nameAr : plan.name;
            const planFormat = isAr ? plan.formatAr : plan.format;
            const bullets = isAr ? plan.bulletsAr : plan.bullets;
            return (
              <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    <span>✨</span>
                    {isAr ? "موصى به لك" : "Recommended for you"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">{planName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{planFormat}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-1 space-y-2">
                    <Button
                      size="lg"
                      className="w-full font-semibold"
                      onClick={() => {
                        track.custom("placement_recommendation_clicked", { level: result.levelKey, cta: "free_trial", plan: plan.name });
                        logLeadEvent({ source_type: "placement", cta_label: "recommendation_trial", metadata: { level: result.levelKey, plan: plan.name } });
                        navigate("/free-trial");
                      }}
                    >
                      {isAr ? "احجز تجربتي المجانية" : "Book My Free Trial"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <button
                      onClick={() => {
                        track.custom("placement_recommendation_clicked", { level: result.levelKey, cta: "see_pricing", plan: plan.name });
                        navigate("/pricing");
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {isAr ? "أو شاهد خطط الأسعار" : "Or see full pricing"}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {isAr ? "⭐️ +500 طالب مصري · استرداد كامل بعد أول حصة مدفوعة" : "⭐️ 500+ Egyptian students · full refund after first paid class"}
                  </p>
                </CardContent>
              </Card>
            );
          })()}

          {/* Performance breakdown */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isAr ? "تحليل الأداء" : "Performance breakdown"}
              </div>

              {/* By section */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isAr ? "حسب المهارة" : "By skill"}</p>
                {(["Vocabulary", "Grammar", "Reading", "Listening", "Speaking"] as const).map(sec => {
                  const skillLabels: Record<string, string> = isAr
                    ? { Vocabulary: "المفردات", Grammar: "القواعد", Reading: "القراءة", Listening: "الاستماع", Speaking: "المحادثة" }
                    : { Vocabulary: "Vocabulary", Grammar: "Grammar", Reading: "Reading", Listening: "Listening", Speaking: "Speaking" };
                  const correct = result.sectionScores[sec];
                  const total = sectionTotal[sec];
                  const pct = Math.round((correct / total) * 100);
                  return (
                    <div key={sec} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{skillLabels[sec]}</span>
                        <span className="text-muted-foreground">{correct} / {total}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weak area action card */}
              {(() => {
                const skillLabelsWeak: Record<string, string> = isAr
                  ? { Vocabulary: "المفردات", Grammar: "القواعد", Reading: "القراءة", Listening: "الاستماع", Speaking: "المحادثة" }
                  : { Vocabulary: "Vocabulary", Grammar: "Grammar", Reading: "Reading", Listening: "Listening", Speaking: "Speaking" };
                const weakest = (["Vocabulary", "Grammar", "Reading", "Listening", "Speaking"] as const)
                  .map(sec => ({ sec, pct: result.sectionScores[sec] / sectionTotal[sec] }))
                  .sort((a, b) => a.pct - b.pct)[0];
                if (!weakest || weakest.pct >= 0.7) return null;
                const tips: Record<string, { tip: string; link: string; label: string }> = isAr ? {
                  Vocabulary: { tip: "ابنِ مفرداتك الكورية بألعاب تفاعلية مجانية.", link: "/games", label: "العب ألعاب المفردات" },
                  Grammar:    { tip: "تدرّب على أنماط القواعد الكورية بتمارين موجّهة.", link: "/games", label: "تمارين القواعد" },
                  Reading:    { tip: "حسّن فهمك للقراءة مع مقالات مدونتنا.", link: "/blog", label: "اقرأ المقالات" },
                  Listening:  { tip: "درّب أذنك مع الحوارات الكورية والدراما والتمارين الصوتية.", link: "/games", label: "ألعاب الاستماع" },
                  Speaking:   { tip: "احجز حصة محادثة لتحسين كوريتك المنطوقة.", link: "/enroll", label: "احجز حصة محادثة" },
                } : {
                  Vocabulary: { tip: "Build your Korean vocabulary with free interactive games.", link: "/games", label: "Play vocab games" },
                  Grammar:    { tip: "Practise Korean grammar patterns with guided exercises.", link: "/games", label: "Grammar exercises" },
                  Reading:    { tip: "Improve your reading comprehension with our blog articles.", link: "/blog", label: "Read articles" },
                  Listening:  { tip: "Train your ear with Korean dialogues, K-dramas, and audio exercises.", link: "/games", label: "Listening games" },
                  Speaking:   { tip: "Book a conversation class to improve your spoken Korean.", link: "/enroll", label: "Book speaking class" },
                };
                const { tip, link, label } = tips[weakest.sec];
                return (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-1.5">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      ⚠️ {isAr ? `أضعف مهارة: ${skillLabelsWeak[weakest.sec]}` : `Your weakest area: ${weakest.sec}`} ({result.sectionScores[weakest.sec]}/{sectionTotal[weakest.sec]})
                    </p>
                    <p className="text-xs text-muted-foreground">{tip}</p>
                    <button
                      onClick={() => navigate(link)}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      {label} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })()}

              {/* By TOPIK band */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{isAr ? "حسب مستوى TOPIK" : "By TOPIK band"}</p>
                {bandBreakdown.map(({ band, correct, total }) => (
                  <div key={band} className="flex items-center gap-3 text-xs">
                    <span className="w-28 shrink-0 font-medium truncate">{band}</span>
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: total }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 flex-1 rounded-sm ${i < correct ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground w-8 text-right">{correct}/{total}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study roadmap */}
          {STUDY_ROADMAPS[result.levelKey] && (
            <Card>
              <CardContent className="pt-5 pb-5">
                <button
                  onClick={() => setShowRoadmap(v => !v)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {isAr ? "خطة دراستك لمدة 4 أسابيع" : "Your 4-week study roadmap"}
                  </span>
                  {showRoadmap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showRoadmap && (
                  <div className="mt-4 space-y-4">
                    {STUDY_ROADMAPS[result.levelKey].map((week) => (
                      <div key={week.week} className="border-t border-border pt-4 first:border-0 first:pt-0">
                        <p className="text-xs font-bold text-primary mb-1.5">{isAr ? `الأسبوع ${week.week}: ${week.title}` : `Week ${week.week}: ${week.title}`}</p>
                        <ul className="space-y-1">
                          {week.tasks.map((task, ti) => (
                            <li key={ti} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5 shrink-0">•</span>{task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-3">
              {/* Social proof block */}
              {(isAr ? SOCIAL_PROOF_AR : SOCIAL_PROOF)[result.levelKey] && (
                <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1.5 text-xs">
                  <div className="text-amber-500 tracking-widest text-sm">★★★★★</div>
                  <p className="text-foreground/80 italic leading-relaxed">"{(isAr ? SOCIAL_PROOF_AR : SOCIAL_PROOF)[result.levelKey].quote}"</p>
                  <p className="text-muted-foreground font-medium">— {(isAr ? SOCIAL_PROOF_AR : SOCIAL_PROOF)[result.levelKey].author}</p>
                  <p className="text-muted-foreground">{isAr ? "أكثر من 500 طالب مصري مسجل" : "500+ Egyptian students enrolled"}</p>
                </div>
              )}
              <p className="text-sm font-semibold text-foreground text-center">{isAr ? "مستعد لبدء التعلّم؟" : "Ready to start learning?"}</p>
              <div className="flex gap-2">
                <Button size="lg" className="flex-1" onClick={() => navigate("/enroll")}>
                  {isAr ? "📚 احجز حصة" : "📚 Book a Class"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={() => handleWhatsAppEnroll(result)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {isAr ? "واتساب" : "WhatsApp Us"}
                </Button>
              </div>
              {!userId && (
                <Button variant="outline" className="w-full" onClick={() => navigate("/signup")}>
                  {isAr ? "احفظ نتيجتي — سجّل مجاناً" : "Save My Result — Sign Up Free"}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => setLeadDialogOpen(true)}>
                  {isAr ? "📚 احصل على خطة دراسية مجانية" : "📚 Get free study plan"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleDownloadCard(result)}>
                  <Download className="h-3.5 w-3.5" /> {isAr ? "تحميل البطاقة" : "Download card"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleDownloadCertificate(result)}>
                  <Download className="h-3.5 w-3.5" /> {isAr ? "الشهادة" : "Certificate"}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { icon: <Users className="h-3.5 w-3.5" />, label: isAr ? "+500 طالب" : "500+ students" },
                  { icon: <BookOpen className="h-3.5 w-3.5" />, label: isAr ? "مستويات A1–C2" : "A1–C2 levels" },
                  { icon: <Gamepad2 className="h-3.5 w-3.5" />, label: isAr ? "13 لعبة مجانية" : "13 free games" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2 text-center">
                    <span className="text-muted-foreground">{icon}</span>
                    <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleShare(result)}>
                  <Share2 className="h-3.5 w-3.5" /> {isAr ? "نسخ النتيجة" : "Copy result"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleWhatsApp(result)}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {isAr ? "واتساب" : "WhatsApp"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={handleRetake}>
                  <RefreshCw className="h-3.5 w-3.5" /> {isAr ? "إعادة" : "Retake"}
                </Button>
              </div>
              {/* Sub-test CTAs */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">{isAr ? "تعمق في المهارات" : "Skill deep-dives"}</p>

                {/* Listening Exam */}
                {listeningAnswers.length === 0 ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setListeningIndex(0); setListeningAnswers([]);
                      setListeningSelected(null); setListeningConfirmed(false);
                      setPhase("listening_test");
                    }}
                  >
                    <Volume2 className="h-4 w-4" /> {isAr ? "اختبار الاستماع (5 أسئلة · ~5 دقائق)" : "Listening Exam (5 questions · ~5 min)"}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-blue-600" />
                      {isAr ? "الاستماع:" : "Listening:"} {listeningAnswers.filter((a, i) => a === (LISTENING_EXAM[result.levelKey] ?? LISTENING_EXAM["hangul"])[i]?.correctIndex).length}/{listeningAnswers.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{subTestSummary(listeningAnswers.filter((a, i) => a === (LISTENING_EXAM[result.levelKey] ?? LISTENING_EXAM["hangul"])[i]?.correctIndex).length, listeningAnswers.length, isAr ? "الاستماع" : "Listening", isAr)}</p>
                  </div>
                )}

                {/* Reading Exam */}
                {readingAnswers.length === 0 ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setReadingIndex(0); setReadingAnswers([]);
                      setReadingSelected(null); setReadingConfirmed(false);
                      setPhase("reading_test");
                    }}
                  >
                    <BookOpen className="h-4 w-4" /> {isAr ? "اختبار القراءة (5 نصوص · ~5 دقائق)" : "Reading Exam (5 passages · ~5 min)"}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-green-700" />
                      {isAr ? "القراءة:" : "Reading:"} {readingAnswers.filter((a, i) => a === (READING_EXAM[result.levelKey] ?? READING_EXAM["hangul"])[i]?.correctIndex).length}/{readingAnswers.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{subTestSummary(readingAnswers.filter((a, i) => a === (READING_EXAM[result.levelKey] ?? READING_EXAM["hangul"])[i]?.correctIndex).length, readingAnswers.length, isAr ? "القراءة" : "Reading", isAr)}</p>
                  </div>
                )}

                {/* Speaking */}
                {speakingRatings.length === 0 ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => { setSpeakingIndex(0); setSpeakingRatings([]); setRecordingUrl(null); setPhase("speaking_test"); }}
                  >
                    <Mic className="h-4 w-4" /> {isAr ? "اختبار المحادثة (5 تمارين · ~3 دقائق)" : "Speaking Test (5 prompts · ~3 min)"}
                  </Button>
                ) : null}
              </div>

              {speakingRatings.length === 5 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-primary" />
                    {isAr ? "نتيجة المحادثة:" : "Speaking score:"} {speakingRatings.reduce((a, b) => a + b, 0)}/10
                  </p>
                  <p className="text-xs text-muted-foreground">{speakingSummary(speakingRatings, result.levelKey, isAr)}</p>
                </div>
              )}
              <button onClick={() => navigate("/")} className="w-full text-xs text-muted-foreground hover:underline">
                {isAr ? "العودة للرئيسية" : "Back to home"}
              </button>
            </CardContent>
          </Card>

          {/* Answer explanations */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <button
                onClick={() => setShowExplanations(v => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {isAr ? "مراجعة الإجابات والشروحات" : "Review answers & explanations"}
                </span>
                {showExplanations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showExplanations && (
                <div className="mt-4 space-y-4">
                  {questionResults.map(({ q, userAnswer, wasSkipped, isCorrect }) => (
                    <div key={q.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                          wasSkipped ? "bg-muted text-muted-foreground" :
                          isCorrect  ? "bg-green-500/15 text-green-800 dark:text-green-300" :
                                       "bg-red-500/15 text-red-800 dark:text-red-300"
                        }`}>
                          {wasSkipped ? "—" : isCorrect ? "✓" : "✗"}
                        </span>
                        <p className="text-sm font-medium leading-snug">Q{q.id}. {q.question}</p>
                      </div>

                      {/* Listening passage revealed in review */}
                      {q.section === "Listening" && q.passage && (
                        <div className="ml-7 mb-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-xs space-y-1.5">
                          <p className="font-medium text-foreground leading-relaxed">{q.passage}</p>
                          <button
                            className="flex items-center gap-1 text-primary hover:underline text-[11px]"
                            onClick={() => speakKorean(q.passage!)}
                          >
                            <Volume2 className="h-3 w-3" /> {isAr ? "استمع مجدداً" : "Listen again"}
                          </button>
                        </div>
                      )}

                      {!wasSkipped && (
                        <div className="ml-7 text-xs space-y-1 mb-2">
                          {!isCorrect && (
                            <p className="text-red-700 dark:text-red-300">
                              {isAr ? "إجابتك:" : "Your answer:"} {q.options[userAnswer] ?? "—"}
                            </p>
                          )}
                          <p className="text-green-800 dark:text-green-300 font-medium">
                            {isAr ? "الصحيح:" : "Correct:"} {q.options[q.correctIndex]}
                          </p>
                        </div>
                      )}

                      <p className="ml-7 text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                      {q.arabicTip && (
                        <p className="mt-1.5 ml-7 text-xs text-muted-foreground border-r-2 border-primary/40 pr-2 text-right leading-relaxed" dir="rtl">
                          💡 {q.arabicTip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead capture dialog */}
          <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{isAr ? "احصل على خطة دراستك المجانية" : "Get your free study plan"}</DialogTitle>
                <DialogDescription>
                  {isAr ? `سنرسل خطة دراسية مخصصة لمستوى ${result.levelLabel} لبريدك.` : `We'll send a personalised ${result.levelLabel} study plan to your inbox.`}
                </DialogDescription>
              </DialogHeader>
              {leadSaved ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
                  <p className="font-semibold text-sm">{isAr ? "سنرسل خطتك قريباً!" : "We'll send your plan shortly!"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder={isAr ? "اسمك" : "Your name"}
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                  />
                  <Input
                    placeholder={isAr ? "بريدك الإلكتروني" : "Your email"}
                    type="email"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleLeadSubmit} disabled={leadSaving}>
                    {leadSaving ? (isAr ? "جارٍ الإرسال..." : "Sending…") : (isAr ? "أرسل لي الخطة" : "Send me the plan")}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </main>
        <Footer />
      </div>
    );
  }

  const banner = (isAr ? SECTION_BANNERS_AR : SECTION_BANNERS)[page];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{isAr ? "اختبار تحديد المستوى" : "Placement Test"}</h1>
          <p className="text-muted-foreground text-sm">{isAr ? "أجب أو تخطَّ كل سؤال — اضغط 1–4 للاختيار ثم انتقل للتالي." : "Answer or skip each question — press 1–4 to select, then move to the next."}</p>
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              {isAr ? `القسم ${page + 1} من ${TOTAL_PAGES}` : `Section ${page + 1} of ${TOTAL_PAGES}`}
              {elapsedSeconds > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />{formatTime(elapsedSeconds)}
                </span>
              )}
            </span>
            <span className="flex items-center gap-3 text-xs">
              <span className="text-green-800 dark:text-green-300 font-medium">{isAr ? `${totalAnswered} تمت الإجابة` : `${totalAnswered} answered`}</span>
              {totalSkipped > 0 && <span className="text-amber-800 dark:text-amber-300 font-medium">{isAr ? `${totalSkipped} تم التخطي` : `${totalSkipped} skipped`}</span>}
              {totalRemaining > 0 && <span>{isAr ? `${totalRemaining} متبقي` : `${totalRemaining} left`}</span>}
              <span className="flex items-center gap-1 ml-1 text-muted-foreground" title="Auto-advance to next question after answering">
                <Switch id="auto-advance" checked={autoAdvance} onCheckedChange={toggleAutoAdvance} className="scale-75 origin-right" />
                <label htmlFor="auto-advance" className="cursor-pointer select-none hidden sm:inline">{isAr ? "تلقائي" : "Auto"}</label>
              </span>
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Question map — click any dot to jump to that page */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {PLACEMENT_QUESTIONS.map((q, qi) => {
            const qPage = Math.floor(qi / QUESTIONS_PER_PAGE);
            const st = skipped.has(q.id) ? "skipped" : answers[q.id] !== undefined ? "answered" : "unanswered";
            return (
              <button
                key={q.id}
                title={`Q${q.id} · ${q.level}`}
                onClick={() => setPage(qPage)}
                className={[
                  "h-5 w-5 rounded-full border-2 transition-all",
                  st === "answered"   ? "bg-green-500 border-green-600" : "",
                  st === "skipped"    ? "bg-amber-400 border-amber-500" : "",
                  st === "unanswered" ? "bg-muted border-border" : "",
                  qPage === page ? "ring-2 ring-primary ring-offset-1 scale-110" : "hover:scale-110",
                ].join(" ")}
              />
            );
          })}
        </div>

        {/* Section banner */}
        {banner && (
          <div className="mb-5 flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
              {page + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{banner.label}</p>
              <p className="text-xs text-muted-foreground">{banner.hint}</p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {currentQuestions.map((q) => {
            const isSkipped = skipped.has(q.id);
            const isFocused = focusedQId === q.id;
            return (
              <Card
                key={q.id}
                id={`question-card-${q.id}`}
                onClick={() => !isSkipped && setFocusedQId(q.id)}
                className={[
                  "cursor-pointer transition-all",
                  isSkipped ? "opacity-50 border-dashed" : "",
                  isFocused && !isSkipped ? "ring-2 ring-primary/40 border-primary/30" : "",
                ].join(" ")}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">{q.section}</Badge>
                      <Badge variant="secondary" className="text-[10px] font-normal">{q.level}</Badge>
                      <span className="text-[10px] text-amber-500 tracking-tighter text-center" title={`Difficulty ${q.difficulty}/5`}>
                        {"★".repeat(q.difficulty)}{"☆".repeat(5 - q.difficulty)}
                      </span>
                    </div>
                    <p className="font-medium text-sm leading-snug">
                      <span className="text-muted-foreground mr-1.5">Q{q.id}.</span>
                      {q.question}
                    </p>
                  </div>

                  {q.passage && q.section === "Listening" ? (
                    <div className="flex flex-col items-center gap-2 mb-4 py-4 bg-primary/5 rounded-xl border border-primary/15">
                      <p className="text-xs text-muted-foreground">{isAr ? "استمع للنص ثم أجب أدناه" : "Listen to the passage, then answer below"}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => isSpeaking ? cancelSpeech() : speakKorean(q.passage!)}
                      >
                        {isSpeaking
                          ? <><Square className="h-3.5 w-3.5" /> {isAr ? "إيقاف" : "Stop"}</>
                          : <><Volume2 className="h-3.5 w-3.5" /> {isAr ? "استمع" : "Listen"}</>}
                      </Button>
                    </div>
                  ) : q.passage ? (
                    <div className="bg-muted/50 border-l-4 border-primary/40 rounded-r-lg px-4 py-3 mb-4 text-sm leading-relaxed text-foreground font-medium">
                      {q.passage}
                    </div>
                  ) : null}

                  {isSkipped ? (
                    <div className="flex items-center justify-between ml-1">
                      <span className="text-sm text-muted-foreground italic">{isAr ? "تم التخطي — يحتسب كـ 0" : "Skipped — counts as 0"}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnskip(q.id); }}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> {isAr ? "أجب هذا السؤال" : "Answer this question"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <RadioGroup
                        value={answers[q.id]?.toString()}
                        onValueChange={(val) => {
                          startTimer();
                          setFocusedQId(q.id);
                          setAnswers((prev) => ({ ...prev, [q.id]: parseInt(val) }));
                          if (autoAdvanceRef.current) {
                            clearTimeout(advanceTimerRef.current!);
                            const idx = currentQuestions.findIndex(cq => cq.id === q.id);
                            advanceTimerRef.current = setTimeout(() => {
                              const nextOnPage = currentQuestions.slice(idx + 1).find(cq => !skippedRef.current.has(cq.id));
                              if (nextOnPage) {
                                setFocusedQId(nextOnPage.id);
                                document.getElementById(`question-card-${nextOnPage.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                              } else if (page < TOTAL_PAGES - 1) {
                                setTimeout(() => setPage(p => p + 1), 250);
                              }
                            }, 350);
                          }
                        }}
                        className="space-y-2 ml-1"
                      >
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center space-x-3">
                            <RadioGroupItem value={oi.toString()} id={`q${q.id}-o${oi}`} />
                            <Label htmlFor={`q${q.id}-o${oi}`} className="cursor-pointer text-sm">
                              <span className="text-muted-foreground mr-1 text-xs">{oi + 1}.</span> {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      <div className="mt-3 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSkip(q.id); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <SkipForward className="h-3.5 w-3.5" /> {isAr ? "تخطي هذا السؤال" : "Skip this question"}
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pb-8 gap-3">
          <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {isAr ? "السابق" : "Previous"}
          </Button>

          {page < TOTAL_PAGES - 1 ? (
            <Button onClick={() => setPage((p) => p + 1)}>
              {isAr ? "التالي" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setPhase("review")} disabled={totalAnswered === 0}>
              <ClipboardList className="mr-2 h-4 w-4" /> {isAr ? "مراجعة وإرسال" : "Review & Submit"}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlacementTestPage;
