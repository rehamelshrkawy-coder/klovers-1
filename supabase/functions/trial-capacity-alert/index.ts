import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAndSendTrialCapacityAlert } from "../_shared/trialCapacityAlert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Public, unauthenticated side-channel: fired (fire-and-forget) from
 * TrialConfirmPage.tsx right after a student's own attendance confirmation
 * succeeds, since that flow runs client-side with only the anon key and has
 * no edge function of its own. Accepts nothing more than a (trial_date,
 * start_time) pair, does its own atomic count+claim server-side, and never
 * returns any booking/student data to the caller — a caller passing
 * arbitrary values just gets a harmless no-op unless a real occurrence is
 * genuinely sitting at the threshold unclaimed, which isn't attacker-
 * controllable.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { trial_date, start_time } = await req.json();

    if (
      typeof trial_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(trial_date) ||
      typeof start_time !== "string" || !start_time
    ) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await checkAndSendTrialCapacityAlert(supabase, trial_date, start_time);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Fire-and-forget side channel — never surface errors to the client.
    console.error("trial-capacity-alert error:", err);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
