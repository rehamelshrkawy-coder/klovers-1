import { useEffect, useMemo } from "react";
import { capture } from "@/lib/analytics";

interface ChurnInput {
  userId: string | null;
  lastActivityDate: string | null;   // ISO date string from student_streaks
  sessionsRemaining: number | null;  // from active enrollment
  currentStreak: number;
}

export interface ChurnSignal {
  /** Student hasn't studied in 3+ days while on an active streak */
  isInactiveRisk: boolean;
  /** Student has ≤ 2 sessions left — needs renewal nudge */
  isSessionLow: boolean;
  /** Student has 0 sessions left — urgent renewal */
  isSessionEmpty: boolean;
  /** Number of days since last activity (null if never studied) */
  daysSinceActivity: number | null;
}

/**
 * Detects churn and renewal signals for a student and fires analytics events
 * so the marketing team can trigger re-engagement campaigns.
 *
 * Rules:
 * - inactiveRisk  → last activity > 2 days ago AND had a streak (not a new user)
 * - sessionLow    → sessions_remaining in [1, 2]
 * - sessionEmpty  → sessions_remaining === 0
 *
 * Each signal fires exactly once per session (guarded by sessionStorage).
 */
export function useChurnPrevention({
  userId,
  lastActivityDate,
  sessionsRemaining,
  currentStreak,
}: ChurnInput): ChurnSignal {
  const daysSinceActivity = useMemo(() => {
    if (!lastActivityDate) return null;
    const last = new Date(lastActivityDate);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / 86_400_000);
  }, [lastActivityDate]);

  const isInactiveRisk = Boolean(
    daysSinceActivity !== null &&
    daysSinceActivity >= 3 &&
    currentStreak > 0   // exclude brand-new users who never built a streak
  );

  const isSessionLow = sessionsRemaining !== null &&
    sessionsRemaining >= 1 &&
    sessionsRemaining <= 2;

  const isSessionEmpty = sessionsRemaining === 0;

  // Fire analytics events once per browser session
  useEffect(() => {
    if (!userId) return;

    const fired = (key: string) => sessionStorage.getItem(`churn_${userId}_${key}`) === "1";
    const mark   = (key: string) => sessionStorage.setItem(`churn_${userId}_${key}`, "1");

    if (isInactiveRisk && !fired("inactive")) {
      capture({
        event: "streak_broken",
        previousStreak: currentStreak,
      } as any);
      mark("inactive");
    }

    if (isSessionLow && !fired("session_low")) {
      capture({
        event: "enrollment_started",
        classType: "renewal_nudge",
        packageId: "low_sessions",
      });
      mark("session_low");
    }

    if (isSessionEmpty && !fired("session_empty")) {
      capture({
        event: "enrollment_started",
        classType: "renewal_urgent",
        packageId: "zero_sessions",
      });
      mark("session_empty");
    }
  }, [userId, isInactiveRisk, isSessionLow, isSessionEmpty, currentStreak]);

  return { isInactiveRisk, isSessionLow, isSessionEmpty, daysSinceActivity };
}
