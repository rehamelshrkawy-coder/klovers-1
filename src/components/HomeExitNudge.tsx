// Homepage exit-intent — mirrors the pricing-page bottom sheet that's
// already showing ~17% CTR. Pricing is downstream; the homepage is where
// most traffic actually lands and bounces, so this is the bigger funnel
// catch. Routes to the placement test (5-min level discovery) rather
// than the trial form, because placement-test takers convert ~5x.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "klovers_home_exit_nudge_shown_at";
// Only show again after 24h to avoid hammering returning visitors.
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const HomeExitNudge = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);
  const shownLogged = useRef(false);

  useEffect(() => {
    // Skip entirely if user dismissed recently — respect attention.
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) {
        dismissed.current = true;
      }
    } catch { /* ignore */ }

    const trigger = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
      setVisible(true);
      if (!shownLogged.current) {
        shownLogged.current = true;
        track.custom("home_exit_intent_shown", {});
        logLeadEvent({ source_type: "homepage", cta_label: "exit_intent_shown" });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) trigger();
    };

    let scrolledUp = 0;
    let lastY = window.scrollY;
    const handleScroll = () => {
      if (dismissed.current) return;
      const y = window.scrollY;
      if (y < lastY) scrolledUp += lastY - y;
      else scrolledUp = 0;
      lastY = y;
      if (scrolledUp > 250) trigger();
    };

    // Engagement gate: don't fire on landing — wait until they've spent
    // 8s reading. Filters out instant-bouncers from search-result mistakes.
    let timer: number | null = window.setTimeout(() => {
      document.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 8000);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    track.custom("home_exit_intent_clicked", { cta: "placement_test" });
    logLeadEvent({ source_type: "homepage", cta_label: "exit_intent_placement" });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none animate-in slide-in-from-bottom-2 duration-300">
      <div className="relative pointer-events-auto mx-auto max-w-lg bg-card border-2 border-primary/60 shadow-[0_20px_60px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden">
        <button
          onClick={() => setVisible(false)}
          aria-label={isAr ? "إغلاق" : "Dismiss"}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/placement-test"
          onClick={handleClick}
          className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
        >
          <div className="text-3xl flex-shrink-0">🎯</div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-bold text-foreground text-sm leading-tight">
              {isAr ? "قبل ما تمشي — اعرف مستواك في الكورية" : "Before you go — find your Korean level"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {isAr ? "دقيقتين · مجاني · بدون تسجيل" : "2 min · free · no sign-up · instant result"}
            </p>
          </div>
          <div className="flex-shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-[1.03] transition-all">
            {isAr ? "ابدأ" : "Start"} <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomeExitNudge;
