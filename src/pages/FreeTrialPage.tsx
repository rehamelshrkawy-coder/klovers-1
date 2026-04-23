import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { Gift, Users, Clock, Star, ArrowRight, Video, ClipboardList, Sparkles, CalendarDays, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TrialSlotPicker from "@/components/TrialSlotPicker";
import AvatarInitials from "@/components/AvatarInitials";

const Stars = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
    ))}
  </div>
);

const FreeTrialPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

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

  const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
    {
      quote: t("freeTrial.testimonial1Quote"),
      name:  t("freeTrial.testimonial1Name"),
      role:  t("freeTrial.testimonial1Role"),
    },
    {
      quote: t("freeTrial.testimonial2Quote"),
      name:  t("freeTrial.testimonial2Name"),
      role:  t("freeTrial.testimonial2Role"),
    },
  ];

  useSEO({
    title: "Book Your Free Korean Class | Klovers Academy",
    description: "Watch your favourite K-dramas without subtitles. Try a live Korean class for free — real teacher, no credit card, 30 minutes.",
    canonical: "https://kloversegy.com/free-trial",
  });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Free Trial Korean Class",
        "description": "30-minute live Korean class with a real teacher. Free, no credit card required.",
        "provider": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free Trial" },
        "inLanguage": "ko",
        "url": "https://kloversegy.com/free-trial",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Is the trial class really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — completely free, no credit card required. You attend a 30-minute live class with a real teacher." } },
          { "@type": "Question", "name": "What level do I need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Any level is welcome. Most students start from zero (Hangul). The teacher will assess your level during the class." } },
          { "@type": "Question", "name": "When are the trial classes?", "acceptedAnswer": { "@type": "Answer", "text": "Every Saturday at 4:00 PM, Sunday at 6:30 PM, and Wednesday at 5:30 PM Cairo time." } },
          { "@type": "Question", "name": "How do I book?", "acceptedAnswer": { "@type": "Answer", "text": "Click 'Book My Free Class', choose a day, and confirm. You'll receive an email with the class link and a Google Calendar invite." } },
          { "@type": "Question", "name": "What happens after the trial?", "acceptedAnswer": { "@type": "Answer", "text": "After your trial you'll receive a level recommendation and pricing options if you'd like to continue with a full course." } },
        ],
      },
    ]);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref") || "";

  // Live booking count for social proof
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from("trial_bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "completed"])
      .then(({ count }) => { if (count !== null) setBookedCount(count); });
  }, []);

  // Guest inline booking state
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNameError, setGuestNameError] = useState("");
  const [guestEmailError, setGuestEmailError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestDone, setGuestDone] = useState(false);
  const bookingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (referredBy) {
      try { localStorage.setItem("referrer_id", referredBy); } catch {}
      supabase.functions.invoke("track-referral-click", { body: { referrerId: referredBy } }).catch(() => {});
    }
  }, [referredBy]);

  // Fire landing_viewed only after 50% scroll depth — reduces noise vs page load
  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= 0.5) {
        fired = true;
        logLeadEvent({ source_type: "free_trial", cta_label: "landing_viewed" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBookCta = () => {
    logLeadEvent({ source_type: "free_trial", cta_label: "free_trial_landing_primary" });
    if (loading) return;
    if (user) {
      navigate("/trial-booking");
    } else {
      setGuestMode(true);
      setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  };

  const handleGuestSlotPicked = async (dayOfWeek: number, startTime: string) => {
    let valid = true;
    if (!guestName.trim()) { setGuestNameError(t("freeTrial.guestNameRequired") || "Enter your name"); valid = false; }
    if (!guestEmail.trim() || !guestEmail.includes("@")) { setGuestEmailError(t("freeTrial.guestEmailRequired") || "Enter a valid email"); valid = false; }
    if (!valid) return;
    setGuestLoading(true);
    try {
      logLeadEvent({ source_type: "free_trial", cta_label: "trial_booking_guest_confirm", metadata: { day_of_week: dayOfWeek, start_time: startTime } });
      const referrerId = (() => { try { return localStorage.getItem("referrer_id") || undefined; } catch { return undefined; } })();
      const { data, error } = await supabase.functions.invoke("book-trial", {
        body: { name: guestName.trim(), email: guestEmail.trim(), day_of_week: dayOfWeek, start_time: startTime, authed: false, referrer_id: referrerId },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setGuestDone(true);
    } catch {
      // Graceful fallback: hand off to auth flow
      navigate(`/signup?redirect=${encodeURIComponent("/trial-booking")}`);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24 border-b border-border overflow-hidden">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-[1fr_200px] gap-12 items-center">

              {/* Text column */}
              <div className="text-center md:text-start">

                {/* Live badge */}
                <span className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-foreground text-xs font-black tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t("freeTrial.badge")}
                </span>

                {/* Headline — "Free" in yellow with outline */}
                <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[0.88] tracking-tight mb-5">
                  {t("freeTrial.heroTitle1")}
                  <br />
                  <span className="relative inline-block mt-1">
                    <span className="absolute -inset-x-2 -inset-y-1 bg-primary -skew-x-2 rounded-lg" aria-hidden />
                    <span className="relative text-primary text-outlined-lg">{t("freeTrial.heroTitleFree")}</span>
                  </span>
                </h1>

                {/* Emotional subtitle */}
                <p className="text-base md:text-xl text-muted-foreground max-w-md mb-6 mx-auto md:mx-0 leading-relaxed">
                  {t("freeTrial.heroSubtitleEmotional")}
                </p>

                {/* Star rating */}
                <div className="flex items-center gap-2 justify-center md:justify-start mb-8">
                  <Stars />
                  <span className="text-sm font-semibold text-foreground">{t("freeTrial.ratingText")}</span>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center md:items-start gap-3 justify-center md:justify-start">
                  {!user && (
                    <p className="text-xs text-muted-foreground text-center md:text-start">
                      {t("freeTrial.noteSignedOut")}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row items-center md:items-start gap-4">
                    <Button
                      size="lg"
                      onClick={handleBookCta}
                      className="gap-2 text-base font-bold h-14 px-8 shadow-xl hover:scale-[1.02] transition-transform"
                    >
                      {t("freeTrial.cta")}
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                    {/* Inline social proof */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {["S","M","H","Y","A"].map((l) => (
                          <div key={l} className="w-8 h-8 rounded-full bg-foreground border-2 border-background flex items-center justify-center text-[10px] font-black text-background">{l}</div>
                        ))}
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-black text-foreground leading-tight">
                          {bookedCount !== null ? `${bookedCount}+ students` : t("freeTrial.socialCount")}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight">{t("freeTrial.socialCountText")}</p>
                      </div>
                    </div>
                  </div>
                  {user && (
                    <p className="text-xs text-muted-foreground text-center md:text-start">
                      {t("freeTrial.noteSignedIn")}
                    </p>
                  )}
                </div>

                {/* Perks chips */}
                <div className="flex flex-wrap gap-2 mt-8 justify-center md:justify-start">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-foreground/25 bg-background flex-shrink-0">
                        <Icon className="h-3 w-3 text-primary" />
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative card — desktop only */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-44 h-56 bg-primary rounded-3xl shadow-2xl flex items-center justify-center rotate-6 hover:rotate-1 transition-transform duration-500 cursor-default select-none">
                  <span className="text-8xl font-black leading-none" style={{ color: "rgba(0,0,0,0.1)" }}>한</span>
                  <div className="absolute -bottom-5 -left-5 bg-foreground text-background rounded-2xl px-4 py-3 shadow-xl -rotate-3">
                    <p className="text-[10px] font-bold text-background/60 uppercase tracking-wider">Free Trial</p>
                    <p className="text-sm font-black leading-tight">No credit card</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────── */}
        <section className="py-16 bg-muted/40 border-b border-border">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-black text-foreground text-center mb-8">
              {t("freeTrial.testimonialsTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t_) => (
                <div key={t_.name} className="bg-background border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <Stars />
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    "{t_.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <AvatarInitials name={t_.name} size={36} />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-tight">{t_.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{t_.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT TO EXPECT — dark ─────────────────────────── */}
        <section className="py-20 bg-foreground">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-black text-background text-center mb-12">
              {t("freeTrial.whatToExpectTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden">
              {STEPS.map(({ icon: Icon, num, text }) => (
                <div key={num} className="flex flex-col items-start gap-5 bg-foreground hover:bg-white/5 transition-colors p-8 group">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-black text-primary leading-none">{num}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-background" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-background/75 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCHEDULE — ticket style ────────────────────────── */}
        <section className="py-20 pb-28">
          <div className="container mx-auto px-4 max-w-xl">

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-3xl font-black text-foreground">{t("freeTrial.slotsTitle")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t("freeTrial.slotsSubtitle")}</p>
            </div>

            {/* Ticket cards — 1-col mobile, 3-col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {SLOT_HIGHLIGHTS.map((s) => (
                <div
                  key={s.day}
                  className="border-2 border-foreground rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_black] hover:shadow-[2px_2px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 cursor-default"
                >
                  {/* Header */}
                  <div className="bg-foreground py-2.5 px-4 text-center">
                    <p className="text-xs font-black text-primary uppercase tracking-widest">{s.day}</p>
                  </div>
                  {/* Perforated divider */}
                  <div className="relative flex items-center bg-background">
                    <div className="absolute -left-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                    <div className="flex-1 border-t-2 border-dashed border-foreground/25 mx-1" />
                    <div className="absolute -right-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                  </div>
                  {/* Body */}
                  <div className="bg-background py-5 px-4 text-center">
                    <p className="text-2xl font-black text-foreground">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Urgency */}
            <div className="flex items-center justify-center gap-1.5 mb-5 text-xs font-semibold text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {t("freeTrial.urgency")}
            </div>

            <Button
              size="lg"
              onClick={handleBookCta}
              className="w-full gap-2 text-base font-bold h-14 shadow-xl hover:scale-[1.01] transition-transform"
            >
              {t("freeTrial.ctaSecondary")}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteSignedOut")}
            </p>

            {/* Trust guarantee */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <span className="text-green-600 font-bold">✓</span>
              <span>{isAr ? "إذا ما عجبتكش الحصة الأولى — هنرجعلك فلوسك أو نعيد الحجز بدون أسئلة." : "If your first class isn't great, we'll refund or rebook — no questions asked."}</span>
            </div>
          </div>
        </section>

        {/* ── INLINE GUEST BOOKING ──────────────────────────── */}
        {guestMode && (
          <section ref={bookingRef} className="py-16 bg-primary/5 border-t-2 border-primary/20 scroll-mt-20">
            <div className="container mx-auto px-4 max-w-lg">

              {guestDone ? (
                /* Success state */
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    {t("trialBooking.successTitle") || "You're booked! 🎉"}
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm">
                    {t("trialBooking.successDesc") || "Check your email for confirmation. We'll send you the Zoom link before the class."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      asChild
                      className="gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
                    >
                      <a
                        href={WHATSAPP_BASE}
                        onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "post_guest_booking_whatsapp" }); }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t("trialBooking.whatsappPromptTitle") || "Say hi on WhatsApp"}
                      </a>
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/signup?redirect=/dashboard")} className="gap-2">
                      {t("freeTrial.createAccount") || "Create your account"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Booking form */
                <div className="bg-background border border-border rounded-3xl p-8 shadow-xl">
                  <h2 className="text-2xl font-black text-foreground mb-1">
                    {t("trialBooking.pickTimeTitle") || "Pick your slot"}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("freeTrial.guestFormSubtitle") || "No account needed — just your name and email."}
                  </p>

                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="guest-name">{t("freeTrial.guestName") || "Your name"}</Label>
                      <Input
                        id="guest-name"
                        placeholder={t("freeTrial.guestNamePlaceholder") || "e.g. Sara"}
                        value={guestName}
                        onChange={(e) => { setGuestName(e.target.value); setGuestNameError(""); }}
                        className={guestNameError ? "border-destructive" : ""}
                      />
                      {guestNameError && <p className="text-xs text-destructive">{guestNameError}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="guest-email">{t("freeTrial.guestEmail") || "Your email"}</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        placeholder="sara@example.com"
                        value={guestEmail}
                        onChange={(e) => { setGuestEmail(e.target.value); setGuestEmailError(""); }}
                        className={guestEmailError ? "border-destructive" : ""}
                      />
                      {guestEmailError && <p className="text-xs text-destructive">{guestEmailError}</p>}
                    </div>
                  </div>

                  <TrialSlotPicker onSelect={handleGuestSlotPicked} onBack={() => setGuestMode(false)} />

                  {guestLoading && (
                    <p className="text-sm text-muted-foreground text-center mt-4 animate-pulse">
                      {t("trialBooking.bookingTrial") || "Booking your slot…"}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground text-center mt-5">
                    {t("freeTrial.noteSignedOut")}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
