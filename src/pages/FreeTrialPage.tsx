import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent } from "@/lib/leadTracking";
import { Gift, Users, Clock, Star, ArrowRight, CalendarDays, Video, ClipboardList, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FreeTrialPage = () => {
  const { t } = useLanguage();

  const PERKS = [
    { icon: Gift,  text: t("freeTrial.perkFree") },
    { icon: Users, text: t("freeTrial.perkLive") },
    { icon: Clock, text: t("freeTrial.perkDuration") },
    { icon: Star,  text: t("freeTrial.perkAssessment") },
  ];

  const STEPS = [
    { icon: Video,         num: "1", text: t("trialBooking.expectItem1") },
    { icon: ClipboardList, num: "2", text: t("trialBooking.expectItem2") },
    { icon: Sparkles,      num: "3", text: t("trialBooking.expectItem3") },
  ];

  const SLOT_HIGHLIGHTS = [
    { day: t("freeTrial.daySaturday"),  time: "4:00 PM" },
    { day: t("freeTrial.daySunday"),    time: "6:30 PM" },
    { day: t("freeTrial.dayWednesday"), time: "5:30 PM" },
  ];

  useSEO({
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Try a live Korean class for free. No credit card. Real teacher. 30 minutes. Join 1,000+ students learning Korean the right way.",
    canonical: "https://kloversegy.com/free-trial",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Free Trial Korean Class",
      "description": "30-minute live Korean class with a real teacher. Free, no credit card required.",
      "provider": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free Trial" },
      "inLanguage": "ko",
      "url": "https://kloversegy.com/free-trial",
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref") || "";

  useEffect(() => {
    if (referredBy) {
      try { localStorage.setItem("referrer_id", referredBy); } catch {}
      supabase.functions.invoke("track-referral-click", { body: { referrerId: referredBy } }).catch(() => {});
    }
  }, [referredBy]);

  useEffect(() => {
    logLeadEvent({ source_type: "free_trial", cta_label: "landing_viewed" });
  }, []);

  const handleBookCta = async () => {
    logLeadEvent({ source_type: "free_trial", cta_label: "free_trial_landing_primary" });
    if (loading) return;
    if (user) {
      navigate("/trial-booking");
    } else {
      navigate(`/signup?redirect=${encodeURIComponent("/trial-booking")}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">

        {/* ── HERO — full yellow ──────────────────────── */}
        <section className="relative bg-primary overflow-hidden py-16 md:py-24">
          {/* Korean character watermark */}
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[26rem] md:text-[36rem] font-black leading-none select-none pointer-events-none"
            style={{ color: "rgba(0,0,0,0.06)" }}
          >
            한
          </span>

          <div className="relative container mx-auto px-4 text-center max-w-2xl">
            {/* Badge */}
            <span className="inline-block bg-foreground text-background text-xs font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6">
              {t("freeTrial.badge")}
            </span>

            {/* Headline */}
            <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tight mb-5 leading-[0.95]">
              {t("freeTrial.heroTitle1")}
              <br />
              <span className="text-foreground text-outlined-lg">{t("freeTrial.heroTitleFree")}</span>
            </h1>

            <p className="text-base md:text-lg text-foreground/70 max-w-sm mx-auto mb-8">
              {t("freeTrial.heroSubtitle")}
            </p>

            {/* Social proof pill */}
            <div className="inline-flex items-center gap-2 bg-foreground/10 border border-foreground/20 rounded-full px-4 py-2 mb-6">
              <div className="flex -space-x-1.5">
                {["N","M","H","Y","J"].map((l) => (
                  <div
                    key={l}
                    className="w-6 h-6 rounded-full bg-foreground/20 border-2 border-primary flex items-center justify-center text-[9px] font-black text-foreground"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-xs text-foreground/80">
                <span className="font-bold text-foreground">{t("freeTrial.bookedSuffixCount")}</span>{" "}
                {t("freeTrial.bookedSuffixText")}
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handleBookCta}
                className="bg-foreground text-background hover:bg-foreground/90 gap-2 text-base font-bold h-14 px-10 shadow-2xl hover:scale-[1.02] transition-transform"
              >
                {t("freeTrial.cta")}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-xs text-foreground/60">
                {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteSignedOut")}
              </p>
            </div>
          </div>
        </section>

        {/* ── PERKS STRIP — dark ─────────────────────── */}
        <section className="bg-foreground py-4 border-b border-background/10">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm font-semibold text-background/80">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT ─────────────────────────── */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-black text-foreground text-center mb-12">
              {t("freeTrial.whatToExpectTitle")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map(({ icon: Icon, num, text }) => (
                <div
                  key={num}
                  className="relative overflow-hidden flex flex-col gap-4 bg-card border-2 border-border rounded-3xl p-6 shadow-sm hover:border-primary hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Large decorative step number */}
                  <span
                    aria-hidden
                    className="absolute -bottom-3 -end-2 text-9xl font-black leading-none select-none pointer-events-none transition-colors duration-200 group-hover:text-primary/20"
                    style={{ color: "rgba(0,0,0,0.05)" }}
                  >
                    {num}
                  </span>

                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                    <Icon className="h-6 w-6 text-black" />
                  </div>

                  <p className="text-sm font-semibold text-foreground leading-relaxed relative z-10">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCHEDULE — dark ────────────────────────── */}
        <section className="bg-foreground py-16 pb-24">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/20 mb-4">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>

            <h2 className="text-3xl font-black text-background mb-2">
              {t("freeTrial.slotsTitle")}
            </h2>
            <p className="text-sm text-background/50 mb-8">
              {t("freeTrial.slotsSubtitle")}
            </p>

            {/* Slot cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {SLOT_HIGHLIGHTS.map((s) => (
                <div
                  key={s.day}
                  className="rounded-2xl border border-background/15 bg-background/8 p-4 text-center hover:border-primary/50 hover:bg-background/15 transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[11px] font-bold text-background/50 uppercase tracking-wider mb-2">{s.day}</p>
                  <p className="text-xl font-black text-primary">{s.time}</p>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={handleBookCta}
              className="w-full bg-primary text-black hover:bg-primary/90 gap-2 text-base font-bold h-14 shadow-xl hover:scale-[1.01] transition-transform"
            >
              {t("freeTrial.ctaSecondary")}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-background/40 mt-4">
              {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteSignedOut")}
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
