import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { LEVEL_NAMES } from "@/constants/levels";

interface Slot {
  id: string;
  day: string;
  time: string;
  course_level: string;
  status: string;
}

interface LevelConfig {
  id: string;
  level: string;
  slot_id: string;
  sort_order: number;
  slot?: Slot;
}

const LevelSlotConfig = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [configs, setConfigs] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state per level
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    const [slotsRes, configsRes] = await Promise.all([
      supabase.from("matching_slots" as any).select("id, day, time, course_level, status").order("day"),
      supabase.from("level_slot_config" as any).select("id, level, slot_id, sort_order").order("level").order("sort_order"),
    ]);

    const slotsData: Slot[] = (slotsRes.data as any[]) || [];
    const configsData = (configsRes.data as any[]) || [];

    const slotMap: Record<string, Slot> = {};
    slotsData.forEach(s => { slotMap[s.id] = s; });

    setSlots(slotsData);
    setConfigs(configsData.map(c => ({ ...c, slot: slotMap[c.slot_id] })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getConfigsForLevel = (level: string) =>
    configs.filter(c => c.level === level).sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async (level: string) => {
    if (!selectedSlotId) return;
    const existing = getConfigsForLevel(level);
    if (existing.length >= 2) {
      toast({ title: "Max 2 slots per level", description: "Remove one before adding another.", variant: "destructive" });
      return;
    }
    const alreadyAdded = existing.find(c => c.slot_id === selectedSlotId);
    if (alreadyAdded) {
      toast({ title: "Already added", description: "This slot is already assigned to this level.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("level_slot_config" as any).insert({
      level,
      slot_id: selectedSlotId,
      sort_order: existing.length,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot assigned", description: `Slot assigned to ${level}.` });
    setAddingFor(null);
    setSelectedSlotId("");
    fetchData();
  };

  const handleRemove = async (configId: string) => {
    const { error } = await supabase.from("level_slot_config" as any).delete().eq("id", configId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removed" });
    fetchData();
  };

  if (loading) return <div className="py-6 text-center text-muted-foreground text-sm">Loading level configurations…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Assign up to <strong>2 class slots</strong> per Korean level. Students will only see days from their level's configured slots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LEVEL_NAMES.map(level => {
          const levelConfigs = getConfigsForLevel(level);
          const isAdding = addingFor === level;

          // Available slots for this level (not already added)
          const usedSlotIds = new Set(levelConfigs.map(c => c.slot_id));
          const availableSlots = slots.filter(s => !usedSlotIds.has(s.id));

          return (
            <Card key={level} className="border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {level}
                  <Badge variant={levelConfigs.length === 2 ? "default" : "secondary"} className="text-xs">
                    {levelConfigs.length}/2 slots
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {levelConfigs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No slots configured</p>
                )}
                {levelConfigs.map((cfg, idx) => (
                  <div key={cfg.id} className="flex items-center justify-between bg-muted/50 rounded-md px-2.5 py-1.5">
                    <div className="text-xs">
                      <span className="font-medium text-foreground">
                        {cfg.slot ? `${cfg.slot.day} · ${cfg.slot.time}` : cfg.slot_id.slice(0, 8) + "…"}
                      </span>
                      {cfg.slot && (
                        <span className="text-muted-foreground ms-1.5">{cfg.slot.course_level}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(cfg.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Add slot row */}
                {levelConfigs.length < 2 && !isAdding && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => { setAddingFor(level); setSelectedSlotId(""); }}
                  >
                    <Plus className="h-3 w-3 me-1" /> Add Slot
                  </Button>
                )}

                {isAdding && (
                  <div className="space-y-2 pt-1">
                    <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose a slot…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.length === 0 && (
                          <p className="text-xs text-muted-foreground px-2 py-1">No slots available</p>
                        )}
                        {availableSlots.map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.day} · {s.time} ({s.course_level})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleAdd(level)} disabled={!selectedSlotId}>
                        Assign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingFor(null); setSelectedSlotId(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSlotConfig;
