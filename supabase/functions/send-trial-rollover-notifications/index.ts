// Notifies students whose trial group didn't reach the minimum to run
// (claim_trial_min_run_check() marks them rollover_status='pending_notification')
// once next month's schedule actually has bookable slots. Idempotent via
// rollover_notified_at. Same dual-auth pattern as send-trial-followups.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RolloverBooking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string | null;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
}

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  return classLanguage === "arabic" ? "ar" : "en";
}

function formatPreviousDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

async function isAuthorised(req: Request, supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;
  if (cronSecret && token === cronSecret) return true;

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

    const { data: pending, error: qErr } = await supabase
      .from("trial_bookings")
      .select("id, name, email, trial_date, user_id, level, class_language")
      .eq("rollover_status", "pending_notification")
      .is("rollover_notified_at", null)
      .not("is_tba", "is", true)
      .not("email", "is", null)
      .limit(200);
    if (qErr) throw new Error(`query pending rollovers: ${qErr.message}`);

    const rows = (pending ?? []) as RolloverBooking[];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, attempted: 0, sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only notify once next month's schedule actually has a bookable slot —
    // otherwise there's nothing to send them to yet; leave pending for the
    // next hourly run.
    const { data: nextSlot } = await supabase
      .from("trial_slots")
      .select("trial_date")
      .eq("lifecycle", "active")
      .eq("is_active", true)
      .gt("trial_date", new Date().toISOString().slice(0, 10))
      .order("trial_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextSlot?.trial_date) {
      return new Response(JSON.stringify({ ok: true, attempted: rows.length, sent: 0, skipped: rows.length, reason: "next month's schedule not published yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const nextTrialMonth = (nextSlot.trial_date as string).slice(0, 7) + "-01";

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const b of rows) {
      if (!b.email) { skipped++; continue; }

      let unsubscribeToken: string | undefined;
      if (b.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("unsubscribe_token, email_unsubscribed")
          .eq("user_id", b.user_id)
          .maybeSingle();
        if (profile?.email_unsubscribed) {
          await supabase.from("trial_bookings")
            .update({ rollover_status: "notified", rollover_notified_at: new Date().toISOString(), next_trial_month: nextTrialMonth })
            .eq("id", b.id);
          skipped++;
          continue;
        }
        unsubscribeToken = profile?.unsubscribe_token ?? undefined;
      }

      try {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: b.email,
            name: b.name || "there",
            language: pickLanguage(b.class_language),
            template: "trial_rollover",
            level: b.level,
            previous_trial_date: formatPreviousDate(b.trial_date),
            ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        await supabase.from("trial_bookings")
          .update({ rollover_status: "notified", rollover_notified_at: new Date().toISOString(), next_trial_month: nextTrialMonth })
          .eq("id", b.id);
        sent++;
      } catch (e) {
        errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log("trial-rollover-notifications:", JSON.stringify({ attempted: rows.length, sent, skipped, errors }));
    return new Response(JSON.stringify({ ok: true, attempted: rows.length, sent, skipped, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-trial-rollover-notifications error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
