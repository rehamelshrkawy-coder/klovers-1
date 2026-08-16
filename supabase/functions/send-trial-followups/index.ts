// Post-trial follow-up sequence dispatcher.
// Invoked hourly by pg_cron (trigger_trial_followups). Idempotent: each
// trial_booking tracks which stages have been sent, so re-running the
// same hour is a no-op.
//
// Three stages:
//   prep  — trial is tomorrow (Cairo)        → placement test + prep tips
//   day1  — trial was yesterday (Cairo)      → pricing CTA
//   day3  — trial was 3 days ago (Cairo)     → WhatsApp final nudge
//
// Users who already have an APPROVED enrollment are skipped (they converted).

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Stage = "prep" | "day1" | "day3" | "day7";

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  user_id: string | null;
  level: string | null;
  start_time: string | null;
  timezone: string | null;
  confirmation_token: string | null;
  class_language: string | null;
  followup_prep_sent_at: string | null;
  followup_day1_sent_at: string | null;
  followup_day3_sent_at: string | null;
  followup_day7_sent_at: string | null;
}

/** Zone the day-offset stages are counted in — the students' market. */
const FOLLOWUP_TIMEZONE = "Africa/Cairo";

/** Mirrors TRIAL_ANCHOR_TIMEZONE in src/lib/siteConfig.ts. */
const TRIAL_ANCHOR_TIMEZONE = "Asia/Kuala_Lumpur";

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  if (classLanguage === "arabic") return "ar";
  return "en";
}

const STAGE_TEMPLATE: Record<Stage, "trial_prep" | "trial_followup_day1" | "trial_followup_day3" | "trial_followup_day7"> = {
  prep: "trial_prep",
  day1: "trial_followup_day1",
  day3: "trial_followup_day3",
  day7: "trial_followup_day7",
};

const STAGE_COLUMN: Record<Stage, "followup_prep_sent_at" | "followup_day1_sent_at" | "followup_day3_sent_at" | "followup_day7_sent_at"> = {
  prep: "followup_prep_sent_at",
  day1: "followup_day1_sent_at",
  day3: "followup_day3_sent_at",
  day7: "followup_day7_sent_at",
};

// Offset in days from today (Cairo) to the trial_date we want to target.
// prep  → trial is tomorrow  (+1)
// day1  → 2 days after trial (-2) — softer cadence, not next morning
// day3  → 3 days after trial (-3) — WhatsApp nudge
// day7  → 7 days after trial (-7) — qualitative check-in + share link
const STAGE_DAY_OFFSET: Record<Stage, number> = {
  prep: 1,
  day1: -2,
  day3: -3,
  day7: -7,
};

async function dispatchStage(
  supabase: ReturnType<typeof createClient>,
  stage: Stage,
): Promise<{ stage: Stage; attempted: number; sent: number; skipped: number; errors: string[] }> {
  const column = STAGE_COLUMN[stage];
  const offset = STAGE_DAY_OFFSET[stage];

  // Ask Intl for the date in the zone rather than adding a fixed offset. This
  // used to add a hardcoded two hours on the stated grounds that "Egypt has had
  // no DST since 2011" — Egypt reinstated DST in 2023, so Africa/Cairo is UTC+3
  // from late April to late October. Half the year the offset was wrong by an
  // hour, and any run in the hour before local midnight therefore resolved to
  // the wrong DATE and dispatched a stage to the wrong cohort.
  const targetDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: FOLLOWUP_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() + offset * 86_400_000));

  // Query bookings whose trial_date matches the target and whose stage column is null.
  // Exclude TBA placeholders and anyone with an APPROVED enrollment.
  const { data: bookings, error } = await supabase
    .from("trial_bookings")
    .select(`id, name, email, trial_date, start_time, timezone, confirmation_token, user_id, level, class_language, followup_prep_sent_at, followup_day1_sent_at, followup_day3_sent_at, followup_day7_sent_at`)
    .eq("trial_date", targetDate)
    .is(column, null)
    .not("is_tba", "is", true)
    .not("email", "is", null)
    .limit(200);

  if (error) throw new Error(`query ${stage}: ${error.message}`);

  const rows = (bookings ?? []) as Booking[];
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Collect user_ids to check enrollment status in one round trip.
  const userIds = rows.map(r => r.user_id).filter((u): u is string => Boolean(u));
  let approvedUsers = new Set<string>();
  if (userIds.length > 0) {
    const { data: enrolls } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("status", "APPROVED")
      .in("user_id", userIds);
    approvedUsers = new Set((enrolls ?? []).map(e => e.user_id as string));
  }

  for (const b of rows) {
    if (b.user_id && approvedUsers.has(b.user_id)) {
      // Already a paying student — mark the column so we stop re-querying this row.
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      skipped++;
      continue;
    }
    if (!b.email) { skipped++; continue; }

    // For day-7, include a referral share link from the profile
    let referralUrl: string | undefined;
    if (stage === "day7" && b.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("unsubscribe_token")
        .eq("user_id", b.user_id)
        .maybeSingle();
      referralUrl = `https://kloversegy.com/free-trial?ref=${b.user_id}`;
      void profile; // unsubscribe_token fetched but handled in send-confirmation-email
    }

    try {
      const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: b.email,
          name: b.name || "there",
          language: pickLanguage(b.class_language),
          template: STAGE_TEMPLATE[stage],
          level: b.level,
          ...(referralUrl ? { referral_url: referralUrl } : {}),
          // The day-before email carries the RSVP. /rsvp was previously
          // orphaned — nothing linked to it and it wrote nothing — which is
          // why attendance_response was null for every booking ever made.
          ...(stage === "prep" && b.confirmation_token
            ? {
                booking_id: b.id,
                confirmation_token: b.confirmation_token,
                trial_date: b.trial_date,
                trial_time: b.start_time,
                trial_timezone: b.timezone,
              }
            : {}),
        },
      });
      if (sendErr) throw new Error(sendErr.message);
      await supabase.from("trial_bookings").update({ [column]: new Date().toISOString() }).eq("id", b.id);
      sent++;
    } catch (e) {
      errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { stage, attempted: rows.length, sent, skipped, errors };
}

/**
 * Resolve a wall-clock date + time in `tz` to the instant it denotes.
 * Mirrors zonedDateTimeToInstant in src/lib/admin-utils.ts; the two runtimes
 * cannot share a module.
 */
function zonedDateTimeToInstant(dateStr: string, timeHHMM: string, tz: string): Date | null {
  if (!dateStr || !timeHHMM || !/^\d{1,2}:\d{2}/.test(timeHHMM)) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeHHMM.split(":").map(Number);
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null;
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(guess)).reduce((a, part) => {
    a[part.type] = part.value; return a;
  }, {} as Record<string, string>);
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    hour, Number(parts.minute), Number(parts.second),
  );
  return new Date(guess - (asUTC - guess));
}

/**
 * The reminder on the day itself.
 *
 * The cron runs hourly, so the window is generous enough that no booking falls
 * between two runs, and `followup_hour_before_sent_at` guarantees one send
 * regardless of overlap.
 */
const HOUR_BEFORE_WINDOW_MIN = 100;

async function dispatchHourBefore(
  supabase: ReturnType<typeof createClient>,
): Promise<{ stage: string; attempted: number; sent: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  // Today and tomorrow in the anchor zone, so a session just after local
  // midnight is still picked up by the run before it.
  const anchorToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIAL_ANCHOR_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const anchorTomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: TRIAL_ANCHOR_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(Date.now() + 86_400_000));

  const { data, error } = await supabase
    .from("trial_bookings")
    .select("id, name, email, trial_date, start_time, timezone, user_id, class_language, followup_hour_before_sent_at")
    .in("trial_date", [anchorToday, anchorTomorrow])
    .is("followup_hour_before_sent_at", null)
    .not("is_tba", "is", true)
    .not("email", "is", null)
    .not("status", "eq", "cancelled")
    .limit(200);

  if (error) throw new Error(`query hour_before: ${error.message}`);
  const rows = (data ?? []) as unknown as Array<{
    id: string; name: string | null; email: string | null;
    trial_date: string; start_time: string | null; timezone: string | null;
    user_id: string | null; class_language: string | null;
  }>;

  const now = Date.now();
  for (const b of rows) {
    if (!b.email || !b.start_time) { skipped++; continue; }
    const startsAt = zonedDateTimeToInstant(
      b.trial_date, b.start_time, b.timezone || TRIAL_ANCHOR_TIMEZONE,
    );
    if (!startsAt) { skipped++; continue; }

    const minutesAway = (startsAt.getTime() - now) / 60_000;
    // Not yet due, or already started — leave the row for a later run or drop it.
    if (minutesAway > HOUR_BEFORE_WINDOW_MIN || minutesAway < 0) { skipped++; continue; }

    // Respect unsubscribes, exactly as the other stages do.
    let unsubscribeToken: string | undefined;
    if (b.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("unsubscribe_token, email_unsubscribed")
        .eq("user_id", b.user_id)
        .maybeSingle();
      if (profile?.email_unsubscribed) {
        await supabase.from("trial_bookings")
          .update({ followup_hour_before_sent_at: new Date().toISOString() }).eq("id", b.id);
        skipped++;
        continue;
      }
      unsubscribeToken = profile?.unsubscribe_token ?? undefined;
    }

    // Best-effort meeting link for the join button.
    const { data: slot } = await supabase
      .from("trial_slots")
      .select("meeting_url")
      .eq("trial_date", b.trial_date)
      .eq("start_time", b.start_time)
      .maybeSingle();

    try {
      const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: b.email,
          name: b.name || "there",
          language: pickLanguage(b.class_language),
          template: "trial_hour_before",
          trial_time: b.start_time,
          trial_timezone: b.timezone,
          class_link_url: (slot as { meeting_url?: string | null } | null)?.meeting_url ?? undefined,
          ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
        },
      });
      if (sendErr) throw new Error(sendErr.message);
      await supabase.from("trial_bookings")
        .update({ followup_hour_before_sent_at: new Date().toISOString() }).eq("id", b.id);
      sent++;
    } catch (e) {
      errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { stage: "hour_before", attempted: rows.length, sent, skipped, errors };
}

// ── Auth helper ─────────────────────────────────────────────────────────────
// Accepts either:
//   a) An admin JWT (Authorization: Bearer <token>) — for manual invocations
//   b) A shared cron secret (x-cron-secret: <CRON_SECRET>) — for pg_cron
async function isAuthorised(req: Request, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: roleRow } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!roleRow;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!(await isAuthorised(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run each stage independently so one failure doesn't block others
    const results = await Promise.allSettled(
      [
        ...(["prep", "day1", "day3", "day7"] as Stage[]).map(s => dispatchStage(supabase, s)),
        dispatchHourBefore(supabase),
      ],
    );
    const settled = results.map(r =>
      r.status === "fulfilled" ? r.value : { stage: "unknown", error: r.reason?.message ?? String(r.reason) }
    );

    console.log("trial-followups:", JSON.stringify(settled));
    return new Response(JSON.stringify({ ok: true, results: settled }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("trial-followups error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
