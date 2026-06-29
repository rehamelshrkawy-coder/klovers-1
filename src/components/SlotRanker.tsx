import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Users, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MatchingSlot {
  id: string;
  course_level: string;
  day: string;
  time: string;
  timezone: string;
  min_students: number;
  max_students: number;
  current_count: number;
  status: string;
}

interface SlotRankerProps {
  selectedLevel: string;
  onComplete: (assignedSlotId: string | null, preferenceId: string) => void;
}

const DAY_ORDER: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  Friday: 5, Saturday: 6, Sunday: 7,
};

const SlotRanker = ({ selectedLevel, onComplete }: SlotRankerProps) => {
  const [slots, setSlots] = useState<MatchingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState<string[]>([]); // up to 3 slot IDs
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ assigned: boolean; slotName: string; prefId: string } | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("matching_slots" as any)
        .select("*")
        .eq("course_level", selectedLevel)
        .neq("status", "full")
        .order("day")
        .order("time");

      if (error) {
        console.error("Failed to fetch matching slots:", error);
        setSlots([]);
      } else {
        setSlots((data as any[]) || []);
      }
      setLoading(false);
    };
    fetchSlots();
  }, [selectedLevel]);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const dayA = DAY_ORDER[a.day] || 8;
      const dayB = DAY_ORDER[b.day] || 8;
      if (dayA !== dayB) return dayA - dayB;
      return a.time.localeCompare(b.time);
    });
  }, [slots]);

  const toggleSlot = (slotId: string) => {
    setRanked((prev) => {
      if (prev.includes(slotId)) return prev.filter((id) => id !== slotId);
      if (prev.length >= 3) {
        toast({ title: "Maximum 3 preferences", description: "Remove one first to add another." });
        return prev;
      }
      return [...prev, slotId];
    });
  };

  const getRank = (slotId: string) => {
    const idx = ranked.indexOf(slotId);
    return idx >= 0 ? idx + 1 : null;
  };

  const handleSubmit = async () => {
    if (ranked.length < 1) {
      toast({ title: "Select at least 1 slot", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      // Insert preferences
      const { data: pref, error: prefError } = await supabase
        .from("student_slot_preferences" as any)
        .insert({
          user_id: session.user.id,
          selected_level: selectedLevel,
          slot_1_id: ranked[0] || null,
          slot_2_id: ranked[1] || null,
          slot_3_id: ranked[2] || null,
          match_status: "pending",
        } as any)
        .select("id")
        .single();

      if (prefError) {
        // May be unique constraint — try upsert
        if (prefError.code === "23505") {
          toast({ title: "Preferences already submitted", description: "You already have slot preferences." });
        } else {
          throw prefError;
        }
        return;
      }

      const prefId = (pref as any).id;

      // Call auto_match_student (slot-level)
      const { data: assignedSlotId, error: matchError } = await supabase
        .rpc("auto_match_student", { _preference_id: prefId } as any);

      if (matchError) {
        console.error("Auto match error:", matchError);
      }

      const assignedId = assignedSlotId as string | null;

      // Also assign to group via unified RPC if slot has package_id
      if (assignedId) {
        const { data: slotInfo } = await supabase
          .from("matching_slots" as any)
          .select("package_id")
          .eq("id", assignedId)
          .maybeSingle();

        if (slotInfo && (slotInfo as any).package_id) {
          await supabase.rpc("assign_student_to_group" as any, {
            _package_id: (slotInfo as any).package_id,
            _user_id: session.user.id,
          } as any);
        }
      }

      if (assignedId) {
        const slot = slots.find((s) => s.id === assignedId);
        setResult({ assigned: true, slotName: slot ? `${slot.day} ${slot.time}` : "a slot", prefId });
      } else {
        setResult({ assigned: false, slotName: "", prefId });
      }

      onComplete(assignedId, prefId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No available slots for level "{selectedLevel}" right now.</p>
        <p className="text-sm mt-1">Please check back later or contact support.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-accent rounded-lg p-5 space-y-2">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            {result.assigned ? (
              <>
                <p className="font-semibold text-foreground">You've been assigned to: {result.slotName}</p>
                <p className="text-sm text-muted-foreground">Your group is forming! We'll notify you when it's confirmed.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">Preferences saved!</p>
                <p className="text-sm text-muted-foreground">We'll notify you once your group forms. Thank you for your patience!</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Rank up to <strong>3 preferred slots</strong> (click to select in order of preference):
        </p>
        <p className="text-xs text-muted-foreground mt-1">Level: <Badge variant="outline">{selectedLevel}</Badge></p>
      </div>

      {/* Selected ranking preview */}
      {ranked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ranked.map((id, idx) => {
            const slot = slots.find((s) => s.id === id);
            if (!slot) return null;
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                #{idx + 1}: {slot.day} {slot.time}
                <button type="button" onClick={() => toggleSlot(id)} className="ml-1 hover:text-destructive" aria-label="Remove selected slot">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="grid gap-3">
        {sortedSlots.map((slot) => {
          const rank = getRank(slot.id);
          const seatsLeft = slot.max_students - slot.current_count;
          return (
            <button
              key={slot.id}
              type="button"
              aria-label={`Rank ${slot.day} at ${slot.time}`}
              onClick={() => toggleSlot(slot.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                rank
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {rank && (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center border border-black/25">
                        {rank}
                      </span>
                    )}
                    <p className="font-semibold text-foreground">{slot.day}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {slot.time} ({slot.timezone.replace(/_/g, " ")})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={seatsLeft > 3 ? "secondary" : seatsLeft > 0 ? "default" : "destructive"}>
                    <Users className="h-3 w-3 mr-1" />
                    {seatsLeft} left
                  </Badge>
                  {slot.status === "confirmed" && (
                    <Badge variant="outline" className="text-xs">Forming</Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={ranked.length < 1 || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Saving..." : `Confirm ${ranked.length} Preference${ranked.length !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
};

export default SlotRanker;
