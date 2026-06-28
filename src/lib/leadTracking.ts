// Unified lead-event logger. Persists every interest signal to lead_events
// and mirrors to Meta Pixel / GA4 via the existing `track` helper.
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getSessionId, getAttribution } from "@/lib/leadSession";
import { track } from "@/lib/tracking";

export type LeadSource =
  | "whatsapp"
  | "free_trial"
  | "placement_test"
  | "pricing"
  | "enroll"
  | "contact"
  | "email"
  | "community"
  | "exit_intent"
  | "free_resource"
  | "homepage"
  | "placement";

interface LogOpts {
  source_type: LeadSource;
  cta_label?: string;
  metadata?: Record<string, unknown>;
}

/** Insert a row into lead_events. Never throws — tracking must not break user flow. */
export async function logLeadEvent(opts: LogOpts): Promise<void> {
  try {
    const attribution = getAttribution();
    const row = {
      session_id: getSessionId(),
      source_type: opts.source_type,
      source_page: typeof window !== "undefined" ? window.location.pathname : "",
      cta_label: opts.cta_label ?? null,
      campaign: attribution.campaign ?? null,
      utm_source: attribution.utm_source ?? null,
      utm_medium: attribution.utm_medium ?? null,
      utm_content: attribution.utm_content ?? null,
      referrer: attribution.referrer ?? null,
      metadata: (opts.metadata ?? {}) as Json,
    };
    // Mirror to Meta Pixel / GA4 (existing infra).
    track.lead({ content_name: opts.source_type });
    await supabase.from("lead_events").insert(row);
  } catch {
    /* swallow — never block UI */
  }
}

/**
 * Log a WhatsApp click then open the URL.
 * Races the insert against a 600ms timeout so the redirect never feels laggy.
 */
export async function trackAndOpenWhatsApp(
  url: string,
  ctx: { cta_label?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  const insert = logLeadEvent({
    source_type: "whatsapp",
    cta_label: ctx.cta_label,
    metadata: ctx.metadata,
  });
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 600));
  await Promise.race([insert, timeout]);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
