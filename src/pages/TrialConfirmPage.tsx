import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

type PageState = "loading" | "success" | "already" | "error";

/**
 * Reached from the confirmation email — including the Arabic one. The page was
 * 100% hardcoded English, so an Arabic-speaking student clicking through from an
 * Arabic email landed on an English screen.
 */
const TrialConfirmPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<PageState>("loading");
  const [classLink, setClassLink] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setState("error");
      return;
    }

    const confirm = async () => {
      // Fetch the booking to check current status and get the slot's meeting_url
      const { data: booking, error: fetchErr } = await supabase
        .from("trial_bookings")
        .select("id, status, trial_date, start_time")
        .eq("id", id)
        .eq("confirmation_token", token)
        .maybeSingle();

      if (fetchErr || !booking) {
        setState("error");
        return;
      }

      if (booking.status === "confirmed_attendance") {
        // Already confirmed — idempotent: just show success
        setState("already");
      } else {
        // Attempt the update
        const { error: updateErr } = await supabase
          .from("trial_bookings")
          .update({
            status: "confirmed_attendance",
            attendance_confirmed_at: new Date().toISOString(),
          } as any)
          .eq("id", id)
          .eq("confirmation_token", token)
          .neq("status", "confirmed_attendance");

        if (updateErr) {
          setState("error");
          return;
        }
        setState("success");
      }

      // Try to fetch the Google Meet link from the trial slot
      if (booking.trial_date && booking.start_time) {
        const { data: slotRow } = await supabase
          .from("trial_slots")
          .select("meeting_url")
          .eq("trial_date", booking.trial_date)
          .eq("start_time", booking.start_time)
          .maybeSingle();
        const url = (slotRow as { meeting_url?: string | null } | null)?.meeting_url ?? null;
        if (url) setClassLink(url);
      }
    };

    confirm();
  }, [id, token]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Logo / brand */}
        <div className="mb-6">
          <span className="text-4xl font-black tracking-tight text-black">
            K<span className="text-[#946F00]">lovers</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">{t("trialConfirm.brandTagline")}</p>
        </div>

        {state === "loading" && (
          <div className="py-8" role="status">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600">{t("trialConfirm.confirming")}</p>
          </div>
        )}

        {(state === "success" || state === "already") && (
          <div className="py-4" role="status">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t("trialConfirm.successTitle")}</h1>
            <p className="text-gray-600 mb-6">
              {state === "already" ? t("trialConfirm.alreadyBody") : t("trialConfirm.successBody")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/placement-test"
                className="inline-flex items-center justify-center min-h-[44px] bg-black text-white font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
              >
                {t("trialConfirm.placementCta")}
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center min-h-[44px] border-2 border-black text-black font-bold px-6 py-3 rounded-xl text-base hover:bg-gray-50 transition-colors"
              >
                {t("trialConfirm.pricingCta")}
              </Link>
            </div>
            {classLink && (
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-gray-600 underline hover:text-black"
              >
                {t("trialConfirm.joinLink")}
              </a>
            )}
          </div>
        )}

        {state === "error" && (
          /* Previously a dead end: one WhatsApp link and no way back into the
             funnel. Both recovery paths are offered now. */
          <div className="py-4" role="alert">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t("trialConfirm.errorTitle")}</h1>
            <p className="text-gray-600 mb-6">{t("trialConfirm.errorBody")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "trial_confirm_error" })}
                className="inline-flex items-center justify-center min-h-[44px] bg-[#25D366] text-black font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                {t("trialConfirm.whatsappCta")}
              </button>
              <Link
                to="/trial-booking"
                className="inline-flex items-center justify-center min-h-[44px] border-2 border-black text-black font-bold px-6 py-3 rounded-xl text-base hover:bg-gray-50 transition-colors"
              >
                {t("trialConfirm.rebookCta")}
              </Link>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-xs mt-8">
          <a href="https://kloversegy.com" className="hover:underline">kloversegy.com</a>
        </p>
      </div>
    </div>
  );
};

export default TrialConfirmPage;
