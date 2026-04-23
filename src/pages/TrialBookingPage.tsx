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
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

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
        title: "Please pick your Korean level",
        description: "Just one quick question so we match you with the right teacher.",
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
        toast({ title: "Booking failed", description: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      setBookingResult(data.booking);
    } catch (err: any) {
      logLeadEvent({ source_type: "free_trial", cta_label: "booking_failed", metadata: { reason: err?.message || "unknown" } });
      toast({
        title: "Something went wrong",
        description: err.message || "Please try again.",
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
    const formattedDate = new Date(bookingResult.trial_date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const trialDateMs = new Date(bookingResult.trial_date + "T00:00:00").getTime();
    const daysUntil = Math.max(0, Math.round((trialDateMs - Date.now()) / 86400000));
    const userTz = getUserTimezone();
    const localized = convertDateTimeToTimezone(bookingResult.trial_date, bookingResult.start_time, bookingResult.timezone || "Africa/Cairo", userTz);
    const localDate = new Date(localized.dateStr + "T00:00:00");
    const localFormattedDate = localDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

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
              <h1 className="text-3xl font-black text-foreground mb-3">Your trial is booked! 🎉</h1>
              <div className="inline-flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 text-left">
                <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{localFormattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {localized.timeFormatted} · {bookingResult.duration_min} min · {userTz.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    ({formattedDate} {bookingResult.start_time_12h} {(bookingResult.timezone || "Africa/Cairo").replace(/_/g, " ")})
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm max-w-md mx-auto">
                A teacher will confirm your class within a few hours. You'll receive a confirmation email with a calendar link once it's approved.
              </p>
            </div>

            {/* While-you-wait nurture bridge */}
            <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                {daysUntil > 0 ? `While you wait — ${daysUntil} day${daysUntil === 1 ? "" : "s"} to go` : "Your trial is today — here's how to prep"}
              </div>

              <div className="space-y-3">
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
                    <p className="font-semibold text-sm text-foreground">Find your level (2 min)</p>
                    <p className="text-xs text-muted-foreground">So your teacher is ready for you from minute one.</p>
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
                    <p className="font-semibold text-sm text-foreground">Peek at our plans</p>
                    <p className="text-xs text-muted-foreground">Group classes from $25/mo · small groups, live teachers.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => {
                    track.custom("post_trial_cta_clicked", { cta: "whatsapp" });
                    const url = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I just booked my free trial and have a question.")}`;
                    trackAndOpenWhatsApp(url, { cta_label: "post_booking_whatsapp" });
                  }}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">Questions? Message us on WhatsApp</p>
                    <p className="text-xs text-muted-foreground">We reply within an hour during business days.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 text-muted-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Go to my dashboard
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
              {profile?.name ? `Welcome, ${profile.name.split(" ")[0]}!` : "Welcome!"}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Pick the day that works best for you. We'll handle the rest.
            </p>
          </div>
        </section>

        <section className="py-12 pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto bg-card border border-border rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-1">Pick your trial time</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Times shown in your timezone ({getUserTimezone().replace(/_/g, " ")}). Confirm and we'll book you in instantly.
              </p>

              {/* Inline level dropdown — only shown when profile/user_metadata has no level */}
              {needsLevel && (
                <div className="mb-6 space-y-2">
                  <Label htmlFor="trial-level" className="text-sm font-medium">
                    Your Korean level
                  </Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger id="trial-level">
                      <SelectValue placeholder="Pick your level" />
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
                    We'll match you with the right teacher. You can change this later in your profile.
                  </p>
                </div>
              )}

              {/* Show the existing level (read-only) when we already have it */}
              {!needsLevel && profileLoaded && selectedLevel && (
                <p className="text-xs text-muted-foreground mb-4">
                  Your level: <span className="font-medium text-foreground">{getLevelShortLabel(selectedLevel)}</span>
                </p>
              )}

              <TrialSlotPicker
                onSelect={handleSlotPicked}
                onBack={() => navigate("/free-trial")}
              />

              {loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">Booking your trial...</p>
              )}

              <p className="text-xs text-muted-foreground text-center mt-6">
                Need to change something later? You can manage your booking from your dashboard.
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
