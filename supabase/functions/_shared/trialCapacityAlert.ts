import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ClaimResult {
  should_send: boolean;
  day_of_week: number | null;
  class_language: string | null;
  timezone: string | null;
  capacity: number | null;
  confirmed_count: number | null;
  fourth_email: string | null;
  fourth_name: string | null;
}

/**
 * Checks whether a trial slot/date just reached its confirmed-registration
 * capacity alert threshold, and if so — exactly once per occurrence — emails
 * the teacher and the student who completed that spot. Best-effort: never
 * throws, so callers can fire-and-forget this after a booking succeeds.
 *
 * Must be called with a service-role Supabase client (the count+claim RPC
 * is service_role-only) from edge-function code, not from a DB trigger —
 * see the comment on claim_trial_capacity_alert in
 * supabase/migrations/20260801120000_trial_monthly_schedule_vietnam.sql for
 * why the trigger-based approach doesn't work in this project.
 */
export async function checkAndSendTrialCapacityAlert(
  supabase: SupabaseClient,
  trialDate: string,
  startTime: string,
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("claim_trial_capacity_alert", {
      p_trial_date: trialDate,
      p_start_time: startTime,
    });
    if (error) {
      console.warn("claim_trial_capacity_alert error:", error.message);
      return;
    }
    const claim = (Array.isArray(data) ? data[0] : data) as ClaimResult | null;
    if (!claim?.should_send) return;

    const dayName = claim.day_of_week != null ? DAY_NAMES[claim.day_of_week] : "";
    const languageLabel = claim.class_language === "arabic" ? "Arabic" : "English";
    const timezone = claim.timezone ?? "Asia/Ho_Chi_Minh";
    const confirmedCount = claim.confirmed_count ?? 4;

    // Teacher alert — reuses the existing admin_notifications ->
    // notify-admin-email pipeline (already proven working: book-trial uses
    // it for every new-booking notification).
    try {
      await supabase.from("admin_notifications").insert({
        message:
          `Trial group full: ${languageLabel} class on ${dayName} ${trialDate} at ` +
          `${startTime} (${timezone}) just reached ${confirmedCount} confirmed students.`,
        type: "trial_capacity_reached",
      });
    } catch (e) {
      console.warn("trial capacity admin_notifications insert failed:", e);
    }

    // Student alert — the confirming student's own email.
    if (claim.fourth_email && SUPABASE_URL && SERVICE_ROLE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-confirmation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            template: "trial_group_full",
            email: claim.fourth_email,
            name: claim.fourth_name || claim.fourth_email.split("@")[0],
            language: claim.class_language === "arabic" ? "ar" : "en",
            class_language: claim.class_language,
            trial_date: trialDate,
            trial_time: startTime,
            trial_timezone: timezone,
            trial_day_name: dayName,
            confirmed_count: confirmedCount,
          }),
        });
      } catch (e) {
        console.warn("trial_group_full email failed:", e);
      }
    }
  } catch (e) {
    console.warn("checkAndSendTrialCapacityAlert failed:", e);
  }
}
