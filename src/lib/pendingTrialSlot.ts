/**
 * A trial slot chosen on /free-trial, held across the account step.
 *
 * The booking flow used to sit entirely behind signup: a visitor had to
 * create an account before they could see a single available time. The picker
 * now lives on the public landing page, and the choice travels with them
 * through signup so they never pick twice.
 *
 * sessionStorage, not the URL or localStorage: this is transient intent that
 * should not be shareable, bookmarkable, or still sitting there next week.
 */

export const PENDING_TRIAL_SLOT_KEY = "klovers_pending_trial_slot";

export interface PendingTrialSlot {
  day_of_week: number;
  start_time: string;
  trial_date: string | null;
  class_language: "arabic" | "english";
}

function isValid(v: unknown): v is PendingTrialSlot {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.day_of_week === "number" &&
    typeof o.start_time === "string" &&
    (o.trial_date === null || typeof o.trial_date === "string") &&
    (o.class_language === "arabic" || o.class_language === "english")
  );
}

/** Reads the pending slot, if one was stored and still parses. */
export function readPendingTrialSlot(): PendingTrialSlot | null {
  try {
    const raw = sessionStorage.getItem(PENDING_TRIAL_SLOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Clears it. Call once the booking is committed, so a later visit starts clean. */
export function clearPendingTrialSlot(): void {
  try { sessionStorage.removeItem(PENDING_TRIAL_SLOT_KEY); } catch { /* ignore */ }
}
