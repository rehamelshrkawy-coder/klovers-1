import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import {
  AVERAGE_RATING,
  RATINGS_COUNT,
  TRIAL_DURATION_MIN,
  TRIAL_GROUP_SIZE_MAX,
  WHATSAPP_BASE,
} from "@/lib/siteConfig";
import { Gift, Users, Clock, Star, ArrowRight, Video, ClipboardList, Sparkles, CalendarDays, AlertCircle, MessageCircle, Sunrise, Sunset } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AvatarInitials from "@/components/AvatarInitials";
import { useTrialAvailability, formatSession, visitorTimezone } from "@/hooks/useTrialAvailability";

const Stars = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-primary-text text-primary-text" aria-hidden="true" />
    ))}
  </div>
);

const FreeTrialPage = () => {
  const { t, tInterpolate, language } = useLanguage();
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

  // Live schedule. The page used to carry its own hardcoded array of expired
  // instants — a *third* set, disagreeing with both the hero's and the JSON-LD's
  // — so this section rendered an empty grid under "4 upcoming sessions".
  const { sessions, loading: slotsLoading, errored: slotsErrored, spotsRemaining } = useTrialAvailability();
  const userTz = visitorTimezone();

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

  // Structured data is rebuilt from the same live sessions the page renders.
  // It previously published a hardcoded, six-weeks-expired CourseInstance list
  // to Google with `availability: InStock`, plus a FAQ answer naming a third
  // set of dates ("July 3, 4, 5, 7") that matched nothing else on the site.
  useEffect(() => {
    if (slotsLoading) return;
    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    const courseInstances = sessions.map((s) => ({
      "@type": "CourseInstance",
      courseMode: "online",
      startDate: s.startsAt.toISOString(),
      endDate: new Date(s.startsAt.getTime() + s.durationMin * 60_000).toISOString(),
      maximumAttendeeCapacity: s.capacity,
    }));
    el.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kloversegy.com" },
          { "@type": "ListItem", "position": 2, "name": "Free Korean Trial Class", "item": "https://kloversegy.com/free-trial" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Free Trial Korean Class",
        "description": `${TRIAL_DURATION_MIN}-minute live group Korean class with a real teacher, up to ${TRIAL_GROUP_SIZE_MAX} students. Free, no credit card required.`,
        "provider": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free Trial" },
        "inLanguage": "ko",
        "url": "https://kloversegy.com/free-trial",
        ...(courseInstances.length > 0 ? { hasCourseInstance: courseInstances } : {}),
      },
      // The Event node is only published while there is a real session to
      // point at — an InStock offer with no session behind it is a lie to the
      // crawler as much as to the visitor.
      ...(sessions.length > 0 ? [{
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Free Korean Trial Class — Klovers Academy",
        "description": `Join a ${TRIAL_DURATION_MIN}-minute live group Korean class with a real teacher. Free, no credit card needed.`,
        "url": "https://kloversegy.com/free-trial",
        "startDate": sessions[0].startsAt.toISOString(),
        "endDate": new Date(sessions[0].startsAt.getTime() + sessions[0].durationMin * 60_000).toISOString(),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "maximumAttendeeCapacity": sessions[0].capacity,
        "remainingAttendeeCapacity": sessions[0].spotsLeft,
        "organizer": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": "https://kloversegy.com/free-trial", "validFrom": new Date().toISOString() },
        "location": { "@type": "VirtualLocation", "url": "https://kloversegy.com/free-trial" },
      }] : []),
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Is the trial class really free?", "acceptedAnswer": { "@type": "Answer", "text": `Yes — completely free, no credit card required. You attend a ${TRIAL_DURATION_MIN}-minute live class with a real teacher.` } },
          { "@type": "Question", "name": "Is the trial a group class or one-to-one?", "acceptedAnswer": { "@type": "Answer", "text": `The trial is a live group class with up to ${TRIAL_GROUP_SIZE_MAX} students, so you get to speak in every session.` } },
          { "@type": "Question", "name": "What level do I need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Any level is welcome. Most students start from zero (Hangul). The teacher will assess your level during the class." } },
          { "@type": "Question", "name": "When are the trial classes?", "acceptedAnswer": { "@type": "Answer", "text": sessions.length > 0
            ? `Upcoming sessions: ${sessions.map((s) => s.startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })).join(", ")} (UTC). All times are automatically shown in your local timezone on the booking page.`
            : "New sessions are published every week. Open the booking page to see the current schedule in your local timezone." } },
          { "@type": "Question", "name": "How do I book?", "acceptedAnswer": { "@type": "Answer", "text": "Click 'Book My Free Class', choose a day, and confirm. You'll receive an email with the class link and a Google Calendar invite." } },
          { "@type": "Question", "name": "What happens after the trial?", "acceptedAnswer": { "@type": "Answer", "text": "After your trial you'll receive a level recommendation and pricing options if you'd like to continue with a full course." } },
        ],
      },
    ]);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [sessions, slotsLoading]);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get("ref") || "";

  // Live booking count for social proof.
  const [bookedCount, setBookedCount] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from("trial_bookings")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "completed"])
      .then(({ count }) => { if (count !== null) setBookedCount(count); });
  }, []);

  // Booking cutoff = one day before the soonest session. Derived from the same
  // live sessions as everything else on the page rather than a second query.
  const daysToDeadline = sessions.length > 0
    ? Math.max(0, Math.ceil((sessions[0].startsAt.getTime() - 86_400_000 - Date.now()) / 86_400_000))
    : null;


  useEffect(() => {
    if (referredBy) {
      try { localStorage.setItem("referrer_id", referredBy); } catch { /* Storage is optional. */ }
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
    // The analytics event fires only when the tap actually navigates. It used
    // to fire first and then bail out while auth was still loading, so the
    // CTA-click metric counted taps that went nowhere — and the visitor got no
    // spinner, no disabled state, and no navigation.
    if (loading) return;
    logLeadEvent({ source_type: "free_trial", cta_label: "free_trial_landing_primary" });
    navigate(user ? "/trial-booking" : `/signup?redirect=${encodeURIComponent("/trial-booking")}`);
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
                    <span className="relative text-primary-text text-outlined-lg">{t("freeTrial.heroTitleFree")}</span>
                  </span>
                </h1>

                {/* Emotional subtitle */}
                <p className="text-base md:text-xl text-muted-foreground max-w-md mb-6 mx-auto md:mx-0 leading-relaxed">
                  {t("freeTrial.heroSubtitleEmotional")}
                </p>

                {/* Star rating */}
                <div className="flex items-center gap-2 justify-center md:justify-start mb-8">
                  <Stars />
                  <span className="text-sm font-semibold text-foreground">
                    {tInterpolate(t("freeTrial.ratingText"), { rating: AVERAGE_RATING.toFixed(1), count: RATINGS_COUNT })}
                  </span>
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
                      disabled={loading}
                      className="gap-2 text-base font-bold h-14 px-8 shadow-xl hover:scale-[1.02] transition-transform"
                    >
                      {t("freeTrial.cta")}
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                    {/* Inline social proof */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {["S","M","H","Y","A"].map((l) => (
                          <div key={l} className="w-8 h-8 rounded-full bg-foreground border-2 border-background flex items-center justify-center text-[10px] font-black text-background">{l}</div>
                        ))}
                      </div>
                      {/* The live count is only shown once it is actually
                          impressive. It used to render "+0 students" three
                          centimetres below a claim of "Rated by 200+", because
                          a fresh trial_bookings table legitimately reads zero. */}
                      <div className="text-start">
                        <p className="text-sm font-black text-foreground leading-tight">
                          {bookedCount !== null && bookedCount >= 10
                            ? (isAr ? `+${bookedCount} طالب` : `${bookedCount}+ students`)
                            : t("freeTrial.socialCount")}
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

                  {/* Live availability chips — every one carries a real number
                      derived from capacity minus bookings. Nothing here fires
                      unless the data says so. */}
                  {!slotsLoading && sessions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start" aria-live="polite" aria-atomic="false">
                      {spotsRemaining <= 15 && (
                        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          {isAr
                            ? `باقي ${spotsRemaining} ${spotsRemaining === 1 ? "مكان" : "أماكن"}`
                            : `${spotsRemaining} ${spotsRemaining === 1 ? "spot" : "spots"} left`}
                        </span>
                      )}
                      {daysToDeadline !== null && (
                        <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          {daysToDeadline === 0
                            ? (isAr ? "الحجز يقفل النهارده" : "Booking closes today")
                            : daysToDeadline === 1
                            ? (isAr ? "الحجز يقفل بكرة" : "Booking closes tomorrow")
                            : (isAr ? `الحجز يقفل خلال ${daysToDeadline} أيام` : `Booking closes in ${daysToDeadline} days`)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Perks chips */}
                <div className="flex flex-wrap gap-2 mt-8 justify-center md:justify-start">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-foreground/25 bg-background flex-shrink-0">
                        <Icon className="h-3 w-3 text-primary-text" />
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
                  <div className="absolute -bottom-5 -start-5 bg-foreground text-background rounded-2xl px-4 py-3 shadow-xl -rotate-3">
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
                    <span className="text-5xl font-black text-primary-text leading-none">{num}</span>
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
                <CalendarDays className="h-5 w-5 text-primary-text" />
                <h2 className="text-3xl font-black text-foreground">{t("freeTrial.slotsTitle")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t("freeTrial.slotsSubtitle")}</p>
              {/* The trial's format, stated plainly. Neither page used to say
                  the trial is a group class; the only leak was "— 3 spots left"
                  inside a dropdown label on the next screen. */}
              <p className="text-sm font-semibold text-foreground mt-2">
                {isAr
                  ? `حصة جماعية · حتى ${TRIAL_GROUP_SIZE_MAX} طلاب · ${TRIAL_DURATION_MIN} دقيقة`
                  : `Group class · up to ${TRIAL_GROUP_SIZE_MAX} students · ${TRIAL_DURATION_MIN} minutes`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? `كل الأوقات بتوقيتك (${userTz.replace(/_/g, " ")})` : `All times in your timezone (${userTz.replace(/_/g, " ")})`}
              </p>
            </div>

            {/* Ticket cards — live sessions, and each card IS the CTA. */}
            {slotsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl border-2 border-border bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {sessions.slice(0, 4).map((session) => {
                  const { weekdayLong, dateLabel, time, period } = formatSession(session, isAr ? "ar" : "en", userTz);
                  const PeriodIcon = period === "morning" ? Sunrise : Sunset;
                  return (
                    <button
                      key={session.key}
                      type="button"
                      onClick={handleBookCta}
                      className="text-start border-2 border-foreground rounded-2xl overflow-hidden shadow-lg hover:-translate-y-0.5 transition-all duration-150"
                    >
                      {/* Header */}
                      <div className="bg-foreground py-2.5 px-4 text-center">
                        <p className="text-xs font-black text-primary-text uppercase tracking-widest">
                          {weekdayLong} · {dateLabel}
                        </p>
                      </div>
                      {/* Perforated divider */}
                      <div className="relative flex items-center bg-background">
                        <div className="absolute -left-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                        <div className="flex-1 border-t-2 border-dashed border-foreground/25 mx-1" />
                        <div className="absolute -right-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                      </div>
                      {/* Body */}
                      <div className="bg-background py-5 px-4 text-center">
                        <p className="text-2xl font-black text-foreground">{time}</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <PeriodIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {period === "morning"
                            ? (isAr ? "صباحاً" : "Morning")
                            : (isAr ? "مساءً" : "Evening")}
                          <span aria-hidden="true">·</span>
                          {isAr
                            ? `${session.spotsLeft} من ${session.capacity} متاح`
                            : `${session.spotsLeft} of ${session.capacity} seats left`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Honest empty state with a recovery path. The booking screen used
                 to tell every visitor "All sessions are currently full" for any
                 reason the query returned zero rows, including misconfiguration. */
              <div className="mb-8 rounded-2xl border-2 border-border bg-muted/40 p-6 text-center space-y-3">
                <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">
                  {slotsErrored
                    ? (isAr ? "مش قادرين نحمّل المواعيد دلوقتي." : "We couldn't load the schedule just now.")
                    : (isAr ? "مفيش مواعيد معلنة للأسبوع ده." : "No sessions are published for this week yet.")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "راسلنا على واتساب ونرتّب لك موعداً مناسباً."
                    : "Message us on WhatsApp and we'll arrange a time that suits you."}
                </p>
                <Button
                  variant="outline"
                  className="gap-2 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground border-0"
                  onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "free_trial_empty_schedule" })}
                >
                  <MessageCircle className="h-4 w-4" />
                  {isAr ? "كلمنا على واتساب" : "Chat on WhatsApp"}
                </Button>
              </div>
            )}

            {/* Urgency — only when real capacity is genuinely low. */}
            {!slotsLoading && sessions.length > 0 && spotsRemaining <= 15 && (
              <div className="flex items-center justify-center gap-1.5 mb-5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {isAr
                  ? `باقي ${spotsRemaining} ${spotsRemaining === 1 ? "مكان" : "أماكن"} في المواعيد الجاية`
                  : `${spotsRemaining} ${spotsRemaining === 1 ? "seat" : "seats"} left across the upcoming sessions`}
              </div>
            )}

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


      </main>
      <Footer />
    </div>
  );
};

export default FreeTrialPage;
