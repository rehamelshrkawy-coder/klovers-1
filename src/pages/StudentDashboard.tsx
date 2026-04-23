import React, { lazy, Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResetGate } from "@/hooks/useResetGate";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyStepper from "@/components/JourneyStepper";
import StudentGroupAttendance from "@/components/StudentGroupAttendance";
import UpcomingSessionsCard from "@/components/UpcomingSessionsCard";
import MyTrialClassCard from "@/components/MyTrialClassCard";
import StudentAttendanceRequest from "@/components/StudentAttendanceRequest";
import AvatarUpload from "@/components/AvatarUpload";
import RegistrationChecklist from "@/components/RegistrationChecklist";
import { LeagueProgressBar, BadgeGrid } from "@/components/GamificationUI";
import { LeaguePromotionModal, BadgeUnlockToast, StreakCelebration } from "@/components/XpAnimation";
import { useGamification } from "@/hooks/useGamification";
import { useLanguage } from "@/contexts/LanguageContext";
import { BADGES } from "@/constants/gamification";
// Korean scene photos for immersive gallery
import imgJeju from "@/assets/blog/jeju-island.jpg";
import imgBBQ from "@/assets/blog/korean-bbq.jpg";
import imgTemple from "@/assets/blog/korean-temple.jpg";
import imgHanbok from "@/assets/blog/hanbok-fashion.jpg";
import imgKpop from "@/assets/blog/kpop-concert.jpg";
import imgNightMarket from "@/assets/blog/korean-nightmarket.jpg";
import imgTea from "@/assets/blog/korean-tea.jpg";
import imgMarket from "@/assets/blog/korean-market.jpg";
// Below-fold components — lazy loaded to keep initial paint fast
const AnalyticsSection = lazy(() =>
  import("@/components/AnalyticsSection").then(m => ({ default: m.AnalyticsSection }))
);
const AchievementMilestoneCard = lazy(() =>
  import("@/components/AchievementMilestoneCard").then(m => ({ default: m.AchievementMilestoneCard }))
);
const LearningGoalsCard = lazy(() =>
  import("@/components/LearningGoalsCard").then(m => ({ default: m.LearningGoalsCard }))
);
const LeaderboardCard = lazy(() =>
  import("@/components/LeaderboardCard").then(m => ({ default: m.LeaderboardCard }))
);
const StreakCalendar = lazy(() =>
  import("@/components/StreakCalendar").then(m => ({ default: m.StreakCalendar }))
);
const DailyBonusCard = lazy(() =>
  import("@/components/DailyBonusCard").then(m => ({ default: m.DailyBonusCard }))
);
import { AlertCircle, CheckCircle2, AlertTriangle, Package, CalendarCheck, Users, CreditCard, BookOpen, GraduationCap, RotateCcw, ChevronDown, Gamepad2, Trophy, Zap, Pencil, Check, X, FlameIcon, Download, Copy, Gift, FileText, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast, useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLevelByKey } from "@/constants/levels";
import WelcomeModal, { isOnboardingDone } from "@/components/WelcomeModal";
import { useCountUp } from "@/hooks/useCountUp";

interface EnrollmentRecord {
  id: string;
  plan_type: string;
  duration: number;
  sessions_total: number;
  sessions_remaining: number;
  unit_price: number;
  amount: number;
  currency: string;
  created_at: string;
  level: string | null;
  preferred_days: string[] | null;
  timezone: string | null;
}

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

interface AttendanceDate {
  date: string;
  source: string;
}

interface PlacementTestResult {
  score: number;
  level: string;
  created_at: string;
}

const AttendanceHistoryCard = ({ dates }: { dates: AttendanceDate[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Attendance History ({dates.length} sessions)
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-1">
              {dates.map((d, i) => (
                <div key={`${d.date}-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <CalendarCheck className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const ProfileCard = ({
  userId, avatarUrl, displayName, enrollmentCount, journeyStage,
  onAvatarUploaded, onNameUpdated,
}: {
  userId: string; avatarUrl: string; displayName: string; enrollmentCount: number;
  journeyStage: number; onAvatarUploaded: (url: string) => void; onNameUpdated: (name: string) => void;
}) => {
  const { t } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingName) setNameValue(displayName);
  }, [displayName, editingName]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === displayName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: nameValue.trim() }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: t("dashboardPage.errorTitle"), description: t("dashboardPage.couldNotUpdateName"), variant: "destructive" });
      return;
    }
    toast({ title: t("dashboardPage.nameUpdated") });
    onNameUpdated(nameValue.trim());
    setEditingName(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <AvatarUpload userId={userId} currentUrl={avatarUrl} name={displayName} onUploaded={onAvatarUploaded} />
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-[180px] text-sm"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveName} disabled={saving}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingName(false); setNameValue(displayName); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-lg">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNameValue(displayName); setEditingName(true); }}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{enrollmentCount} active package{enrollmentCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <JourneyStepper currentStage={journeyStage} />
      </CardContent>
    </Card>
  );
};

const StudentDashboard = () => {
  useSEO({ title: "My Dashboard", description: "Track your Korean learning progress, schedule, and achievements on Klovers.", canonical: "https://kloversegy.com/dashboard" });
  const { t } = useLanguage();
  const { loading: gateLoading, resetBlocked } = useResetGate();
  const { progress: gamification, league, loading: gamLoading, awardGameXp, leaguePromotion, newBadges, streakCelebration, clearLeaguePromotion, clearNewBadges, clearStreakCelebration } = useGamification();
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [profileLevel, setProfileLevel] = useState("");
  const [placementTest, setPlacementTest] = useState<PlacementTestResult | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [latestEnrollmentId, setLatestEnrollmentId] = useState("");
  const [attendanceDates, setAttendanceDates] = useState<AttendanceDate[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingEnrollments, setPendingEnrollments] = useState<{ id: string; plan_type: string; approval_status: string }[]>([]);
  const [bookAssignment, setBookAssignment] = useState<{ available_from: string } | null | undefined>(undefined);
  const vocabStorageKey = `vocab_xp_${new Date().toISOString().split("T")[0]}`;
  const [vocabClaimed, setVocabClaimed] = useState(() => !!localStorage.getItem(`vocab_xp_${new Date().toISOString().split("T")[0]}`));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast: uiToast } = useToast();

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          uiToast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  const FIELD_MAP: Record<string, string> = {
    name: "Full name",
    level: "Korean level",
    country: "Country",
    timezone: "Timezone",
    days: "Preferred class days",
  };

  const completeParam = searchParams.get("complete");
  const autoFocusField = completeParam ? FIELD_MAP[completeParam] || undefined : undefined;

  useEffect(() => {
    if (completeParam) {
      setSearchParams({}, { replace: true });
    }
  }, [completeParam, setSearchParams]);

  useEffect(() => {
    if (gateLoading || resetBlocked) return;
    const load = async () => {
      try {
      setFetchError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      // Referral count
      const { count: refCount } = await supabase
        .from("referral_conversions")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", session.user.id)
        .eq("xp_awarded", true);
      setReferralCount(refCount || 0);

      // Pending enrollments
      const { data: pendingEnrollData } = await supabase
        .from("enrollments")
        .select("id, plan_type, approval_status")
        .eq("user_id", session.user.id)
        .in("approval_status", ["PENDING_PAYMENT", "UNDER_REVIEW", "PENDING"]);
      setPendingEnrollments(pendingEnrollData || []);

      // Weekly XP: from Monday 00:00 local time
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const { data: weeklyXpData } = await supabase
        .from("student_xp")
        .select("xp_earned")
        .eq("user_id", session.user.id)
        .gte("created_at", monday.toISOString());
      setWeeklyXp((weeklyXpData || []).reduce((s: number, r: any) => s + (r.xp_earned || 0), 0));

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, name, level, country")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setAvatarUrl(profile.avatar_url || "");
        setUserName(profile.name || "");
        setProfileLevel(profile.level || "");
      }

      // Fetch latest placement test result
      const { data: ptData } = await supabase
        .from("placement_tests")
        .select("score, level, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ptData) {
        setPlacementTest(ptData as PlacementTestResult);
      }

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, sessions_total, sessions_remaining, unit_price, amount, currency, created_at, preferred_days, timezone, level")
        .eq("user_id", session.user.id)
        .eq("approval_status", "APPROVED")
        .eq("payment_status", "PAID")
        .order("created_at", { ascending: false });

      if (enrollmentData && enrollmentData.length > 0) {
        setEnrollments(enrollmentData as EnrollmentRecord[]);
        const latestEnroll = enrollmentData[0];
        setLatestEnrollmentId(latestEnroll.id);

        // Auto-sync: fill profile gaps from enrollment data
        const p = profile;
        const autoUpdates: Record<string, string> = {};
        if ((!p?.level || !p.level.trim()) && latestEnroll.level && latestEnroll.level.trim()) {
          autoUpdates.level = latestEnroll.level.trim();
        }
        if ((!p?.name || !p.name.trim()) && session.user.user_metadata?.name) {
          autoUpdates.name = session.user.user_metadata.name;
        }
        if (Object.keys(autoUpdates).length > 0) {
          await supabase.from("profiles").update(autoUpdates).eq("user_id", session.user.id);
          if (autoUpdates.name) setUserName(autoUpdates.name);
        }

        const effectiveLevel = autoUpdates.level || p?.level || "";
        const effectiveName = autoUpdates.name || p?.name || "";

        const items: ChecklistItem[] = [
          { key: "Full name", label: "Full name", completed: !!(effectiveName && effectiveName.trim() !== "") },
          { key: "Korean level", label: "Korean level", completed: !!(effectiveLevel && effectiveLevel.trim() !== "") },
          { key: "Country", label: "Country", completed: !!(p?.country && p.country.trim() !== "") },
          { key: "Preferred class days", label: "Preferred class days", completed: !!(latestEnroll.preferred_days && latestEnroll.preferred_days.length > 0) },
          { key: "Timezone", label: "Timezone", completed: !!(latestEnroll.timezone && latestEnroll.timezone.trim() !== "") },
        ];
        setChecklistItems(items);

        // Fetch all attendance dates from all sources
        const latestId = latestEnroll.id;
        const [adminRes, pkgRes, selfRes] = await Promise.all([
          supabase
            .from("admin_attendance_log")
            .select("session_date")
            .eq("enrollment_id", latestId),
          supabase
            .from("pkg_attendance")
            .select("session_id, pkg_group_sessions(session_date)")
            .eq("user_id", session.user.id)
            .eq("admin_approved", true),
          supabase
            .from("attendance_requests")
            .select("request_date")
            .eq("enrollment_id", latestId)
            .eq("status", "APPROVED"),
        ]);

        const dates: AttendanceDate[] = [
          ...(adminRes.data || []).map(r => ({ date: r.session_date, source: "Admin" as const })),
          ...(pkgRes.data || []).flatMap(r => {
            const sessions = r.pkg_group_sessions as { session_date: string } | null;
            return sessions?.session_date ? [{ date: sessions.session_date, source: "Group" as const }] : [];
          }),
          ...(selfRes.data || []).map(r => ({ date: r.request_date, source: "Self" as const })),
        ].sort((a, b) => a.date.localeCompare(b.date));
        setAttendanceDates(dates);

        // Fetch group membership
        const { data: groupData } = await supabase
          .from("pkg_group_members")
          .select("group_id, pkg_groups(name)")
          .eq("user_id", session.user.id)
          .eq("member_status", "active")
          .limit(1);
        if (groupData && groupData.length > 0) {
          const grp = groupData[0].pkg_groups as { name: string } | null;
          setGroupName(grp?.name || null);
        }
      } else {
        setHasNoData(true);
      }

      // Book assignment (outside enrollment block — assigned regardless of approval)
      const { data: bookData } = await supabase
        .from("book_assignments")
        .select("available_from")
        .eq("user_id", session.user.id)
        .eq("book_id", "hangul-1")
        .maybeSingle();
      setBookAssignment(bookData ?? null);

      setLoading(false);
      if (!isOnboardingDone()) setShowWelcome(true);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : t("dashboardPage.loadFailed"));
        setLoading(false);
      }
    };
    load();
  }, [navigate, gateLoading, resetBlocked, retryCount]);

  const handleItemCompleted = (key: string, _value: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, completed: true } : item))
    );
    if (key === "Full name") setUserName(_value);
  };

  // ── Hooks that must live before any early return ──────────────────────────
  const lessonsCompleted = Object.values(gamification.lessonProgress).filter((p) => p.chapter_completed).length;

  // Level-up flash: detect league change since last session
  const [showLevelUpFlash, setShowLevelUpFlash] = useState(false);
  const levelUpChecked = useRef(false);
  useEffect(() => {
    if (levelUpChecked.current || !league) return;
    levelUpChecked.current = true;
    const prevLeague = sessionStorage.getItem("kl_last_league");
    if (prevLeague && prevLeague !== league.key) {
      setShowLevelUpFlash(true);
      setTimeout(() => setShowLevelUpFlash(false), 2200);
    }
    sessionStorage.setItem("kl_last_league", league.key);
  }, [league]);

  // Animated count-up for numeric stats
  const xpCountUp = useCountUp(gamification.totalXp, 1200);
  const streakCountUp = useCountUp(gamification.streak.current_streak, 800);

  const quickStats = useMemo(() => [
    { label: "Total XP", rawValue: gamification.totalXp, sub: weeklyXp > 0 ? `+${weeklyXp} this week` : undefined, icon: Zap, color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30 border border-black/10 ring-1 ring-black/5" },
    { label: "Day Streak", rawValue: gamification.streak.current_streak, sub: `Best: ${gamification.streak.longest_streak}d`, icon: FlameIcon, color: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30" },
    { label: "Lessons Done", rawValue: lessonsCompleted, icon: BookOpen, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
    { label: "League", rawValue: -1, icon: Trophy, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
  ], [gamification.totalXp, gamification.streak.current_streak, gamification.streak.longest_streak, lessonsCompleted, league, weeklyXp]);

  const quickActions = useMemo(() => [
    { label: "Textbook", desc: "Continue lessons", emoji: "📚", path: "/textbook", bg: "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25" },
    { label: "Daily Quiz", desc: "+30 XP reward", emoji: "⚡", path: "/daily-quiz", bg: "bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-orange-500/25" },
    { label: "Games", desc: "20 fun games", emoji: "🎮", path: "/games", bg: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25" },
    { label: "Vocab Review", desc: "Spaced repetition", emoji: "🧠", path: "/review", bg: "bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-violet-500/25" },
  ], []);
  // ─────────────────────────────────────────────────────────────────────────

  if (gateLoading || resetBlocked || loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <main id="main-content" className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-16 rounded-xl" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-destructive font-medium">Failed to load dashboard</p>
            <p className="text-muted-foreground text-sm">{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); setRetryCount(c => c + 1); }}
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayName = userName || "Student";
  const hasBlockers = checklistItems.some(
    (i) => !i.completed && (i.key === "Preferred class days" || i.key === "Korean level")
  );
  const journeyStage = enrollments.length > 0 ? 2 : 1;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const todayStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const handleExportProgress = () => {
    const lines: string[] = [
      "KLOVERS KOREAN ACADEMY — STUDENT PROGRESS REPORT",
      "=".repeat(50),
      `Generated: ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      "",
      "STUDENT",
      `  Name:    ${userName || "—"}`,
      `  Level:   ${profileLevel || "—"}`,
      "",
      "LEARNING STATS",
      `  Total XP:        ${gamification.totalXp.toLocaleString()}`,
      `  Day Streak:      ${gamification.streak.current_streak} days`,
      `  Lessons Done:    ${lessonsCompleted} / 45`,
      `  League:          ${league ? `${league.emoji} ${league.name}` : "Beginner"}`,
      "",
      "ATTENDANCE",
      `  Sessions logged: ${attendanceDates.length}`,
      ...attendanceDates.map((d, i) => `  ${String(i + 1).padStart(3, " ")}. ${new Date(d.date + "T00:00:00").toLocaleDateString("en-GB")}  (${d.source})`),
      "",
      "PLACEMENT TEST",
      placementTest
        ? `  Score: ${placementTest.score}  |  Level: ${placementTest.level}  |  Date: ${new Date(placementTest.created_at).toLocaleDateString("en-GB")}`
        : "  No placement test on record",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klovers-progress-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {showLevelUpFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-level-up-flash flex items-center justify-center bg-amber-400/30">
          <div className="animate-scale-in text-center">
            <p className="text-5xl mb-2">{league?.emoji}</p>
            <p className="text-2xl font-black text-foreground text-outlined-lg">Level Up!</p>
            <p className="text-lg font-bold text-foreground">{league?.name}</p>
          </div>
        </div>
      )}
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ── Hero greeting ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl shrink-0 select-none ring-2 ring-primary/30">
                {displayName?.[0]?.toUpperCase() ?? "K"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{todayStr}</p>
                <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{greeting}, {displayName.split(" ")[0]} 👋</h1>
                {league && (
                  <p className="text-xs text-muted-foreground mt-0.5">{league.emoji} {league.name} · {gamification.totalXp.toLocaleString()} XP</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleExportProgress} className="gap-1.5 shrink-0 bg-background/80">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* ── Compact alerts (only rendered when active) ── */}
          {(() => {
            const alerts: React.ReactNode[] = [];
            const streak = gamification.streak.current_streak;
            const todayDate = new Date().toISOString().slice(0, 10);
            const lastActive = gamification.streak.last_activity_date?.slice(0, 10);
            if (streak >= 1 && lastActive !== todayDate) {
              alerts.push(
                <div key="streak" className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/60 rounded-xl px-3 py-2 text-sm">
                  <span className="animate-bounce text-base">🔥</span>
                  <span className="flex-1 font-medium text-orange-800 dark:text-orange-300">Keep your <strong>{streak}-day streak</strong> alive!</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 shrink-0 px-2" onClick={() => navigate("/games")}>Play →</Button>
                </div>
              );
            }
            if (enrollments.length > 0) {
              const remaining = enrollments[0].sessions_total - attendanceDates.length;
              if (remaining <= 2) {
                alerts.push(
                  <div key="sessions" className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl px-3 py-2 text-sm">
                    <span className="text-base">📦</span>
                    <span className="flex-1 font-medium text-blue-900 dark:text-blue-300">{remaining <= 0 ? "Package finished" : `Only ${remaining} session${remaining === 1 ? "" : "s"} left`}</span>
                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 px-2" onClick={() => navigate("/enroll-now")}>Renew →</Button>
                  </div>
                );
              }
            }
            pendingEnrollments.forEach(pe => {
              const label = pe.approval_status === "PENDING_PAYMENT" ? "Awaiting payment" : pe.approval_status === "UNDER_REVIEW" ? "Under review" : "Pending";
              alerts.push(
                <div key={pe.id} className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-muted-foreground capitalize">{pe.plan_type} enrollment — <strong>{label}</strong></span>
                </div>
              );
            });
            if (checklistItems.length > 0) {
              const done = checklistItems.filter(i => i.completed).length;
              const total = checklistItems.length;
              if (done < total) {
                alerts.push(
                  <div key="profile" className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl px-3 py-2 text-sm">
                    <span className="text-base">⚠️</span>
                    <span className="flex-1 font-medium text-amber-800 dark:text-amber-300">Profile {Math.round((done / total) * 100)}% complete</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 shrink-0 px-2" onClick={() => navigate("/dashboard?complete=name")}>Fix →</Button>
                  </div>
                );
              }
            }
            if (alerts.length === 0) return null;
            return <div className="space-y-1.5">{alerts}</div>;
          })()}

          {/* ── Stats row + Weekly Goal side-by-side ── */}
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 grid grid-cols-2 gap-3">
              {quickStats.map(({ label, rawValue, sub, icon: Icon, color }, idx) => {
                let displayValue: string;
                if (label === "Total XP") displayValue = xpCountUp.toLocaleString();
                else if (label === "Day Streak") displayValue = `${streakCountUp}d`;
                else if (label === "Lessons Done") displayValue = `${rawValue}/45`;
                else displayValue = league?.name ?? "Beginner";
                const isXP = label === "Total XP";
                return (
                  <Card key={label} className={`border-border/60 ${isXP ? "bg-gradient-to-br from-yellow-50/60 to-transparent dark:from-yellow-950/20 border-yellow-200/60 dark:border-yellow-800/40" : ""}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                        {label === "League" && league?.emoji
                          ? <span className="text-base leading-none">{league.emoji}</span>
                          : <Icon className="h-3.5 w-3.5" />}
                      </div>
                      <p className={`font-extrabold text-foreground leading-none truncate ${isXP ? "text-2xl" : "text-xl"}`}>{displayValue}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
                      {sub && <p className={`text-[10px] font-medium mt-0.5 ${isXP ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`}>{sub}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3">
              {(() => {
                const WEEKLY_GOAL = 300;
                const pct = Math.min(100, Math.round((weeklyXp / WEEKLY_GOAL) * 100));
                const msg = pct >= 100 ? "🎉 Goal crushed!" : pct >= 60 ? "Almost there!" : pct >= 30 ? "Good start!" : "Start earning XP";
                return (
                  <div className="flex-1 bg-card border border-border/60 rounded-2xl px-4 py-4 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Weekly XP</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs">{weeklyXp}/{WEEKLY_GOAL}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pct >= 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{msg}</p>
                  </div>
                );
              })()}
              <a
                href={`https://wa.me/601121777560?text=${encodeURIComponent("Hi! I'd like to book my next Korean class.")}`}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`https://wa.me/601121777560?text=${encodeURIComponent("Hi! I'd like to book my next Korean class.")}`, { cta_label: "dashboard_book" }); }}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#1a9e4f] dark:text-[#4ade80] rounded-xl px-3.5 py-2.5 transition-all text-sm font-medium"
              >
                <span className="text-base">📅</span>
                <span>Book a Class</span>
                <span className="text-xs opacity-60 ml-auto">WhatsApp →</span>
              </a>
            </div>
          </div>

          {/* ── TODAY zone — vocab + bonus + actions grouped ── */}
          <div className="bg-muted/25 border border-border/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-sm font-bold text-foreground">Today</h2>
              <span className="text-xs text-muted-foreground">{todayStr}</span>
            </div>

            {/* Vocab of the day — photo background */}
            {(() => {
              const VOCAB = [
                { ko: "안녕하세요", rom: "annyeonghaseyo", en: "Hello / Good day", emoji: "👋", img: imgTemple },
                { ko: "감사합니다", rom: "gamsahamnida", en: "Thank you", emoji: "🙏", img: imgTea },
                { ko: "사랑해요", rom: "saranghaeyo", en: "I love you", emoji: "❤️", img: imgHanbok },
                { ko: "공부하다", rom: "gongbuhada", en: "To study", emoji: "📚", img: imgMarket },
                { ko: "맛있어요", rom: "massisseoyo", en: "It's delicious", emoji: "😋", img: imgBBQ },
                { ko: "화이팅", rom: "hwaiting", en: "Fighting! / You can do it!", emoji: "💪", img: imgKpop },
                { ko: "천천히", rom: "cheoncheonhi", en: "Slowly", emoji: "🐢", img: imgJeju },
              ];
              const today = VOCAB[new Date().getDay() % VOCAB.length];
              const handleVocabClaim = async () => {
                if (vocabClaimed) return;
                await awardGameXp("vocab_daily", 5, 1);
                localStorage.setItem(vocabStorageKey, "1");
                setVocabClaimed(true);
                toast({ title: t("dashboardPage.xpBonus"), description: t("dashboardPage.vocabBonus") });
              };
              return (
                <div className="relative overflow-hidden rounded-xl h-28">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${today.img})` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/15" />
                  <div className="relative h-full flex items-center gap-4 px-5">
                    <div className="text-3xl drop-shadow">{today.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Word of the day</p>
                      <p className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">{today.ko}</p>
                      <p className="text-xs text-white/70">{today.rom} · {today.en}</p>
                    </div>
                    <Button size="sm" disabled={vocabClaimed} onClick={handleVocabClaim}
                      className={`shrink-0 ${vocabClaimed ? "bg-white/20 text-white/60 hover:bg-white/20" : "bg-white text-black hover:bg-white/90"}`}
                      variant={vocabClaimed ? "outline" : "default"}>
                      {vocabClaimed ? "✓ +5 XP" : "Claim +5 XP"}
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Daily Bonus */}
            <Suspense fallback={<div className="h-20 bg-background/60 rounded-xl animate-pulse" />}>
              <DailyBonusCard />
            </Suspense>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map(({ label, desc, emoji, path, bg }) => (
                <button key={label} onClick={() => navigate(path)} aria-label={`${label}: ${desc}`}
                  className={`group rounded-xl p-3 text-left shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${bg}`}>
                  <div className="text-xl mb-1">{emoji}</div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-white/75 text-[11px]">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Hangul Book card ── */}
          {bookAssignment !== undefined && bookAssignment !== null && (() => {
            const now = Date.now();
            const unlockMs = new Date(bookAssignment.available_from).getTime();
            const isLive = unlockMs <= now;
            const daysLeft = Math.ceil((unlockMs - now) / (1000 * 60 * 60 * 24));
            return (
              <div className={`relative overflow-hidden rounded-2xl border p-4 flex items-center gap-4 ${isLive ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-200/80 dark:border-amber-800/60" : "bg-muted/30 border-border/60"}`}>
                {/* Glow ring when live */}
                {isLive && <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/30 pointer-events-none" />}
                {/* Book icon */}
                <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 text-2xl font-black ${isLive ? "bg-amber-400 text-black shadow-lg shadow-amber-400/40" : "bg-muted text-muted-foreground"}`}>
                  {isLive ? "📖" : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground leading-tight">Hangul Book 1 — الهانغول</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isLive
                      ? "Your book is ready! Learn the Korean alphabet."
                      : `Unlocks in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} · ${new Date(bookAssignment.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                  </p>
                  {isLive && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">🎬 K-Drama</span>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">🎵 K-Pop</span>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Level 1</span>
                    </div>
                  )}
                </div>
                {isLive ? (
                  <Button size="sm" className="shrink-0 bg-amber-400 hover:bg-amber-500 text-black font-bold shadow-md" onClick={() => navigate("/hangul-book")}>
                    Open Book →
                  </Button>
                ) : (
                  <div className="shrink-0 text-center">
                    <div className="text-2xl font-black text-muted-foreground leading-none">{daysLeft}</div>
                    <div className="text-[10px] text-muted-foreground">days</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Discover Korea Gallery ── */}
          {(() => {
            const SCENES = [
              { img: imgJeju,        ko: "제주도",   en: "Jeju Island",       caption: "Volcanic paradise" },
              { img: imgBBQ,         ko: "삼겹살",   en: "Korean BBQ",         caption: "Grilled pork belly" },
              { img: imgTemple,      ko: "사찰",     en: "Buddhist Temple",    caption: "Mountain temples" },
              { img: imgHanbok,      ko: "한복",     en: "Traditional Hanbok", caption: "Centuries of fashion" },
              { img: imgKpop,        ko: "케이팝",   en: "K-Pop Concert",      caption: "Global music wave" },
              { img: imgNightMarket, ko: "야시장",   en: "Night Market",       caption: "Street food & vibes" },
              { img: imgTea,         ko: "차 문화",  en: "Tea Culture",        caption: "Calm & tradition" },
              { img: imgMarket,      ko: "전통시장", en: "Traditional Market", caption: "Colors & local life" },
            ];
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🇰🇷 Discover Korea</h2>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                  {SCENES.map(({ img, ko, en, caption }) => (
                    <div key={ko} className="relative flex-none w-36 h-44 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
                      <img src={img} alt={en} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white font-bold text-base leading-tight">{ko}</p>
                        <p className="text-white/75 text-[10px] leading-tight">{en}</p>
                        <p className="text-white/50 text-[9px] mt-0.5">{caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Refer a Friend — slim strip ── */}
          {userId && (() => {
            const refLink = `https://kloversegy.com/free-trial?ref=${userId}`;
            return (
              <div className="flex items-center gap-3 bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-xl px-4 py-2.5">
                <Gift className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="flex-1 text-sm text-muted-foreground min-w-0 truncate">
                  <strong className="text-foreground">Refer a friend</strong> · earn 150 XP
                  {referralCount > 0 && <> · <span className="text-violet-600 font-medium">{referralCount} joined</span></>}
                </span>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(refLink); toast({ title: "Link copied! 🎁" }); }}
                  className="shrink-0 gap-1 border-violet-300 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 h-7 text-xs px-2">
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
            );
          })()}

          {hasNoData ? (
            /* ── No-enrollment state: show learning features + enroll CTA ── */
            <div className="space-y-6">
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-transparent ring-1 ring-black/10">
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-black/10">
                      <GraduationCap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Start Your Korean Journey</h2>
                      <p className="text-sm text-muted-foreground mt-1">Join live classes with expert teachers, track your progress, and connect with other K-drama fans learning Korean.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex -space-x-1">
                      {["🇪🇬","🇸🇦","🇦🇪","🇯🇴"].map((flag, i) => (
                        <span key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm">{flag}</span>
                      ))}
                    </div>
                    <span>Join <strong className="text-foreground">500+</strong> students from Egypt &amp; the Arab world</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    {[
                      { emoji: "🎓", text: "Live group & private classes" },
                      { emoji: "📊", text: "Progress tracking & analytics" },
                      { emoji: "🏆", text: "XP, badges & leaderboards" },
                    ].map(({ emoji, text }) => (
                      <div key={text} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2 border border-border">
                        <span>{emoji}</span>
                        <span className="text-muted-foreground">{text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => navigate("/enroll-now")} size="lg" className="flex-1">Enroll Now</Button>
                    <Button variant="outline" size="lg" onClick={() => navigate("/free-trial")} className="flex-1">Book a Free Trial</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Still show level test for unenrolled */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Korean Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileLevel ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="text-sm px-3 py-1">{getLevelByKey(profileLevel)?.shortLabel || profileLevel}</Badge>
                        {placementTest && (
                          <p className="text-xs text-muted-foreground mt-1">Score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Find your Korean level</p>
                      <Button size="sm" onClick={() => navigate("/placement-test")}>
                        <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Take Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Still show gamification for unenrolled learners */}
              <Suspense fallback={<div className="h-40 bg-muted/30 rounded-2xl animate-pulse" />}>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5" /> My League</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LeagueProgressBar totalXp={gamification.totalXp} />
                    {gamLoading ? (
                      <BadgeGrid earnedBadges={[]} loading />
                    ) : gamification.badges.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Earned Badges ({gamification.badges.length})</p>
                        <BadgeGrid earnedBadges={gamification.badges} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Complete lessons and games to earn badges.</p>
                    )}
                  </CardContent>
                </Card>
                <AchievementMilestoneCard />
              </div>
              <StreakCalendar />
              <LeaderboardCard />
              </Suspense>
            </div>
          ) : (
            <>
              {/* ── Two-column layout: Profile + League ── */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Profile Card */}
                <ProfileCard
                  userId={userId}
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  enrollmentCount={enrollments.length}
                  journeyStage={journeyStage}
                  onAvatarUploaded={(url) => setAvatarUrl(url)}
                  onNameUpdated={(name) => setUserName(name)}
                />

                {/* League & XP */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="h-5 w-5" /> My League
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <LeagueProgressBar totalXp={gamification.totalXp} />
                    {gamLoading ? (
                      <BadgeGrid earnedBadges={[]} loading />
                    ) : gamification.badges.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Earned Badges ({gamification.badges.length})</p>
                        <BadgeGrid earnedBadges={gamification.badges} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Complete lessons and games to earn badges.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Korean Level + Registration Checklist (two-col) ── */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" /> Korean Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profileLevel ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="text-sm px-3 py-1">{getLevelByKey(profileLevel)?.shortLabel || profileLevel}</Badge>
                          {placementTest && (
                            <p className="text-xs text-muted-foreground mt-1">Score: {placementTest.score}/40 — {new Date(placementTest.created_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/placement-test")}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Take the placement test to find your level</p>
                        <Button size="sm" onClick={() => navigate("/placement-test")}>
                          <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Take Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Package summary card (most recent) */}
                {enrollments[0] && (() => {
                  const enrollment = enrollments[0];
                  const totalUsed = attendanceDates.length;
                  const remaining = enrollment.sessions_total - totalUsed;
                  const extra = remaining < 0 ? Math.abs(remaining) : 0;
                  const due = Math.round(extra * enrollment.unit_price);
                  const curr = enrollment.currency === "EGP" ? "LE" : "$";
                  return (
                    <Card className={remaining <= 0 && totalUsed > 0 ? "border-green-500 border-2" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span className="capitalize">{enrollment.plan_type}</span> — {enrollment.duration}mo
                          </CardTitle>
                          <Badge variant={remaining >= 0 ? "default" : "destructive"}>
                            {remaining >= 0 ? `${remaining} left` : `${extra} extra`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: "Package", val: enrollment.sessions_total, red: false },
                            { label: "Used", val: totalUsed, red: false },
                            { label: remaining >= 0 ? "Remaining" : "Extra", val: remaining >= 0 ? remaining : extra, red: remaining < 0 },
                            { label: "Due", val: `${curr}${due.toLocaleString()}`, red: due > 0 },
                          ].map(({ label, val, red }) => (
                            <div key={label} className={`rounded-lg p-3 text-center border ${red ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border"}`}>
                              <span className="text-[10px] text-muted-foreground block">{label}</span>
                              <p className={`text-lg font-bold ${red ? "text-destructive" : "text-foreground"}`}>{val}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Sessions used</span>
                            <span>{Math.min(totalUsed, enrollment.sessions_total)}/{enrollment.sessions_total}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? "bg-destructive" : remaining <= 2 ? "bg-amber-500" : "bg-amber-400"}`}
                              style={{ width: `${Math.min(100, (totalUsed / enrollment.sessions_total) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {due > 0 && (
                          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span><strong>{extra}</strong> extra sessions — Due: <strong>{curr}{due.toLocaleString()}</strong></span>
                          </div>
                        )}
                        {groupName && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>Group: <strong className="text-foreground">{groupName}</strong></span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* ── Registration Checklist ── */}
              <RegistrationChecklist userId={userId} enrollmentId={latestEnrollmentId} items={checklistItems} onItemCompleted={handleItemCompleted} autoFocusField={autoFocusField} />

              {/* ── Achievements + Goals (two-col) ── */}
              <div className="grid md:grid-cols-2 gap-4">
                <AchievementMilestoneCard />
                <LearningGoalsCard />
              </div>

              {/* ── Analytics (full width) ── */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Your Learning Analytics</h3>
                <AnalyticsSection />
              </div>

              {/* ── Streak Calendar (full width) ── */}
              <StreakCalendar />

              {/* ── Leaderboard (full width) ── */}
              <LeaderboardCard />

              {/* ── Attendance & Admin (bottom section) ── */}
              <StudentAttendanceRequest userId={userId} />

              {/* Additional packages (if > 1) */}
              {enrollments.slice(1).map((enrollment) => {
                const totalUsed = enrollment.sessions_total - enrollment.sessions_remaining;
                const remaining = enrollment.sessions_total - totalUsed;
                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                const due = Math.round(extra * enrollment.unit_price);
                const curr = enrollment.currency === "EGP" ? "LE" : "$";
                return (
                  <Card key={enrollment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="capitalize">{enrollment.plan_type}</span> — {enrollment.duration}mo
                          <Badge variant="outline" className="ml-1 text-xs">Older</Badge>
                        </CardTitle>
                        <Badge variant={remaining >= 0 ? "secondary" : "destructive"}>
                          {remaining >= 0 ? `${remaining} left` : `${extra} extra`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: "Package", val: enrollment.sessions_total },
                          { label: "Used", val: totalUsed },
                          { label: remaining >= 0 ? "Remaining" : "Extra", val: remaining >= 0 ? remaining : extra },
                          { label: "Due", val: `${curr}${due.toLocaleString()}` },
                        ].map(({ label, val }) => (
                          <div key={label} className="rounded-lg bg-muted/50 border border-border p-2 text-center">
                            <span className="text-[10px] text-muted-foreground block">{label}</span>
                            <p className="text-base font-bold text-foreground">{val}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {attendanceDates.length > 0 && <AttendanceHistoryCard dates={attendanceDates} />}
              <MyTrialClassCard />
              <UpcomingSessionsCard />
              <StudentGroupAttendance />

              {/* ── Progress Report + Certificate ── */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(`/progress-report?uid=${userId}`, '_blank')}
                  className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-amber-300 hover:bg-amber-50 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-black/10">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Progress Report</span>
                  <span className="text-xs text-muted-foreground">Download PDF</span>
                </button>
                <button
                  onClick={() => window.open(`/certificate?uid=${userId}&level=${encodeURIComponent(profileLevel || 'A0')}`, '_blank')}
                  className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-amber-300 hover:bg-amber-50 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-black/10">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Certificate</span>
                  <span className="text-xs text-muted-foreground">Download PNG</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      {streakCelebration !== null && <StreakCelebration currentStreak={streakCelebration} onContinue={clearStreakCelebration} />}
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
