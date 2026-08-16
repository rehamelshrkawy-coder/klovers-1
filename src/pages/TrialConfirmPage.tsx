import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

type PageState = "loading" | "success" | "already" | "error";

/**
 * The attendance-confirmation landing page.
 *
 * This is reached by clicking a link in the confirmation email — including
 * the Arabic one — and every string on it was hardcoded English. It also
 * never imported the language context at all, so an Arabic reader who clicked
 * an Arabic email landed on a fully English page.
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
          })
          .eq("id", id)
          .eq("confirmation_token", token)
          .neq("status", "confirmed_attendance");

        if (updateErr) {
          setState("error");
          return;
        }
        setState("success");

        // Best-effort: this confirmation may have just completed the
        // group's 4th confirmed spot for this occurrence. Never blocks the
        // UI; errors are swallowed inside the function itself.
        if (booking.trial_date && booking.start_time) {
          supabase.functions.invoke("trial-capacity-alert", {
            body: { trial_date: booking.trial_date, start_time: booking.start_time },
          }).catch(() => { /* best-effort, ignore */ });
        }
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
            K<span className="text-yellow-400">lovers</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">{t("trialConfirm.academy")}</p>
        </div>

        {state === "loading" && (
          <div className="py-8" aria-busy="true">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600">{t("trialConfirm.confirming")}</p>
          </div>
        )}

        {(state === "success" || state === "already") && (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900/40" aria-hidden="true">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t("trialConfirm.title")}</h1>
            <p className="text-gray-600 mb-6">
              {state === "already" ? t("trialConfirm.bodyAlready") : t("trialConfirm.body")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* The class link is the one thing they came here for — it goes
                  first, as the primary action, when we have it. */}
              {classLink && (
                <a
                  href={classLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: "#000", color: "#FACC15" }}
                  className="inline-flex items-center justify-center min-h-[44px] font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
                >
                  {t("trialConfirm.joinClass")}
                </a>
              )}
              <a
                href="/placement-test"
                style={{ backgroundColor: "#000", color: "#FACC15" }}
                className="inline-flex items-center justify-center min-h-[44px] font-bold px-6 py-3 rounded-xl text-base hover:opacity-80 transition-opacity"
              >
                {t("trialConfirm.placementTest")}
              </a>
            </div>
            <a href="/pricing" className="inline-block mt-3 text-sm text-gray-600 underline hover:text-gray-800">
              {t("trialConfirm.viewPrices")}
            </a>
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-red-900/40" aria-hidden="true">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">{t("trialConfirm.errorTitle")}</h1>
            <p className="text-gray-600 mb-6">{t("trialConfirm.errorBody")}</p>
            <a
              /* The shared number, not a second hardcoded one that may not be
                 monitored. */
              href={WHATSAPP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] bg-black text-yellow-400 font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              {t("trialConfirm.contactWhatsApp")}
            </a>
          </div>
        )}

        <p className="text-gray-400 text-xs mt-8">
          <a href="https://kloversegy.com" className="hover:underline">kloversegy.com</a>
        </p>
      </div>
    </div>
  );
};

export default TrialConfirmPage;
