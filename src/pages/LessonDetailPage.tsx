import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Languages, MessageSquare, Lightbulb, FileText, CheckCircle2, Zap, Eye, EyeOff, Volume2, PenLine, Gamepad2, RotateCcw, AlertTriangle } from "lucide-react";
import KoreanWritingTest from "@/components/KoreanWritingTest";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";
import { useSpeech } from "@/hooks/useSpeech";
import VisualVocabScene from "@/components/VisualVocabScene";
import { MissionStartBanner, XpBadge, LeagueProgressBar, LessonProgressDots } from "@/components/GamificationUI";
import { isCheckpointLesson, isBossChallenge, XP_VALUES, getRandomMotivation } from "@/constants/gamification";
import { getWorldForLesson } from "@/constants/worlds";
import { getGrammarMasteryWorldForLesson } from "@/constants/grammarMasteryWorlds";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { MissionCompleteOverlay, XpFloatAnimation, StreakCelebration } from "@/components/XpAnimation";
import { Progress } from "@/components/ui/progress";
import { NextStepCard } from "@/components/NextStepCard";

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  description: string;
  title_ar?: string;
  description_ar?: string;
  sort_order: number;
  scene_image_url?: string;
}

interface VocabItem { id: string; korean: string; romanization: string; meaning: string; image_url?: string; }
interface GrammarItem { id: string; title: string; structure: string; explanation: string; examples: { korean: string; english: string }[]; }
interface DialogueLine { id: string; speaker: string; korean: string; romanization: string; english: string; }
interface ExerciseItem { id: string; question: string; options: string[]; correct_index: number; explanation: string; }
interface ReadingItem { id: string; korean_text: string; english_text: string; }

const LessonDetailPage = () => {
  const { lessonId, bookId } = useParams();
  const bookSlug = bookId || "korean-1";
  const lessonNum = parseInt(lessonId || "1", 10);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, progress, league, markSectionDone, awardXp, awardBadge, streakCelebration, clearStreakCelebration } = useGamification();
  const { speakKorean, isSpeaking } = useSpeech();
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const lessonTitle = lesson ? (isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en) : `Lesson ${lessonNum}`;
  useSEO({
    title: `${lessonTitle} | Korean Textbook`,
    description: lesson?.description || `Learn Korean in lesson ${lessonNum} on Klovers. Vocabulary, grammar, dialogues and exercises.`,
    canonical: `https://kloversegy.com/textbook/${bookSlug}/${lessonNum}`,
  });
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarItem[]>([]);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [reading, setReading] = useState<ReadingItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  // Interactive states
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [showTranslations, setShowTranslations] = useState(false);
  const [showMissionComplete, setShowMissionComplete] = useState(false);
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [activeTab, setActiveTab] = useState("vocab");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setFetchError(null);
      setSelectedAnswers({});
      setShowResults({});
      setFlippedCards(new Set());
      setStudiedCards(new Set());
      setCorrectCount(0);

      try {
        const baseQuery = supabase.from("textbook_lessons").select("*").eq("sort_order", lessonNum).eq("is_published", true);
        const countQuery = supabase.from("textbook_lessons").select("id", { count: "exact", head: true }).eq("is_published", true);
        const [lessonRes, countRes] = await Promise.all([
          (baseQuery as any).eq("book", bookSlug).maybeSingle(),
          (countQuery as any).eq("book", bookSlug),
        ]);

        if (lessonRes.error) throw lessonRes.error;

        const l = lessonRes.data as unknown as Lesson | null;
        setLesson(l);
        setTotalLessons(countRes.count || 0);

        if (l) {
          const [vRes, gRes, dRes, eRes, rRes] = await Promise.all([
            supabase.from("lesson_vocabulary").select("*").eq("lesson_id", l.id).order("sort_order"),
            supabase.from("lesson_grammar").select("*").eq("lesson_id", l.id).order("sort_order"),
            supabase.from("lesson_dialogues").select("*").eq("lesson_id", l.id).order("sort_order"),
            supabase.from("lesson_exercises").select("*").eq("lesson_id", l.id).order("sort_order"),
            supabase.from("lesson_reading").select("*").eq("lesson_id", l.id).order("sort_order"),
          ]);
          setVocab((vRes.data as unknown as VocabItem[]) || []);
          setGrammar((gRes.data as unknown as GrammarItem[]) || []);
          setDialogue((dRes.data as unknown as DialogueLine[]) || []);
          setExercises((eRes.data as unknown as ExerciseItem[]) || []);
          setReading((rRes.data as unknown as ReadingItem[]) || []);
        }
        setLoading(false);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load lesson");
        setLoading(false);
      }
    };
    fetchAll();
  }, [lessonNum, bookSlug]);

  const handleAnswer = (exerciseId: string, optionIndex: number, correctIndex: number) => {
    if (showResults[exerciseId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [exerciseId]: optionIndex }));
    setShowResults((prev) => ({ ...prev, [exerciseId]: true }));
    if (optionIndex === correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleMarkDone = useCallback(async (section: "vocab_done" | "grammar_done" | "dialogue_done" | "exercises_done" | "reading_done" | "writing_done") => {
    if (!lesson || !userId) {
      toast({ title: t("textbook.signInRequired"), description: t("textbook.signInRequiredDesc"), variant: "destructive" });
      return;
    }

    const lp = progress.lessonProgress[lesson.id];
    if (lp?.[section]) return;

    await markSectionDone(lesson.id, section);

    const xpMap: Record<string, number> = {
      vocab_done: XP_VALUES.vocab,
      grammar_done: XP_VALUES.grammar,
      dialogue_done: XP_VALUES.dialogue,
      exercises_done: XP_VALUES.exercise,
      reading_done: XP_VALUES.reading,
      writing_done: XP_VALUES.writing,
    };

    setXpFloat(xpMap[section]);
    setTimeout(() => setXpFloat(null), 1600);

    // Award perfect_exercise badge if all exercise answers were correct
    if (section === "exercises_done" && exercises.length > 0 && correctCount === exercises.length) {
      await awardBadge("perfect_exercise");
    }

    // Check if chapter just completed
    const allDone = ["vocab_done", "grammar_done", "dialogue_done", "exercises_done", "reading_done", "writing_done"]
      .every(s => s === section ? true : lp?.[s as keyof typeof lp]);

    if (allDone) {
      // Boss challenge: award badge + 25 XP bonus
      if (isBossChallenge(lesson.sort_order)) {
        await awardBadge("boss_slayer");
        await awardXp(lesson.id, "bonus");
      }
      setTimeout(() => setShowMissionComplete(true), 800);
    }

    toast({
      title: `+${xpMap[section]} XP earned! ⚡`,
      description: getRandomMotivation(),
    });
  }, [lesson, userId, progress, markSectionDone, awardXp, awardBadge, exercises, correctCount, toast, t]);

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setStudiedCards((prev) => new Set(prev).add(id));
  };

  const lp = lesson ? progress.lessonProgress[lesson.id] : undefined;

  // Calculate section completion for progress bar
  const sectionsDone = lp
    ? [lp.vocab_done, lp.grammar_done, lp.dialogue_done, lp.exercises_done, lp.reading_done, (lp as any).writing_done].filter(Boolean).length
    : 0;
  const sectionProgress = (sectionsDone / 6) * 100;

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="font-semibold text-foreground">Couldn't load this lesson</h1>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Refresh</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-96 mb-2" />
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl text-center">
          <p className="text-muted-foreground text-lg">{t("textbook.lessonNotFound")}</p>
          <Link to={`/textbook/${bookSlug}`} className="text-amber-700 underline mt-4 inline-block">{t("textbook.backToLessons")}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const boss = isBossChallenge(lesson.sort_order);
  const checkpoint = isCheckpointLesson(lesson.sort_order);
  const world = bookSlug === "grammar-mastery"
    ? (() => { const gw = getGrammarMasteryWorldForLesson(lesson.sort_order); return { name: gw.name, nameAr: gw.name, emoji: gw.emoji }; })()
    : getWorldForLesson(lesson.sort_order);

  const sectionLabels: Record<string, string> = {
    vocab_done: t("textbook.vocabulary"),
    grammar_done: t("textbook.grammar"),
    dialogue_done: t("textbook.dialogue"),
    exercises_done: t("textbook.exercises"),
    reading_done: t("textbook.reading"),
    writing_done: isAr ? "الكتابة" : "Writing",
  };

  const SectionDoneButton = ({ section }: { section: "vocab_done" | "grammar_done" | "dialogue_done" | "exercises_done" | "reading_done" }) => {
    const label = sectionLabels[section];
    if (!userId) {
      return (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to={`/login?redirect=/textbook/${bookSlug}/${lessonNum}`} className="text-amber-700 underline">{t("textbook.signIn")}</Link> {t("textbook.signInToTrack")}
        </p>
      );
    }
    const done = lp?.[section];
    return (
      <Button
        onClick={() => handleMarkDone(section)}
        disabled={!!done}
        variant={done ? "secondary" : "default"}
        size="lg"
        className={cn("mt-6 gap-2 w-full sm:w-auto", done && "opacity-70")}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        {done ? `${label} ${t("textbook.sectionComplete")}` : `${t("textbook.complete")} ${label} ${t("textbook.completeAndEarnXp")}`}
      </Button>
    );
  };

  // Quiz score display
  const quizTotal = exercises.length;
  const allAnswered = quizTotal > 0 && Object.keys(showResults).length === quizTotal;
  const quizScore = allAnswered ? Math.round((correctCount / quizTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* XP Float Animation */}
      {xpFloat !== null && <XpFloatAnimation xp={xpFloat} />}
      {streakCelebration !== null && <StreakCelebration currentStreak={streakCelebration} onContinue={clearStreakCelebration} />}

      {/* Mission Complete Overlay */}
      {showMissionComplete && (
        <MissionCompleteOverlay
          lessonTitle={isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
          xpEarned={XP_VALUES.chapter}
          onContinue={() => {
            setShowMissionComplete(false);
            if (lessonNum < totalLessons) navigate(`/textbook/${bookSlug}/${lessonNum + 1}`);
          }}
        />
      )}

      <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        {/* Back link with world context */}
        <div className="flex items-center gap-2 mb-6">
     <Link to={`/textbook/${bookSlug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> {t("textbook.allMissions")}
          </Link>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{world.emoji} {isAr ? world.nameAr : world.name}</span>
        </div>

        {/* Mission Start Banner */}
        <MissionStartBanner
          lessonNum={lesson.sort_order}
          title={isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
          description={isAr && lesson.description_ar ? lesson.description_ar : lesson.description}
          isBoss={boss}
          isCheckpoint={checkpoint}
        />

        {/* Lesson header */}
        <div className="flex items-start gap-4 mb-4">
          <span className="text-5xl">{lesson.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("textbook.missionLabel")} {lesson.sort_order}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}</h1>
            <p className="text-muted-foreground text-lg">{lesson.title_ko}</p>
          </div>
        </div>

        {/* Progress & XP */}
        {userId && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <XpBadge xp={progress.totalXp} />
                <span className="text-xs text-muted-foreground">{league.emoji} {league.name}</span>
              </div>
              {lp && <LessonProgressDots progress={lp} />}
            </div>
            {/* Section progress bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{sectionsDone}/6</span>
              <Progress value={sectionProgress} className="h-2 flex-1" />
              {sectionProgress === 100 && <span className="text-sm">⭐</span>}
            </div>
          </div>
        )}

        {lp?.chapter_completed && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-6 text-center ring-1 ring-black/10">
            <span className="text-2xl">⭐</span>
            <p className="font-bold text-foreground">{t("textbook.missionComplete")}</p>
            <p className="text-sm text-muted-foreground">{getRandomMotivation()}</p>
          </div>
        )}
        {lp?.chapter_completed && (
          <div className="mb-6">
            <NextStepCard completedType="lesson" lessonSection={activeTab} />
          </div>
        )}

        {/* Visual Vocabulary Scene */}
        <VisualVocabScene
          lessonId={lesson.id}
          title={lesson.title_en}
          titleKo={lesson.title_ko}
          sceneImageUrl={lesson.scene_image_url}
          vocab={vocab}
          isAdmin={false}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-6 mb-8">
            <TabsTrigger value="vocab" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <BookOpen className="h-4 w-4 hidden sm:block" /> {t("textbook.vocab")}
              {lp?.vocab_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="grammar" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <Languages className="h-4 w-4 hidden sm:block" /> {t("textbook.grammar")}
              {lp?.grammar_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="dialogue" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <MessageSquare className="h-4 w-4 hidden sm:block" /> {t("textbook.dialogue")}
              {lp?.dialogue_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <Lightbulb className="h-4 w-4 hidden sm:block" /> {t("textbook.exercises")}
              {lp?.exercises_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="reading" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <FileText className="h-4 w-4 hidden sm:block" /> {t("textbook.reading")}
              {lp?.reading_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="writing" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:ring-1 data-[state=active]:ring-black/15">
              <PenLine className="h-4 w-4 hidden sm:block" /> {isAr ? "كتابة" : "Writing"}
              {(lp as any)?.writing_done && <CheckCircle2 className="h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          {/* VOCAB — 3D flip cards */}
          <TabsContent value="vocab">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" /> {t("textbook.vocabulary")}
                <span className="text-xs text-muted-foreground">+{XP_VALUES.vocab} XP</span>
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { setFlippedCards(new Set()); setStudiedCards(new Set()); }}
                  className="gap-1.5 text-xs"
                  title="Reset all cards"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowTranslations(!showTranslations)}
                  className="gap-1.5 text-xs"
                >
                  {showTranslations ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showTranslations ? (isAr ? "إخفاء الكل" : "Hide all") : (isAr ? "إظهار الكل" : "Show all")}
                </Button>
              </div>
            </div>

            {/* Studied progress bar */}
            {vocab.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{isAr ? "المفردات المدروسة" : "Cards studied"}</span>
                  <span className="font-semibold">{studiedCards.size} / {vocab.length}</span>
                </div>
                <Progress value={(studiedCards.size / vocab.length) * 100} className="h-1.5" />
              </div>
            )}

            {vocab.length === 0 ? (
              <p className="text-muted-foreground">{t("textbook.noVocab")}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vocab.map((v) => {
                    const isFlipped = flippedCards.has(v.id) || showTranslations;
                    const isStudied = studiedCards.has(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleFlip(v.id)}
                        style={{ perspective: '1000px', cursor: 'pointer' }}
                        className="select-none"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleFlip(v.id)}
                        aria-label={`${v.korean} — ${isFlipped ? v.meaning : 'tap to reveal'}`}
                      >
                        <div
                          style={{
                            transformStyle: 'preserve-3d',
                            transition: 'transform 0.45s ease',
                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            position: 'relative',
                            height: '200px',
                          }}
                        >
                          {/* Front — Picture Dictionary */}
                          <div
                            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                            className={cn(
                              "absolute inset-0 rounded-xl border flex flex-col items-center justify-center gap-2 p-4 overflow-hidden",
                              isStudied ? "border-amber-300 bg-amber-50" : "border-border bg-card hover:border-amber-200 hover:shadow-md"
                            )}
                          >
                            {isStudied && <span className="absolute top-2 end-2 text-amber-600 text-xs z-10">✓</span>}
                            {/* Image */}
                            {v.image_url && (
                              <img
                                src={v.image_url}
                                alt={v.korean}
                                className="w-24 h-24 object-cover rounded-lg"
                                loading="lazy"
                              />
                            )}
                            <p className="text-xl font-bold text-foreground text-center">{v.korean}</p>
                            <p className="text-xs italic text-muted-foreground">{v.romanization}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakKorean(v.korean);
                              }}
                              disabled={isSpeaking}
                              className="gap-1 text-xs mt-1"
                              title="Hear pronunciation"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                              {isAr ? "استمع" : "Hear"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "اضغط للكشف" : "Tap to reveal"}</p>
                          </div>
                          {/* Back — Meaning */}
                          <div
                            style={{
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                            className="absolute inset-0 rounded-xl border border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-2 p-4 ring-1 ring-black/10"
                          >
                            <p className="text-lg font-bold text-foreground text-center">{v.meaning}</p>
                            <p className="text-sm italic text-muted-foreground">{v.romanization}</p>
                            <p className="text-sm text-amber-700 font-medium mt-1 text-center">{v.korean}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Practice with Games */}
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                    <Gamepad2 className="h-4 w-4 text-amber-600" />
                    {isAr ? "تدرب مع الألعاب" : "Practice with Games"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                      <Link to="/games">🃏 {isAr ? "مطابقة" : "Memory Match"}</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                      <Link to="/games">🔤 {isAr ? "ترتيب الكلمات" : "Word Scramble"}</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                      <Link to="/games">⚡ {isAr ? "كل الألعاب" : "All Games"}</Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <SectionDoneButton section="vocab_done" />
                </div>
              </>
            )}
          </TabsContent>

          {/* GRAMMAR */}
          <TabsContent value="grammar">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Languages className="h-5 w-5 text-amber-600" /> {t("textbook.grammar")}
              <span className="text-xs text-muted-foreground ms-auto">+{XP_VALUES.grammar} XP</span>
            </h2>
            {grammar.length === 0 ? (
              <p className="text-muted-foreground">{t("textbook.noGrammar")}</p>
            ) : (
              <>
                <div className="space-y-6">
                  {grammar.map((g, gi) => (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-bold shadow-sm border border-black/15">{gi + 1}</span>
                        <h3 className="text-lg font-bold text-foreground">{g.title}</h3>
                      </div>
                      {g.structure && (
                        <p className="text-sm font-mono text-foreground bg-amber-100 inline-block px-3 py-1.5 rounded-lg mb-3 border border-black/10">{g.structure}</p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4">{g.explanation}</p>
                      {g.examples?.length > 0 && (
                        <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                          {g.examples.map((ex, i) => (
                            <div key={i} className="border-s-2 border-amber-300 ps-3">
                              <p className="text-sm font-medium text-foreground">{ex.korean}</p>
                              <p className="text-xs text-muted-foreground">{ex.english}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="grammar_done" />
              </>
            )}
          </TabsContent>

          {/* DIALOGUE - Enhanced chat-style */}
          <TabsContent value="dialogue">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-600" /> {t("textbook.dialogue")}
              <span className="text-xs text-muted-foreground ms-auto">+{XP_VALUES.dialogue} XP</span>
            </h2>
            {dialogue.length === 0 ? (
              <p className="text-muted-foreground">{t("textbook.noDialogue")}</p>
            ) : (
              <>
                <div className="space-y-3">
                  {dialogue.map((d, di) => {
                    const isEven = di % 2 === 0;
                    return (
                      <div
                        key={d.id}
                        className={cn("flex", isEven ? "justify-start" : "justify-end")}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-2xl p-4",
                          isEven
                            ? "rounded-tl-sm bg-card border border-border"
                            : "rounded-tr-sm bg-amber-100 border border-amber-200 ring-1 ring-black/10"
                        )}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-bold text-foreground uppercase">{d.speaker}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => speakKorean(d.korean)}
                              disabled={isSpeaking}
                              className="gap-1 text-xs h-6 w-6 p-0 flex-shrink-0"
                              title="Hear pronunciation"
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-foreground font-medium text-lg">{d.korean}</p>
                          {d.romanization && <p className="text-xs italic text-muted-foreground mt-0.5">{d.romanization}</p>}
                          <p className="text-sm text-muted-foreground mt-1.5 border-t border-border/50 pt-1.5">{d.english}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <SectionDoneButton section="dialogue_done" />
              </>
            )}
          </TabsContent>

          {/* EXERCISES - Enhanced with score */}
          <TabsContent value="exercises">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" /> {t("textbook.exercises")}
                <span className="text-xs text-muted-foreground">+{XP_VALUES.exercise} XP</span>
              </h2>
              {allAnswered && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border border-black/10",
                  quizScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : quizScore >= 50 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {quizScore}% {quizScore >= 80 ? "🎉" : quizScore >= 50 ? "👍" : "📚"}
                </div>
              )}
            </div>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground">{t("textbook.noExercises")}</p>
            ) : (
              <>
                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">{Object.keys(showResults).length}/{quizTotal}</span>
                  <Progress value={(Object.keys(showResults).length / quizTotal) * 100} className="h-1.5 flex-1" />
                </div>

                <div className="space-y-6">
                  {exercises.map((ex, idx) => (
                    <div key={ex.id} className={cn(
                      "rounded-xl border bg-card p-5 transition-all",
                      showResults[ex.id]
                        ? selectedAnswers[ex.id] === ex.correct_index
                          ? "border-green-500/40"
                          : "border-destructive/40"
                        : "border-border"
                    )}>
                      <p className="font-medium text-foreground mb-3">{idx + 1}. {ex.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ex.options.map((opt, oi) => {
                          const selected = selectedAnswers[ex.id] === oi;
                          const revealed = showResults[ex.id];
                          const isCorrect = oi === ex.correct_index;
                          return (
                            <button
                              key={oi}
                              onClick={() => handleAnswer(ex.id, oi, ex.correct_index)}
                              disabled={revealed}
                              className={cn(
                                "text-left px-4 py-3 rounded-lg border text-sm transition-all",
                                revealed && isCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-medium",
                                revealed && selected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                                !revealed && "border-border hover:border-amber-300 hover:bg-amber-50 text-foreground",
                                revealed && !selected && !isCorrect && "opacity-40"
                              )}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full border inline-flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {showResults[ex.id] && ex.explanation && (
                        <div className={cn(
                          "mt-3 p-3 rounded-lg text-sm",
                          selectedAnswers[ex.id] === ex.correct_index
                            ? "bg-green-500/5 text-green-700 dark:text-green-400"
                            : "bg-destructive/5 text-destructive"
                        )}>
                          {selectedAnswers[ex.id] === ex.correct_index ? "✅ " : "❌ "}
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Score summary */}
                {allAnswered && (
                  <div className="mt-6 rounded-xl border border-border bg-card p-5 text-center">
                    <p className="text-3xl font-bold text-foreground mb-1">{correctCount}/{quizTotal}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {quizScore >= 80 ? (isAr ? "ممتاز! أداء رائع!" : "Excellent! Great job!") 
                        : quizScore >= 50 ? (isAr ? "جيد! حاول مراجعة الأخطاء" : "Good! Review your mistakes") 
                        : (isAr ? "حاول مرة أخرى بعد المراجعة" : "Review and try again")}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAnswers({});
                        setShowResults({});
                        setCorrectCount(0);
                      }}
                    >
                      {isAr ? "أعد المحاولة" : "Retry Quiz"} 🔄
                    </Button>
                  </div>
                )}

                <SectionDoneButton section="exercises_done" />
              </>
            )}
          </TabsContent>

          {/* READING */}
          <TabsContent value="reading">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" /> {t("textbook.reading")}
              <span className="text-xs text-muted-foreground ms-auto">+{XP_VALUES.reading} XP</span>
            </h2>
            {reading.length === 0 ? (
              <p className="text-muted-foreground">{t("textbook.noReading")}</p>
            ) : (
              <>
                <div className="space-y-6">
                  {reading.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                      <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap mb-3">{r.korean_text}</p>
                      <hr className="border-border mb-3" />
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.english_text}</p>
                    </div>
                  ))}
                </div>
                <SectionDoneButton section="reading_done" />
              </>
            )}
          </TabsContent>

          {/* WRITING - Korean Typing Test */}
          <TabsContent value="writing">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <PenLine className="h-5 w-5 text-amber-600" /> {isAr ? "تمرين الكتابة" : "Writing Practice"}
              <span className="text-xs text-muted-foreground ms-auto">+{XP_VALUES.writing} XP</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isAr
                ? "اختبر مهاراتك في الكتابة بالكورية! اكتب الكلمات والجمل باستخدام لوحة المفاتيح الكورية."
                : "Test your Korean typing skills! Type words and sentences using a Korean keyboard."}
            </p>
            <KoreanWritingTest
              vocab={vocab}
              dialogue={dialogue}
              lessonTitle={isAr && lesson.title_ar ? lesson.title_ar : lesson.title_en}
              onComplete={(score, total) => {
                if (score > 0) {
                  handleMarkDone("writing_done");
                }
              }}
            />
            <SectionDoneButton section={"writing_done" as any} />
          </TabsContent>
        </Tabs>

        {/* Games XP Banner */}
        <Link
          to="/games"
          className="group flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 p-4 mt-10 transition-all ring-1 ring-black/10"
        >
          <span className="text-3xl">🎮</span>
          <div className="flex-1">
            <p className="font-bold text-foreground">
              {isAr ? "اكسب المزيد من النقاط!" : "Earn More XP!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr ? "العب ألعاب المفردات والهانغول لتعزيز تعلمك" : "Play vocab & Hangul games to boost your learning"}
            </p>
          </div>
          <span className="text-amber-700 font-semibold text-sm group-hover:underline">
            {isAr ? "العب الآن" : "Play Now →"}
          </span>
        </Link>

        {/* Prev / Next navigation */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
          {lessonNum > 1 ? (
           <Link to={`/textbook/${bookSlug}/${lessonNum - 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> {t("textbook.previousMission")}
            </Link>
          ) : <span />}
          {lessonNum < totalLessons ? (
            <Link to={`/textbook/${bookSlug}/${lessonNum + 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              {t("textbook.nextMission")} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LessonDetailPage;
