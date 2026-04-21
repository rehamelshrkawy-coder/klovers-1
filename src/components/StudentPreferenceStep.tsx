import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Calendar, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHATSAPP_NUMBER } from "@/lib/siteConfig";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Fallback preset times shown when teacher hasn't configured availability yet
const PRESET_TIMES = [
  { time: "09:00", label: "9:00 AM — Morning" },
  { time: "12:00", label: "12:00 PM — Midday" },
  { time: "15:00", label: "3:00 PM — Afternoon" },
  { time: "18:00", label: "6:00 PM — Evening" },
  { time: "20:00", label: "8:00 PM — Night" },
];

interface StudentPreferenceStepProps {
  onBack: () => void;
  onNext: (preferredDay: number, preferredTime: string) => void;
  loading: boolean;
  userLevel?: string;
}

const StudentPreferenceStep = ({
  onBack,
  onNext,
  loading,
  userLevel,
}: StudentPreferenceStepProps) => {
  const { t, tArray } = useLanguage();
  const localDayNames: string[] = (tArray("enrollNow", "dayNames") as string[]).length === 7
    ? tArray("enrollNow", "dayNames") as string[]
    : DAYS;

  const [availableTimes, setAvailableTimes] = useState<{ day: number; dayName: string; time: string }[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [preferredDay, setPreferredDay] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchAvailableTimes();
  }, []);

  const fetchAvailableTimes = async () => {
    try {
      setLoadingTimes(true);
      // Get all available teacher times
      const { data, error } = await supabase
        .from("teacher_availability")
        .select("day_of_week, start_time")
        .eq("is_available", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;

      const times = (data || []).map((slot: any) => ({
        day: slot.day_of_week,
        dayName: DAYS[slot.day_of_week],
        time: slot.start_time,
      }));

      setAvailableTimes(times);

      // Auto-select first if available
      if (times.length > 0) {
        setPreferredDay(times[0].day.toString());
      }
    } catch (error) {
      console.error("Error fetching available times:", error);
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive",
      });
    } finally {
      setLoadingTimes(false);
    }
  };

  // Filter available times for the selected day
  const timesForDay = availableTimes.filter(
    (t) => t.day.toString() === preferredDay
  );

  const handleNext = () => {
    setFormError("");

    if (!preferredDay) {
      setFormError(t("enrollNow.prefStepSelectDay"));
      return;
    }

    if (!preferredTime) {
      setFormError(t("enrollNow.prefStepSelectTimeErr"));
      return;
    }

    onNext(parseInt(preferredDay), preferredTime);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("enrollNow.prefStepTitle")}
          </CardTitle>
          <CardDescription>
            {t("enrollNow.prefStepDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Day Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">{t("enrollNow.prefStepWhichDay")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DAYS.map((day, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={preferredDay === idx.toString() ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    setPreferredDay(idx.toString());
                    setPreferredTime(""); // Reset time when day changes
                  }}
                  disabled={loadingTimes}
                >
                  {localDayNames[idx] ?? day}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {loadingTimes ? (
            <div className="text-center text-muted-foreground py-4">{t("enrollNow.prefStepLoadingTimes")}</div>
          ) : !preferredDay ? null : (() => {
            // Use live teacher times if available, otherwise fall back to preset options
            const usePresets = availableTimes.length === 0;
            const timeOptions = usePresets
              ? PRESET_TIMES.map((p) => ({ time: p.time, label: p.label }))
              : timesForDay.map((slot) => {
                  const [h] = slot.time.split(":").map(Number);
                  const ampm = h >= 12 ? "PM" : "AM";
                  const h12 = h % 12 || 12;
                  return { time: slot.time, label: `${h12}:${slot.time.split(":")[1]} ${ampm}` };
                });

            return (
              <div className="space-y-3">
                <Label htmlFor="time-select" className="font-semibold">
                  {t("enrollNow.prefStepWhatTime")}
                </Label>
                {usePresets && (
                  <p className="text-xs text-muted-foreground">
                    {t("enrollNow.prefStepSuggestTime")}
                  </p>
                )}
                {timeOptions.length === 0 ? (() => {
                  const dayLabel = localDayNames[parseInt(preferredDay)] ?? DAYS[parseInt(preferredDay)];
                  const waMsg = encodeURIComponent(
                    `Hi Klovers — I'd like to request a Korean class on ${dayLabel}${userLevel ? ` for ${userLevel}` : ""}. The current schedule doesn't have a matching time.`
                  );
                  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          {t("enrollNow.prefStepNoTimes").replace("{day}", dayLabel)}
                        </p>
                      </div>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Contact us on WhatsApp to arrange this time
                      </a>
                    </div>
                  );
                })() : (
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger id="time-select">
                      <SelectValue placeholder={t("enrollNow.prefStepSelectTime")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.time} value={opt.time}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })()}

          {/* Error message */}
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">{t("enrollNow.prefStepWhyAskingTitle")}</p>
            <p>{t("enrollNow.prefStepWhyAskingBody")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          {t("enrollNow.prefStepBack")}
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={loading || loadingTimes || !preferredDay || !preferredTime}
          className="gap-2"
        >
          {t("enrollNow.prefStepContinue")}
        </Button>
      </div>
    </div>
  );
};

export default StudentPreferenceStep;
