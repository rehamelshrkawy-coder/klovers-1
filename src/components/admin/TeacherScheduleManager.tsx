import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import { ADMIN_TIMEZONE, WEEKDAYS } from "@/constants/scheduling";
import {
  addSlot, addSlotsBulk, clearSlots, deleteSlot, getTeacherSchedule, setSlotStatus,
  type SlotStatus, type TeacherScheduleSlot,
} from "@/lib/teacherSchedule";
import {
  addDays, formatTime, normalizeTime, startOfWeek, toDateKey,
} from "@/lib/teacherScheduleTime";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TZ_LABEL = ADMIN_TIMEZONE.replace(/_/g, " ");

function formatDayHeading(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Blocks are stored wall-clock, so "today" is just a local calendar comparison. */
function isToday(d: Date): boolean {
  return toDateKey(d) === toDateKey(new Date());
}

const TeacherScheduleManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<TeacherScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);

  // "Add one block" form
  const [addDate, setAddDate] = useState(() => toDateKey(new Date()));
  const [addStart, setAddStart] = useState("18:00");
  const [addDuration, setAddDuration] = useState("60");
  const [addStatus, setAddStatus] = useState<SlotStatus>("empty");
  const [addLabel, setAddLabel] = useState("");

  // "Fill a date range" form
  const [bulkFrom, setBulkFrom] = useState(() => toDateKey(new Date()));
  const [bulkTo, setBulkTo] = useState(() => toDateKey(addDays(new Date(), 28)));
  const [bulkDays, setBulkDays] = useState<number[]>([1, 3]);
  const [bulkTimes, setBulkTimes] = useState("18:00, 19:00");
  const [bulkDuration, setBulkDuration] = useState("60");

  // "Mark busy" dialog
  const [busyTarget, setBusyTarget] = useState<TeacherScheduleSlot | null>(null);
  const [busyLabel, setBusyLabel] = useState("");

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const rangeFrom = toDateKey(weekStart);
  const rangeTo = toDateKey(addDays(weekStart, 6));

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setSlots(await getTeacherSchedule(rangeFrom, rangeTo));
    } catch (error) {
      console.error("Error loading teacher schedule:", error);
      toast({
        title: "Could not load the schedule",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [rangeFrom, rangeTo, toast, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const slotsByDate = useMemo(() => {
    const map: Record<string, TeacherScheduleSlot[]> = {};
    for (const slot of slots) {
      (map[slot.slot_date] ??= []).push(slot);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [slots]);

  const emptyCount = slots.filter((s) => s.status === "empty").length;
  const busyCount = slots.length - emptyCount;

  /** Every mutation funnels through here so the DB's own message reaches the toast. */
  const run = useCallback(
    async (action: () => Promise<string>) => {
      try {
        setBusyAction(true);
        const message = await action();
        await load();
        toast({ title: "Schedule updated", description: message });
        return true;
      } catch (error) {
        console.error("Teacher schedule action failed:", error);
        toast({
          title: "That did not work",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        return false;
      } finally {
        setBusyAction(false);
      }
    },
    [load, toast],
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const start = normalizeTime(addStart);
    if (!start) {
      toast({
        title: "Check the time",
        description: "Use HH:MM, for example 18:00.",
        variant: "destructive",
      });
      return;
    }
    const minutes = Number(addDuration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast({
        title: "Check the length",
        description: "Give a length in minutes, for example 60.",
        variant: "destructive",
      });
      return;
    }
    void run(async () => {
      await addSlot({
        date: addDate,
        startTime: start,
        durationMinutes: minutes,
        status: addStatus,
        label: addStatus === "busy" ? addLabel.trim() || null : null,
      });
      setAddLabel("");
      return `Added ${addStatus === "busy" ? "a busy" : "an empty"} block on ${addDate} at ${formatTime(start)}.`;
    });
  };

  const handleBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const times = bulkTimes
      .split(",")
      .map((t) => normalizeTime(t))
      .filter((t): t is string => t !== null);
    if (times.length === 0) {
      toast({
        title: "Check the times",
        description: "Give one or more times separated by commas, for example 18:00, 19:00.",
        variant: "destructive",
      });
      return;
    }
    if (bulkDays.length === 0) {
      toast({
        title: "Pick at least one day",
        description: "Tick the weekdays you want filled.",
        variant: "destructive",
      });
      return;
    }
    const minutes = Number(bulkDuration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast({
        title: "Check the length",
        description: "Give a length in minutes, for example 60.",
        variant: "destructive",
      });
      return;
    }
    void run(async () => {
      const result = await addSlotsBulk({
        from: bulkFrom,
        to: bulkTo,
        weekdays: bulkDays,
        startTimes: times,
        durationMinutes: minutes,
        status: "empty",
      });
      return result.skipped > 0
        ? `Added ${result.inserted} blocks. Skipped ${result.skipped} that clashed with blocks already there.`
        : `Added ${result.inserted} blocks.`;
    });
  };

  const handleClearWeek = () => {
    void run(async () => {
      const removed = await clearSlots(rangeFrom, rangeTo, "empty");
      return removed === 0
        ? "There were no empty blocks in this week to remove."
        : `Removed ${removed} empty block${removed === 1 ? "" : "s"}. Busy blocks were left alone.`;
    });
  };

  const handleMarkFree = (slot: TeacherScheduleSlot) => {
    void run(async () => {
      await setSlotStatus(slot.id, "empty");
      return `${formatTime(slot.start_time)} is free again.`;
    });
  };

  const handleConfirmBusy = () => {
    if (!busyTarget) return;
    const target = busyTarget;
    void run(async () => {
      await setSlotStatus(target.id, "busy", busyLabel.trim() || null);
      setBusyTarget(null);
      setBusyLabel("");
      return `${formatTime(target.start_time)} is marked busy.`;
    });
  };

  const handleDelete = (slot: TeacherScheduleSlot) => {
    void run(async () => {
      await deleteSlot(slot.id);
      return `Removed the ${formatTime(slot.start_time)} block.`;
    });
  };

  const toggleBulkDay = (day: number) => {
    setBulkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Teaching Schedule
          </CardTitle>
          <CardDescription>
            Mark real dates as free or busy. Times are {TZ_LABEL} and are saved exactly as you type
            them. This is separate from the Availability tab, which sets your general weekly pattern.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Week navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[11rem] text-center">
                {formatDayHeading(weekStart)} – {formatDayHeading(addDays(weekStart, 6))}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekStart(startOfWeek(new Date()))}
              >
                This week
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {emptyCount} free · {busyCount} busy
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearWeek}
                disabled={busyAction || emptyCount === 0}
              >
                Clear free blocks
              </Button>
            </div>
          </div>

          {/* Week grid */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {weekDays.map((day) => {
                const key = toDateKey(day);
                const daySlots = slotsByDate[key] ?? [];
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${isToday(day) ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="mb-2">
                      <p className="text-sm font-semibold">{DAY_SHORT[day.getDay()]}</p>
                      <p className="text-xs text-muted-foreground">{formatDayHeading(day)}</p>
                    </div>
                    {daySlots.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">Nothing set</p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`rounded-md border p-2 text-xs ${
                              slot.status === "busy" ? "bg-muted" : "bg-card"
                            } ${slot.is_past ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <Badge
                                variant={slot.status === "busy" ? "outline" : "default"}
                                className="font-mono text-[10px]"
                              >
                                {formatTime(slot.start_time)}
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={busyAction}
                                onClick={() => handleDelete(slot)}
                                aria-label={`Delete the ${formatTime(slot.start_time)} block on ${key}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {slot.duration_minutes} min
                              {slot.label ? ` · ${slot.label}` : ""}
                              {slot.student_name ? ` · ${slot.student_name}` : ""}
                            </p>
                            <Button
                              type="button"
                              variant={slot.status === "busy" ? "secondary" : "outline"}
                              size="sm"
                              className="mt-2 h-7 w-full text-[11px]"
                              disabled={busyAction}
                              onClick={() =>
                                slot.status === "busy"
                                  ? handleMarkFree(slot)
                                  : (setBusyTarget(slot), setBusyLabel(""))
                              }
                            >
                              {slot.status === "busy" ? "Mark free" : "Mark busy"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add one block */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a block</CardTitle>
          <CardDescription>One date, one time. Times are {TZ_LABEL}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="tsm-date" className="mb-2 block text-xs">Date</Label>
              <Input
                id="tsm-date"
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tsm-start" className="mb-2 block text-xs">Start (HH:MM)</Label>
              <Input
                id="tsm-start"
                type="text"
                placeholder="18:00"
                value={addStart}
                onChange={(e) => setAddStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tsm-duration" className="mb-2 block text-xs">Length (minutes)</Label>
              <Input
                id="tsm-duration"
                type="number"
                min={5}
                step={5}
                value={addDuration}
                onChange={(e) => setAddDuration(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tsm-status" className="mb-2 block text-xs">Free or busy</Label>
              <select
                id="tsm-status"
                value={addStatus}
                onChange={(e) => setAddStatus(e.target.value as SlotStatus)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="empty">Free</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" className="w-full" disabled={busyAction}>
                <Plus className="mr-2 h-4 w-4" />
                Add block
              </Button>
            </div>
            {addStatus === "busy" && (
              <div className="sm:col-span-2 lg:col-span-5">
                <Label htmlFor="tsm-label" className="mb-2 block text-xs">
                  Reason (optional) — only you see this
                </Label>
                <Input
                  id="tsm-label"
                  type="text"
                  placeholder="Korean 1 – Ahmed"
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                />
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Bulk fill */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fill a date range</CardTitle>
          <CardDescription>
            Add the same times on chosen weekdays across a range — useful at the start of a term.
            Blocks that clash with something already there are skipped, never overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBulk} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="tsm-bulk-from" className="mb-2 block text-xs">From</Label>
                <Input
                  id="tsm-bulk-from"
                  type="date"
                  value={bulkFrom}
                  onChange={(e) => setBulkFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tsm-bulk-to" className="mb-2 block text-xs">To</Label>
                <Input
                  id="tsm-bulk-to"
                  type="date"
                  value={bulkTo}
                  onChange={(e) => setBulkTo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tsm-bulk-times" className="mb-2 block text-xs">
                  Times, comma separated
                </Label>
                <Input
                  id="tsm-bulk-times"
                  type="text"
                  placeholder="18:00, 19:00"
                  value={bulkTimes}
                  onChange={(e) => setBulkTimes(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tsm-bulk-duration" className="mb-2 block text-xs">
                  Length (minutes)
                </Label>
                <Input
                  id="tsm-bulk-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={bulkDuration}
                  onChange={(e) => setBulkDuration(e.target.value)}
                />
              </div>
            </div>
            <fieldset>
              <legend className="mb-2 block text-xs font-medium">Weekdays</legend>
              <div className="flex flex-wrap gap-4">
                {WEEKDAYS.map((name, idx) => (
                  <label key={name} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={bulkDays.includes(idx)}
                      onCheckedChange={() => toggleBulkDay(idx)}
                      aria-label={name}
                    />
                    {DAY_SHORT[idx]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" size="sm" disabled={busyAction}>
              <Plus className="mr-2 h-4 w-4" />
              Fill range with free blocks
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mark busy dialog */}
      <Dialog
        open={busyTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBusyTarget(null);
            setBusyLabel("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this block busy</DialogTitle>
            <DialogDescription>
              {busyTarget
                ? `${busyTarget.slot_date} at ${formatTime(busyTarget.start_time)}. The reason is private — students never see it.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="tsm-busy-label" className="mb-2 block text-xs">Reason (optional)</Label>
            <Input
              id="tsm-busy-label"
              type="text"
              placeholder="Doctor, or Korean 1 – Ahmed"
              value={busyLabel}
              onChange={(e) => setBusyLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBusyTarget(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmBusy} disabled={busyAction}>
              Mark busy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(TeacherScheduleManager);
