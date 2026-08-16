import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGamification } from "@/hooks/useGamification";
import { LeagueProgressBar, LeagueCard, StreakDisplay, BadgeGrid, XpBadge, LessonProgressDots } from "@/components/GamificationUI";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Map, Award, Flame, Users, BookOpen } from "lucide-react";
import { LEAGUES, getLeague } from "@/constants/gamification";
import { WORLDS, getWorldProgress } from "@/constants/worlds";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_xp: number;
}

interface Lesson {
  id: number;
  emoji: string;
  title_en: string;
  title_ko: string;
  sort_order: number;
  book: string;
}

const TextbookProgressPage = () => {
  const { userId, progress, league, loading } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const fetchData = async () => {
      const [lbRes, lessonsRes] = await Promise.all([
        supabase.from("xp_leaderboard").select("*").limit(20),
        supabase.from("textbook_lessons").select("id, emoji, title_en, title_ko, sort_order, book").eq("is_published", true).order("sort_order"),
      ]);
      setLeaderboard((lbRes.data as unknown as LeaderboardEntry[]) || []);
      setLessons((lessonsRes.data as unknown as Lesson[]) || []);
    };
    fetchData();
  }, []);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-3xl text-center">
          <Trophy className="h-16 w-16 text-primary-text mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isAr ? "تقدمك في التعلم" : "Your Learning Progress"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isAr ? "سجّل الدخول لتتبع XP الخاص بك وكسب الشارات والتنافس!" : "Sign in to track your XP, earn badges, and compete on the leaderboard!"}
          </p>
          <Link to="/login?redirect=/textbook/progress" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90">
            {isAr ? "سجّل الدخول للبدء" : "Sign In to Start"}
          </Link>
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
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  const completedLessons = Object.values(progress.lessonProgress).filter(p => p.chapter_completed).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <Link to="/textbook" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          {isAr ? "→" : "←"} {isAr ? "العودة للكتاب" : "Back to Textbook"}
        </Link>

        {/* Hero Stats */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary-text" /> {isAr ? "تقدمي" : "My Progress"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedLessons} / {lessons.length} {isAr ? "مهمة مكتملة" : "missions completed"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <XpBadge xp={progress.totalXp} className="text-base px-3 py-1" />
              <StreakDisplay
                currentStreak={progress.streak.current_streak}
                longestStreak={progress.streak.longest_streak}
              />
            </div>
          </div>
          <LeagueProgressBar totalXp={progress.totalXp} />
        </div>

        <Tabs defaultValue="worlds" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="worlds" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="h-4 w-4 hidden sm:block" /> {isAr ? "العوالم" : "Worlds"}
            </TabsTrigger>
            <TabsTrigger value="leagues" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4 hidden sm:block" /> {isAr ? "الدوريات" : "Leagues"}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="h-4 w-4 hidden sm:block" /> {isAr ? "الشارات" : "Badges"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 hidden sm:block" /> {isAr ? "الترتيب" : "Leaderboard"}
            </TabsTrigger>
          </TabsList>

          {/* WORLDS OVERVIEW */}
          <TabsContent value="worlds">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Map className="h-5 w-5 text-primary-text" /> {isAr ? "خريطة العوالم" : "World Map"}
            </h2>
            <div className="space-y-4">
              {WORLDS.map((world) => {
                const wp = getWorldProgress(world, progress.lessonProgress as any, lessons);
                const isComplete = wp.percent === 100;
                const worldLessons = lessons.filter(
                  (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
                );

                return (
                  <div
                    key={world.key}
                    className={cn(
                      "rounded-xl border p-5 transition-all",
                      isComplete ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{world.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">
                          {isAr ? world.nameAr : world.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? world.descriptionAr : world.description}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-foreground">{wp.completed}/{wp.total}</p>
                        {isComplete && <span className="text-sm text-primary-text">✓</span>}
                      </div>
                    </div>
                    <Progress value={wp.percent} className="h-2 mb-3" />
                    {/* Mini lesson dots */}
                    <div className="flex flex-wrap gap-1.5">
                      {worldLessons.map((l) => {
                        const done = progress.lessonProgress[l.id]?.chapter_completed;
                        return (
                          <Link
                            key={l.id}
                            to={`/textbook/${l.book}/${l.sort_order}`}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110",
                              done ? "bg-primary/20 text-primary-text" : "bg-muted text-muted-foreground"
                            )}
                            title={l.title_en}
                          >
                            {l.emoji}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* LEAGUES */}
          <TabsContent value="leagues">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary-text" /> {isAr ? "نظام الدوريات" : "League System"}
            </h2>
            <LeagueCard leagueKey={league.key} totalXp={progress.totalXp} />
          </TabsContent>

          {/* BADGES */}
          <TabsContent value="badges">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-text" /> {isAr ? "الإنجازات" : "Achievements"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {progress.badges.length} / {14} {isAr ? "شارة مكتسبة" : "badges earned"}
            </p>
            <BadgeGrid earnedBadges={progress.badges} />
          </TabsContent>

          {/* LEADERBOARD */}
          <TabsContent value="leaderboard">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-text" /> {isAr ? "لوحة الترتيب" : "Leaderboard"}
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {isAr ? "لا يوجد متعلمون بعد. كن الأول!" : "No learners on the leaderboard yet. Be the first!"}
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const entryLeague = getLeague(entry.total_xp);
                  const isMe = entry.user_id === userId;
                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">
                          {entry.name || (isAr ? "متعلم مجهول" : "Anonymous Learner")} {isMe && <span className="text-xs text-primary-text">({isAr ? "أنت" : "you"})</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{entryLeague.emoji} {entryLeague.name}</p>
                      </div>
                      <XpBadge xp={entry.total_xp} />
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TextbookProgressPage;
