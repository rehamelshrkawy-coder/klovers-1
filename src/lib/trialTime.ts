import { tzOffsetMs } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

/**
 * Date arithmetic for trial scheduling.
 *
 * Kept separate from useTrialAvailability so it can be tested without pulling
 * in the Supabase client (which throws at import time when the environment is
 * not configured). These are the two calculations that were getting the wrong
 * answer in production, so they are the ones worth pinning down with tests.
 */

/**
 * Resolve a (date, wall-clock time, source timezone) triple to an absolute
 * instant. `2026-08-20 21:00 Asia/Kuala_Lumpur` is one moment in time
 * regardless of where the reader is sitting; only once it is an instant can
 * it be formatted into the viewer's own timezone correctly.
 */
export function resolveSlotInstant(
  dateStr: string | null,
  timeHHMM: string | null,
  sourceTz: string,
): Date | null {
  if (!dateStr || !timeHHMM) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  // Postgres `time` columns come back as HH:MM:SS; accept both.
  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(timeHHMM);
  if (!dateMatch || !timeMatch) return null;

  const [, y, mo, d] = dateMatch;
  const [, h, mi] = timeMatch;
  const guess = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  const offset = tzOffsetMs(new Date(guess), sourceTz);
  const instant = new Date(guess - offset);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/**
 * "Today" as the *viewer* sees it, as a YYYY-MM-DD string.
 *
 * The previous same-day check used `Date.now() + 8h` to approximate the
 * teacher's date. From 18:00 Cairo onward that rolled over to tomorrow, so a
 * student's own class disappeared from the duplicate-booking pre-check every
 * evening and they were invited to book a second one.
 */
export function viewerToday(timeZone = getUserTimezone()): string {
  try {
    // en-CA formats as YYYY-MM-DD, which compares and sorts lexically.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Sentinel used by the scheduling tables for "no end date". Previously the
 * bare literal 2099-12-31 appeared inline with no explanation of what it was.
 */
export const NO_END_DATE_SENTINEL = "2099-12-31";
