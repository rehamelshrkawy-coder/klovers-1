import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { LEVEL_NAMES } from "@/constants/levels";

interface Group {
  id: string;
  name: string;
  level: string;
  schedule_day: string | null;
  schedule_time: string | null;
}

interface LevelGroupCfg {
  id: string;
  level: string;
  group_id: string;
  sort_order: number;
  group?: Group;
}

const LevelGroupConfig = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [configs, setConfigs] = useState<LevelGroupCfg[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    const [groupsRes, configsRes] = await Promise.all([
      supabase.from("student_groups" as any).select("id, name, level, schedule_day, schedule_time").order("name"),
      supabase.from("level_group_config" as any).select("id, level, group_id, sort_order").order("level").order("sort_order"),
    ]);

    const groupsData: Group[] = (groupsRes.data as any[]) || [];
    const configsData = (configsRes.data as any[]) || [];

    const groupMap: Record<string, Group> = {};
    groupsData.forEach(g => { groupMap[g.id] = g; });

    setGroups(groupsData);
    setConfigs(configsData.map(c => ({ ...c, group: groupMap[c.group_id] })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getConfigsForLevel = (level: string) =>
    configs.filter(c => c.level === level).sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async (level: string) => {
    if (!selectedGroupId) return;
    const existing = getConfigsForLevel(level);
    if (existing.length >= 2) {
      toast({ title: "Max 2 groups per level", description: "Remove one before adding another.", variant: "destructive" });
      return;
    }
    if (existing.find(c => c.group_id === selectedGroupId)) {
      toast({ title: "Already added", description: "This group is already assigned to this level.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("level_group_config" as any).insert({
      level,
      group_id: selectedGroupId,
      sort_order: existing.length,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group assigned", description: `Group assigned to ${level}.` });
    setAddingFor(null);
    setSelectedGroupId("");
    fetchData();
  };

  const handleRemove = async (configId: string) => {
    const { error } = await supabase.from("level_group_config" as any).delete().eq("id", configId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Removed" });
    fetchData();
  };

  if (loading) return <div className="py-6 text-center text-muted-foreground text-sm">Loading group configurations…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Assign up to <strong>2 groups</strong> per Korean level. Students will only see groups from their level's configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LEVEL_NAMES.map(level => {
          const levelConfigs = getConfigsForLevel(level);
          const isAdding = addingFor === level;
          const usedGroupIds = new Set(levelConfigs.map(c => c.group_id));
          const availableGroups = groups.filter(g => !usedGroupIds.has(g.id));

          return (
            <Card key={level} className="border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {level}
                  <Badge variant={levelConfigs.length === 2 ? "default" : "secondary"} className="text-xs">
                    {levelConfigs.length}/2 groups
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {levelConfigs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No groups configured</p>
                )}
                {levelConfigs.map(cfg => (
                  <div key={cfg.id} className="flex items-center justify-between bg-muted/50 rounded-md px-2.5 py-1.5">
                    <div className="text-xs">
                      <span className="font-medium text-foreground">
                        {cfg.group ? cfg.group.name : cfg.group_id.slice(0, 8) + "…"}
                      </span>
                      {cfg.group?.schedule_day && (
                        <span className="text-muted-foreground ms-1.5">
                          {cfg.group.schedule_day}{cfg.group.schedule_time ? ` · ${cfg.group.schedule_time}` : ""}
                        </span>
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

                {levelConfigs.length < 2 && !isAdding && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => { setAddingFor(level); setSelectedGroupId(""); }}
                  >
                    <Plus className="h-3 w-3 me-1" /> Add Group
                  </Button>
                )}

                {isAdding && (
                  <div className="space-y-2 pt-1">
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Choose a group…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroups.length === 0 && (
                          <p className="text-xs text-muted-foreground px-2 py-1">No groups available</p>
                        )}
                        {availableGroups.map(g => (
                          <SelectItem key={g.id} value={g.id} className="text-xs">
                            {g.name}{g.schedule_day ? ` · ${g.schedule_day}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleAdd(level)} disabled={!selectedGroupId}>
                        Assign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingFor(null); setSelectedGroupId(""); }}>
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

export default LevelGroupConfig;
