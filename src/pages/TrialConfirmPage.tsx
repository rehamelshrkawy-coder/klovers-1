import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type PageState = "loading" | "success" | "already" | "error";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Logo / brand */}
        <div className="mb-6">
          <span className="text-4xl font-black tracking-tight text-foreground">
            K<span className="text-primary">lovers</span>
          </span>
          <p className="text-muted-foreground text-sm mt-1">{t("trialConfirm.tagline")}</p>
        </div>

        {state === "loading" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t("trialConfirm.loading")}</p>
          </div>
        )}

        {(state === "success" || state === "already") && (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("trialConfirm.successTitle")}</h1>
            <p className="text-muted-foreground mb-6">
              {state === "already" ? t("trialConfirm.alreadyDesc") : t("trialConfirm.successDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/placement-test"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                📝 {t("trialConfirm.placementTestBtn")}
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                💰 {t("trialConfirm.viewPricesBtn")}
              </a>
            </div>
            {classLink && (
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-muted-foreground underline hover:text-foreground"
              >
                {t("trialConfirm.joinMeetLink")}
              </a>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("trialConfirm.errorTitle")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("trialConfirm.errorDesc")}
            </p>
            <a
              href="https://wa.me/201010003084"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              {t("trialConfirm.contactWhatsapp")}
            </a>
          </div>
        )}

        <p className="text-muted-foreground/70 text-xs mt-8">
          <a href="https://kloversegy.com" className="hover:underline">kloversegy.com</a>
        </p>
      </div>
    </div>
  );
};

export default TrialConfirmPage;
