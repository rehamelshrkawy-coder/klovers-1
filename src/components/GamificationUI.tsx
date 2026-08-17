import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAGUES, getLeague, getLeagueProgress, BADGES } from "@/constants/gamification";
import { cn } from "@/lib/utils";
import { Flame, Trophy, Star, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// --- XP Badge (small inline) ---
export function XpBadge({ xp, className }: { xp: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold shadow-sm border border-black/15", className)}>
      <Zap className="h-3 w-3" /> {xp} XP
    </span>
  );
}

// --- XP Earned Animation ---
export function XpEarnedToast({ xp }: { xp: number }) {
  return (
    <div className="flex items-center gap-2">
      <Zap className="h-5 w-5 text-primary" />
      <span className="font-bold text-primary text-outlined">+{xp} XP</span>
    </div>
  );
}

// --- League Progress Bar ---
export function LeagueProgressBar({ totalXp }: { totalXp: number }) {
  const league = getLeague(totalXp);
  const pct = getLeagueProgress(totalXp);
  const nextLeague = LEAGUES[league.index + 1];
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{league.emoji}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{league.name}</p>
            <p className="text-xs text-muted-foreground">
              {totalXp.toLocaleString()} XP · League {league.index + 1} of {LEAGUES.length}
            </p>
          </div>
        </div>
        {nextLeague && (
          <p className="text-xs text-muted-foreground text-end">
            {(nextLeague.minXp - totalXp).toLocaleString()} XP to<br />
            <span className="font-medium">{nextLeague.emoji} {nextLeague.name}</span>
          </p>
        )}
      </div>
      <Progress value={displayPct} className="h-3 transition-all duration-1000 ease-out" />
    </div>
  );
}

// --- League Card ---
export function LeagueCard({ leagueKey, totalXp }: { leagueKey: string; totalXp: number }) {
  const currentLeague = getLeague(totalXp);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {LEAGUES.map((l, i) => {
        const unlocked = totalXp >= l.minXp;
        const isCurrent = l.key === currentLeague.key;
        return (
          <div
            key={l.key}
            className={cn(
              "rounded-xl border p-4 text-center transition-all",
              isCurrent && "border-amber-400 bg-amber-50 shadow-md ring-1 ring-black/10",
              unlocked && !isCurrent && "border-border bg-card",
              !unlocked && "border-border/50 bg-muted/30 opacity-60"
            )}
          >
            <span className="text-3xl block mb-2">{l.emoji}</span>
            <p className="font-bold text-sm text-foreground">{l.name}</p>
            <p className="text-xs text-muted-foreground">
              {l.maxXp === Infinity ? `${l.minXp}+ XP` : `${l.minXp} – ${l.maxXp} XP`}
            </p>
            {isCurrent && (
              <span className="mt-2 inline-block text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full border border-black/25">
                Current
              </span>
            )}
            {unlocked && !isCurrent && (
              <span className="mt-2 inline-block text-xs text-primary">✓ Unlocked</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Streak Display ---
export function StreakDisplay({
  currentStreak,
  longestStreak,
  isAtRisk = false,
}: {
  currentStreak: number;
  longestStreak: number;
  isAtRisk?: boolean;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Flame className={cn(
          "h-6 w-6 transition-colors",
          isAtRisk ? "text-red-500 animate-pulse" :
          currentStreak > 7 ? "text-orange-500" :
          currentStreak > 0 ? "text-orange-400" :
          "text-muted-foreground"
        )} />
        <div>
          <p className={cn("text-lg font-bold text-foreground", isAtRisk && "animate-shake")}>{currentStreak}</p>
          <p className="text-xs text-muted-foreground">
            {isAtRisk ? "⚠️ At risk today!" : "Day Streak"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <div>
          <p className="text-lg font-bold text-foreground">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
      </div>
    </div>
  );
}

// --- Badge Grid ---
export function BadgeGrid({ earnedBadges, loading = false }: { earnedBadges: string[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-3 space-y-2 animate-pulse">
            <Skeleton className="h-8 w-8 mx-auto rounded-full" />
            <Skeleton className="h-3 w-16 mx-auto rounded" />
            <Skeleton className="h-2.5 w-12 mx-auto rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {BADGES.map((b) => {
        const earned = earnedBadges.includes(b.key);
        return (
          <div
            key={b.key}
            className={cn(
              "rounded-xl border p-3 text-center transition-all",
              earned ? "border-amber-300 bg-amber-50 animate-badge-burst ring-1 ring-black/10" : "border-border/50 bg-muted/30 opacity-50"
            )}
          >
            <span className="text-2xl block mb-1">{b.emoji}</span>
            <p className="text-xs font-bold text-foreground">{b.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{b.description}</p>
            {earned && <Star className="h-3 w-3 text-amber-500 mx-auto mt-1" />}
          </div>
        );
      })}
    </div>
  );
}

// --- Lesson Progress Indicator (checkmarks per section) ---
export function LessonProgressDots({ progress }: {
  progress?: { vocab_done: boolean; grammar_done: boolean; dialogue_done: boolean; exercises_done: boolean; reading_done: boolean; chapter_completed: boolean }
}) {
  if (!progress) return null;
  const sections = [
    { key: "vocab_done", label: "V" },
    { key: "grammar_done", label: "G" },
    { key: "dialogue_done", label: "D" },
    { key: "exercises_done", label: "E" },
    { key: "reading_done", label: "R" },
  ];

  return (
    <div className="flex items-center gap-1">
      {sections.map((s) => (
        <span
          key={s.key}
          className={cn(
            "h-5 w-5 rounded-full text-[9px] font-bold flex items-center justify-center",
            progress[s.key as keyof typeof progress]
              ? "bg-amber-500 text-white border border-black/15"
              : "bg-muted text-muted-foreground"
          )}
        >
          {s.label}
        </span>
      ))}
      {progress.chapter_completed && <span className="text-xs ms-1">⭐</span>}
    </div>
  );
}

// --- Mission Start Banner ---
export function MissionStartBanner({ lessonNum, title, description, isBoss, isCheckpoint }: {
  lessonNum: number;
  title: string;
  description: string;
  isBoss: boolean;
  isCheckpoint: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 mb-6",
      isBoss ? "border-destructive/40 bg-destructive/5" : isCheckpoint ? "border-amber-300 bg-amber-50 ring-1 ring-black/10" : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {isBoss && <span className="text-lg">🐉</span>}
        {isCheckpoint && !isBoss && <span className="text-lg">🏁</span>}
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          {isBoss ? "Boss Challenge" : isCheckpoint ? "Checkpoint Mission" : `Mission ${lessonNum}`}
        </span>
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {isBoss && (
        <p className="text-xs text-destructive mt-2 font-medium">
          ⚠️ This boss challenge tests reading, grammar, and vocabulary!
        </p>
      )}
      {isCheckpoint && !isBoss && (
        <p className="text-xs text-amber-700 mt-2 font-medium">
          🏁 Complete this checkpoint to earn bonus XP!
        </p>
      )}
    </div>
  );
}
