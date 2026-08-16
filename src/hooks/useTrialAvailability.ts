import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tzOffsetMs } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

/**
 * The single source of truth for "when is the next free trial class?".
 *
 * Before this hook, the hero and /free-trial each carried their own literal
 * array of ISO timestamps — five hardcoded date arrays across the codebase,
 * all of them already in the past, none of them agreeing with each other or
 * with the database. The slot picker was querying `get_trial_availability`
 * successfully the whole time; the marketing surfaces simply never asked.
 */

/** Fallback used only when a row somehow omits capacity. */
const DEFAULT_CAPACITY = 6;

/** The teacher's timezone; every trial time in the DB is anchored to it. */
const DEFAULT_SOURCE_TZ = "Asia/Kuala_Lumpur";

export interface TrialSlot {
  day_of_week: number;
  start_time: string;
  booked_count: number;
  capacity: number;
  duration_min: number;
  timezone: string;
  class_language: string | null;
  /** The concrete upcoming session date (YYYY-MM-DD) returned by the RPC. */
  next_trial_date: string | null;
  /** Absolute instant of this session, resolved from date + time + timezone. */
  startsAt: Date | null;
  spotsLeft: number;
}

export type AvailabilityStatus =
  | "loading"
  /** The query failed. Distinct from "no slots" — never render scarcity copy. */
  | "error"
  /**
   * The query succeeded and returned no rows at all: nothing is scheduled.
   * This is an operational problem, not a sales message.
   */
  | "unscheduled"
  /** Rows exist, but every one of them is at capacity. Genuinely full. */
  | "full"
  /** At least one bookable session. */
  | "ready";

export interface TrialAvailability {
  status: AvailabilityStatus;
  /** Bookable, future, soonest first. Empty unless status === "ready". */
  slots: TrialSlot[];
  /** Every row returned, including full ones — used to tell full from unscheduled. */
  allSlots: TrialSlot[];
  /** Sum of remaining seats across bookable sessions, or null when unknown. */
  spotsRemaining: number | null;
  /** The soonest upcoming session, or null. */
  nextSlot: TrialSlot | null;
  refresh: () => void;
}

/**
 * Resolve a (date, wall-clock time, source timezone) triple to an absolute
 * instant. `2026-08-20 21:00 Asia/Kuala_Lumpur` is one moment in time
 * regardless of where the reader is sitting; only then can it be formatted
 * into the viewer's own timezone correctly.
 */
export function resolveSlotInstant(
  dateStr: string | null,
  timeHHMM: string | null,
  sourceTz: string,
): Date | null {
  if (!dateStr || !timeHHMM) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
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
 * teacher's date. From 18:00 Cairo onward that rolled to tomorrow, so a
 * student's own class disappeared from the same-day pre-check every evening
 * and they were invited to book a duplicate.
 */
export function viewerToday(timeZone = getUserTimezone()): string {
  try {
    // en-CA formats as YYYY-MM-DD, which sorts and compares lexically.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Sentinel used by the scheduling tables for "no end date". Previously the
 * bare literal 2099-12-31 appeared inline with no explanation.
 */
export const NO_END_DATE_SENTINEL = "2099-12-31";

export function useTrialAvailability(classLanguage?: "arabic" | "english" | null): TrialAvailability {
  const [rows, setRows] = useState<TrialSlot[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setFailed(false);

    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_trial_availability", {
          p_language: classLanguage ?? null,
        });
        if (error) throw error;
        if (cancelled) return;

        const now = Date.now();
        const mapped: TrialSlot[] = ((data ?? []) as Record<string, unknown>[]).map((r) => {
          const capacity = Number(r.capacity ?? DEFAULT_CAPACITY);
          const booked = Number(r.booked_count ?? 0);
          const timezone = (r.timezone as string) || DEFAULT_SOURCE_TZ;
          const nextDate = (r.next_trial_date as string) ?? null;
          const startTime = (r.start_time as string) ?? null;
          return {
            day_of_week: Number(r.day_of_week),
            start_time: startTime ?? "",
            booked_count: booked,
            capacity,
            duration_min: Number(r.duration_min ?? 30),
            timezone,
            class_language: (r.class_language as string) ?? null,
            next_trial_date: nextDate,
            startsAt: resolveSlotInstant(nextDate, startTime, timezone),
            spotsLeft: Math.max(0, capacity - booked),
          };
        });

        // Drop anything already in the past. A slot with no resolvable instant
        // is kept — better to show a session without a countdown than to hide
        // a real class because one column was null.
        const upcoming = mapped.filter((s) => !s.startsAt || s.startsAt.getTime() > now);
        upcoming.sort((a, b) => (a.startsAt?.getTime() ?? Infinity) - (b.startsAt?.getTime() ?? Infinity));
        setRows(upcoming);
      } catch (err) {
        if (cancelled) return;
        console.error("get_trial_availability failed:", err);
        setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [classLanguage, nonce]);

  return useMemo<TrialAvailability>(() => {
    const refresh = () => setNonce((n) => n + 1);

    if (failed) {
      return { status: "error", slots: [], allSlots: [], spotsRemaining: null, nextSlot: null, refresh };
    }
    if (rows === null) {
      return { status: "loading", slots: [], allSlots: [], spotsRemaining: null, nextSlot: null, refresh };
    }

    const bookable = rows.filter((s) => s.spotsLeft > 0);

    /*
      Telling these two apart matters. "All sessions are currently full" used
      to fire whenever the query returned zero rows for any reason — including
      the schedule simply having run out — which told visitors a false scarcity
      story and produced a silent 0% conversion that nobody was paged about.
    */
    let status: AvailabilityStatus;
    if (rows.length === 0) {
      status = "unscheduled";
      console.warn(
        "[trial] get_trial_availability returned no rows — no trial sessions are scheduled. " +
        "This is a scheduling gap, not demand: visitors currently cannot book at all.",
      );
    } else if (bookable.length === 0) {
      status = "full";
    } else {
      status = "ready";
    }

    return {
      status,
      slots: bookable,
      allSlots: rows,
      spotsRemaining: bookable.reduce((sum, s) => sum + s.spotsLeft, 0),
      nextSlot: bookable[0] ?? null,
      refresh,
    };
  }, [rows, failed]);
}

/** Formats a slot's start for display in the viewer's own timezone and locale. */
export function formatSlot(
  slot: TrialSlot,
  language: "en" | "ar",
  timeZone = getUserTimezone(),
): { day: string; time: string; weekday: string } | null {
  if (!slot.startsAt) return null;
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const opts = { timeZone } as const;
  return {
    weekday: slot.startsAt.toLocaleDateString(locale, { weekday: "long", ...opts }),
    day: slot.startsAt.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric", ...opts }),
    time: slot.startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true, ...opts }),
  };
}
