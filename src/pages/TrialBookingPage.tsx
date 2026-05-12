import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import TrialSlotPicker from "@/components/TrialSlotPicker";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { LEVEL_SELECT_OPTIONS, getLevelShortLabel } from "@/constants/levels";
import { CheckCircle2, CalendarPlus, CalendarClock, ArrowRight, GraduationCap, LayoutDashboard, Sparkles, MessageCircle, Tag, Share2, Globe, Link2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";

// ── Country / pricing helpers ─────────────────────────────────────────────────

/** IANA timezone → country name (best-effort pre-fill) */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Africa/Cairo": "Egypt", "Africa/Casablanca": "Morocco", "Africa/Tunis": "Tunisia",
  "Africa/Algiers": "Algeria", "Africa/Tripoli": "Libya", "Asia/Amman": "Jordan",
  "Asia/Beirut": "Lebanon", "Asia/Baghdad": "Iraq", "Asia/Damascus": "Syria",
  "Africa/Khartoum": "Sudan", "Asia/Aden": "Yemen",
  "Asia/Dubai": "UAE", "Asia/Riyadh": "Saudi Arabia", "Asia/Qatar": "Qatar",
  "Asia/Bahrain": "Bahrain", "Asia/Muscat": "Oman", "Asia/Kuwait": "Kuwait",
  "Asia/Kuala_Lumpur": "Malaysia", "Asia/Singapore": "Malaysia",
  "Asia/Jakarta": "Indonesia", "Asia/Bangkok": "Thailand",
  "Asia/Ho_Chi_Minh": "Vietnam", "Asia/Manila": "Philippines",
  "Asia/Kolkata": "India", "Asia/Karachi": "Pakistan",
  "America/Sao_Paulo": "Brazil", "America/Mexico_City": "Mexico",
  "America/Bogota": "Colombia", "America/Argentina/Buenos_Aires": "Argentina",
  "Europe/Istanbul": "Turkey",
  "America/New_York": "United States", "America/Los_Angeles": "United States",
  "America/Chicago": "United States", "America/Toronto": "Canada",
  "Europe/London": "United Kingdom", "Europe/Berlin": "Germany",
  "Europe/Paris": "France", "Australia/Sydney": "Australia",
  "Asia/Tokyo": "Japan", "Asia/Seoul": "South Korea", "Asia/Shanghai": "China",
};

/** Country → starting group price for display on confirmation */
const COUNTRY_PRICE: Record<string, string> = {
  // Egypt — EGP
  Egypt: "1,200 EGP/mo",
  // Local Arab tier — $25
  Morocco: "$25/mo", Tunisia: "$25/mo", Algeria: "$25/mo", Libya: "$25/mo",
  Jordan: "$25/mo", Lebanon: "$25/mo", Iraq: "$25/mo", Syria: "$25/mo",
  Sudan: "$25/mo", Yemen: "$25/mo",
  // Regional tier — $40
  Malaysia: "$40/mo", Indonesia: "$40/mo", Thailand: "$40/mo",
  Vietnam: "$40/mo", Philippines: "$40/mo", India: "$40/mo",
  Pakistan: "$40/mo", Brazil: "$40/mo", Mexico: "$40/mo",
  Colombia: "$40/mo", Argentina: "$40/mo", Turkey: "$40/mo",
  // Gulf + Western tier — $60
  UAE: "$60/mo", "Saudi Arabia": "$60/mo", Qatar: "$60/mo",
  Bahrain: "$60/mo", Oman: "$60/mo", Kuwait: "$60/mo",
  "United States": "$60/mo", "United Kingdom": "$60/mo",
  Germany: "$60/mo", France: "$60/mo", Canada: "$60/mo",
  Australia: "$60/mo", Japan: "$60/mo", "South Korea": "$60/mo", China: "$60/mo",
};

const ALL_COUNTRIES = [
  "Algeria","Argentina","Australia","Bahrain","Brazil","Canada","China",
  "Colombia","Egypt","France","Germany","India","Indonesia","Iraq","Japan",
  "Jordan","Kuwait","Lebanon","Libya","Malaysia","Mexico","Morocco","Oman",
  "Pakistan","Philippines","Qatar","Saudi Arabia","South Korea","Sudan",
  "Syria","Thailand","Tunisia","Turkey","UAE","United Kingdom","United States",
  "Vietnam","Yemen",
];

function getStartingPrice(country: string): string {
  return COUNTRY_PRICE[country] ?? "$25/mo";
}

function guessCountryFromTz(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_COUNTRY[tz] ?? "Egypt";
  } catch { return "Egypt"; }
}

/** Countries whose trial classes are taught in Arabic */
const ARABIC_COUNTRIES = new Set([
  "Egypt","Morocco","Tunisia","Algeria","Libya","Jordan","Lebanon",
  "Iraq","Syria","Sudan","Yemen","UAE","Saudi Arabia","Qatar",
  "Bahrain","Oman","Kuwait",
]);

/** Auto-detect class language from country */
function defaultLanguageForCountry(country: string): "arabic" | "english" {
  return ARABIC_COUNTRIES.has(country) ? "arabic" : "english";
}

// ─────────────────────────────────────────────────────────────────────────────

interface BookingResult {
  trial_date: string;
  day_name: string;
  start_time: string;
  start_time_12h: string;
  duration_min: number;
  timezone: string;
  calendar_url: string;
}

const TrialBookingPage = () => {
  const { t, language } = useLanguage();
  useSEO({
    title: "Pick Your Free Trial Slot | Klovers Academy",
    description: "Confirm your free Korean trial class. Pick a day and time that works for you.",
    canonical: "https://kloversegy.com/trial-booking",
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string | null; email: string | null; level: string | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(guessCountryFromTz);
  const [classLanguage, setClassLanguage] = useState<"arabic" | "english">(() =>
    defaultLanguageForCountry(guessCountryFromTz())
  );

  // Keep class language in sync when user changes country
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setClassLanguage(defaultLanguageForCountry(country));
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, email, level")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as any);
        // Fall back to level captured at signup (user_metadata) if profile is empty —
        // covers the email-confirmation flow where signup couldn't write to profiles.
        const profileLevel = (data as any)?.level?.trim();
        const metaLevel = (user.user_metadata?.level as string | undefined)?.trim();
        if (profileLevel) {
          setSelectedLevel(profileLevel);
        } else if (metaLevel) {
          setSelectedLevel(metaLevel);
        }
        setProfileLoaded(true);
      });
  }, [user]);

  // Pre-check for an existing active trial booking so users aren't thrown
  // into the error "You already have a trial class booked" from the edge
  // function — instead, show them their existing booking as the success
  // screen. Fixes the UX cliff hitting ~4 sessions/month of users who
  // bounce back to /trial-booking a second time.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const todayCairo = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("trial_bookings")
        .select("trial_date, start_time, duration_min, timezone, calendar_url, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "confirmed"])
        .gte("trial_date", todayCairo)
        .neq("trial_date", "2099-12-31")
        .order("trial_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data && data.trial_date) {
        const d = new Date(data.trial_date + "T00:00:00");
        const day_name = d.toLocaleDateString("en-US", { weekday: "long" });
        const timeStr = data.start_time as string | null;
        const timeMatch = timeStr?.match(/^(\d{1,2}):(\d{2})$/);
        const start_time_12h = timeMatch
          ? (() => {
              const h = Number(timeMatch[1]);
              const m = Number(timeMatch[2]);
              const ap = h >= 12 ? "PM" : "AM";
              return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
            })()
          : "";
        setBookingResult({
          trial_date: data.trial_date,
          day_name,
          start_time: timeStr || "",
          start_time_12h,
          duration_min: data.duration_min || 45,
          timezone: data.timezone || "Africa/Cairo",
          calendar_url: data.calendar_url || "",
        });
      }
    })();
  }, [user]);

  // True when neither profile nor user_metadata has a level — we need to ask.
  const needsLevel =
    profileLoaded &&
    !(profile?.level?.trim()) &&
    !((user?.user_metadata?.level as string | undefined)?.trim());

  const handleSlotPicked = async (dayOfWeek: number, startTime: string, trialDate: string) => {
    if (!user) {
      navigate(`/signup?redirect=${encodeURIComponent("/trial-booking")}`);
      return;
    }

    // If we still don't have a level (profile empty + dropdown untouched), ask for it.
    if (needsLevel && !selectedLevel) {
      toast({
        title: t("trialBooking.pickLevelTitle"),
        description: t("trialBooking.pickLevelDesc"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Log the intent (links automatically to user via session_id stitching)
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_booking_confirm",
        metadata: { day_of_week: dayOfWeek, start_time: startTime },
      });

      const referrerId = (() => {
        try { return localStorage.getItem("referrer_id") || undefined; } catch { return undefined; }
      })();

      const effectiveLevel =
        profile?.level?.trim() ||
        (user.user_metadata?.level as string | undefined)?.trim() ||
        selectedLevel ||
        "";

      // If the user picked a level here (and profile was empty), persist it so
      // we don't ask again on future flows.
      if (needsLevel && selectedLevel) {
        await supabase
          .from("profiles")
          .update({ level: selectedLevel })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase.functions.invoke("book-trial", {
        body: {
          // Authenticated path: server pulls name/email/user_id from JWT.
          // We still pass the values from the client profile as a fallback
          // for the first few sessions until book-trial is fully migrated.
          name: profile?.name || user.email?.split("@")[0] || "Student",
          email: user.email,
          level: effectiveLevel || undefined,
          day_of_week: dayOfWeek,
          start_time: startTime,
          trial_date: trialDate,           // always concrete — slot picker guarantees this
          class_language: classLanguage,
          country: selectedCountry,
          referrer_id: referrerId,
          authed: true,
        },
      });

      if (error) throw error;
      if (data?.error) {
        logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: data.error } });
        toast({ title: t("trialBooking.bookingFailed"), description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      setBookingResult(data.booking);
    } catch (err: any) {
      logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: err?.message || "unknown" } });
      toast({
        title: t("trialBooking.somethingWrong"),
        description: err.message || t("trialBooking.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Referral share link for invite-a-friend CTA on success screen
  const [referralCopied, setReferralCopied] = useState(false);
  const referralShareUrl = user
    ? `https://kloversegy.com/free-trial?ref=${user.id}`
    : "https://kloversegy.com/free-trial";

  // Fire once when success state renders: funnel + Meta Pixel + GA4
  useEffect(() => {
    if (bookingResult) {
      track.custom("post_trial_screen_shown", { trial_date: bookingResult.trial_date });
      // Meta Pixel Lead event with LTV signal for paid ads optimisation
      track.lead({ content_name: "trial_booked", trial_date: bookingResult.trial_date, value: 3, currency: "USD" });
      // Log funnel event for acquisition attribution
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_booked_confirmed",
        metadata: { trial_date: bookingResult.trial_date, day_name: bookingResult.day_name },
      });
    }
  }, [bookingResult]);

  // Funnel step: slot picker page viewed. With landing_viewed +
  // trial_booking_confirm already in place, this closes the funnel:
  // landing → cta → slot_page → confirm.
  useEffect(() => {
    logLeadEvent({ source_type: "free_trial", cta_label: "slot_page_viewed" });
  }, []);

  // ── Reschedule: cancel existing booking then re-show slot picker ──────────
  const handleReschedule = async () => {
    if (!user || !bookingResult) return;
    setRescheduling(true);
    try {
      await supabase
        .from("trial_bookings")
        .update({ status: "cancelled" })
        .eq("user_id", user.id)
        .eq("trial_date", bookingResult.trial_date)
        .in("status", ["pending", "confirmed"]);

      track.custom("trial_reschedule_started", { old_date: bookingResult.trial_date });
      logLeadEvent({
        source_type: "free_trial",
        cta_label: "trial_reschedule_started",
        metadata: { old_date: bookingResult.trial_date },
      });

      toast({
        title: t("trialBooking.rescheduleToast"),
        variant: "default",
      });
      setBookingResult(null);
    } catch (err: any) {
      toast({
        title: t("trialBooking.somethingWrong"),
        description: err.message || t("trialBooking.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (bookingResult) {
    const formattedDate = new Date(bookingResult.trial_date + "T00:00:00").toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const trialDateMs = new Date(bookingResult.trial_date + "T00:00:00").getTime();
    const daysUntil = Math.max(0, Math.round((trialDateMs - Date.now()) / 86400000));

    // Always use the BROWSER's real timezone — bypasses any stale localStorage value
    // written by EnrollNowPage, so admin testing in Asia doesn't bleed into student view.
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo";

    // All slots are defined in Cairo time — always convert FROM Cairo regardless of
    // what bookingResult.timezone stores (it may reflect the client TZ at booking time).
    const SLOT_TZ = "Africa/Cairo";
    const localized = convertDateTimeToTimezone(bookingResult.trial_date, bookingResult.start_time, SLOT_TZ, userTz);
    const localDate = new Date(localized.dateStr + "T00:00:00");
    const localFormattedDate = localDate.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // Friendly city name: "Africa/Cairo" → "Cairo", "Asia/Singapore" → "Singapore"
    const tzCity = userTz.includes("/") ? userTz.split("/").pop()!.replace(/_/g, " ") : userTz;

    // Show Cairo reference line only when the user is NOT already in Cairo
    const isInCairo = userTz === SLOT_TZ || userTz === "Africa/Cairo";

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 py-12">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-3">{t("trialBooking.successTitle")}</h1>
              <div className="inline-flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 text-left">
                <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{localFormattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {localized.timeFormatted} · {bookingResult.duration_min} {t("mySchedule.minutes")} · {tzCity}
                  </p>
                  {!isInCairo && (
                    <p className="text-[11px] text-muted-foreground/60">
                      ({formattedDate} {bookingResult.start_time_12h} Cairo)
                    </p>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto">
                {t("trialBooking.successDesc")}
              </p>

              {/* Change date button */}
              <button
                onClick={handleReschedule}
                disabled={rescheduling}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-sm font-semibold text-foreground transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <CalendarClock className="h-4 w-4 text-primary" />
                {rescheduling ? t("trialBooking.rescheduling") : t("trialBooking.changeDateBtn")}
              </button>

              {/* Inline country selector — updates pricing below in real time */}
              <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {language === "ar" ? "بلدك:" : "Your country:"}
                </span>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[130px] border-dashed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_COUNTRIES.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground/70">
                  → {getStartingPrice(selectedCountry)}
                </span>
              </div>

              {/* Class language badge on confirmation */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {language === "ar" ? "لغة الحصة:" : "Class language:"}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setClassLanguage("arabic")}
                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                      classLanguage === "arabic"
                        ? "border-gray-800 bg-gray-800 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    🇸🇦 {language === "ar" ? "عربي" : "Arabic"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassLanguage("english")}
                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                      classLanguage === "english"
                        ? "border-gray-800 bg-gray-800 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    🇺🇸 {language === "ar" ? "إنجليزي" : "English"}
                  </button>
                </div>
              </div>
            </div>

            {/* While-you-wait — single hero CTA. Previous 3-button panel
                got 0 clicks: classic choice paralysis. Collapsing to one
                clear next action (the only one that measurably lifts the
                teacher's trial experience) and downgrading alternatives
                to plain text links. */}
            <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 mb-4 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-bold bg-amber-500 text-black px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                {daysUntil > 0 ? (daysUntil === 1 ? t("trialBooking.whileWait").replace("{days}", String(daysUntil)) : t("trialBooking.whileWaitPlural").replace("{days}", String(daysUntil))) : t("trialBooking.trialToday")}
              </div>

              <div className="space-y-3">
                {/* WhatsApp — primary action: fastest confirmation + human touch */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "whatsapp" });
                    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("trialBooking.whatsappSuccessMsg"))}`;
                    trackAndOpenWhatsApp(url, { cta_label: "post_booking_whatsapp" });
                  }}
                  className="w-full flex items-center gap-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-400 rounded-xl p-4 text-left hover:bg-green-100 dark:hover:bg-green-950/50 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{t("trialBooking.whatsappPromptTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.whatsappPromptDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Placement test */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "placement_test" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_placement_test" });
                    navigate("/placement-test");
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.findLevelTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.findLevelDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Pricing teaser */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "pricing" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_pricing" });
                    navigate("/pricing");
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-purple-400 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.peekPlansTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? `حصص جماعية من ${getStartingPrice(selectedCountry)} · مجموعات صغيرة`
                        : `Group classes from ${getStartingPrice(selectedCountry)} · small groups`}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Referral / share */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "share" });
                    const shareText = language === "ar"
                      ? "احجزت حصة كورية مجانية مع Klovers! جرب أنت كمان 🇰🇷"
                      : "Just booked a free Korean class with Klovers! You should try it 🇰🇷";
                    const shareUrl = "https://kloversegy.com/free-trial";
                    if (navigator.share) {
                      navigator.share({ title: "Klovers Free Trial", text: shareText, url: shareUrl }).catch(() => {});
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-orange-400 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                    <Share2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {language === "ar" ? "شارك مع صاحبك" : "Tell a friend"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar" ? "خليهم يجربوا معاك — الحصة المجانية متاحة للكل" : "Invite a friend to join your free class"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t("trialBooking.findLevelTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                {t("trialBooking.findLevelDesc")}
              </p>
              <Button
                size="lg"
                className="gap-2 font-bold px-8 shadow-lg"
                onClick={() => {
                  track.custom("post_trial_cta_clicked", { cta: "placement_test" });
                  logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_placement_test" });
                  navigate("/placement-test");
                }}
              >
                <GraduationCap className="h-4 w-4" />
                {t("trialBooking.findLevelTitle")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Invite-a-friend card — referral growth loop */}
            <div className="border border-border rounded-2xl p-5 mb-4 bg-muted/30">
              <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-primary" />
                Got a friend who loves K-dramas?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Share your personal link — they get a free class, you help grow the community 🙌
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralShareUrl}
                  className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-muted-foreground truncate"
                  aria-label="Your referral link"
                />
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(referralShareUrl); } catch {}
                    setReferralCopied(true);
                    track.custom("referral_link_copied", { from: "success_screen" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "referral_link_copied" });
                    setTimeout(() => setReferralCopied(false), 2000);
                  }}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                  aria-label="Copy referral link"
                >
                  {referralCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  {referralCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => {
                  track.custom("post_trial_cta_clicked", { cta: "pricing" });
                  logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_pricing" });
                  navigate("/pricing");
                }}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <Tag className="h-3 w-3" /> {t("trialBooking.peekPlansTitle")}
              </button>
              <span aria-hidden>·</span>
              <button
                onClick={() => {
                  track.custom("post_trial_cta_clicked", { cta: "whatsapp" });
                  const url = `${WHATSAPP_BASE}?text=${encodeURIComponent(t("trialBooking.whatsappSuccessMsg"))}`;
                  trackAndOpenWhatsApp(url, { cta_label: "post_booking_whatsapp" });
                }}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" /> {t("trialBooking.whatsappPromptTitle")}
              </button>
              <span aria-hidden>·</span>
              <button
                onClick={() => navigate("/dashboard")}
                className="hover:text-foreground underline underline-offset-2 flex items-center gap-1"
              >
                <LayoutDashboard className="h-3 w-3" /> {t("trialBooking.goDashboard")}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Slot picker state ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">
              {profile?.name ? t("trialBooking.welcomeWithName").replace("{name}", profile.name.split(" ")[0]) : t("trialBooking.welcome")}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("trialBooking.pickDayDesc")}
            </p>
          </div>
        </section>

        <section className="py-12 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-1">{t("trialBooking.pickTimeTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("trialBooking.pickTimeDesc")} <span className="opacity-70">({(Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Cairo").replace(/_/g, " ")})</span>
              </p>

              {/* Inline level dropdown — only shown when profile/user_metadata has no level */}
              {needsLevel && (
                <div className="mb-6 space-y-2">
                  <Label htmlFor="trial-level" className="text-sm font-medium">
                    {t("trialBooking.yourLevelLabel")}
                  </Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger id="trial-level">
                      <SelectValue placeholder={t("trialBooking.yourLevelPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_SELECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("trialBooking.levelHelperText")}
                  </p>
                </div>
              )}

              {/* Show the existing level (read-only) when we already have it */}
              {!needsLevel && profileLoaded && selectedLevel && (
                <p className="text-xs text-muted-foreground mb-4">
                  {t("trialBooking.yourLevelIs")} <span className="font-medium text-foreground">{getLevelShortLabel(selectedLevel)}</span>
                </p>
              )}

              {/* Country selector — always shown, pre-filled from timezone */}
              <div className="mb-4 space-y-1.5">
                <Label htmlFor="trial-country" className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  {language === "ar" ? "بلدك" : "Your country"}
                  <span className="text-[10px] text-muted-foreground font-normal">{language === "ar" ? "(للأسعار)" : "(for pricing)"}</span>
                </Label>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger id="trial-country">
                    <SelectValue placeholder={language === "ar" ? "اختر بلدك" : "Select your country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class language — auto-detected from country, user can override */}
              <div className="mb-6 space-y-1.5">
                <Label className="text-sm font-medium">
                  {language === "ar" ? "لغة الحصة" : "Class language"}
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClassLanguage("arabic")}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      classLanguage === "arabic"
                        ? "border-gray-800 bg-gray-800 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    🇸🇦 {language === "ar" ? "عربي" : "Arabic"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassLanguage("english")}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      classLanguage === "english"
                        ? "border-gray-800 bg-gray-800 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    🇺🇸 {language === "ar" ? "إنجليزي" : "English"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {language === "ar"
                    ? "اخترنا هذا تلقائيًا حسب بلدك — يمكنك تغييره"
                    : "Auto-selected based on your country — you can change it"}
                </p>
              </div>

              <TrialSlotPicker
                onSelect={handleSlotPicked}
                onBack={() => navigate("/free-trial")}
                classLanguage={classLanguage}
              />

              {loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">{t("trialBooking.bookingTrial")}</p>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                {t("trialBooking.manageFromDashboard")}
                <ArrowRight className="inline h-3 w-3 ml-1" />
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrialBookingPage;
