import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type PageState = "loading" | "success" | "already" | "error";

const TrialConfirmPage = () => {
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
            K<span className="text-yellow-400">lovers</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">Korean Language Academy</p>
        </div>

        {state === "loading" && (
          <div className="py-8">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Confirming your attendance…</p>
          </div>
        )}

        {(state === "success" || state === "already") && (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Attendance Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              {state === "already"
                ? "You've already confirmed your attendance. See you in class!"
                : "You're all set. See you in class!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/placement-test"
                className="inline-block bg-black text-yellow-400 font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                📝 Take Placement Test
              </a>
              <a
                href="/pricing"
                className="inline-block bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                💰 View Prices
              </a>
            </div>
            {classLink && (
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-gray-500 underline hover:text-gray-700"
              >
                Join via Google Meet
              </a>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Link Invalid</h1>
            <p className="text-gray-600 mb-6">
              This link is invalid or has already been used. Please contact us if you need help.
            </p>
            <a
              href="https://wa.me/201010003084"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-black text-yellow-400 font-bold px-6 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              Contact us on WhatsApp
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
