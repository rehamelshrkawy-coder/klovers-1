import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CalendarDays, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTrialAvailability, formatSlot, type TrialSlot } from "@/hooks/useTrialAvailability";
import { getUserTimezone } from "@/lib/viewerTimezone";

interface TrialSlotPickerProps {
  onSelect: (dayOfWeek: number, startTime: string, trialDate: string) => void;
  onBack: () => void;
  classLanguage?: "arabic" | "english";
  /**
   * True while the parent is committing the booking. The button disables and
   * shows a spinner, so a slow network cannot be turned into two bookings by
   * an impatient second tap.
   */
  submitting?: boolean;
}

const TrialSlotPicker = ({ onSelect, onBack, classLanguage, submitting = false }: TrialSlotPickerProps) => {
  const { t, tPlural, language } = useLanguage();
  const isAr = language === "ar";
  const availability = useTrialAvailability(classLanguage);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const userTz = getUserTimezone();
  const keyFor = (s: TrialSlot) => `${s.day_of_week}|${s.start_time}|${s.next_trial_date ?? ""}`;

  const BackButton = ({ variant = "ghost" }: { variant?: "ghost" | "outline" }) => (
    <Button variant={variant} size="sm" onClick={onBack} className="gap-1 min-h-[44px]">
      <ArrowLeft className="h-4 w-4 rtl-flip" />
      {t("common.back")}
    </Button>
  );

  if (availability.status === "loading") {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex items-center gap-2 mb-2"><BackButton /></div>
        <div className="h-12 w-full rounded-xl bg-muted animate-pulse" aria-hidden="true" />
        <p className="sr-only">{t("common.loading")}</p>
      </div>
    );
  }

  if (availability.status === "error") {
    return (
      <div className="text-center py-8 space-y-3">
        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-destructive" role="alert">{t("trialPicker.loadError")}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" className="min-h-[44px]" onClick={availability.refresh}>
            {t("common.retry")}
          </Button>
          <BackButton variant="outline" />
        </div>
      </div>
    );
  }

  if (availability.status === "full" || availability.status === "unscheduled") {
    const handleWaitlist = async () => {
      const trimmed = waitlistEmail.trim().toLowerCase();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setWaitlistError(t("trialPicker.waitlistInvalidEmail"));
        return;
      }
      setWaitlistError(null);
      setWaitlistSubmitting(true);
      // The result was previously discarded and success claimed regardless —
      // a failed insert still told the visitor they were on the list.
      const { error } = await supabase.from("leads").upsert(
        {
          email: trimmed,
          name: trimmed.split("@")[0],
          source: "trial_waitlist",
          status: "waitlist",
          goal: "Trial - notify when slot opens",
        },
        { onConflict: "email" },
      );
      setWaitlistSubmitting(false);
      if (error) {
        console.error("Waitlist signup failed:", error);
        setWaitlistError(t("trialPicker.waitlistFailed"));
        return;
      }
      setWaitlistDone(true);
    };

    return (
      <div className="text-center py-8 space-y-4">
        <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">
          {/* Genuinely full is a different message from nothing scheduled. */}
          {availability.status === "full"
            ? t("trialPicker.allFull")
            : t("trialPicker.noneScheduled")}
        </p>
        {waitlistDone ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 text-sm text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("trialPicker.waitlistDone")}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="waitlist-email" className="text-xs text-muted-foreground font-normal">
              {t("trialPicker.waitlistPrompt")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("trialPicker.emailPlaceholder")}
                value={waitlistEmail}
                onChange={(e) => { setWaitlistEmail(e.target.value); setWaitlistError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleWaitlist(); }}
                aria-invalid={waitlistError ? true : undefined}
                aria-describedby={waitlistError ? "waitlist-error" : undefined}
                className="flex-1 min-h-[44px] text-sm"
              />
              <Button
                size="sm"
                className="min-h-[44px] gap-1.5"
                disabled={waitlistSubmitting || !waitlistEmail.trim()}
                onClick={() => void handleWaitlist()}
              >
                {waitlistSubmitting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  : <Mail className="h-3.5 w-3.5" aria-hidden="true" />}
                {t("trialPicker.notifyMe")}
              </Button>
            </div>
            {waitlistError && (
              <p id="waitlist-error" role="alert" className="text-xs text-destructive text-start">
                {waitlistError}
              </p>
            )}
          </div>
        )}
        <BackButton variant="outline" />
      </div>
    );
  }

  const labelFor = (s: TrialSlot) => {
    const label = formatSlot(s, isAr ? "ar" : "en", userTz);
    const when = label ? `${label.weekday}, ${label.day} · ${label.time}` : s.start_time;
    return `${when} — ${tPlural("common.spotsLeft", s.spotsLeft)}`;
  };

  const selectedSlot = availability.slots.find((s) => keyFor(s) === selectedKey);

  const commit = () => {
    // Re-entrancy guard at the source as well as at the parent.
    if (submitting || !selectedSlot) return;
    const trialDate = selectedSlot.next_trial_date;
    if (!trialDate) return;
    onSelect(selectedSlot.day_of_week, selectedSlot.start_time, trialDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <p className="text-sm text-muted-foreground">{t("trialPicker.pickDay")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trial-day">{t("trialPicker.trialDayLabel")}</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey} disabled={submitting}>
          <SelectTrigger id="trial-day" className="w-full min-h-[44px]">
            <SelectValue placeholder={t("trialPicker.choosePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {availability.slots.map((s) => (
              <SelectItem key={keyFor(s)} value={keyFor(s)}>
                {labelFor(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("trialPicker.timezoneNote")} ({userTz.replace(/_/g, " ")})
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full gap-2 text-base font-bold h-14 mt-2"
        disabled={!selectedKey || submitting}
        onClick={commit}
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {submitting
          ? t("trialPicker.booking")
          : selectedKey
          ? t("trialPicker.bookThis")
          : t("trialPicker.selectFirst")}
      </Button>
    </div>
  );
};

export default TrialSlotPicker;
