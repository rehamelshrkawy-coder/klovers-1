import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { convertDateTimeToTimezone, zonedDateTimeToInstant } from "@/lib/admin-utils";
import {
  TRIAL_ANCHOR_TIMEZONE,
  TRIAL_DURATION_MIN,
  TRIAL_GROUP_SIZE_MAX,
} from "@/lib/siteConfig";

/**
 * The single source of truth for "when is the next trial class?".
 *
 * Every surface that shows trial times — the homepage hero chip and pill row,
 * the /free-trial schedule cards, the JSON-LD published to Google, and the
 * booking picker — used to carry its own hardcoded array of ISO instants.
 * There were three such arrays holding three different sets of dates, and all
 * of them were in the past, so the site advertised an empty schedule under the
 * heading "4 upcoming sessions" and published expired CourseInstance markup
 * with `availability: InStock`.
 */

/** Shape returned by the `get_trial_availability` RPC. */
interface TrialSlotRow {
  day_of_week: number;
  start_time: string;
  booked_count: number | null;
  capacity: number | null;
  duration_min: number | null;
  timezone: string | null;
  next_trial_date: string | null;
}

export interface TrialSession {
  /** Stable identity for React keys and picker values. */
  key: string;
  dayOfWeek: number;
  /** Wall-clock start time (HH:MM) in `sourceTimezone`. */
  startTime: string;
  /** Session date (YYYY-MM-DD) in `sourceTimezone`. */
  trialDate: string;
  /** Absolute instant the session begins. */
  startsAt: Date;
  sourceTimezone: string;
  capacity: number;
  bookedCount: number;
  spotsLeft: number;
  durationMin: number;
}

export interface TrialAvailability {
  sessions: TrialSession[];
  loading: boolean;
  /** True when the query itself failed — distinct from "genuinely no slots". */
  errored: boolean;
  /**
   * True only when upcoming sessions exist and every one of them is sold out.
   * The booking screen used to show "All sessions are currently full" for *any*
   * reason the query returned zero rows — no slots configured, all archived, a
   * language filter matching nothing — which is a false scarcity story and an
   * operational blind spot that silently converts the funnel at 0%.
   */
  allFull: boolean;
  /** Sum of remaining seats across all upcoming sessions. */
  spotsRemaining: number;
}

function nextDateForDayUTC(dayOfWeek: number): string {
  const today = new Date();
  let diff = dayOfWeek - today.getUTCDay();
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setUTCDate(today.getUTCDate() + diff);
  return next.toISOString().split("T")[0];
}

/** Normalise one RPC row into a session, or null when it is already past. */
function toSession(row: TrialSlotRow): TrialSession | null {
  const sourceTimezone = row.timezone || TRIAL_ANCHOR_TIMEZONE;
  const trialDate = row.next_trial_date ?? nextDateForDayUTC(row.day_of_week);
  const startTime = (row.start_time || "").slice(0, 5);
  const startsAt = zonedDateTimeToInstant(trialDate, startTime, sourceTimezone);
  if (!startsAt || startsAt.getTime() <= Date.now()) return null;

  const capacity = row.capacity ?? TRIAL_GROUP_SIZE_MAX;
  const bookedCount = Number(row.booked_count ?? 0);
  return {
    key: `${row.day_of_week}|${row.start_time}`,
    dayOfWeek: row.day_of_week,
    startTime,
    trialDate,
    startsAt,
    sourceTimezone,
    capacity,
    bookedCount,
    spotsLeft: Math.max(0, capacity - bookedCount),
    durationMin: row.duration_min ?? TRIAL_DURATION_MIN,
  };
}

/**
 * Live trial sessions, soonest first, already filtered to the future and to
 * slots that still have a seat.
 *
 * @param classLanguage Optional server-side filter ("arabic" | "english").
 */
export function useTrialAvailability(classLanguage?: "arabic" | "english" | null): TrialAvailability {
  const [rows, setRows] = useState<TrialSlotRow[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setErrored(false);
    supabase
      .rpc("get_trial_availability" as never, { p_language: classLanguage ?? null } as never)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("get_trial_availability failed:", error);
          setErrored(true);
          setRows([]);
          return;
        }
        setRows((data || []) as unknown as TrialSlotRow[]);
      });
    return () => { cancelled = true; };
  }, [classLanguage]);

  return useMemo(() => {
    const upcoming = (rows ?? [])
      .map(toSession)
      .filter((s): s is TrialSession => s !== null);
    const sessions = upcoming
      .filter((s) => s.spotsLeft > 0)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return {
      sessions,
      loading: rows === null,
      errored,
      allFull: upcoming.length > 0 && sessions.length === 0,
      spotsRemaining: sessions.reduce((sum, s) => sum + s.spotsLeft, 0),
    };
  }, [rows, errored]);
}

/** The visitor's IANA timezone, read from the browser on every call. */
export function visitorTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || TRIAL_ANCHOR_TIMEZONE;
  } catch {
    return TRIAL_ANCHOR_TIMEZONE;
  }
}

/**
 * Render a session in the visitor's timezone and language.
 * Weekday and month names come from the active locale — the Arabic booking
 * screen used to hardcode `en-US`, so it showed English weekday names inside
 * an otherwise-Arabic dropdown.
 */
export function formatSession(session: TrialSession, lang: "en" | "ar", tz = visitorTimezone()) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const { dateStr, timeFormatted } = convertDateTimeToTimezone(
    session.trialDate,
    session.startTime,
    session.sourceTimezone,
    tz,
  );
  const [y, m, d] = dateStr.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  const weekdayLong = local.toLocaleDateString(locale, { weekday: "long" });
  const weekdayShort = local.toLocaleDateString(locale, { weekday: "short" });
  const dateLabel = local.toLocaleDateString(locale, { month: "short", day: "numeric" });
  // `timeFormatted` is en-US 12h; re-render it in the active locale so Arabic
  // gets Arabic AM/PM markers rather than "PM".
  const time = session.startsAt.toLocaleTimeString(locale, {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz,
  }) || timeFormatted;
  /** Morning / evening band — present in the schema and never surfaced. */
  const hour24 = Number(
    session.startsAt.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: tz }),
  );
  const period: "morning" | "evening" = hour24 < 12 ? "morning" : "evening";
  return { weekdayLong, weekdayShort, dateLabel, time, period, localDate: dateStr };
}
