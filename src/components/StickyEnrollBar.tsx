import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * StickyEnrollBar — appears after the user scrolls past the hero CTA buttons.
 * Shows a slim bottom bar: "Still thinking? → Enroll Now" + Free Trial link.
 * Dismissed by clicking X (stored in sessionStorage so it doesn't re-appear on the same visit).
 */
const StickyEnrollBar = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show after user scrolls past 600px
  useEffect(() => {
    if (sessionStorage.getItem("enroll_bar_dismissed")) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 600) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("enroll_bar_dismissed", "1");
  };

  if (dismissed || !visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-2 duration-300"
      role="complementary"
      aria-label={t("stickyBar.ariaLabel")}
    >
      <div className="bg-black border-t border-primary/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 max-w-4xl mx-auto">
        {/* Left: text */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-primary text-lg flex-shrink-0">🇰🇷</span>
          <p className="text-white text-sm font-medium truncate">
            <span className="text-primary font-bold">Klovers</span> — {t("stickyBar.tagline")}
          </p>
        </div>

        {/* Right: CTAs + dismiss */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/free-trial"
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "sticky_bar_free_trial" }); } catch {} }}
            className="text-xs font-semibold text-white/85 hover:text-white transition-colors hidden sm:block"
          >
            {t("stickyBar.freeTrial")}
          </Link>
          <Link
            to="/enroll-now"
            onClick={() => { try { logLeadEvent({ source_type: "enroll", cta_label: "sticky_bar_enroll_now" }); } catch {} }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity border border-black/25"
          >
            {t("stickyBar.enrollNow")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={dismiss}
            aria-label={t("stickyBar.dismiss")}
            className="text-white/60 hover:text-white/90 transition-colors ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyEnrollBar;
