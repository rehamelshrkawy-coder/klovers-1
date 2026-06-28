import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap, Star, Trophy, Flame, Check } from "lucide-react";
import { getLeague, LEAGUES } from "@/constants/gamification";
import mascotImg from "@/assets/klovers-mascot.png";

// --- Floating XP animation ---
export function XpFloatAnimation({ xp, onComplete }: { xp: number; onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-bounce-up text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-2xl text-xl font-bold">
          <Zap className="h-6 w-6" />
          +{xp} XP
        </div>
      </div>
    </div>
  );
}

// --- Streak Celebration (Duolingo-style) ---
export function StreakCelebration({
  currentStreak,
  onContinue,
}: {
  currentStreak: number;
  onContinue: () => void;
}) {
  const today = new Date();
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const todayIndex = today.getDay();

  // Build a week view: past days completed, today highlighted, future empty
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3; // center today at index 3
    const dayIdx = (todayIndex + offset + 7) % 7;
    const isToday = offset === 0;
    const isPast = offset < 0;
    const completed = isPast || isToday;
    return { label: dayNames[dayIdx], isToday, completed };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={(event) => event.target === event.currentTarget && onContinue()}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && ["Enter", " ", "Escape"].includes(event.key)) onContinue();
      }}
      role="button"
      tabIndex={0}
      aria-label="Dismiss streak celebration"
    >
      <div className="max-w-sm w-full mx-4 text-center animate-scale-in">
        {/* Speech bubble */}
        <div className="relative bg-card border border-border rounded-2xl px-6 py-4 mb-4 shadow-lg animate-fade-in-down">
          <p className="text-sm text-foreground">
            Keep it up! You're building an amazing habit! 🎉
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r border-border rotate-45" />
        </div>

        {/* Mascot with flame shield */}
        <div className="relative flex justify-center mb-2">
          {/* Flame glow behind mascot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 animate-pulse-glow rounded-full" />
          {/* Flame icon */}
          <div className="relative animate-mascot-bounce">
            <Flame className="absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 text-primary animate-flame-flicker drop-shadow-lg" strokeWidth={2.5} />
            <img
              src={mascotImg}
              alt="KLovers Mascot"
              className="relative z-10 w-36 h-36 object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Big streak number */}
        <div className="animate-count-pop">
          <p className="text-7xl font-black text-primary text-outlined-lg leading-none tracking-tight">
            {currentStreak}
          </p>
          <p className="text-2xl font-bold text-primary text-outlined-lg mt-1">day streak</p>
        </div>

        {/* Weekly tracker */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-8">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-xs font-bold",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {day.label}
              </span>
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  day.completed
                    ? "bg-primary text-primary-foreground shadow-md animate-check-pop"
                    : "bg-muted"
                )}
                style={day.completed ? { animationDelay: `${i * 80}ms` } : undefined}
              >
                {day.completed && <Check className="h-4 w-4" strokeWidth={3} />}
              </div>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}

// --- League Promotion Celebration ---
export function LeaguePromotionModal({
  fromLeague,
  toLeague,
  onClose,
}: {
  fromLeague: string;
  toLeague: string;
  onClose: () => void;
}) {
  const from = LEAGUES.find((l) => l.key === fromLeague);
  const to = LEAGUES.find((l) => l.key === toLeague);

  if (!to) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && ["Enter", " ", "Escape"].includes(event.key)) onClose();
      }}
      role="button"
      tabIndex={0}
      aria-label="Dismiss league promotion"
    >
      <div className="max-w-sm w-full mx-4 text-center animate-scale-in">
        {/* Mascot celebration */}
        <div className="relative flex justify-center mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 animate-pulse-glow rounded-full" />
          <div className="relative animate-mascot-bounce">
            <img
              src={mascotImg}
              alt="KLovers Mascot celebrating"
              className="relative z-10 w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* League emoji */}
        <div className="text-7xl mb-2 animate-count-pop">{to.emoji}</div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className="text-primary animate-check-pop"
              style={{ animationDelay: `${i * 150}ms` }}
              size={i === 1 ? 28 : 22}
              fill="hsl(var(--primary))"
            />
          ))}
        </div>

        <h2 className="text-3xl font-black text-foreground mb-2">League Promoted!</h2>
        <p className="text-muted-foreground mb-2">
          {from && (
            <span>
              {from.emoji} {from.name} →{" "}
            </span>
          )}
          <span className="font-bold text-primary">{to.name}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Keep studying to reach the next league! 화이팅! 🔥
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}

// --- Badge Unlock Celebration ---
export function BadgeUnlockToast({ badgeName, badgeEmoji }: { badgeName: string; badgeEmoji: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{badgeEmoji}</span>
      <div>
        <p className="font-bold text-foreground">Badge Unlocked!</p>
        <p className="text-sm text-muted-foreground">{badgeName}</p>
      </div>
    </div>
  );
}

// --- Mission Complete Celebration ---
export function MissionCompleteOverlay({ lessonTitle, xpEarned, onContinue }: {
  lessonTitle: string;
  xpEarned: number;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="max-w-sm w-full mx-4 text-center animate-scale-in">
        {/* Mascot */}
        <div className="relative flex justify-center mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 animate-pulse-glow rounded-full" />
          <img
            src={mascotImg}
            alt="KLovers Mascot"
            className="relative z-10 w-28 h-28 object-contain drop-shadow-2xl animate-mascot-bounce"
          />
        </div>

        <div className="text-6xl mb-3 animate-count-pop">⭐</div>
        <h2 className="text-3xl font-black text-foreground mb-2">Mission Complete!</h2>
        <p className="text-muted-foreground mb-4">{lessonTitle}</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-lg mb-6">
          <Zap className="h-5 w-5" /> +{xpEarned} XP
        </div>
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// --- Perfect Score Celebration ---
export function PerfectScoreOverlay({ score, total, onContinue }: {
  score: number;
  total: number;
  onContinue: () => void;
}) {
  const confettiPieces = Array.from({ length: 30 }, (_, i) => i);
  const colors = ["#C60C30", "#003478", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md overflow-hidden"
      onClick={(event) => event.target === event.currentTarget && onContinue()}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && ["Enter", " ", "Escape"].includes(event.key)) onContinue();
      }}
      role="button"
      tabIndex={0}
      aria-label="Dismiss perfect score celebration"
    >
      {/* Confetti */}
      {confettiPieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti-fall pointer-events-none select-none text-lg"
          style={{
            left: `${(i / confettiPieces.length) * 100}%`,
            animationDelay: `${(i * 0.05) % 0.8}s`,
            animationDuration: `${1.2 + (i % 4) * 0.3}s`,
            color: colors[i % colors.length],
            fontSize: `${12 + (i % 3) * 6}px`,
          }}
        >
          {["★", "✦", "●", "◆", "▲"][i % 5]}
        </span>
      ))}

      <div className="max-w-sm w-full mx-4 text-center animate-scale-in">
        <div className="text-7xl mb-4 animate-count-pop">🌟</div>
        <h2 className="text-3xl font-black text-foreground mb-2">Perfect Score!</h2>
        <p className="text-muted-foreground mb-2">
          {score}/{total} — Flawless! 화이팅! 🔥
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-bold text-lg mb-6 border border-black/10">
          ⭐ You got them all!
        </div>
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg active:scale-95"
        >
          CONTINUE
        </button>
        <p className="text-xs text-muted-foreground mt-3">or tap anywhere</p>
      </div>
    </div>
  );
}
