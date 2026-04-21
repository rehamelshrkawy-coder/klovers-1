import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent } from "@/lib/leadTracking";
import { Star, Users, Clock, ArrowRight, Gift, CalendarDays } from "lucide-react";

const PERKS = [
  { icon: Gift, text: "100% free — no credit card" },
  { icon: Users, text: "Live class with real teacher" },
  { icon: Clock, text: "45-minute session" },
  { icon: Star, text: "Personalised level assessment" },
];

const SLOT_HIGHLIGHTS = [
  { day: "Wednesday", time: "5:30 PM" },
  { day: "Sunday",    time: "6:30 PM" },
];

const FreeTrialPage = () => {
  useSEO({
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Try a live Korean class for free. No credit card. Real teacher. 45 minutes. Join 1,000+ students learning Korean the right way.",
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
      "description": "45-minute live Korean class with a real teacher. Free, no credit card required.",
      "provider": {
        "@type": "Organization",
        "name": "Klovers Korean Academy",
        "url": "https://kloversegy.com",
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "category": "Free Trial",
      },
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

  // Preserve the existing referral-tracking behaviour from the previous
  // version of this page so referrer attribution keeps working.
  useEffect(() => {
    if (referredBy) {
      try { localStorage.setItem("referrer_id", referredBy); } catch {}
      supabase.functions.invoke("track-referral-click", {
        body: { referrerId: referredBy },
      }).catch(() => {});
    }
  }, [referredBy]);

  // Funnel step: landing page viewed. Lets us compute
  // "landing_viewed → cta_clicked" abandonment rate.
  useEffect(() => {
    logLeadEvent({ source_type: "free_trial", cta_label: "landing_viewed" });
  }, []);

  const handleBookCta = async () => {
    // Fire-and-forget lead event so we know which CTA brought them in.
    logLeadEvent({
      source_type: "free_trial",
      cta_label: "free_trial_landing_primary",
    });

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

        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <span className="inline-block bg-primary text-black text-xs font-black tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-5">
              Free Trial
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-5 leading-[1.05]">
              Try Korean for <span className="text-primary text-outlined-lg">Free</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              One live class. Real teacher. No credit card. Pick a time that works for you.
            </p>

            <Button
              size="lg"
              onClick={handleBookCta}
              className="gap-2 text-base font-bold h-14 px-8 shadow-xl hover:scale-[1.02] transition-transform"
            >
              Book Your Free Korean Class
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground mt-3">
              {user ? "You're signed in — pick a slot on the next page." : "Takes 30 seconds. We'll create your account so you can manage your bookings."}
            </p>

            {/* Perks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary border border-black/25 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When do trials run */}
        <section className="py-12 pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 mb-3">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">When do trials run?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We run two free trial sessions every week. All times are in Cairo (Africa/Cairo).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {SLOT_HIGHLIGHTS.map((s) => (
                  <div key={s.day} className="rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.day}</p>
                    <p className="text-2xl font-black text-foreground mt-1">{s.time}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleBookCta}
                className="w-full sm:w-auto gap-2 text-base font-bold h-13 px-8"
              >
                Book Your Free Korean Class
                <ArrowRight className="h-5 w-5" />
              </Button>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-border mt-6">
                <div className="flex -space-x-1.5">
                  {["N","M","H","Y","J"].map((l) => (
                    <div key={l} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary">{l}</div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">14 students</span> booked this week
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
