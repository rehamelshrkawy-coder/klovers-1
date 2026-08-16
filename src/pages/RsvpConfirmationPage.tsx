import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

/**
 * The reminder-email RSVP landing page.
 *
 * Two things were wrong with this page.
 *
 * First, it wrote nothing. `trial_bookings.attendance_response` and
 * `attendance_responded_at` exist, and the admin broadcast table filters on
 * them, but no code ever set them — so every RSVP the students sent went
 * nowhere and the admin filter only ever saw nulls. The page simply echoed
 * whatever the URL said.
 *
 * Second, "I can't make it" is the single highest-intent recovery moment in
 * the whole funnel — someone telling you, unprompted, that they still want
 * the class but not at that time — and it was a terminal page with no button
 * on it. It promised "we'll reach out soon to reschedule" with nothing behind
 * the promise.
 */

type WriteState = "idle" | "saving" | "saved" | "failed";

export default function RsvpConfirmationPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const r = params.get("r");
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const name = params.get("name") || "";
  const day = params.get("day") || "";
  const time = params.get("time") || "";

  const isYes = r === "yes";
  const [writeState, setWriteState] = useState<WriteState>("idle");

  useEffect(() => {
    if (r !== "yes" && r !== "no") return;
    // Without a booking id and token we can only display; recording the
    // response needs the same token pair the confirmation link carries.
    if (!id || !token) return;

    let cancelled = false;
    (async () => {
      setWriteState("saving");
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          attendance_response: r,
          attendance_responded_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("confirmation_token", token);

      if (cancelled) return;
      if (error) {
        console.error("Could not record RSVP:", error);
        setWriteState("failed");
        return;
      }
      setWriteState("saved");
    })();

    return () => { cancelled = true; };
  }, [r, id, token]);

  const greeting = name
    ? (isYes ? t("rsvp.titleYesNamed") : t("rsvp.titleNoNamed")).replace("{name}", name)
    : (isYes ? t("rsvp.titleYes") : t("rsvp.titleNo"));

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <img
          src="/klovers-logo.jpg"
          alt="Klovers"
          width={64}
          height={64}
          className="w-16 h-16 rounded-full border-2 border-[#FFFF00] mx-auto mb-6 object-cover"
        />

        <div className="text-6xl mb-5" aria-hidden="true">{isYes ? "🎉" : "🗓️"}</div>

        <h1 className="text-2xl font-bold text-[#FFFF00] mb-3">{greeting}</h1>

        <p className="text-[#cccccc] text-[15px] leading-relaxed mb-6">
          {isYes ? (
            <>
              {day && time
                ? t("rsvp.bodyYesWithTime").replace("{day}", day).replace("{time}", time)
                : t("rsvp.bodyYes")}
            </>
          ) : (
            t("rsvp.bodyNo")
          )}
        </p>

        {/*
          The recovery path. "No" now leads somewhere: a new date, or a human.
        */}
        {!isYes && (
          <div className="flex flex-col gap-3 mb-6">
            <Link
              to="/free-trial"
              className="inline-flex items-center justify-center min-h-[44px] bg-[#FFFF00] text-black font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              {t("rsvp.pickNewDate")}
            </Link>
            <button
              type="button"
              onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "rsvp_decline_whatsapp" })}
              className="inline-flex items-center justify-center min-h-[44px] border border-[#2a2a2a] text-[#cccccc] font-semibold px-6 py-3 rounded-xl text-sm hover:border-[#444] transition-colors"
            >
              {t("rsvp.talkToUs")}
            </button>
          </div>
        )}

        <div
          className="inline-flex items-center gap-2 bg-[#111111] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-6"
          role="status"
        >
          <span className={isYes ? "text-green-400" : "text-amber-400"} aria-hidden="true">
            {isYes ? "✅" : "🕓"}
          </span>
          <span className="text-[#888]">
            {t("rsvp.statusLabel")}{" "}
            <span className="text-white font-medium">
              {isYes ? t("rsvp.statusConfirmed") : t("rsvp.statusDeclined")}
            </span>
          </span>
        </div>

        {/* Only claim it was recorded when it actually was. */}
        {writeState === "failed" && (
          <p className="text-[#f7b955] text-[13px] mb-4" role="alert">
            {t("rsvp.saveFailed")}
          </p>
        )}

        <div className="border-t border-[#2a2a2a] pt-5 mt-2">
          <p className="text-[#999] text-[13px]">{t("rsvp.signoff")}</p>
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
