import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CalendarDays, Mail, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { TRIAL_DURATION_MIN, TRIAL_GROUP_SIZE_MAX, WHATSAPP_BASE } from "@/lib/siteConfig";
import { useTrialAvailability, formatSession, visitorTimezone } from "@/hooks/useTrialAvailability";

interface TrialSlotPickerProps {
  onSelect: (dayOfWeek: number, startTime: string, trialDate: string) => void;
  onBack: () => void;
  classLanguage?: "arabic" | "english";
  /** True while the parent is committing the booking. */
  submitting?: boolean;
}

/**
 * The screen where the money is decided.
 *
 * Every string here used to be hardcoded English — including all error and
 * empty states — on a site whose entire differentiator is "explained in
 * Arabic", and the date formatting was pinned to `en-US`, so the Arabic
 * dropdown listed English weekday names inside a right-to-left page.
 */
const TrialSlotPicker = ({ onSelect, onBack, classLanguage, submitting = false }: TrialSlotPickerProps) => {
  const { t, tInterpolate, language } = useLanguage();
  const isAr = language === "ar";
  const lang = isAr ? "ar" : "en";

  const { sessions, loading, errored, allFull } = useTrialAvailability(classLanguage);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const userTz = visitorTimezone();

  const BackButton = (
    <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
      {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
      {t("trialSlots.back")}
    </Button>
  );

  const WhatsAppFallback = (
    <Button
      variant="outline"
      className="gap-2 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground border-0"
      onClick={() => trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "trial_picker_fallback" })}
    >
      <MessageCircle className="h-4 w-4" />
      {t("trialSlots.whatsapp")}
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">{BackButton}</div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <p className="sr-only" role="status">{t("trialSlots.loading")}</p>
      </div>
    );
  }

  // The query itself failed. Distinct from "no slots" — and never dressed up as
  // scarcity, which would be both a lie and an invisible 0%-conversion outage.
  if (errored) {
    return (
      <div className="text-center py-8 space-y-4" role="alert">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{t("trialSlots.loadErrorTitle")}</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{t("trialSlots.loadErrorDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("trialSlots.retry")}
          </Button>
          {WhatsAppFallback}
        </div>
        <div className="flex justify-center">{BackButton}</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    const handleWaitlist = async () => {
      const trimmed = waitlistEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setWaitlistError(t("trialSlots.waitlistInvalid"));
        return;
      }
      setWaitlistError(null);
      setWaitlistSubmitting(true);
      // The result used to be discarded. If row-level security rejected the
      // insert the user was still told "You're on the list!" — lying to someone
      // at the exact moment they have already been disappointed.
      const { error } = await supabase.from("leads").upsert(
        {
          email: trimmed,
          name: trimmed.split("@")[0],
          source: "trial_waitlist",
          status: "waitlist",
          goal: "Trial - notify when slot opens",
        },
        { onConflict: "email" }
      );
      setWaitlistSubmitting(false);
      if (error) {
        console.error("Trial waitlist upsert failed:", error);
        setWaitlistError(t("trialSlots.waitlistFailed"));
        return;
      }
      setWaitlistDone(true);
    };

    return (
      <div className="text-center py-8 space-y-4">
        <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {allFull ? t("trialSlots.fullTitle") : t("trialSlots.noneTitle")}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {allFull ? t("trialSlots.fullDesc") : t("trialSlots.noneDesc")}
          </p>
        </div>

        {/* The waitlist is only offered when a waitlist is the right answer.
            With no sessions published at all, the recovery path is a human. */}
        {allFull ? (
          waitlistDone ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 text-sm text-green-800 bg-green-50 dark:bg-green-950/30 dark:text-green-300 border border-green-300 dark:border-green-800 rounded-xl px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("trialSlots.waitlistDone")}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-label={t("trialSlots.waitlistPlaceholder")}
                  aria-invalid={waitlistError ? true : undefined}
                  placeholder={t("trialSlots.waitlistPlaceholder")}
                  value={waitlistEmail}
                  onChange={(e) => { setWaitlistEmail(e.target.value); setWaitlistError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleWaitlist()}
                  className="flex-1 h-11 text-sm"
                  dir="ltr"
                />
                <Button
                  className="h-11 gap-1.5 px-4"
                  disabled={waitlistSubmitting || !waitlistEmail.trim()}
                  onClick={handleWaitlist}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {t("trialSlots.notifyMe")}
                </Button>
              </div>
              {waitlistError && (
                <p role="alert" className="text-xs text-destructive text-start">{waitlistError}</p>
              )}
            </div>
          )
        ) : (
          <div className="flex justify-center">{WhatsAppFallback}</div>
        )}

        <div className="flex justify-center">{BackButton}</div>
      </div>
    );
  }

  const selectedSlot = sessions.find((s) => s.key === selectedKey);

  const labelFor = (session: (typeof sessions)[number]) => {
    const { weekdayLong, dateLabel, time, period } = formatSession(session, lang, userTz);
    const periodLabel = period === "morning" ? t("trialSlots.morning") : t("trialSlots.evening");
    const seats = tInterpolate(t("trialSlots.seatsLeft"), {
      left: session.spotsLeft,
      capacity: session.capacity,
    });
    return `${weekdayLong}, ${dateLabel} · ${time} · ${periodLabel} · ${seats}`;
  };

  const commit = () => {
    if (!selectedSlot || submitting) return;
    onSelect(selectedSlot.dayOfWeek, selectedSlot.startTime, selectedSlot.trialDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {BackButton}
        <p className="text-sm text-muted-foreground">{t("trialSlots.pickDay")}</p>
      </div>

      {/* The format of the class, before the choice — not leaked through a
          "3 spots left" fragment inside a dropdown label. */}
      <p className="text-sm font-semibold text-foreground">
        {tInterpolate(t("trialSlots.groupNote"), {
          max: TRIAL_GROUP_SIZE_MAX,
          minutes: TRIAL_DURATION_MIN,
        })}
      </p>

      <div className="space-y-2">
        <Label htmlFor="trial-day">{t("trialSlots.dayLabel")}</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey} disabled={submitting}>
          <SelectTrigger id="trial-day" className="w-full">
            <SelectValue placeholder={t("trialSlots.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session) => (
              <SelectItem key={session.key} value={session.key}>
                {labelFor(session)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {tInterpolate(t("trialSlots.localTimeNote"), { tz: userTz.replace(/_/g, " ") })}
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full gap-2 text-base font-bold h-13 mt-2"
        // Re-entrancy guard. Without it users tapped the button repeatedly and
        // the fix shipped for that was a 429 rate-limit recovery path.
        disabled={!selectedKey || submitting}
        onClick={commit}
      >
        {submitting
          ? t("trialSlots.booking")
          : selectedKey
          ? t("trialSlots.bookThis")
          : t("trialSlots.selectDay")}
      </Button>
    </div>
  );
};

export default TrialSlotPicker;
