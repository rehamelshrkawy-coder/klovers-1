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
import { CheckCircle2, CalendarPlus, ArrowRight, GraduationCap, LayoutDashboard, Sparkles, MessageCircle, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

  // True when neither profile nor user_metadata has a level — we need to ask.
  const needsLevel =
    profileLoaded &&
    !(profile?.level?.trim()) &&
    !((user?.user_metadata?.level as string | undefined)?.trim());

  const handleSlotPicked = async (dayOfWeek: number, startTime: string) => {
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

  // Fire once when success state renders, for funnel measurement.
  useEffect(() => {
    if (bookingResult) {
      track.custom("post_trial_screen_shown", { trial_date: bookingResult.trial_date });
    }
  }, [bookingResult]);

  // Funnel step: slot picker page viewed. With landing_viewed +
  // trial_booking_confirm already in place, this closes the funnel:
  // landing → cta → slot_page → confirm.
  useEffect(() => {
    logLeadEvent({ source_type: "free_trial", cta_label: "slot_page_viewed" });
  }, []);

  // ── Success state ──────────────────────────────────────────────────────────
  if (bookingResult) {
    const formattedDate = new Date(bookingResult.trial_date + "T00:00:00").toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const trialDateMs = new Date(bookingResult.trial_date + "T00:00:00").getTime();
    const daysUntil = Math.max(0, Math.round((trialDateMs - Date.now()) / 86400000));

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
                  <p className="font-bold text-foreground">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {bookingResult.start_time_12h} · {bookingResult.duration_min} {t("mySchedule.minutes")} · {t("trialBooking.cairoTime")}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto">
                {t("trialBooking.successDesc")}
              </p>
            </div>

            {/* While-you-wait nurture bridge */}
            <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
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
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.findLevelTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.findLevelDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* Pricing teaser */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "pricing" });
                    logLeadEvent({ source_type: "free_trial", cta_label: "post_booking_pricing" });
                    navigate("/pricing");
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{t("trialBooking.peekPlansTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("trialBooking.peekPlansDesc")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 text-muted-foreground">
                <LayoutDashboard className="h-4 w-4" />
                {t("trialBooking.goDashboard")}
              </Button>
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
                {t("trialBooking.pickTimeDesc")}
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

              <TrialSlotPicker
                onSelect={handleSlotPicked}
                onBack={() => navigate("/free-trial")}
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
