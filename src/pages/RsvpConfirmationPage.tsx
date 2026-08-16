import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import type { TrialInviteResponse } from "@/pages/TrialConfirmPage";

/**
 * Landing page for the RSVP links in the reminder email.
 *
 * Two things were wrong with it. It rendered purely from URL parameters and
 * wrote nothing to the database, so `attendance_response` — a column the admin
 * tables read and filter on — was null for every booking ever made. And "can't
 * attend", the highest-intent recovery moment in the funnel, was answered with
 * "We'll reach out soon" and no call to action at all.
 *
 * Declining deliberately does NOT cancel the booking: the student keeps their
 * original slot until they actually pick a new one, matching the reschedule
 * flow elsewhere so abandoning mid-flow costs them nothing.
 */
export default function RsvpConfirmationPage() {
  const { t, tInterpolate } = useLanguage();
  const [params] = useSearchParams();
  const r = params.get("r"); // "yes" | "no"
  const name = params.get("name") || "";
  const day = params.get("day") || "";
  const time = params.get("time") || "";
  // The email builds this link, so it knows the zone the time is stated in.
  // The page used to append "Cairo time" to every value regardless.
  const tz = params.get("tz") || "";
  const id = params.get("id") || "";
  const token = params.get("token") || "";

  const isYes = r === "yes";

  // `idle` covers legacy links that carry no id/token — those still render the
  // right message, they just have nothing to record against.
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">(
    id && token && (r === "yes" || r === "no") ? "saving" : "idle",
  );

  useEffect(() => {
    if (saveState !== "saving") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc(
        "respond_to_trial_invite" as never,
        { p_booking_id: id, p_token: token, p_response: r } as never,
      );
      if (cancelled) return;
      const rows = (data ?? []) as unknown as TrialInviteResponse[];
      const row = Array.isArray(rows) ? rows[0] : (rows as TrialInviteResponse | undefined);
      if (error || !row || row.outcome === "invalid") {
        if (error) console.error("respond_to_trial_invite failed:", error);
        setSaveState("failed");
        return;
      }
      setSaveState("saved");
    })();
    return () => { cancelled = true; };
    // Runs once for the response encoded in the link.
  }, [saveState, id, token, r]);
  const when = [day, time].filter(Boolean).join(" · ") + (tz ? ` (${tz.replace(/_/g, " ")})` : "");
  const hasWhen = Boolean(day || time);

  const primaryCta = "inline-flex items-center justify-center min-h-[44px] w-full px-6 py-3 rounded-xl text-base font-bold bg-[#FFFF00] text-black hover:opacity-90 transition-opacity";
  const secondaryCta = "inline-flex items-center justify-center min-h-[44px] w-full px-6 py-3 rounded-xl text-base font-semibold border border-[#3a3a3a] text-white hover:bg-white/5 transition-colors";

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 sm:p-10 max-w-md w-full text-center shadow-2xl">

        <img
          src="/klovers-logo.jpg"
          alt="Klovers"
          className="w-16 h-16 rounded-full border-2 border-[#FFFF00] mx-auto mb-6 object-cover"
        />

        <div className="text-6xl mb-5" aria-hidden="true">{isYes ? "🎉" : "🗓️"}</div>

        <h1 className="text-2xl font-bold text-[#FFFF00] mb-3">
          {tInterpolate(isYes ? t("rsvp.yesTitle") : t("rsvp.noTitle"), { name: name || "👋" })}
        </h1>

        <p className="text-[#cccccc] text-[15px] leading-relaxed mb-6">
          {isYes
            ? hasWhen
              ? tInterpolate(t("rsvp.yesBody"), { when })
              : t("rsvp.yesBodyNoTime")
            : t("rsvp.noBody")}
        </p>

        {/* The badge reflects what was actually stored. Claiming a response was
            recorded when the write failed is the same defect as the waitlist
            that told users "You're on the list!" after a rejected insert. */}
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-2 bg-[#111111] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-6"
        >
          {saveState === "saving" ? (
            <span className="text-[#999]">{t("rsvp.saving")}</span>
          ) : saveState === "failed" ? (
            <>
              <span className="text-red-400" aria-hidden="true">⚠️</span>
              <span className="text-[#999]">{t("rsvp.saveFailed")}</span>
            </>
          ) : (
            <>
              <span className={isYes ? "text-green-400" : "text-orange-400"} aria-hidden="true">
                {isYes ? "✅" : "↻"}
              </span>
              <span className="text-[#999]">
                {t("rsvp.statusLabel")}:{" "}
                <span className="text-white font-medium">
                  {isYes ? t("rsvp.confirmed") : t("rsvp.declined")}
                </span>
              </span>
            </>
          )}
        </div>

        {/* One clear next action per branch, then everything else demoted. */}
        <div className="flex flex-col gap-3">
          {isYes ? (
            <>
              <Link to="/placement-test" className={primaryCta}>{t("rsvp.placementCta")}</Link>
              <Link to="/" className={secondaryCta}>{t("rsvp.homeCta")}</Link>
            </>
          ) : (
            <>
              <Link to="/trial-booking" className={primaryCta}>{t("rsvp.rebookCta")}</Link>
              <button
                type="button"
                onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "rsvp_declined_whatsapp" })}
                className={secondaryCta}
              >
                {t("rsvp.whatsappCta")}
              </button>
            </>
          )}
        </div>

        <div className="border-t border-[#2a2a2a] pt-5 mt-6">
          <p className="text-[#999] text-[13px]">{t("rsvp.team")} 🇰🇷</p>
          <a
            href="https://kloversegy.com"
            className="text-[#FFFF00] text-[12px] hover:underline mt-1 inline-block"
          >
            kloversegy.com
          </a>
        </div>
      </div>
    </div>
  );
}
