import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Pencil } from "lucide-react";
import LevelSlotConfig from "./LevelSlotConfig";
import LevelGroupConfig from "./LevelGroupConfig";

interface Slot {
  id: string;
  course_level: string;
  day: string;
  time: string;
  timezone: string;
  min_students: number;
  max_students: number;
  current_count: number;
  status: string;
  created_at: string;
}

interface SlotStudent {
  id: string;
  user_id: string;
  match_status: string;
  selected_level: string;
  profiles?: { name: string; email: string } | null;
}

import { LEVEL_NAMES } from "@/constants/levels";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SlotManager = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showStudents, setShowStudents] = useState<Slot | null>(null);
  const [slotStudents, setSlotStudents] = useState<SlotStudent[]>([]);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  // Add form state
  const [newDay, setNewDay] = useState("Friday");
  const [newTime, setNewTime] = useState("18:00");
  const [newTimezone, setNewTimezone] = useState("Africa/Cairo");
  const [newLevel, setNewLevel] = useState(LEVEL_NAMES[0]);
  const [newMin, setNewMin] = useState(3);
  const [newMax, setNewMax] = useState(7);

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matching_slots" as any)
      .select("*")
      .order("course_level")
      .order("day")
      .order("time");

    if (error) {
      console.error("Fetch slots error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSlots((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, []);

  const handleAdd = async () => {
    const { error } = await supabase.from("matching_slots" as any).insert({
      course_level: newLevel,
      day: newDay,
      time: newTime,
      timezone: newTimezone,
      min_students: newMin,
      max_students: newMax,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot added" });
    setShowAdd(false);
    fetchSlots();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("matching_slots" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot deleted" });
    fetchSlots();
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot) return;
    const { error } = await supabase.from("matching_slots" as any).update({
      course_level: editingSlot.course_level,
      day: editingSlot.day,
      time: editingSlot.time,
      timezone: editingSlot.timezone,
      min_students: editingSlot.min_students,
      max_students: editingSlot.max_students,
      status: editingSlot.status,
    } as any).eq("id", editingSlot.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot updated" });
    setEditingSlot(null);
    fetchSlots();
  };

  const handleViewStudents = async (slot: Slot) => {
    setShowStudents(slot);
    const { data } = await supabase
      .from("student_slot_preferences" as any)
      .select("id, user_id, match_status, selected_level")
      .eq("assigned_slot_id", slot.id);

    // Enrich with profiles
    const students = (data as any[]) || [];
    if (students.length > 0) {
      const userIds = students.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      const profileMap: Record<string, { name: string; email: string }> = {};
      if (profiles) {
        (profiles as any[]).forEach((p: any) => { profileMap[p.user_id] = p; });
      }
      setSlotStudents(students.map((s: any) => ({ ...s, profiles: profileMap[s.user_id] || null })));
    } else {
      setSlotStudents([]);
    }
  };

  const statusBadge = (status: string, count: number, max: number) => {
    if (status === "full") return <Badge variant="destructive">Full</Badge>;
    if (status === "confirmed") return <Badge variant="default">Confirmed</Badge>;
    if (count === max - 1) return <Badge variant="default">Almost Full</Badge>;
    return <Badge variant="secondary">Open</Badge>;
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading slots...</div>;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="slots">
        <TabsList>
          <TabsTrigger value="slots">Matching Slots</TabsTrigger>
          <TabsTrigger value="level-config">Level → Slot Config</TabsTrigger>
          <TabsTrigger value="group-config">Level → Group Config</TabsTrigger>
        </TabsList>

        <TabsContent value="level-config" className="pt-3">
          <LevelSlotConfig />
        </TabsContent>

        <TabsContent value="group-config" className="pt-3">
          <LevelGroupConfig />
        </TabsContent>

        <TabsContent value="slots" className="pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{slots.length} slots configured</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 me-1" /> Add Slot
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>TZ</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot) => (
            <TableRow key={slot.id}>
              <TableCell className="font-medium">{slot.course_level}</TableCell>
              <TableCell>{slot.day}</TableCell>
              <TableCell>{slot.time}</TableCell>
              <TableCell className="text-xs">{slot.timezone.replace(/_/g, " ")}</TableCell>
              <TableCell>
                <span className="font-mono">{slot.current_count}/{slot.max_students}</span>
                <span className="text-xs text-muted-foreground ms-1">(min {slot.min_students})</span>
              </TableCell>
              <TableCell>{statusBadge(slot.status, slot.current_count, slot.max_students)}</TableCell>
              <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                <Button variant="ghost" size="sm" onClick={() => handleViewStudents(slot)}>
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingSlot({ ...slot })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Slot Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slot</DialogTitle>
            <DialogDescription>Create a new class slot for students to choose.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={newLevel} onValueChange={setNewLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVEL_NAMES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input value={newTime} onChange={(e) => setNewTime(e.target.value)} placeholder="18:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={newTimezone} onChange={(e) => setNewTimezone(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Students</Label>
                <Input type="number" value={newMin} onChange={(e) => setNewMin(Number(e.target.value))} min={1} />
              </div>
              <div className="space-y-2">
                <Label>Max Students</Label>
                <Input type="number" value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} min={1} />
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd}>Create Slot</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slot</DialogTitle>
            <DialogDescription>Modify slot details.</DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={editingSlot.course_level} onValueChange={(v) => setEditingSlot({ ...editingSlot, course_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_NAMES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={editingSlot.day} onValueChange={(v) => setEditingSlot({ ...editingSlot, day: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input value={editingSlot.time} onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={editingSlot.timezone} onChange={(e) => setEditingSlot({ ...editingSlot, timezone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Students</Label>
                  <Input type="number" value={editingSlot.min_students} onChange={(e) => setEditingSlot({ ...editingSlot, min_students: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Students</Label>
                  <Input type="number" value={editingSlot.max_students} onChange={(e) => setEditingSlot({ ...editingSlot, max_students: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status Override</Label>
                <Select value={editingSlot.status} onValueChange={(v) => setEditingSlot({ ...editingSlot, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleUpdateSlot}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={!!showStudents} onOpenChange={(open) => !open && setShowStudents(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Students in {showStudents?.day} {showStudents?.time}</DialogTitle>
            <DialogDescription>{showStudents?.course_level} · {slotStudents.length} student(s) assigned</DialogDescription>
          </DialogHeader>
          {slotStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No students assigned yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {slotStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm text-foreground">{s.profiles?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{s.profiles?.email || s.user_id}</p>
                  </div>
                  <Badge variant={s.match_status === "confirmed" ? "default" : "secondary"}>{s.match_status}</Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlotManager;

