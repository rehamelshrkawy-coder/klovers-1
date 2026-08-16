import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Users, Star, Globe, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
const heroPoster = "/hero-korean.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import {
  AVERAGE_RATING,
  STUDENTS_TAUGHT,
  TRIAL_DURATION_MIN,
  TRIAL_GROUP_SIZE_MAX,
  WHATSAPP_BASE,
} from "@/lib/siteConfig";
import { useTrialAvailability, formatSession } from "@/hooks/useTrialAvailability";
import { formatNumber } from "@/lib/formatNumber";

/** True when the visitor has asked their OS to reduce motion. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

const useCountUp = (target: number, duration = 1800) => {
  // Starts at the target when motion is reduced: the animation is decoration,
  // the number is the content.
  const [count, setCount] = useState(() => (prefersReducedMotion() ? target : 0));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setCount(target); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // Clamped: a school selling trust must never paint "-2+ students
        // taught" or "0.0 ★" on a cold visitor's first frame.
        setCount(Math.max(0, Math.min(target, Math.round(t * target))));
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
  const { count: studentCount, ref: studentRef } = useCountUp(STUDENTS_TAUGHT);
  const { count: ratingCount, ref: ratingRef } = useCountUp(Math.round(AVERAGE_RATING * 10), 1200);

  // Live schedule — replaces three hardcoded arrays of ISO instants that had
  // all expired, leaving the chip permanently reading "Next class: soon".
  const { sessions } = useTrialAvailability();
  const nextSessions = useMemo(() => sessions.slice(0, 4), [sessions]);
  const nextUp = nextSessions[0];

  useEffect(() => {
    const conn = (navigator as Navigator & {
      connection?: { type?: string; effectiveType?: string; saveData?: boolean };
    }).connection;

    if (conn?.saveData === true || prefersReducedMotion()) return;

    // The background video is 30–45 MB. `!conn` used to count as "fast", and
    // Safari/iOS does not implement the Network Information API at all — so
    // every iPhone downloaded the whole file regardless of network. With no
    // connection signal, fall back to viewport width as a coarse proxy for
    // "probably not on a metered cellular plan".
    const isFast = conn
      ? conn.type === "wifi" || conn.effectiveType === "4g" || conn.effectiveType === "5g"
      : window.innerWidth >= 1024;
    if (!isFast) return;

    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      setShowVideo(true);
      video.src = "/videos/hero-korea-video-new.mp4";
      video.load();
      video.play().catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
              <span className="text-white text-xs font-semibold tracking-[0.12em] uppercase">Enrolling Now</span>
            </div>
          </div>

          {/* Next-class chip — rendered only when there genuinely is a next
              class. The urgency clause is driven by real remaining capacity;
              the old copy asserted "spots filling fast" unconditionally against
              a set of dates that had expired six weeks earlier. */}
          {nextUp && (
            <div className="inline-flex items-center gap-2 bg-black/40 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white/90">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              {(() => {
                const { weekdayLong, time } = formatSession(nextUp, isAr ? "ar" : "en");
                const seats = nextUp.spotsLeft;
                if (isAr) {
                  return `الحصة الجاية: ${weekdayLong} ${time}${seats <= 3 ? ` — باقي ${seats} أماكن` : ""}`;
                }
                return `Next class: ${weekdayLong} ${time}${seats <= 3 ? ` — ${seats} seat${seats === 1 ? "" : "s"} left` : ""}`;
              })()}
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
                onClick={() => { try { logLeadEvent({ source_type: "free_trial", cta_label: "homepage_hero_free_trial" }); } catch {} }}
              >
                <Gift className="h-5 w-5" />
                {t("hero", "startNow")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="gap-2.5 text-base font-bold px-8 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground border-0"
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

          {/* Micro trust line — states the format up front. The trial is a
              GROUP class and neither page used to say so anywhere. */}
          <p className="text-white/60 text-xs" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            {isAr
              ? `✓ بدون بطاقة بنكية · ✓ ${TRIAL_DURATION_MIN} دقيقة · ✓ حصة جماعية حتى ${TRIAL_GROUP_SIZE_MAX} طلاب`
              : `✓ No credit card · ✓ ${TRIAL_DURATION_MIN} minutes · ✓ Group class, up to ${TRIAL_GROUP_SIZE_MAX} students`}
          </p>

          {/* Upcoming sessions — live from get_trial_availability, rendered in
              the visitor's timezone and locale. */}
          {nextSessions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {nextSessions.map((session) => {
                const { weekdayShort, dateLabel, time } = formatSession(session, isAr ? "ar" : "en");
                return (
                  <div key={session.key} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    {`${weekdayShort}, ${dateLabel} · ${time}`}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hangul sheet — reciprocity trigger */}
          <Link
            to="/hangul-starter"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
            onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "hero_hangul_sheet" }); } catch {} }}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            {isAr ? "احصل على ورقة هانغول المجانية ←" : "Free Hangul starter sheet →"}
          </Link>

        </div>
      </div>

      {/* ── Stats strip — absolutely pinned to bottom ─────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 sm:pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/25 to-transparent mb-6" />
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: Users, ref: studentRef, display: `${formatNumber(studentCount, isAr ? "ar" : "en")}+`, label: isAr ? "طالب تعلّموا" : "Students Taught" },
              { icon: Star,  ref: ratingRef,  display: `${(Math.max(0, ratingCount) / 10).toFixed(1)} ★`, label: isAr ? "متوسط التقييم" : "Average Rating" },
              // Was "6 Months → To Conversational". Six months is 24 sessions,
              // which is Level 1 / TOPIK 1 / A1 by the site's own roadmap — not
              // conversational. Replaced with a fact the trial actually keeps.
              { icon: Globe, ref: null, display: `≤ ${TRIAL_GROUP_SIZE_MAX}`, label: isAr ? "طلاب في الحصة" : "Students Per Class" },
            ].map(({ icon: Icon, ref: itemRef, display, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center group">
                <div className="flex items-center gap-1.5">
                  {/* Hero is always dark (#1a1a1a), so the bright brand yellow is
                      the correct value here rather than the light-surface one. */}
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
