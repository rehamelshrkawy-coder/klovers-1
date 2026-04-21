import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { convertSlotToTimezone } from "@/lib/admin-utils";
import { ADMIN_TIMEZONE, TIMEZONE as SOURCE_TZ } from "@/constants/scheduling";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS: { [key: number]: string } = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"
};

/** Convert a (day, HH:MM) tuple from Malaysia (admin input) to Cairo (stored). */
function adminToSource(dayIdx: number, timeHHMM: string): { day_of_week: number; start_time: string } {
  const c = convertSlotToTimezone(dayIdx, timeHHMM, ADMIN_TIMEZONE, SOURCE_TZ);
  const [hStr, period] = c.timeFormatted.split(" ");
  const [hh, mm] = hStr.split(":").map(Number);
  const h24 = (period === "PM" ? (hh % 12) + 12 : hh % 12);
  return { day_of_week: c.dayIndex, start_time: `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}` };
}

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  is_available: boolean;
}

const TeacherAvailabilityManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState("");
  const [newDay, setNewDay] = useState("1"); // Monday by default

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("teacher_availability")
        .select("*")
        .eq("teacher_id", user?.id)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTime || !user) {
      toast({
        title: "Error",
        description: "Please enter a time",
        variant: "destructive",
      });
      return;
    }

    // Validate time format HH:MM
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast({
        title: "Error",
        description: "Time must be in HH:MM format (e.g., 10:00)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Admin enters time in Malaysia tz; convert to Cairo (source) before storing.
      const stored = adminToSource(parseInt(newDay), newTime);
      const { error } = await supabase
        .from("teacher_availability")
        .insert({
          teacher_id: user.id,
          day_of_week: stored.day_of_week,
          start_time: stored.start_time,
          is_available: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${DAYS[parseInt(newDay)]} at ${newTime} (${ADMIN_TIMEZONE.replace(/_/g, " ")})`,
      });

      setNewTime("");
      setNewDay("1");
      await fetchAvailability();
    } catch (error: any) {
      console.error("Error adding slot:", error);
      if (error.code === "23505") {
        toast({
          title: "Error",
          description: "This day/time combination already exists",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add availability slot",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleAvailability = async (slotId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from("teacher_availability")
        .update({ is_available: !currentAvailability })
        .eq("id", slotId);

      if (error) throw error;

      await fetchAvailability();
      toast({
        title: "Success",
        description: "Availability updated",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from("teacher_availability")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      await fetchAvailability();
      toast({
        title: "Success",
        description: "Slot removed",
      });
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast({
        title: "Error",
        description: "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  // Compute Malaysia-local weekday/time for each slot (stored as Cairo).
  type LocalizedSlot = TimeSlot & { localDay: number; localWeekday: string; localTime: string };
  const localized: LocalizedSlot[] = timeSlots.map((s) => {
    const l = convertSlotToTimezone(s.day_of_week, s.start_time, SOURCE_TZ, ADMIN_TIMEZONE);
    return { ...s, localDay: l.dayIndex, localWeekday: l.weekday, localTime: l.timeFormatted };
  });

  // Group by admin-local day
  const slotsByDay: { [key: number]: LocalizedSlot[] } = {};
  localized.forEach((slot) => {
    if (!slotsByDay[slot.localDay]) slotsByDay[slot.localDay] = [];
    slotsByDay[slot.localDay].push(slot);
  });
  Object.values(slotsByDay).forEach(arr => arr.sort((a, b) => a.localTime.localeCompare(b.localTime)));

  const availableSummary = localized
    .filter((s) => s.is_available)
    .map((s) => `${DAY_LABELS[s.localDay]} ${s.localTime}`)
    .join(", ");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Teaching Availability
          </CardTitle>
          <CardDescription>Set your available days and times for teaching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          {availableSummary && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-semibold text-foreground mb-1">Available times <span className="text-xs text-muted-foreground">({ADMIN_TIMEZONE.replace(/_/g, " ")})</span>:</p>
              <div className="flex flex-wrap gap-2">
                {localized
                  .filter((s) => s.is_available)
                  .map((slot) => (
                    <Badge key={slot.id} variant="secondary" title={`Source: ${DAYS[slot.day_of_week]} ${slot.start_time} ${SOURCE_TZ}`}>
                      {slot.localWeekday} {slot.localTime}
                    </Badge>
                  ))}
              </div>
              {localized.filter((s) => !s.is_available).length > 0 && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Unavailable:</p>
                  <div className="flex flex-wrap gap-2">
                    {localized
                      .filter((s) => !s.is_available)
                      .map((slot) => (
                        <Badge key={slot.id} variant="outline" title={`Source: ${DAYS[slot.day_of_week]} ${slot.start_time} ${SOURCE_TZ}`}>
                          {slot.localWeekday} {slot.localTime}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add new slot */}
          <form onSubmit={handleAddSlot} className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Add new availability slot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Day
                </label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                >
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Time (HH:MM) <span className="text-xs">— {ADMIN_TIMEZONE.replace(/_/g, " ")}</span>
                </label>
                <Input
                  type="text"
                  placeholder="10:00"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>
            </div>
          </form>

          {/* Grid view of slots */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No availability slots yet. Add your first slot above.
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                const daySlots = slotsByDay[dayIdx] || [];
                return (
                  <div key={dayIdx}>
                    <h4 className="font-semibold text-sm mb-2">{day}</h4>
                    {daySlots.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No slots scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={slot.is_available ? "default" : "outline"}
                                className="font-mono"
                                title={`Source: ${DAYS[slot.day_of_week]} ${slot.start_time} ${SOURCE_TZ}`}
                              >
                                {slot.localTime}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {slot.is_available ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={slot.is_available ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => handleToggleAvailability(slot.id, slot.is_available)}
                              >
                                {slot.is_available ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
    </div>
  );
};

export default memo(TeacherAvailabilityManager);
