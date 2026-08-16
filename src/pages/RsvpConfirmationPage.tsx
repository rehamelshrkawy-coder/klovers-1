import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

/**
 * Landing page for the RSVP links in the reminder email.
 *
 * "Can't attend" is the highest-intent recovery moment in the whole funnel — a
 * student who bothers to tell you they can't make it still wants the class.
 * This page used to answer that with "We'll reach out soon" and nothing else:
 * no rebook button, no link, no header. Both branches now end in an action.
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

  const isYes = r === "yes";
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

        <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-6">
          <span className={isYes ? "text-green-400" : "text-orange-400"} aria-hidden="true">
            {isYes ? "✅" : "↻"}
          </span>
          <span className="text-[#999]">
            {t("rsvp.statusLabel")}:{" "}
            <span className="text-white font-medium">
              {isYes ? t("rsvp.confirmed") : t("rsvp.declined")}
            </span>
          </span>
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
