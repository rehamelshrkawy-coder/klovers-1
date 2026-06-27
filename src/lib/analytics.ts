/**
 * Klovers Analytics — thin wrapper over PostHog REST capture API.
 *
 * Why REST instead of posthog-js SDK?
 * - Zero bundle impact (no npm dep)
 * - Works identically in PWA offline queue (fetch + keepalive)
 * - Graceful: if VITE_POSTHOG_KEY is unset, every call is a silent no-op
 *
 * Set in Vercel env:
 *   VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
 *   VITE_POSTHOG_HOST=https://app.posthog.com   (optional, defaults to EU cloud)
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.posthog.com";

// ─── Persistent anonymous device ID ──────────────────────────────────────────
function getDistinctId(): string {
  try {
    let id = localStorage.getItem("kl_did");
    if (!id) {
      id = `anon_${crypto.randomUUID()}`;
      localStorage.setItem("kl_did", id);
    }
    return id;
  } catch {
    return "anon_unknown";
  }
}

// ─── Identify logged-in user so events are attributed correctly ───────────────
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!KEY) return;
  try {
    localStorage.setItem("kl_did", userId);
  } catch {
    // Storage may be unavailable in privacy modes; identification still proceeds.
  }
  _send("$identify", {
    $anon_distinct_id: getDistinctId(),
    ...traits,
  });
}

// ─── Core typed event catalogue ───────────────────────────────────────────────
export type AnalyticsEvent =
  | { event: "page_viewed";            path: string; title?: string }
  | { event: "lesson_section_complete"; lessonId: number; section: string; xpEarned: number }
  | { event: "chapter_complete";        lessonId: number; totalXp: number }
  | { event: "game_played";             gameId: string; score: number; totalRounds: number; xpEarned: number }
  | { event: "quiz_submitted";          correct: number; total: number; score_pct: number }
  | { event: "streak_continued";        streakDays: number }
  | { event: "streak_broken";           previousStreak: number }
  | { event: "league_promoted";         fromLeague: string; toLeague: string; totalXp: number }
  | { event: "badge_earned";            badgeKey: string; badgeName: string }
  | { event: "enrollment_started";      classType: string; packageId?: string }
  | { event: "enrollment_completed";    classType: string; amount: number; currency: string }
  | { event: "placement_test_done";     level: string; score: number }
  | { event: "free_trial_booked";       slot: string }
  | { event: "review_session_done";     cardsReviewed: number; avgQuality: number }
  | { event: "pwa_installed" }
  | { event: "push_subscribed" }
  | { event: "nps_submitted";           score: number; feedback?: string }
  | { event: "referral_link_copied" }
  | { event: "blog_read";               slug: string; readTimeSeconds?: number };

/**
 * Capture a typed analytics event.
 *
 * @example
 * capture({ event: "lesson_section_complete", lessonId: 3, section: "vocab", xpEarned: 10 })
 */
export function capture(payload: AnalyticsEvent): void {
  const { event, ...properties } = payload;
  _send(event, properties);
}

// ─── Internal send ────────────────────────────────────────────────────────────
function _send(event: string, properties: Record<string, unknown> = {}): void {
  if (!KEY) return;
  const body = JSON.stringify({
    api_key: KEY,
    event,
    distinct_id: getDistinctId(),
    timestamp: new Date().toISOString(),
    properties: {
      $current_url: typeof window !== "undefined" ? window.location.href : "",
      $lib: "klovers-web",
      $lib_version: "1.0.0",
      app_env: import.meta.env.MODE,
      ...properties,
    },
  });

  // keepalive ensures the request completes even if the page unloads
  fetch(`${HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics failures are always non-fatal
  });
}

// ─── Page-view auto-tracking helper ──────────────────────────────────────────
/**
 * Call once from App.tsx to auto-track every client-side navigation.
 * Pass the current `pathname` from useLocation().
 */
export function trackPageView(pathname: string, title?: string): void {
  capture({ event: "page_viewed", path: pathname, title });
}
