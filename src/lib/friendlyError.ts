/**
 * Turns a thrown error into something a student can act on.
 *
 * Customer-facing toasts were showing `err.message` straight through, which
 * on a Supabase failure means text like
 *   `duplicate key value violates unique constraint "trial_bookings_pkey"`
 * or `TypeError: Failed to fetch`. That tells the student nothing they can
 * do, and it leaks schema details besides.
 *
 * Admin surfaces deliberately keep the raw message — staff debugging a failed
 * approval need the real constraint name.
 */

export interface FriendlyError {
  /** Safe to show. */
  message: string;
  /** True when reaching us is the sensible next step. */
  offerWhatsApp: boolean;
}

/** Postgres / PostgREST codes worth naming specifically. */
const BY_CODE: Record<string, string> = {
  "23505": "duplicate",
  "23503": "reference",
  "42501": "permission",
  "PGRST301": "auth",
};

function classify(err: unknown): string {
  const e = err as { code?: string; status?: number; message?: string } | null;
  const code = e?.code ?? "";
  if (BY_CODE[code]) return BY_CODE[code];

  const status = e?.status;
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rateLimit";
  if (typeof status === "number" && status >= 500) return "server";

  const msg = (e?.message ?? "").toLowerCase();
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("load failed")) {
    return "offline";
  }
  if (msg.includes("timeout") || msg.includes("aborted")) return "timeout";
  return "unknown";
}

/**
 * @param t         the translation function from useLanguage
 * @param err       whatever was caught
 */
export function friendlyError(
  t: (key: string) => string,
  err: unknown,
): FriendlyError {
  const kind = classify(err);
  // Log the real thing; show the readable one.
  console.error(`[${kind}]`, err);
  return {
    message: t(`errors.${kind}`),
    // A duplicate or a validation failure is self-service; anything that
    // looks like our fault gets a human.
    offerWhatsApp: kind === "server" || kind === "unknown" || kind === "permission",
  };
}
