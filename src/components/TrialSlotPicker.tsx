import { useState, useEffect } from "react";
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
import { ArrowLeft, CalendarDays } from "lucide-react";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";

/**
 * Fallback: next UTC occurrence of dayOfWeek — mirrors the edge function
 * logic exactly so client and server always agree on the date.
 */
function nextDateForDayUTC(dayOfWeek: number): string {
  const today = new Date();
  const todayDay = today.getUTCDay();
  let diff = dayOfWeek - todayDay;
  if (diff <= 0) diff += 7; // always at least 1 day ahead
  const next = new Date(today);
  next.setUTCDate(today.getUTCDate() + diff);
  return next.toISOString().split("T")[0];
}

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  booked_count: number;
  capacity: number | null;
  duration_min: number | null;
  timezone: string | null;
  /** Actual upcoming session date returned by the RPC (anchored to existing bookings). */
  next_trial_date: string | null;
}

interface TrialSlotPickerProps {
  onSelect: (dayOfWeek: number, startTime: string, trialDate: string) => void;
  onBack: () => void;
  classLanguage?: "arabic" | "english";
}

// Only used when the backend row somehow omits capacity (shouldn't happen in prod).
const DEFAULT_CAPACITY = 6;

const TrialSlotPicker = ({ onSelect, onBack, classLanguage }: TrialSlotPickerProps) => {
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    setSelectedKey(""); // reset selection when language changes
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc("get_trial_availability" as any, {
          p_language: classLanguage ?? null,
        });
        if (rpcError) throw rpcError;
        const rows = (data || []) as any[];
        const normalised: TrialSlot[] = rows.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          booked_count: Number(s.booked_count ?? 0),
          capacity: s.capacity ?? null,
          duration_min: s.duration_min ?? null,
          timezone: s.timezone ?? null,
          // RPC now returns the actual session date anchored to existing bookings.
          next_trial_date: s.next_trial_date ?? null,
        }));
        setSlots(normalised);
      } catch (err: any) {
        console.error("Failed to fetch trial slots:", err);
        setError("Could not load available times. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [classLanguage]);

  // RPC already filters full slots server-side; keep defensive client filter too.
  const availableSlots = slots.filter((s) => {
    const cap = s.capacity ?? DEFAULT_CAPACITY;
    return s.booked_count < cap;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Go back
        </Button>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          All trial sessions are currently full. Please check back soon or contact us on WhatsApp.
        </p>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  // Always read from browser — bypasses stale localStorage values.
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuala_Lumpur";

  const sessionDateFor = (s: TrialSlot): string =>
    s.next_trial_date ?? nextDateForDayUTC(s.day_of_week);

  const labelFor = (s: TrialSlot) => {
    const srcTz = s.timezone || "Asia/Kuala_Lumpur";
    const sessionDate = sessionDateFor(s);
    // Use convertDateTimeToTimezone for specific-dated slots (accurate DST handling)
    const { dateStr: localDateStr, timeFormatted, weekday } = convertDateTimeToTimezone(sessionDate, s.start_time, srcTz, userTz);
    const [ly, lm, ld] = localDateStr.split("-").map(Number);
    const dateLabel = new Date(ly, lm - 1, ld).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const cap = s.capacity ?? DEFAULT_CAPACITY;
    const spotsLeft = cap - s.booked_count;
    return `${weekday}, ${dateLabel} at ${timeFormatted} — ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`;
  };

  const keyFor = (s: TrialSlot) => `${s.day_of_week}|${s.start_time}`;

  const selectedSlot = availableSlots.find((s) => keyFor(s) === selectedKey);

  const commit = () => {
    if (!selectedKey || !selectedSlot) return;
    const [dStr, time] = selectedKey.split("|");
    const day = Number(dStr);
    // Always pass a concrete date — never let the edge function guess.
    const trialDate = sessionDateFor(selectedSlot);
    onSelect(day, time, trialDate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Pick your trial day</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trial-day">Trial Day</Label>
        <Select value={selectedKey} onValueChange={setSelectedKey}>
          <SelectTrigger id="trial-day" className="w-full">
            <SelectValue placeholder="Choose a trial session" />
          </SelectTrigger>
          <SelectContent>
            {availableSlots.map((s) => (
              <SelectItem key={keyFor(s)} value={keyFor(s)}>
                {labelFor(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        All times shown in your local timezone ({userTz.replace(/_/g, " ")})
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full gap-2 text-base font-bold h-13 mt-2"
        disabled={!selectedKey}
        onClick={commit}
      >
        {selectedKey ? "Book this trial" : "Select a trial day"}
      </Button>
    </div>
  );
};

export default TrialSlotPicker;
