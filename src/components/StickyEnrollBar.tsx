import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { logLeadEvent } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBottomOverlayOccupant } from "@/lib/bottomOverlay";

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

  // Step aside while the exit nudge is up — they share this anchor.
  const bottomOccupant = useBottomOverlayOccupant();

  if (dismissed || !visible || bottomOccupant === "nudge") return null;

  return (
    <div
      className="fixed bottom-0 start-0 end-0 z-40 animate-in slide-in-from-bottom-2 duration-300"
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
            onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "sticky_bar_free_trial" }); } catch { /* Analytics must not block navigation. */ } }}
            className="text-xs font-semibold text-white/85 hover:text-white transition-colors hidden sm:block"
          >
            {t("stickyBar.freeTrial")}
          </Link>
          <Link
            to="/enroll-now"
            onClick={() => { try { logLeadEvent({ source_type: "enroll", cta_label: "sticky_bar_enroll_now" }); } catch { /* Analytics must not block navigation. */ } }}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] bg-primary text-primary-foreground text-xs font-bold px-4 rounded-lg hover:opacity-90 transition-opacity border border-black/25"
          >
            {t("stickyBar.enrollNow")} <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
          </Link>
          {/*
            44×44 with real separation from the CTA. This was a ~16px icon
            four pixels from "Enroll now", on a bar pinned to the bottom edge
            of a phone — every mis-tap landed on the paid CTA.
          */}
          <button
            onClick={dismiss}
            aria-label={t("stickyBar.dismiss")}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] ms-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyEnrollBar;
