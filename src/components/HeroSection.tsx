import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, Globe, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
const heroPoster = "/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { useTrialAvailability, formatSlot } from "@/hooks/useTrialAvailability";

/**
 * Counts 0 → target once the element is actually on screen.
 *
 * Two guards matter here:
 *  - `Math.max(0, …)`: `performance.now()` is not guaranteed to be monotonic
 *    relative to a timestamp captured in a different frame, so `now - start`
 *    can come back negative on the first tick and the hero briefly rendered a
 *    negative student count.
 *  - the observer starts the animation, so it can never run during the hero's
 *    first paint before the strip is visible.
 */
const useCountUp = (target: number, duration = 1800) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the user's motion preference: land on the final value at once.
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setCount(target); return; }

    if (typeof IntersectionObserver === "undefined") { setCount(target); return; }

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = Math.max(0, now - start);
        const t = Math.min(elapsed / duration, 1);
        setCount(Math.max(0, Math.round(t * target)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
};

const HeroSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { count: studentCount, ref: studentRef } = useCountUp(500);
  const { count: ratingCount, ref: ratingRef } = useCountUp(49, 1200);
  const { ref: monthsRef } = useCountUp(6);

  /*
    Live schedule. The hero used to carry its own literal array of four MYT
    timestamps that had already expired, so the "next class" chip and the date
    pills advertised classes that no longer existed.
  */
  const availability = useTrialAvailability();
  const nextSlotLabel = useMemo(() => {
    if (!availability.nextSlot) return null;
    return formatSlot(availability.nextSlot, isAr ? "ar" : "en");
  }, [availability.nextSlot, isAr]);

  /* Locale-aware grouping. A hardcoded 'en-US' put Western grouping into an
     Arabic sentence. */
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US"),
    [isAr],
  );

  useEffect(() => {
    const conn = (navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string; saveData?: boolean };
    }).connection;

    /*
      Opt in, never opt out.

      The old test was `!conn || conn.type === "wifi" || conn.effectiveType === "4g"`.
      `navigator.connection` is undefined on every iPhone, so `!conn` was true
      and every iOS visitor downloaded a 30–45 MB hero video regardless of
      their actual network. Now an unknown connection means "don't", and
      Data Saver — widely enabled in Egypt — is honoured.
    */
    if (!conn) return;
    if (conn.saveData) return;
    const isFast = conn.type === "wifi" || conn.effectiveType === "4g";
    if (!isFast) return;

    // A decorative background loop is exactly what this preference is for.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const timer = setTimeout(() => setShowVideo(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  /*
    The <video> element only exists once showVideo flips, so the source has to
    be attached in a second pass. Doing it in the timer read videoRef.current
    while the element was still unmounted, so it was always null and the video
    never actually loaded.
  */
  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;
    video.src = "/videos/hero-korea-video-new.mp4";
    video.load();
    video.play().catch(() => {
      /* Autoplay refusal is fine — the poster image stays. */
    });
  }, [showVideo]);

  return (
    <section
      id="home"
      className="relative min-h-[100svh] flex flex-col items-center justify-center pt-16 overflow-hidden"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* ── Background layer ─────────────────────────────────── */}
      <img
        src={heroPoster}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 animate-ken-burns brightness-110 saturate-[1.15] ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />
      {showVideo && (
        <video
          ref={videoRef}
          poster={heroPoster}
          preload="none"
          loop
          muted
          playsInline
          aria-hidden="true"
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Cinematic gradient — just enough for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/55" />
      {/* Bottom scrim for stats readability */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Primary colour glow behind headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, hsl(60 100% 50% / 0.18) 0%, transparent 70%)" }}
      />

      {/* ── Decorative large Korean text (backdrop) ──────────── */}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: "clamp(180px, 30vw, 420px)",
          fontWeight: 900,
          color: "rgba(255, 255, 0, 0.035)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        한국어
      </span>

      {/* ── Hero text content — truly centered ───────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full px-4 text-center pb-36">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-8">

          {/* Live badge — split pill design */}
          <div className="inline-flex items-stretch rounded-full overflow-hidden shadow-xl border border-black/30 backdrop-blur-md">
            <div className="bg-primary px-4 py-2 flex items-center gap-2">
              <span className="text-black text-xs font-black tracking-[0.15em] uppercase">🇰🇷 K-LOVERS</span>
            </div>
            <div className="bg-black/50 px-4 py-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-white text-xs font-semibold tracking-[0.12em] uppercase">
                {isAr ? "التسجيل مفتوح" : "Enrolling now"}
              </span>
            </div>
          </div>

          {/*
            Next-class chip. Rendered only when there genuinely is a next class:
            no slots means no chip, rather than a chip promising one "soon".
            The old copy also appended "spots filling fast" unconditionally,
            with no capacity query anywhere behind it.
          */}
          {availability.status === "ready" && nextSlotLabel && (
            <div className="inline-flex items-center gap-2 bg-black/40 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white/90">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              {isAr
                ? `الحصة التالية: ${nextSlotLabel.weekday}`
                : `Next class: ${nextSlotLabel.weekday}`}
            </div>
          )}

          {/* Main headline */}
          <h1
            className="font-black text-white leading-[1.05] tracking-tighter w-full"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)" }}
          >
            <span className="block" style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}>
              {t("hero", "title1")}
            </span>
            <span
              className="block mt-1"
              style={{
                fontSize: "clamp(2.4rem, 6.8vw, 5.5rem)",
                color: "#ffff00",
                textShadow: "0 0 80px rgba(255, 255, 0, 0.4), 0 4px 24px rgba(0,0,0,0.7)"
              }}
            >
              {t("hero", "title2")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-xl md:text-2xl text-white/85 max-w-xl mx-auto leading-relaxed text-pretty"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}
          >
            {t("hero", "subtitle")}
          </p>

          {/* CTA Buttons — 2 max to eliminate choice paralysis */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm sm:max-w-none mx-auto">
            <Button
              size="lg"
              asChild
              className="gap-2.5 text-base font-bold px-10 shadow-2xl"
              style={{ boxShadow: "0 0 36px hsl(60 100% 50% / 0.3), 0 8px 24px rgba(0,0,0,0.4)" }}
            >
              <Link
                to="/free-trial"
                onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "homepage_hero_free_trial" }); } catch { /* Analytics must not block navigation. */ } }}
              >
                <Gift className="h-5 w-5" />
                {t("hero", "startNow")}
                <ArrowRight className="h-5 w-5 rtl-flip" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="gap-2.5 text-base font-bold px-8 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
            >
              <a
                href={WHATSAPP_BASE}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "homepage_hero_whatsapp" }); }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                {isAr ? "واتساب" : "WhatsApp Us"}
              </a>
            </Button>
          </div>

          {/* Micro trust line */}
          <p className="text-white/60 text-xs" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            {isAr ? "✓ بدون بطاقة بنكية · ✓ 98% راضون · ✓ رد خلال دقائق" : "✓ No credit card · ✓ 98% satisfaction · ✓ Reply in minutes"}
          </p>

          {/*
            Upcoming sessions, straight from get_trial_availability and
            localised to the visitor's timezone. Three explicit states, so an
            empty grid can never appear: a skeleton while the query is in
            flight, the real sessions, or nothing at all. `error` and
            `unscheduled` deliberately render no pills and no urgency copy —
            an empty schedule is not a scarcity message.
          */}
          {availability.status === "loading" && (
            <div className="flex flex-wrap gap-2 justify-center" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-6 w-32 rounded-full bg-white/10 animate-pulse" />
              ))}
            </div>
          )}
          {availability.status === "ready" && (
            <div className="flex flex-wrap gap-2 justify-center">
              {availability.slots.slice(0, 4).map((slot) => {
                const label = formatSlot(slot, isAr ? "ar" : "en");
                if (!label) return null;
                return (
                  <div
                    key={`${slot.day_of_week}|${slot.start_time}|${slot.next_trial_date}`}
                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    {label.day} · {label.time}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hangul sheet — reciprocity trigger */}
          <Link
            to="/hangul-starter"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
            onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch { /* Analytics must not block navigation. */ } }}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {isAr ? "احصل على ورقة هانغول المجانية" : "Free Hangul starter sheet"}
            {/* A literal "→" in the string points the wrong way in RTL; the
                icon flips with the document direction instead. */}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl-flip" aria-hidden="true" />
          </Link>

        </div>
      </div>

      {/* ── Stats strip — absolutely pinned to bottom ─────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 sm:pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/25 to-transparent mb-6" />
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              {
                icon: Users, ref: studentRef,
                display: `${numberFormat.format(studentCount)}+`,
                label: isAr ? "طالب تعلّموا" : "Students taught",
              },
              {
                icon: Star, ref: ratingRef,
                display: `${numberFormat.format(Math.round(ratingCount) / 10)} ★`,
                label: isAr ? "متوسط التقييم" : "Average rating",
              },
              {
                /*
                  Was "6 Months → To Conversational". Six months of one class a
                  week is A1 — the first level, not conversational fluency —
                  so the headline number was promising something the course
                  structure cannot deliver in that time.
                */
                icon: Globe, ref: monthsRef,
                display: isAr ? "6 أشهر" : "6 months",
                label: isAr ? "لمستواك الأول" : "To your first level",
              },
            ].map(({ icon: Icon, ref: itemRef, display, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center group">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary hidden sm:block" />
                  <span
                    ref={itemRef}
                    className="text-2xl sm:text-3xl md:text-4xl font-black text-white"
                    style={{ textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}
                  >
                    {display}
                  </span>
                </div>
                <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
