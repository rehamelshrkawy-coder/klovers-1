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
import { DAY_NAMES, formatTime12h } from "@/lib/calendarUrl";

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  booked_count: number;
  capacity: number | null;     // nullable for back-compat; falls back to DEFAULT_CAPACITY
  duration_min: number | null;
  timezone: string | null;
}

interface TrialSlotPickerProps {
  onSelect: (dayOfWeek: number, startTime: string) => void;
  onBack: () => void;
}

// Fallback only used if the backend row doesn't expose a capacity.
// The production get_trial_availability() RPC returns a capacity per slot
// (see migration 20260416000000_trial_slots_table.sql) and already filters
// full slots out server-side.
const DEFAULT_CAPACITY = 6;

const TrialSlotPicker = ({ onSelect, onBack }: TrialSlotPickerProps) => {
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_trial_availability" as any,
        );
        if (rpcError) throw rpcError;
        const rows = (data || []) as any[];
        const normalised: TrialSlot[] = rows.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          booked_count: Number(s.booked_count ?? 0),
          capacity: s.capacity ?? null,
          duration_min: s.duration_min ?? null,
          timezone: s.timezone ?? null,
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
  }, []);

  // Server-side RPC already hides full slots (see migration), but keep a
  // defensive client filter using per-row capacity + DEFAULT_CAPACITY fallback.
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

  const labelFor = (s: TrialSlot) => {
    const day = DAY_NAMES[s.day_of_week] ?? `Day ${s.day_of_week}`;
    const time = formatTime12h(s.start_time);
    const cap = s.capacity ?? DEFAULT_CAPACITY;
    const spotsLeft = cap - s.booked_count;
    const tzLabel = s.timezone ? ` (${s.timezone})` : "";
    return `${day} at ${time}${tzLabel} — ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`;
  };

  const keyFor = (s: TrialSlot) => `${s.day_of_week}|${s.start_time}`;

  const selectedSlot = availableSlots.find((s) => keyFor(s) === selectedKey);
  const footerTimezone = selectedSlot?.timezone
    ?? availableSlots[0]?.timezone
    ?? "Africa/Cairo";

  const commit = () => {
    if (!selectedKey) return;
    const [dStr, time] = selectedKey.split("|");
    const day = Number(dStr);
    onSelect(day, time);
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
        All times are in {footerTimezone}
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
