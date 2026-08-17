import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { Gift, Users, Clock, Star, ArrowRight, Video, ClipboardList, Sparkles, CalendarDays, AlertCircle, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import AvatarInitials from "@/components/AvatarInitials";
import { useTrialAvailability, formatSlot, type TrialSlot } from "@/hooks/useTrialAvailability";
import { getUserTimezone } from "@/lib/viewerTimezone";
import { PENDING_TRIAL_SLOT_KEY } from "@/lib/pendingTrialSlot";

/** Stable identity for a slot across re-fetches. */
const slotKey = (s: TrialSlot) => `${s.day_of_week}|${s.start_time}|${s.next_trial_date ?? ""}`;

const Stars = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
    ))}
  </div>
);

const FreeTrialPage = () => {
  const { t, tPlural, language } = useLanguage();
  const isAr = language === "ar";
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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

  /*
    The class-language selector. /free-trial previously had none, so the seat
    counts below were filtered by the *UI* language — an English-reading
    visitor who wanted the Arabic-taught track saw the wrong availability.
    Defaulting to the UI language is a reasonable first guess; the toggle
    makes it correctable.
  */
  const [classLanguage, setClassLanguage] = useState<"arabic" | "english">(
    isAr ? "arabic" : "english",
  );

  const availability = useTrialAvailability(classLanguage);
  const userTz = getUserTimezone();

  const SLOT_HIGHLIGHTS = availability.slots.map((slot) => {
    const label = formatSlot(slot, isAr ? "ar" : "en", userTz);
    return { slot, label };
  });

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

  /*
    Structured data is built from the same fetched slots the page renders.

    It used to carry four hardcoded CourseInstance dates and a fifth,
    contradictory set inside the FAQ answer ("July 3, July 4, July 5 and
    July 7") — so Google was being fed expired course markup that disagreed
    with itself. The CourseInstance and Event nodes are now omitted entirely
    when there is nothing scheduled, rather than advertising a class that
    cannot be booked.
  */
  useEffect(() => {
    if (availability.status === "loading") return;

    const instances = availability.slots
      .filter((s) => s.startsAt)
      .map((s) => ({
        "@type": "CourseInstance",
        courseMode: "online",
        startDate: s.startsAt!.toISOString(),
        endDate: new Date(s.startsAt!.getTime() + s.duration_min * 60_000).toISOString(),
      }));

    const course: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Free Trial Korean Class",
      "description": "30-minute live Korean class with a real teacher. Free, no credit card required.",
      "provider": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free Trial" },
      "inLanguage": "ko",
      "url": "https://kloversegy.com/free-trial",
    };
    if (instances.length > 0) course.hasCourseInstance = instances;

    const nodes: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kloversegy.com" },
          { "@type": "ListItem", "position": 2, "name": "Free Korean Trial Class", "item": "https://kloversegy.com/free-trial" },
        ],
      },
      course,
    ];

    if (availability.nextSlot?.startsAt) {
      nodes.push({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Free Korean Trial Class — Klovers Academy",
        "description": "Join a 30-minute live Korean class with a real teacher. Free, no credit card needed.",
        "url": "https://kloversegy.com/free-trial",
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "startDate": availability.nextSlot.startsAt.toISOString(),
        "endDate": new Date(
          availability.nextSlot.startsAt.getTime() + availability.nextSlot.duration_min * 60_000,
        ).toISOString(),
        "organizer": { "@type": "Organization", "name": "Klovers Korean Academy", "url": "https://kloversegy.com" },
        "offers": {
          "@type": "Offer", "price": "0", "priceCurrency": "USD",
          "availability": "https://schema.org/InStock", "validFrom": new Date().toISOString(),
        },
        "location": { "@type": "VirtualLocation", "url": "https://kloversegy.com/free-trial" },
      });
    }

    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Is the trial class really free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — completely free, no credit card required. You attend a 30-minute live class with a real teacher." } },
        { "@type": "Question", "name": "What level do I need to be?", "acceptedAnswer": { "@type": "Answer", "text": "Any level is welcome. Most students start from zero (Hangul). The teacher will assess your level during the class." } },
        // No literal dates here. They contradicted the CourseInstance nodes
        // above, and they went stale the moment the schedule moved.
        { "@type": "Question", "name": "When are the trial classes?", "acceptedAnswer": { "@type": "Answer", "text": "Upcoming sessions are listed on this page and shown automatically in your own timezone. New sessions are added regularly." } },
        { "@type": "Question", "name": "How do I book?", "acceptedAnswer": { "@type": "Answer", "text": "Pick a time on this page and confirm. You'll receive an email with the class link and a calendar invite." } },
        { "@type": "Question", "name": "What happens after the trial?", "acceptedAnswer": { "@type": "Answer", "text": "After your trial you'll receive a level recommendation and pricing options if you'd like to continue with a full course." } },
      ],
    });

    const el = document.createElement("script");
    el.id = "free-trial-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify(nodes);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [availability.status, availability.slots, availability.nextSlot]);


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

  /*
    Seats and booking deadline, both derived from the same fetched slots.

    Three separate bugs lived in the previous version of this block:
      · it summed capacity across BOTH language tracks, so it over-reported
        seats to everyone;
      · it took `data[0]` as the earliest session without sorting, trusting
        whatever order Postgres happened to return;
      · it computed the deadline against UTC midnight rather than the
        viewer's, which shifted the countdown by up to a day.
  */
  const spotsRemaining = availability.status === "ready" ? availability.spotsRemaining : null;

  const daysToDeadline = useMemo(() => {
    const next = availability.nextSlot;
    if (!next?.startsAt) return null;
    // Booking closes 24h before the session starts.
    const deadlineMs = next.startsAt.getTime() - 86_400_000;
    const days = Math.ceil((deadlineMs - Date.now()) / 86_400_000);
    // Never render a zero-or-negative countdown as a countdown.
    return days >= 0 ? days : null;
  }, [availability.nextSlot]);


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
    logLeadEvent({ source_type: "free_trial", cta_label: "free_trial_landing_primary" });
    if (loading) return;

    /*
      Carry the chosen slot through the account step so the visitor never has
      to pick twice. sessionStorage rather than the URL: the selection is
      transient, and it should not survive being shared or bookmarked.
    */
    const chosen = availability.slots.find((s) => slotKey(s) === selectedKey);
    if (chosen) {
      try {
        sessionStorage.setItem(PENDING_TRIAL_SLOT_KEY, JSON.stringify({
          day_of_week: chosen.day_of_week,
          start_time: chosen.start_time,
          trial_date: chosen.next_trial_date,
          class_language: classLanguage,
        }));
      } catch { /* Storage is optional; they just re-pick on the next page. */ }
    }

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
                      aria-label="Book your free Korean trial class"
                    >
                      {t("freeTrial.cta")}
                      <ArrowRight className="h-5 w-5 rtl-flip" />
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

                  {/* Live availability chips */}
                  {(spotsRemaining !== null || daysToDeadline !== null) && (
                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start" aria-live="polite" aria-atomic="false">
                      {spotsRemaining !== null && spotsRemaining > 0 && spotsRemaining <= 15 && (
                        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          {/* Real capacity − booked, pluralised through CLDR
                              so Arabic gets its dual and `many` forms. */}
                          {tPlural("common.spotsLeft", spotsRemaining)}
                        </span>
                      )}
                      {daysToDeadline !== null && (
                        <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          {daysToDeadline === 0
                            ? t("common.bookingClosesToday")
                            : daysToDeadline === 1
                            ? t("common.bookingClosesTomorrow")
                            : tPlural("common.bookingClosesIn", daysToDeadline)}
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

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-primary-text" />
                <h2 className="text-3xl font-black text-foreground">{t("freeTrial.slotsTitle")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t("freeTrial.slotsSubtitle")}</p>
            </div>

            {/*
              Class-language selector. Availability is per language track, and
              with no selector the page had to guess from the UI language —
              so a visitor browsing in English who wanted the Arabic-taught
              class was shown the wrong seats. A radiogroup, not two coloured
              buttons: the selection is announced, and it is marked by a check
              and a border rather than by background colour alone.
            */}
            <fieldset className="mb-8">
              <legend className="sr-only">{t("freeTrial.classLanguageLegend")}</legend>
              <p className="text-xs font-semibold text-muted-foreground text-center mb-2">
                {t("freeTrial.classLanguageLegend")}
              </p>
              <div role="radiogroup" aria-label={t("freeTrial.classLanguageLegend")} className="flex gap-2 justify-center">
                {(["arabic", "english"] as const).map((lang) => {
                  const selected = classLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => { setClassLanguage(lang); setSelectedKey(null); }}
                      className={`min-h-[44px] px-4 py-2 rounded-xl border-2 text-sm font-bold inline-flex items-center gap-2 transition-colors ${
                        selected
                          ? "border-foreground bg-accent text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {/* Non-colour indicator, so the choice is legible to a
                          colour-blind reader and in high-contrast mode. */}
                      <span aria-hidden="true">{selected ? "●" : "○"}</span>
                      {t(lang === "arabic" ? "freeTrial.taughtInArabic" : "freeTrial.taughtInEnglish")}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* ── Slots ──────────────────────────────────────────
                Four explicit states. The grid can no longer render empty,
                and no urgency copy appears when there is nothing to book. */}
            {availability.status === "loading" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl border-2 border-border bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {availability.status === "error" && (
              <div className="text-center py-10 px-4 border-2 border-border rounded-2xl mb-8">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">{t("freeTrial.slotsErrorTitle")}</p>
                <p className="text-xs text-muted-foreground mb-4">{t("freeTrial.slotsErrorBody")}</p>
                <Button variant="outline" size="sm" className="min-h-[44px]" onClick={availability.refresh}>
                  {t("common.retry")}
                </Button>
              </div>
            )}

            {(availability.status === "unscheduled" || availability.status === "full") && (
              <div className="text-center py-10 px-4 border-2 border-border rounded-2xl mb-8">
                <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">
                  {/* "All sessions are full" used to fire for zero rows of any
                      cause. Full and not-scheduled are now different messages. */}
                  {availability.status === "full"
                    ? t("freeTrial.slotsFullTitle")
                    : t("freeTrial.slotsNoneTitle")}
                </p>
                <p className="text-xs text-muted-foreground mb-4">{t("freeTrial.slotsNoneBody")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] gap-2"
                  onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "free_trial_no_slots" })}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("freeTrial.slotsNoneCta")}
                </Button>
              </div>
            )}

            {availability.status === "ready" && (
              <>
                <p className="sr-only" aria-live="polite">
                  {tPlural("common.sessionsAvailable", availability.slots.length)}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t("freeTrial.slotsTitle")}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                >
                  {SLOT_HIGHLIGHTS.map(({ slot, label }) => {
                    if (!label) return null;
                    const key = slotKey(slot);
                    const selected = selectedKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedKey(key)}
                        className={`text-start border-2 rounded-2xl overflow-hidden transition-all duration-150 ${
                          selected
                            ? "border-foreground shadow-[2px_2px_0px_0px_black] translate-x-[2px] translate-y-[2px]"
                            : "border-foreground/70 shadow-[4px_4px_0px_0px_black] hover:shadow-[2px_2px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px]"
                        }`}
                      >
                        <div className="bg-foreground py-2.5 px-4 text-center flex items-center justify-center gap-2">
                          <span aria-hidden="true" className="text-primary text-xs">{selected ? "●" : "○"}</span>
                          <p className="text-xs font-black text-primary uppercase tracking-widest">{label.day}</p>
                        </div>
                        <div className="relative flex items-center bg-background">
                          <div className="absolute -start-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                          <div className="flex-1 border-t-2 border-dashed border-foreground/25 mx-1" />
                          <div className="absolute -end-[9px] w-4 h-4 bg-background border-2 border-foreground rounded-full z-10" />
                        </div>
                        <div className="bg-background py-5 px-4 text-center">
                          <p className="text-2xl font-black text-foreground">{label.time}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                            {tPlural("common.spotsLeft", slot.spotsLeft)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Honest scarcity: a statement about how the classes are run,
                    not an invented countdown. */}
                <div className="flex items-center justify-center gap-1.5 mb-5 text-xs font-semibold text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {t("freeTrial.urgency")}
                </div>
              </>
            )}

            <Button
              size="lg"
              onClick={handleBookCta}
              disabled={availability.status === "ready" && !selectedKey}
              className="w-full gap-2 text-base font-bold h-14 shadow-xl hover:scale-[1.01] transition-transform"
            >
              {availability.status === "ready" && !selectedKey
                ? t("freeTrial.pickATimeFirst")
                : t("common.ctaBookFreeClass")}
              <ArrowRight className="h-5 w-5 rtl-flip" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              {/*
                The account comes after the choice, not before it. A visitor
                previously had to create an account before seeing a single
                available time — the picker was behind the signup wall.
              */}
              {user ? t("freeTrial.noteSignedIn") : t("freeTrial.noteAccountAfter")}
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
