import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import KoreanMatchGame from "@/components/KoreanMatchGame";
import HangulQuizGame from "@/components/HangulQuizGame";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getLeagueProgress, BADGES } from "@/constants/gamification";
import { LeaguePromotionModal, BadgeUnlockToast, StreakCelebration, XpFloatAnimation, PerfectScoreOverlay } from "@/components/XpAnimation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, Brain, Layers, Hash, Palette, BookOpen, MessageCircle, ArrowLeftRight, PenLine, Shuffle, Calculator, Tv, Clock, Trophy, Zap, Flame, Lock, X, Keyboard, Volume2, CreditCard, Zap as ZapIcon, MousePointerClick, BookOpenCheck, Headphones } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SentenceBuilderGame = lazy(() => import("@/components/games/SentenceBuilderGame"));
const NumbersGame = lazy(() => import("@/components/games/NumbersGame"));
const ColorMatchGame = lazy(() => import("@/components/games/ColorMatchGame"));
const VerbConjugationGame = lazy(() => import("@/components/games/VerbConjugationGame"));
const GreetingMasterGame = lazy(() => import("@/components/games/GreetingMasterGame"));
const OppositeWordsGame = lazy(() => import("@/components/games/OppositeWordsGame"));
const FillBlankGame = lazy(() => import("@/components/games/FillBlankGame"));
const WordScrambleGame = lazy(() => import("@/components/games/WordScrambleGame"));
const CounterWordsGame = lazy(() => import("@/components/games/CounterWordsGame"));
const KDramaQuizGame = lazy(() => import("@/components/games/KDramaQuizGame"));
const TimeTellerGame = lazy(() => import("@/components/games/TimeTellerGame"));
const TypeKoreanGame = lazy(() => import("@/components/games/TypeKoreanGame"));
const RomanizationGame = lazy(() => import("@/components/games/RomanizationGame"));
const FlashcardGame = lazy(() => import("@/components/games/FlashcardGame"));
const SpeedReadGame = lazy(() => import("@/components/games/SpeedReadGame"));
const ReadingChoiceGame = lazy(() => import("@/components/games/ReadingChoiceGame"));
const SentenceReadGame = lazy(() => import("@/components/games/SentenceReadGame"));
const PhonicsReadGame = lazy(() => import("@/components/games/PhonicsReadGame"));

const FREE_GAME_IDS = ["match", "hangul"];

const GameFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const GamesPage = () => {
  useSEO({ title: "Korean Learning Games", description: "Practice Korean with interactive games on Klovers. Memory match, Hangul quiz, word scramble, and more fun vocabulary games.", canonical: "https://kloversegy.com/games" });
  const [activeGame, setActiveGame] = useState<string>("match");
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  const { awardGameXp, progress, league, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [showPerfectScore, setShowPerfectScore] = useState<{ score: number; total: number } | null>(null);
  const { xpLeaderboard, loading: lbLoading } = useLeaderboard();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          toast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  const games = [
    { id: "match", title: t("games.matchTitle"), description: t("games.matchDesc"), icon: Layers, emoji: "🃏", difficulty: t("games.beginner"), free: true },
    { id: "hangul", title: t("games.hangulTitle"), description: t("games.hangulDesc"), icon: Brain, emoji: "⚡", difficulty: t("games.beginner"), free: true },
    { id: "sentence", title: t("games.sentenceTitle"), description: t("games.sentenceDesc"), icon: PenLine, emoji: "🧩", difficulty: t("games.beginner"), free: false },
    { id: "numbers", title: t("games.numbersTitle"), description: t("games.numbersDesc"), icon: Hash, emoji: "🔢", difficulty: t("games.beginner"), free: false },
    { id: "colors", title: t("games.colorsTitle"), description: t("games.colorsDesc"), icon: Palette, emoji: "🎨", difficulty: t("games.beginner"), free: false },
    { id: "verbs", title: t("games.verbsTitle"), description: t("games.verbsDesc"), icon: BookOpen, emoji: "📝", difficulty: t("games.intermediate"), free: false },
    { id: "greetings", title: t("games.greetingsTitle"), description: t("games.greetingsDesc"), icon: MessageCircle, emoji: "👋", difficulty: t("games.beginner"), free: false },
    { id: "opposites", title: t("games.oppositesTitle"), description: t("games.oppositesDesc"), icon: ArrowLeftRight, emoji: "↔️", difficulty: t("games.intermediate"), free: false },
    { id: "fillblank", title: t("games.fillblankTitle"), description: t("games.fillblankDesc"), icon: PenLine, emoji: "✏️", difficulty: t("games.intermediate"), free: false },
    { id: "scramble", title: t("games.scrambleTitle"), description: t("games.scrambleDesc"), icon: Shuffle, emoji: "🔀", difficulty: t("games.beginner"), free: false },
    { id: "counters", title: t("games.countersTitle"), description: t("games.countersDesc"), icon: Calculator, emoji: "🔢", difficulty: t("games.intermediate"), free: false },
    { id: "kdrama", title: t("games.kdramaTitle"), description: t("games.kdramaDesc"), icon: Tv, emoji: "🎬", difficulty: t("games.beginner"), free: false },
    { id: "time", title: t("games.timeTitle"), description: t("games.timeDesc"), icon: Clock, emoji: "⏰", difficulty: t("games.beginner"), free: false },
    { id: "typekorean", title: t("games.typekoreanTitle"), description: t("games.typekoreanDesc"), icon: Keyboard, emoji: "⌨️", difficulty: t("games.intermediate"), free: false },
    { id: "romanization", title: t("games.romanizationTitle"), description: t("games.romanizationDesc"), icon: Volume2, emoji: "🔤", difficulty: t("games.beginner"), free: false },
    { id: "flashcard", title: t("games.flashcardTitle"), description: t("games.flashcardDesc"), icon: CreditCard, emoji: "🃏", difficulty: t("games.beginner"), free: false },
    { id: "speedread", title: t("games.speedreadTitle"), description: t("games.speedreadDesc"), icon: ZapIcon, emoji: "⚡", difficulty: t("games.intermediate"), free: false },
    { id: "readingchoice", title: t("games.readingchoiceTitle"), description: t("games.readingchoiceDesc"), icon: MousePointerClick, emoji: "👆", difficulty: t("games.beginner"), free: false },
    { id: "sentenceread", title: t("games.sentencereadTitle"), description: t("games.sentencereadDesc"), icon: BookOpenCheck, emoji: "📖", difficulty: t("games.intermediate"), free: false },
    { id: "phonics", title: t("games.phonicsTitle"), description: t("games.phonicsDesc"), icon: Headphones, emoji: "🎧", difficulty: t("games.beginner"), free: false },
  ];

  const handleGameComplete = useCallback(async (gameId: string, score: number, totalRounds: number) => {
    if (isLoggedIn) {
      const xp = await awardGameXp(gameId, score, totalRounds);
      if (xp && xp > 0) {
        setXpFloat(xp);
        sonnerToast.success(`🎮 +${xp} XP!`, { description: `${league.emoji} ${league.name}` });
      }
      // Show perfect score overlay
      if (score === totalRounds && totalRounds > 0) {
        setShowPerfectScore({ score, total: totalRounds });
      }
    } else {
      setShowSignupNudge(true);
    }
  }, [awardGameXp, league, isLoggedIn]);

  const selectGame = (id: string) => {
    setActiveGame(id);
    setTimeout(() => {
      document.getElementById("active-game-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const renderGame = () => {
    const isGameFree = FREE_GAME_IDS.includes(activeGame);
    const game = games.find(g => g.id === activeGame);

    if (!isLoggedIn && !isGameFree) {
      return (
        <div className="py-20 flex flex-col items-center gap-5 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">{game?.emoji} {game?.title} {isAr ? "للأعضاء فقط" : "is for members"}</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              {isAr ? "أنشئ حساباً مجانياً لفتح جميع الألعاب الـ 30، حفظ XP الخاص بك، وبناء سلسلتك اليومية." : "Create a free account to unlock all 30 games, save your XP, and build your daily streak."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button size="lg" asChild>
              <a href="/signup">{isAr ? "🚀 سجّل مجاناً" : "🚀 Sign Up Free"}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">{isAr ? "تسجيل الدخول" : "Log In"}</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{isAr ? "بدون بطاقة ائتمان · انضم أكثر من 500 طالب" : "No credit card needed · 500+ students already joined"}</p>
        </div>
      );
    }

    const onComplete = (score: number, total: number) => handleGameComplete(activeGame, score, total);
    switch (activeGame) {
      case "match": return <KoreanMatchGame onGameComplete={onComplete} />;
      case "hangul": return <HangulQuizGame onGameComplete={onComplete} />;
      case "sentence": return <Suspense fallback={<GameFallback />}><SentenceBuilderGame onGameComplete={onComplete} /></Suspense>;
      case "numbers": return <Suspense fallback={<GameFallback />}><NumbersGame onGameComplete={onComplete} /></Suspense>;
      case "colors": return <Suspense fallback={<GameFallback />}><ColorMatchGame onGameComplete={onComplete} /></Suspense>;
      case "verbs": return <Suspense fallback={<GameFallback />}><VerbConjugationGame onGameComplete={onComplete} /></Suspense>;
      case "greetings": return <Suspense fallback={<GameFallback />}><GreetingMasterGame onGameComplete={onComplete} /></Suspense>;
      case "opposites": return <Suspense fallback={<GameFallback />}><OppositeWordsGame onGameComplete={onComplete} /></Suspense>;
      case "fillblank": return <Suspense fallback={<GameFallback />}><FillBlankGame onGameComplete={onComplete} /></Suspense>;
      case "scramble": return <Suspense fallback={<GameFallback />}><WordScrambleGame onGameComplete={onComplete} /></Suspense>;
      case "counters": return <Suspense fallback={<GameFallback />}><CounterWordsGame onGameComplete={onComplete} /></Suspense>;
      case "kdrama": return <Suspense fallback={<GameFallback />}><KDramaQuizGame onGameComplete={onComplete} /></Suspense>;
      case "time": return <Suspense fallback={<GameFallback />}><TimeTellerGame onGameComplete={onComplete} /></Suspense>;
      case "typekorean": return <Suspense fallback={<GameFallback />}><TypeKoreanGame onGameComplete={onComplete} /></Suspense>;
      case "romanization": return <Suspense fallback={<GameFallback />}><RomanizationGame onGameComplete={onComplete} /></Suspense>;
      case "flashcard": return <Suspense fallback={<GameFallback />}><FlashcardGame onGameComplete={onComplete} /></Suspense>;
      case "speedread": return <Suspense fallback={<GameFallback />}><SpeedReadGame onGameComplete={onComplete} /></Suspense>;
      case "readingchoice": return <Suspense fallback={<GameFallback />}><ReadingChoiceGame onGameComplete={onComplete} /></Suspense>;
      case "sentenceread": return <Suspense fallback={<GameFallback />}><SentenceReadGame onGameComplete={onComplete} /></Suspense>;
      case "phonics": return <Suspense fallback={<GameFallback />}><PhonicsReadGame onGameComplete={onComplete} /></Suspense>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 px-4 bg-muted/30">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/5 rounded-full -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-primary/20 rounded-full animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-primary/15 rounded-full animate-pulse delay-500" />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-primary/25 rounded-full animate-pulse delay-300" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium">
              <Gamepad2 className="h-4 w-4" />
              {t("games.learnPlay")}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground">
              {t("games.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              {t("games.subtitle").replace("{count}", String(games.length))}
            </p>

            <div className="flex justify-center gap-4 pt-2" aria-hidden="true">
              {["가", "나", "다", "라", "마"].map((ch, i) => (
                <span key={ch} className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border shadow-sm text-xl font-bold text-foreground animate-bounce select-none"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: "2.5s" }}>{ch}</span>
              ))}
            </div>

            {/* Guest banner */}
            {!isLoggedIn && (
              <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <span>{isAr ? "🎮 لعبتان مجانيتان · " : "🎮 2 free games · "}</span>
                <a href="/signup" className="text-amber-700 font-semibold hover:underline">{isAr ? "سجّل لفتح جميع الألعاب الـ 30" : "Sign up to unlock all 30 games"}</a>
              </div>
            )}

            {/* Live user stats strip */}
            {isLoggedIn && progress.totalXp > 0 && (
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                  <span>{league.emoji}</span>
                  <span>{league.name}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-full px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-200 ring-1 ring-black/10">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{progress.totalXp.toLocaleString()} XP</span>
                </div>
                {progress.streak.current_streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-full px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-200">
                    <Flame className="h-3.5 w-3.5" />
                    <span>{progress.streak.current_streak} {isAr ? "يوم متتالي" : "day streak"}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Game selector */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {games.map((game) => {
                const isActive = activeGame === game.id;
                const isLocked = !isLoggedIn && !game.free;
                return (
                  <button key={game.id} onClick={() => selectGame(game.id)} className="text-left">
                    <Card className={`p-4 transition-all duration-200 border-2 cursor-pointer h-full relative ${
                      isActive
                        ? "border-primary/50 bg-primary/5 shadow-md"
                        : isLocked
                        ? "border-border opacity-60 hover:opacity-80 hover:shadow-sm"
                        : "border-border hover:border-foreground/20 hover:shadow-sm"
                    }`}>
                      {isLocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {game.free && !isLoggedIn && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 dark:text-green-200 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full font-medium">{isAr ? "مجاني" : "FREE"}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                          {game.emoji}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">{game.title}</h3>
                            {isActive && (
                              <span className="text-[10px] bg-primary/20 text-foreground px-1.5 py-0.5 rounded-full font-medium">{t("games.playing")}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{game.description}</p>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                            game.difficulty === t("games.intermediate") ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
                          }`}>{game.difficulty}</span>
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Leaderboard — real data for logged-in, teaser for guests */}
        <section className="py-8 px-4 bg-muted/20 border-t border-border">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> {isAr ? "أفضل اللاعبين" : "Top Players"}
              </h2>
              {!isLoggedIn && (
                <a href="/signup" className="text-xs text-amber-700 font-semibold hover:underline">{isAr ? "سجّل للانضمام ←" : "Sign up to join →"}</a>
              )}
            </div>
            <div className={`relative rounded-2xl overflow-hidden border border-border bg-card ${!isLoggedIn ? "max-h-44" : ""}`}>
              <div className="divide-y divide-border">
                {isLoggedIn ? (
                  lbLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{isAr ? "جارٍ تحميل الترتيب..." : "Loading leaderboard…"}</div>
                  ) : xpLeaderboard.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا توجد بيانات بعد. العب لكسب XP!" : "No data yet. Play games to earn XP!"}</div>
                  ) : (
                    xpLeaderboard.slice(0, 10).map((p, idx) => {
                      const rankEmojis = ["🥇", "🥈", "🥉"];
                      const emoji = idx < 3 ? rankEmojis[idx] : `${idx + 1}`;
                      return (
                        <div key={p.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${p.isCurrentUser ? "bg-amber-50" : ""}`}>
                          <span className="text-base w-6 text-center font-bold">{emoji}</span>
                          <span className={`flex-1 text-sm font-medium ${p.isCurrentUser ? "text-amber-700 font-bold" : "text-foreground"}`}>
                            {p.name}{p.isCurrentUser ? (isAr ? " (أنت)" : " (you)") : ""}
                          </span>
                          <span className="text-xs text-yellow-700 dark:text-yellow-200 font-semibold bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-2 py-0.5 rounded-full ring-1 ring-black/10">
                            {p.value.toLocaleString()} XP
                          </span>
                        </div>
                      );
                    })
                  )
                ) : (
                  [
                    { rank: 1, name: "Sara M.", xp: 1840, emoji: "🥇" },
                    { rank: 2, name: "Ahmed K.", xp: 1620, emoji: "🥈" },
                    { rank: 3, name: "Yuki T.", xp: 1380, emoji: "🥉" },
                    { rank: 4, name: "Lin W.", xp: 1150, emoji: "4️⃣" },
                    { rank: 5, name: "Omar F.", xp: 980, emoji: "5️⃣" },
                  ].map((p) => (
                    <div key={p.rank} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-base w-6 text-center">{p.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-foreground">{p.name}</span>
                      <span className="text-xs text-yellow-700 dark:text-yellow-200 font-semibold bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-2 py-0.5 rounded-full">
                        {p.xp.toLocaleString()} XP
                      </span>
                    </div>
                  ))
                )}
              </div>
              {!isLoggedIn && (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-3">
                    <a
                      href="/signup"
                      className="text-xs bg-amber-500 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-amber-600 transition-colors shadow-md border border-black/15"
                    >
                      {isAr ? "🏆 سجّل لرؤية ترتيبك" : "🏆 Sign up to see your rank"}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Active game */}
        <div id="active-game-area" className="border-t border-border scroll-mt-20">
          {renderGame()}
        </div>
        <FinalCTA />
      </main>
      <Footer />

      {xpFloat !== null && <XpFloatAnimation xp={xpFloat} onComplete={() => setXpFloat(null)} />}
      {showPerfectScore && (
        <PerfectScoreOverlay
          score={showPerfectScore.score}
          total={showPerfectScore.total}
          onContinue={() => setShowPerfectScore(null)}
        />
      )}
      {streakCelebration !== null && <StreakCelebration currentStreak={streakCelebration} onContinue={clearStreakCelebration} />}
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
      {/* Signup nudge modal */}
      {showSignupNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
            <button
              onClick={() => setShowSignupNudge(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold text-foreground">{isAr ? "أحسنت!" : "Nice work!"}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? "أنشئ حساباً مجانياً لحفظ تقدمك وفتح جميع الألعاب الـ 30." : "Create a free account to save your progress and unlock all 30 games."}</p>
            </div>

            <div className="space-y-2">
              {[
                { icon: "⭐", text: isAr ? "احفظ XP وسلسلتك" : "Save your XP and streak" },
                { icon: "🔓", text: isAr ? "افتح جميع الألعاب الكورية الـ 30" : "Unlock all 30 Korean games" },
                { icon: "📊", text: isAr ? "تتبع تقدمك في التعلّم" : "Track your learning progress" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-foreground">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <Button className="w-full" size="lg" asChild>
                <a href="/signup">{isAr ? "🚀 سجّل مجاناً" : "🚀 Sign Up Free"}</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/login">{isAr ? "لديك حساب بالفعل؟ سجّل الدخول" : "Already have an account? Log in"}</a>
              </Button>
            </div>

            <button
              onClick={() => setShowSignupNudge(false)}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              {isAr ? "واصل اللعب كضيف" : "Continue playing as guest"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPage;
