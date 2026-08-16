import { supabase } from "@/integrations/supabase/client";
import { buildGoogleCalendarUrl, formatTime12h } from "@/lib/calendarUrl";
import {
  TRIAL_ANCHOR_TIMEZONE,
  TRIAL_CONFIRMATION_EMAIL_ENABLED,
  TRIAL_DURATION_MIN,
} from "@/lib/siteConfig";

/**
 * Sends the trial_confirmed email (calendar link + formatted date/time),
 * gated by TRIAL_CONFIRMATION_EMAIL_ENABLED. Single source of truth for the
 * admin "approve trial" flow — previously duplicated across three admin
 * panels with slightly different date formatting in each.
 *
 * Returns true iff an email was actually sent (false when the feature flag
 * is off), so callers can reflect the real outcome in their toast/UI instead
 * of referencing the flag directly.
 */
export async function sendTrialConfirmationEmail(params: {
  email: string;
  name: string;
  level?: string | null;
  trial_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  timezone?: string | null;
  language?: string; // defaults "ar"
  /** Meeting link for this slot, when one is configured. */
  classLinkUrl?: string | null;
}): Promise<boolean> {
  if (!TRIAL_CONFIRMATION_EMAIL_ENABLED) return false;

  // The booking's own timezone wins. Hardcoding Africa/Cairo here stated a time
  // up to seven hours wrong for any slot anchored to the teacher's zone.
  const tz = params.timezone || TRIAL_ANCHOR_TIMEZONE;
  const calendarUrl = buildGoogleCalendarUrl({
    title: "Free Korean Trial Class — Klovers Academy",
    date: params.trial_date,
    time: params.start_time,
    // Was 45, so a student sold a 30-minute class had 45 minutes blocked out.
    durationMin: TRIAL_DURATION_MIN,
    description: `Level: ${params.level || "Beginner"}`,
    timezone: tz,
  });
  const trialDateFormatted = new Date(`${params.trial_date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { error } = await supabase.functions.invoke("send-confirmation-email", {
    body: {
      template: "trial_confirmed",
      email: params.email,
      name: params.name,
      level: params.level || "Beginner",
      trial_date: trialDateFormatted,
      trial_time: formatTime12h(params.start_time),
      trial_timezone: tz,
      calendar_url: calendarUrl,
      language: params.language || "ar",
      ...(params.classLinkUrl ? { class_link_url: params.classLinkUrl } : {}),
    },
  });
  if (error) throw error;
  return true;
}
