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

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background -z-10" />

          <div className="container mx-auto px-4 text-center max-w-2xl">
            <span className="inline-block bg-primary text-black text-xs font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6">
              {t("freeTrial.badge")}
            </span>

            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-4 leading-[1.0]">
              {t("freeTrial.heroTitle1")}{" "}
              <span className="text-primary text-outlined-lg">{t("freeTrial.heroTitleFree")}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-8">
              {t("freeTrial.heroSubtitle")}
            </p>

            {/* Social proof — near CTA for max impact */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex -space-x-2">
                {["N","M","H","Y","J"].map((l) => (
                  <div key={l} className="w-8 h-8 rounded-full bg-primary/25 border-2 border-background flex items-center justify-center text-xs font-bold text-primary">{l}</div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{t("freeTrial.bookedSuffixCount")}</span>{" "}
                {t("freeTrial.bookedSuffixText")}
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleBookCta}
              className="gap-2 text-base font-bold h-14 px-10 shadow-xl hover:scale-[1.02] transition-transform"
            >
              {t("freeTrial.cta")}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground mt-3">
              {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteSignedOut")}
            </p>

            {/* Perks as pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-10">
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT ────────────────────────────────── */}
        <section className="py-16 bg-muted/40 border-y border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              {t("freeTrial.whatToExpectTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STEPS.map(({ icon: Icon, num, text }) => (
                <div key={num} className="relative flex flex-col items-center text-center gap-4 bg-background border border-border rounded-2xl p-6 shadow-sm">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-primary text-black text-xs font-black flex items-center justify-center leading-none">
                      {num}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCHEDULE ──────────────────────────────────────── */}
        <section className="py-16 pb-24">
          <div className="container mx-auto px-4 max-w-md">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 mb-4">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("freeTrial.slotsTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("freeTrial.slotsSubtitle")}</p>

              <div className="grid grid-cols-3 gap-2 mb-8">
                {SLOT_HIGHLIGHTS.map((s) => (
                  <div key={s.day} className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{s.day}</p>
                    <p className="text-lg font-black text-foreground mt-1">{s.time}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleBookCta}
                className="w-full gap-2 text-base font-bold h-14"
              >
                {t("freeTrial.ctaSecondary")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
