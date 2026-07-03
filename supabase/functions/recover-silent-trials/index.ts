// One-shot recovery for trial bookers who were never sent a follow-up
// because their trial happened before the post-trial cron was deployed.
//
// Defaults to dry_run: returns counts + a sample so you can eyeball before
// hitting send. A live run requires explicit { mode: "live" }.
//
// Invoke (dry run, 30-day window):
//   supabase functions invoke recover-silent-trials --body '{}'
// Invoke (live send):
//   supabase functions invoke recover-silent-trials --body '{"mode":"live"}'
//
// Sends ONE email per user (trial_followup_day3 template — softest, most
// convert-focused). Stamps followup_day3_sent_at so the regular cron
// treats these rows as done and never re-emails them.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Auth: admin JWT (manual invocation) OR shared cron secret (scheduled
    // safety-net run) — same dual-auth pattern as send-trial-followups. ──────
    const cronSecret = Deno.env.get("CRON_SECRET");
    const viaCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    if (!viaCron) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized — admin JWT required" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleRow } = await supabase.from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) {
        return new Response(JSON.stringify({ ok: false, error: "Forbidden — admin role required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let body: { mode?: "dry_run" | "live"; days?: number; limit?: number } = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    const mode = body.mode === "live" ? "live" : "dry_run";
    const days = typeof body.days === "number" && body.days > 0 && body.days <= 180 ? body.days : 30;
    const limit = typeof body.limit === "number" && body.limit > 0 ? body.limit : 500;

    // Trials that already happened (trial_date <= today Cairo), within the window,
    // not yet sent the day3 follow-up, not TBA placeholders, with a usable email.
    const nowCairoMs = Date.now() + 2 * 60 * 60 * 1000;
    const todayCairo = new Date(nowCairoMs).toISOString().slice(0, 10);
    const cutoffCairo = new Date(nowCairoMs - days * 86400000).toISOString().slice(0, 10);

    // .lt (not .lte) so we only target trials that have already happened.
    // Otherwise we'd email today's trial bookers before they attend, which
    // is the opposite of "silent" — they're about to be very-much-attending.
    const { data: bookings, error } = await supabase
      .from("trial_bookings")
      .select("id, name, email, trial_date, user_id, level, class_language, created_at")
      .gte("trial_date", cutoffCairo)
      .lt("trial_date", todayCairo)
      .is("followup_day3_sent_at", null)
      .not("is_tba", "is", true)
      .not("email", "is", null)
      .order("trial_date", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`query: ${error.message}`);

    const rows = (bookings ?? []) as Booking[];

    // Filter out users who already enrolled (APPROVED) — they converted.
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

    const eligible = rows.filter(b => !(b.user_id && approvedUsers.has(b.user_id)));

    const sample = eligible.slice(0, 10).map(b => ({
      id: b.id,
      name: b.name,
      email: b.email,
      trial_date: b.trial_date,
      days_since_trial: Math.floor((Date.now() - new Date(b.trial_date + "T00:00:00Z").getTime()) / 86400000),
    }));

    if (mode === "dry_run") {
      return new Response(JSON.stringify({
        mode: "dry_run",
        window: { from: cutoffCairo, to: todayCairo, days },
        candidates_total: rows.length,
        skipped_already_enrolled: rows.length - eligible.length,
        would_send: eligible.length,
        sample,
        next_step: "Re-invoke with { \"mode\": \"live\" } to actually send.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Live send.
    let sent = 0;
    const errors: string[] = [];
    for (const b of eligible) {
      if (!b.email) continue;
      try {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: b.email,
            name: b.name || "there",
            language: b.class_language === "english" ? "en" : "ar",
            template: "trial_followup_day3",
            level: b.level,
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        await supabase
          .from("trial_bookings")
          .update({ followup_day3_sent_at: new Date().toISOString() })
          .eq("id", b.id);
        sent++;
      } catch (e) {
        errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(JSON.stringify({
      mode: "live",
      window: { from: cutoffCairo, to: todayCairo, days },
      eligible: eligible.length,
      sent,
      errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("recover-silent-trials error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
