import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Users, Trash2, Bell, RefreshCw, ArrowRight, AlertTriangle, Check, X, ChevronDown, ChevronRight, UserPlus, Search, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import AdminNotifications from "./AdminNotifications";
import TrialClassesTab from "./TrialClassesTab";
import { getSuggestedPackages, type SuggestedPackage, formatSuggestion } from "@/lib/scheduleAutomation";
import { useAuth } from "@/hooks/useAuth";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
import { LEVEL_KEYS, mapLegacyLevel, getLevelShortLabel, LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import { formatTime } from "@/lib/admin-utils";
import { TRIAL_CONFIRMATION_EMAIL_ENABLED } from "@/lib/siteConfig";
import type { PkgGroup } from "@/types/admin";
const LEVELS = LEVEL_KEYS;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Package {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  is_active: boolean;
  course_type: string;
  member_count?: number;
  waitlist_count?: number;
  total_capacity?: number;
  seats_left?: number;
}

interface GroupMember {
  group_id: string;
  user_id: string;
  member_status: string;
  profiles?: { name: string; email: string } | null;
}

interface WaitlistRow {
  group_id: string;
  user_id: string;
  member_status: string;
  profiles?: { name: string; email: string } | null;
  preferredPackage?: Package | null;
  alternatives?: Package[];
}

interface TrialBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  goal: string | null;
  day_of_week: number;
  start_time: string;
  trial_date: string;
  timezone: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  user_id?: string | null;
}

// ─── Packages Manager ────────────────────────────────────────────────────────

const PackagesManager = ({ onSwitchToGroups }: { onSwitchToGroups?: () => void }) => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkgHasGroup, setPkgHasGroup] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  // Suggestion state
  const [suggestions, setSuggestions] = useState<SuggestedPackage[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);

  // Form state
  const [fLevel, setFLevel] = useState(LEVELS[0]);
  const [fDay, setFDay] = useState(5);
  const [fTime, setFTime] = useState("18:00");
  const [fDuration, setFDuration] = useState(90);
  const [fTimezone, setFTimezone] = useState("Africa/Cairo");
  const [fCapacity, setFCapacity] = useState(5);
  const [fActive, setFActive] = useState(true);
  const [fCourseType, setFCourseType] = useState("group");

  const fetchPackages = async () => {
    setLoading(true);
    const { data: pkgs } = await supabase.from("schedule_packages").select("*").order("level").order("day_of_week");
    const list: Package[] = pkgs || [];

    // Count members per package via groups
    const pkgIds = list.map((p) => p.id);
    if (pkgIds.length > 0) {
      const { data: groups } = await supabase.from("pkg_groups").select("id, package_id, capacity").in("package_id", pkgIds).eq("is_active", true);
      const groupIds = (groups || []).map((g) => g.id);

      // Track which packages have active groups
      const hasGroupMap: Record<string, boolean> = {};
      (groups || []).forEach((g) => { hasGroupMap[g.package_id] = true; });
      setPkgHasGroup(hasGroupMap);

      // Calculate total capacity per package (sum of group capacities)
      const pkgTotalCapacity: Record<string, number> = {};
      (groups || []).forEach((g) => {
        pkgTotalCapacity[g.package_id] = (pkgTotalCapacity[g.package_id] || 0) + (g.capacity || 0);
      });

      if (groupIds.length > 0) {
        const { data: members } = await supabase.from("pkg_group_members").select("group_id, member_status").in("group_id", groupIds);
        const pkgCount: Record<string, number> = {};
        const pkgWaitlist: Record<string, number> = {};
        const groupPkg: Record<string, string> = {};
        (groups || []).forEach((g) => { groupPkg[g.id] = g.package_id; });
        (members || []).forEach((m) => {
          const pid = groupPkg[m.group_id];
          if (pid) {
            if (m.member_status === "active") pkgCount[pid] = (pkgCount[pid] || 0) + 1;
            if (m.member_status === "waitlist") pkgWaitlist[pid] = (pkgWaitlist[pid] || 0) + 1;
          }
        });
        list.forEach((p) => {
          p.member_count = pkgCount[p.id] || 0;
          p.waitlist_count = pkgWaitlist[p.id] || 0;
          p.total_capacity = pkgTotalCapacity[p.id] || p.capacity;
          p.seats_left = Math.max(0, (p.total_capacity || p.capacity) - (p.member_count || 0));
        });
      } else {
        list.forEach((p) => {
          p.total_capacity = pkgTotalCapacity[p.id] || p.capacity;
          p.seats_left = p.total_capacity;
        });
      }
    }

    setPackages(list);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFLevel(LEVELS[0]); setFDay(5); setFTime("18:00"); setFDuration(90);
    setFTimezone("Africa/Cairo"); setFCapacity(5); setFActive(true); setFCourseType("group");
    setShowForm(true);
  };

  const openEdit = (p: Package) => {
    setEditing(p);
    // Normalize legacy level keys (e.g. "beginner_1" or "level_1" → "l1")
    const resolvedLevel = LEVELS.includes(p.level) ? p.level : (mapLegacyLevel(p.level)?.key ?? p.level);
    setFLevel(resolvedLevel); setFDay(p.day_of_week); setFTime(p.start_time.slice(0, 5));
    setFDuration(p.duration_min); setFTimezone(p.timezone); setFCapacity(p.capacity); setFActive(p.is_active); setFCourseType(p.course_type || "group");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (fCourseType === "private") {
      // PRIVATE: Block if the selected day has ANY active group slot
      const { data: groupSlots } = await supabase
        .from("schedule_packages")
        .select("day_of_week")
        .eq("is_active", true)
        .neq("course_type", "private");

      const courseDayIndices = new Set((groupSlots || []).map((s) => s.day_of_week));

      if (courseDayIndices.has(fDay)) {
        const availableDays = DAY_NAMES
          .map((name, i) => ({ name, i }))
          .filter(({ i }) => !courseDayIndices.has(i))
          .map(({ name }) => name);

        toast({
          title: "Private classes not available on this day",
          description: `Private classes are not available on ${DAY_NAMES[fDay]} — group classes run on that day.${
            availableDays.length > 0
              ? ` Available days for private: ${availableDays.join(", ")}.`
              : " All weekdays currently have group classes."
          }`,
          variant: "destructive",
        });
        return;
      }

      // Also check exact time conflict with other private slots at the SAME level
      const { data: existingPrivate } = await supabase
        .from("schedule_packages")
        .select("id")
        .eq("level", fLevel)
        .eq("day_of_week", fDay)
        .eq("start_time", fTime)
        .eq("course_type", "private")
        .eq("is_active", true);

      const isDupe = (existingPrivate || []).some(
        (s) => !editing || s.id !== editing.id
      );

      if (isDupe) {
        toast({
          title: "Slot already exists",
          description: `A private slot already exists on ${DAY_NAMES[fDay]} at ${fTime}.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // GROUP: Check for duplicate level + day + time (skip if editing the same slot)
      const { data: existing } = await supabase
        .from("schedule_packages")
        .select("id, day_of_week, course_type")
        .eq("level", fLevel)
        .eq("day_of_week", fDay)
        .eq("start_time", fTime)
        .neq("course_type", "private");

      const isDuplicate = (existing || []).some(
        (s) => !editing || s.id !== editing.id
      );

      if (isDuplicate) {
        // Find which days already have this level+time (excluding private)
        const { data: allSlots } = await supabase
          .from("schedule_packages")
          .select("day_of_week")
          .eq("level", fLevel)
          .eq("start_time", fTime)
          .neq("course_type", "private");
        const takenDays = new Set((allSlots || []).map((s) => s.day_of_week));
        const availableDays = DAY_NAMES
          .map((name, i) => ({ name, i }))
          .filter(({ i }) => !takenDays.has(i))
          .map(({ name }) => name);

        toast({
          title: "Slot already exists",
          description: `A slot for "${getLevelShortLabel(fLevel)}" at ${fTime} already exists on ${DAY_NAMES[fDay]}.${
            availableDays.length > 0
              ? ` Available days: ${availableDays.join(", ")}.`
              : " All days are taken for this level and time."
          }`,
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      level: fLevel, day_of_week: fDay, start_time: fTime, duration_min: fDuration,
      timezone: fTimezone, capacity: fCapacity, is_active: fActive, course_type: fCourseType,
    };
    const { error } = editing
      ? await supabase.from("schedule_packages").update(payload).eq("id", editing.id)
      : await supabase.from("schedule_packages").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Sync capacity to linked groups
    if (editing) {
      await supabase.from("pkg_groups").update({ capacity: fCapacity }).eq("package_id", editing.id).eq("is_active", true);
    }
    toast({ title: editing ? "Package updated" : "Package created" });
    setShowForm(false);
    fetchPackages();
  };

  const handleToggleActive = async (p: Package) => {
    await supabase.from("schedule_packages").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchPackages();
  };

  const handleAddGroup = async (p: Package) => {
    // Check if an active group already exists for this package
    const { data: existing } = await supabase.from("pkg_groups").select("id").eq("package_id", p.id).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      toast({ title: "Group already exists", description: "This package already has an active group.", variant: "destructive" });
      return;
    }
    const defaultName = `${getLevelShortLabel(p.level)} – ${DAY_NAMES[p.day_of_week]} ${formatTime(p.start_time)}`;
    const { error } = await supabase.from("pkg_groups").insert({
      package_id: p.id,
      name: defaultName,
      capacity: p.capacity,
    });
    if (error) {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group created", description: `"${defaultName}" added to Groups tab.` });
    fetchPackages();
  };

  const handleDeletePackage = async (p: Package) => {
    if (!confirm(`Delete this slot? (${getLevelShortLabel(p.level)} – ${DAY_NAMES[p.day_of_week]} ${formatTime(p.start_time)})\n\nThis will also deactivate any groups linked to it.`)) return;
    // Deactivate linked groups first
    await supabase.from("pkg_groups").update({ is_active: false }).eq("package_id", p.id);
    const { error } = await supabase.from("schedule_packages").delete().eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Slot deleted" });
    fetchPackages();
  };

  // Load suggestions based on teacher availability
  const handleLoadSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      if (!user) {
        toast({ title: "Error", description: "Not logged in", variant: "destructive" });
        return;
      }
      const suggested = await getSuggestedPackages(user.id, LEVELS);
      setSuggestions(suggested);
      setShowSuggestionsDialog(true);
    } catch (error: any) {
      console.error("Error loading suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to load suggestions",
        variant: "destructive",
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Quick-add a suggested package
  const handleQuickAddPackage = async (suggestion: SuggestedPackage) => {
    const dayName = DAY_NAMES[suggestion.day_of_week];
    try {
      const { error } = await supabase
        .from("schedule_packages")
        .insert({
          level: suggestion.level,
          day_of_week: suggestion.day_of_week,
          start_time: suggestion.start_time,
          duration_min: 90,
          timezone: "Africa/Cairo",
          capacity: 5,
          is_active: true,
          course_type: "group",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${suggestion.level} on ${dayName} at ${suggestion.start_time}`,
      });

      // Refresh packages
      await fetchPackages();

      // Remove from suggestions
      setSuggestions(suggestions.filter((s) => s !== suggestion));
    } catch (error: any) {
      console.error("Error creating package:", error);
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    }
  };

  const displayed = packages.filter((p) => {
    const lvl = filterLevel === "all" || p.level === filterLevel;
    const act = filterActive === "all" || (filterActive === "active" ? p.is_active : !p.is_active);
    return lvl && act;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLoadSuggestions}
            disabled={suggestionsLoading}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            {suggestionsLoading ? "Loading..." : "View Suggestions"}
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Slot</Button>
        </div>
      </div>

      {!loading && packages.length > 0 && (() => {
        const fullCount = packages.filter(p => {
          const cap = p.total_capacity ?? p.capacity;
          return cap > 0 && (p.member_count ?? 0) >= cap;
        }).length;
        const openCount = packages.filter(p => {
          const cap = p.total_capacity ?? p.capacity;
          return cap > 0 && (p.member_count ?? 0) < cap;
        }).length;
        return (
          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-2.5">
            <span className="font-medium text-foreground">{packages.length} groups total</span>
            <span>·</span>
            <span className="text-red-600 font-medium">{fullCount} full</span>
            <span>·</span>
            <span className="text-green-600 font-medium">{openCount} with open spots</span>
          </div>
        );
      })()}

      {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
        <div className="border rounded-xl overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Active / Capacity</TableHead>
                <TableHead>Fill Rate</TableHead>
                <TableHead>Seats Left</TableHead>
                <TableHead>Waitlist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((p) => {
                const seatsLeft = p.seats_left ?? (p.capacity - (p.member_count ?? 0));
                const needsGroup = (p.waitlist_count ?? 0) > 0 || seatsLeft <= 0;
                return (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline">{getLevelShortLabel(p.level)}</Badge></TableCell>
                  <TableCell><Badge variant={p.course_type === "private" ? "destructive" : "secondary"}>{p.course_type || "group"}</Badge></TableCell>
                  <TableCell>{DAY_NAMES[p.day_of_week]}</TableCell>
                  <TableCell>{formatTime(p.start_time)}</TableCell>
                  <TableCell>{p.duration_min}min</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.timezone.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{p.member_count ?? 0}/{p.total_capacity ?? p.capacity}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const cap = p.total_capacity ?? p.capacity;
                      const members = p.member_count ?? 0;
                      if (!cap) return <span className="text-muted-foreground text-xs">—</span>;
                      const pct = Math.round((members / cap) * 100);
                      const cls = pct >= 75 ? "bg-green-100 text-green-700 border-green-200"
                        : pct >= 40 ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-700 border-red-200";
                      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{pct}%</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={seatsLeft > 2 ? "secondary" : seatsLeft > 0 ? "default" : "destructive"} className="text-xs">
                      {seatsLeft}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(p.waitlist_count ?? 0) > 0 ? (
                      <Badge variant="destructive" className="text-xs">{p.waitlist_count} waiting</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                      {needsGroup && !pkgHasGroup[p.id] && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Add group
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    {pkgHasGroup[p.id] ? (
                      <Button variant="ghost" size="sm" onClick={() => onSwitchToGroups?.()} title="View group in Groups tab">
                        <Users className="h-4 w-4 mr-1" /> View Group
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleAddGroup(p)} title="Create a group for this package">
                        <Plus className="h-4 w-4 mr-1" /> Add Group
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(p)}>
                      {p.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeletePackage(p)} title="Delete slot">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Slot" : "New Slot"}</DialogTitle>
            <DialogDescription>Configure teacher available slot details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={fLevel} onValueChange={setFLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={String(fDay)} onValueChange={(v) => setFDay(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input value={fTime} onChange={(e) => setFTime(e.target.value)} placeholder="18:00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={fDuration} onChange={(e) => setFDuration(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={fCapacity} onChange={(e) => setFCapacity(Number(e.target.value))} min={1} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={fTimezone} onChange={(e) => setFTimezone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={fCourseType} onValueChange={setFCourseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={fActive} onCheckedChange={setFActive} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Save Changes" : "Create Slot"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUGGESTIONS DIALOG */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suggested Schedule Packages</DialogTitle>
            <DialogDescription>
              Based on your availability and student preferences. Click "Add" to create any of these packages.
            </DialogDescription>
          </DialogHeader>

          {suggestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              All suggested packages already exist! Your availability is fully covered.
            </p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition"
                >
                  <div className="flex-1">
                    <div className="font-semibold">
                      {suggestion.level} • {DAY_NAMES[suggestion.day_of_week]} @ {suggestion.start_time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {suggestion.studentCount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {suggestion.studentCount} {suggestion.studentCount === 1 ? "student" : "students"} want this slot
                        </span>
                      ) : (
                        <span>No requests yet, but available per your schedule</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAddPackage(suggestion)}
                    disabled={suggestion.existsAlready}
                  >
                    {suggestion.existsAlready ? "Exists" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Types for enriched groups ────────────────────────────────────────────────

interface EnrichedGroup {
  id: string;
  package_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  // From parent package
  level: string;
  course_type: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  // Computed
  members: GroupMember[];
  active_count: number;
  waitlist_count: number;
}

// ─── Groups Manager ───────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
  source: "registered" | "lead";
  already_in_group?: boolean;
}

const GroupsManager = () => {
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // Add group dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPkgId, setAddPkgId] = useState("");
  const [addName, setAddName] = useState("");
  const [addCapacity, setAddCapacity] = useState(5);

  // Add student dialog
  const [addStudentGroupId, setAddStudentGroupId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // 1. Fetch all active groups with package info
    const [grpRes, pkgRes] = await Promise.all([
      supabase.from("pkg_groups").select("*").eq("is_active", true),
      supabase.from("schedule_packages").select("*").order("level").order("day_of_week"),
    ]);

    const rawGroups = grpRes.data || [];
    const pkgs: Package[] = pkgRes.data || [];
    setPackages(pkgs);
    const pkgMap: Record<string, Package> = {};
    pkgs.forEach((p) => { pkgMap[p.id] = p; });

    if (rawGroups.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // 2. Fetch all members for those groups
    const groupIds = rawGroups.map((g) => g.id);
    const { data: allMembers } = await supabase
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .in("group_id", groupIds);

    // 3. Fetch profiles for all member user_ids
    const userIds = [...new Set((allMembers || []).map((m) => m.user_id))];
    const profMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      (profiles || []).forEach((p) => { profMap[p.user_id] = { name: p.name, email: p.email }; });
    }

    // 4. Combine into enriched groups
    const membersByGroup: Record<string, GroupMember[]> = {};
    (allMembers || []).forEach((m) => {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push({
        ...m,
        profiles: profMap[m.user_id] || null,
      });
    });

    const enriched: EnrichedGroup[] = rawGroups
      .map((g) => {
        const pkg = pkgMap[g.package_id];
        const members = membersByGroup[g.id] || [];
        return {
          id: g.id,
          package_id: g.package_id,
          name: g.name,
          capacity: g.capacity,
          is_active: g.is_active,
          level: pkg?.level || "unknown",
          course_type: pkg?.course_type || "group",
          day_of_week: pkg?.day_of_week ?? 0,
          start_time: pkg?.start_time || "00:00",
          duration_min: pkg?.duration_min || 0,
          timezone: pkg?.timezone || "",
          members,
          active_count: members.filter((m) => m.member_status === "active").length,
          waitlist_count: members.filter((m) => m.member_status === "waitlist").length,
        };
      })
      .sort((a, b) => a.level.localeCompare(b.level) || a.day_of_week - b.day_of_week);

    setGroups(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sync + Clean
  const handleSyncAndClean = async () => {
    setSyncing(true);
    try {
      const { data: cleanResult, error: cleanErr } = await supabase.rpc("cleanup_pkg_groups");
      if (cleanErr) throw cleanErr;
      const { data: created, error: syncErr } = await supabase.rpc("ensure_pkg_groups_for_packages");
      if (syncErr) throw syncErr;
      const result = cleanResult as { disabled: number; deleted: number; merged: number } | null;
      toast({
        title: "Sync complete",
        description: `Disabled ${result?.disabled ?? 0}, merged ${result?.merged ?? 0}, deleted ${result?.deleted ?? 0}, created ${created ?? 0} missing.`,
      });
      fetchAll();
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Inline name edit
  const startEditName = (g: EnrichedGroup) => {
    setEditingNameId(g.id);
    setEditNameValue(g.name);
  };

  const saveEditName = async (groupId: string) => {
    if (!editNameValue.trim()) return;
    const { error } = await supabase.from("pkg_groups").update({ name: editNameValue.trim() }).eq("id", groupId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: editNameValue.trim() } : g));
      toast({ title: "Group renamed" });
    }
    setEditingNameId(null);
  };

  const cancelEditName = () => setEditingNameId(null);

  // Toggle expand
  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  // Remove member
  const handleRemoveMember = async (groupId: string, userId: string) => {
    await supabase.from("pkg_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    toast({ title: "Member removed" });
    fetchAll();
  };

  // Delete group
  const handleDeleteGroup = async (g: EnrichedGroup) => {
    if (!confirm(`Delete group "${g.name}"?\n\nThis will remove all ${g.members.length} member(s) from this group.`)) return;
    // Delete members first
    await supabase.from("pkg_group_members").delete().eq("group_id", g.id);
    // Deactivate (soft-delete) the group
    const { error } = await supabase.from("pkg_groups").update({ is_active: false }).eq("id", g.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted" });
      fetchAll();
    }
  };

  // Add group
  const openAddGroup = () => {
    setAddPkgId("");
    setAddName("");
    setAddCapacity(5);
    setShowAddDialog(true);
  };

  const handleAddGroup = async () => {
    if (!addPkgId) return;
    // Check if an active group already exists for this package
    const { data: existing } = await supabase.from("pkg_groups").select("id").eq("package_id", addPkgId).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      toast({ title: "Group already exists", description: "This package already has an active group. Each package can only have one group.", variant: "destructive" });
      return;
    }
    const pkg = packages.find((p) => p.id === addPkgId);
    const name = addName.trim() || (pkg ? `${getLevelShortLabel(pkg.level)} – ${DAY_NAMES[pkg.day_of_week]} ${formatTime(pkg.start_time)}` : "New Group");
    const { error } = await supabase.from("pkg_groups").insert({
      package_id: addPkgId,
      name,
      capacity: addCapacity,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Group created", description: `"${name}" added.` });
    setShowAddDialog(false);
    fetchAll();
  };

  // ── Add Student to Group ──────────────────────────────────────────────────
  const openAddStudent = (groupId: string) => {
    setAddStudentGroupId(groupId);
    setStudentSearch("");
    setSearchResults([]);
  };

  const handleSearchStudents = async (query: string) => {
    setStudentSearch(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);

    const term = `%${query.trim()}%`;
    const group = groups.find((g) => g.id === addStudentGroupId);
    const existingUserIds = new Set(group?.members.map((m) => m.user_id) || []);

    // Search profiles and leads in parallel
    const [profRes, leadRes] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(20),
      supabase.from("leads").select("id, name, email").or(`name.ilike.${term},email.ilike.${term}`).limit(20),
    ]);

    const results: SearchResult[] = [];
    const profileEmails = new Set<string>();

    // Registered users
    (profRes.data || []).forEach((p) => {
      profileEmails.add(p.email?.toLowerCase());
      results.push({
        id: p.user_id,
        name: p.name,
        email: p.email,
        user_id: p.user_id,
        source: "registered",
        already_in_group: existingUserIds.has(p.user_id),
      });
    });

    // Leads — try to resolve to a registered profile by email match
    for (const l of (leadRes.data || [])) {
      const emailLower = l.email?.toLowerCase();
      // Skip if already shown as a registered user
      if (profileEmails.has(emailLower)) continue;

      // Check if this lead has a matching profile (registered but not found by name/email search above)
      const { data: matchedProfiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .eq("email", l.email)
        .limit(1);

      if (matchedProfiles && matchedProfiles.length > 0) {
        const mp = matchedProfiles[0];
        profileEmails.add(mp.email?.toLowerCase());
        results.push({
          id: mp.user_id,
          name: l.name || mp.name,
          email: mp.email,
          user_id: mp.user_id,
          source: "registered",
          already_in_group: existingUserIds.has(mp.user_id),
        });
      } else {
        results.push({
          id: l.id,
          name: l.name,
          email: l.email,
          user_id: null,
          source: "lead",
        });
      }
    }

    setSearchResults(results);
    setSearchLoading(false);
  };

  const handleAddStudentToGroup = async (result: SearchResult) => {
    if (!addStudentGroupId || !result.user_id) return;
    // Find the package_id for this group
    const group = groups.find((g) => g.id === addStudentGroupId);
    if (!group) return;

    // Use unified RPC to assign student to group via package
    const { data: assignResult, error } = await supabase
      .rpc("assign_student_to_group", {
        _package_id: group.package_id,
        _user_id: result.user_id,
      });

    if (error) {
      toast({ title: "Error adding student", description: error.message, variant: "destructive" });
      return;
    }

    const r = assignResult as Record<string, unknown> | null;
    if (r?.status === "assigned" || r?.status === "already_assigned") {
      toast({ title: "Student added", description: `${result.name} assigned to "${r.group_name}".` });
    } else if (r?.status === "waitlisted") {
      toast({ title: "Waitlisted", description: `${result.name} waitlisted — all groups full.`, variant: "destructive" });
    } else {
      toast({ title: "Error", description: `Unexpected result: ${r?.status}`, variant: "destructive" });
    }

    setSearchResults((prev) => prev.map((r) => r.id === result.id ? { ...r, already_in_group: true } : r));
    fetchAll();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {groups.length} active group(s)
          {groups.length > 0 && (
            <span className="ml-2">
              · <span className="text-green-600 font-medium">{groups.filter(g => g.active_count >= g.capacity).length} full</span>
              · <span className="text-amber-600 font-medium">{groups.filter(g => g.active_count < g.capacity).length} have open spots</span>
            </span>
          )}
        </p>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleSyncAndClean} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync + Clean
        </Button>
        <Button size="sm" onClick={openAddGroup}>
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
      </div>

      {loading && <p className="text-muted-foreground text-center py-8">Loading groups...</p>}
      {!loading && groups.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No active groups. Click "Sync + Clean" to auto-create from packages.</p>
      )}

      {/* Group cards */}
      {groups.map((g) => {
        const isExpanded = expandedGroups.has(g.id);
        return (
          <Card key={g.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Editable name */}
                  <div className="flex items-center gap-2 mb-1">
                    {editingNameId === g.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="h-7 text-sm w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditName(g.id);
                            if (e.key === "Escape") cancelEditName();
                          }}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEditName(g.id)}>
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelEditName}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-sm truncate">{g.name}</CardTitle>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => startEditName(g)}>
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">{getLevelShortLabel(g.level)}</Badge>
                    <Badge variant={g.course_type === "private" ? "destructive" : "secondary"} className="text-xs">{g.course_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {DAY_NAMES[g.day_of_week]} · {formatTime(g.start_time)}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-mono">
                      {g.active_count}/{g.capacity} active
                    </span>
                    {g.active_count > 0 && g.active_count < g.capacity && (
                      <Badge className="text-xs bg-green-600 text-white hover:bg-green-600">Ongoing</Badge>
                    )}
                    {g.waitlist_count > 0 && (
                      <Badge variant="secondary" className="text-xs">{g.waitlist_count} waitlisted</Badge>
                    )}
                    {g.active_count >= g.capacity && (
                      <Badge variant="destructive" className="text-xs">Full</Badge>
                    )}
                    {/* Fill rate badge */}
                    {g.capacity > 0 && (() => {
                      const pct = Math.round((g.active_count / g.capacity) * 100);
                      const cls = pct >= 75 ? "bg-green-100 text-green-700 border-green-300" : pct >= 40 ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-red-100 text-red-700 border-red-300";
                      return <Badge variant="outline" className={`text-xs ${cls}`}>{pct}% full</Badge>;
                    })()}
                  </div>
                </div>

                {/* Add Student + Delete + Expand toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEditName(g)} title="Edit name" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openAddStudent(g.id)} title="Add student to group" className="h-8 w-8 p-0">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteGroup(g)} title="Delete group">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleExpand(g.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Users className="h-4 w-4 ml-1" />
                    <span className="text-xs ml-1">{g.members.length}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Student roster */}
            {isExpanded && (
              <CardContent className="pt-0">
                {g.members.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-3">No students in this group.</p>
                ) : (
                  <div className="space-y-1.5">
                    {g.members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.profiles?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.profiles?.email || m.user_id}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={m.member_status === "active" ? "default" : "secondary"} className="text-xs">{m.member_status}</Badge>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRemoveMember(g.id, m.user_id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add Group Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>Create a new group under a package.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={addPkgId} onValueChange={setAddPkgId}>
                <SelectTrigger><SelectValue placeholder="Select package..." /></SelectTrigger>
                <SelectContent>
                  {packages.filter((p) => p.is_active && !groups.some((g) => g.package_id === p.id)).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {getLevelShortLabel(p.level)} · {DAY_NAMES[p.day_of_week]} {formatTime(p.start_time)} ({p.course_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group Name (optional – auto-generated if blank)</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Beginner A" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={addCapacity} onChange={(e) => setAddCapacity(Number(e.target.value))} min={1} />
            </div>
            <Button className="w-full" onClick={handleAddGroup} disabled={!addPkgId}>Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={!!addStudentGroupId} onOpenChange={(open) => { if (!open) setAddStudentGroupId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Group</DialogTitle>
            <DialogDescription>Search by name or email across registered users and leads.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                value={studentSearch}
                onChange={(e) => handleSearchStudents(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {searchLoading && <p className="text-sm text-muted-foreground text-center py-2">Searching...</p>}

            {!searchLoading && studentSearch.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No results found.</p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {searchResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <Badge variant={r.source === "registered" ? "default" : "outline"} className="text-xs shrink-0">
                          {r.source === "registered" ? "Registered" : "Lead"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <div className="shrink-0 ml-2">
                      {r.already_in_group ? (
                        <Badge variant="secondary" className="text-xs">Already in group</Badge>
                      ) : r.source === "lead" ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Not registered</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleAddStudentToGroup(r)}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Waitlist Manager ─────────────────────────────────────────────────────────

const WaitlistManager = () => {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    setLoading(true);
    const { data: waitlist } = await supabase
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .eq("member_status", "waitlist");

    const wl: WaitlistRow[] = waitlist || [];
    if (wl.length === 0) { setRows([]); setLoading(false); return; }

    const userIds = wl.map((r) => r.user_id);
    // Course logic must read profiles.course_level_key (canonical), NOT
    // profiles.level (free-form self-assessment). See migration
    // profiles.course_level_key in Supabase.
    const [profilesRes, prefsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, name, email, course_level_key, level").in("user_id", userIds),
      supabase.from("student_package_preferences").select("user_id, package_id, level").in("user_id", userIds),
    ]);

    const profMap: Record<string, { user_id: string; name: string; email: string; course_level_key: string | null; level: string }> = {};
    (profilesRes.data || []).forEach((p: any) => { profMap[p.user_id] = p; });
    const prefMap: Record<string, { user_id: string; package_id: string | null; level: string }> = {};
    (prefsRes.data || []).forEach((p) => { prefMap[p.user_id] = p; });

    // Fetch all active packages for alternatives
    const { data: allPkgs } = await supabase.from("schedule_packages").select("*").eq("is_active", true);
    const pkgs: Package[] = allPkgs || [];

    // Count members per package
    const pkgIds = pkgs.map((p: Package) => p.id);
    const pkgCount: Record<string, number> = {};
    if (pkgIds.length > 0) {
      const { data: groups } = await supabase.from("pkg_groups").select("id, package_id").in("package_id", pkgIds);
      const gIds = (groups || []).map((g) => g.id);
      const gPkg: Record<string, string> = {};
      (groups || []).forEach((g) => { gPkg[g.id] = g.package_id; });
      if (gIds.length > 0) {
        const { data: mems } = await supabase.from("pkg_group_members").select("group_id, member_status").in("group_id", gIds).eq("member_status", "active");
        (mems || []).forEach((m) => {
          const pid = gPkg[m.group_id];
          if (pid) pkgCount[pid] = (pkgCount[pid] || 0) + 1;
        });
      }
    }
    const pkgsWithSeats = pkgs.map((p: Package) => ({ ...p, member_count: pkgCount[p.id] || 0 }));

    const enriched: WaitlistRow[] = wl.map((r) => {
      const profile = profMap[r.user_id];
      const pref = prefMap[r.user_id];
      const preferredPkg = pref?.package_id ? pkgsWithSeats.find((p: Package) => p.id === pref.package_id) || null : null;
      // Matcher pairs students to packages by canonical course key.
      // Prefer profiles.course_level_key (source of truth for course logic).
      // Fallback to the waitlist preference, then the legacy self-assessment
      // column (pre-migration rows) as a last resort.
      const level = profile?.course_level_key || pref?.level || profile?.level || "";
      const alternatives = pkgsWithSeats.filter((p: Package) =>
        p.level === level && (p.member_count || 0) < p.capacity && p.id !== pref?.package_id
      ).slice(0, 4);

      return { ...r, profiles: profile || null, preferredPackage: preferredPkg, alternatives };
    });

    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchWaitlist(); }, []);

  const handleAssign = async (userId: string, packageId: string) => {
    setAssigning(userId);
    // Remove from old waitlist group
    const row = rows.find((r) => r.user_id === userId);
    if (row) {
      await supabase.from("pkg_group_members").delete().eq("group_id", row.group_id).eq("user_id", userId);
    }
    // Use unified RPC
    const { data: enr } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("approval_status", "APPROVED").eq("payment_status", "PAID").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: result, error } = await supabase.rpc("assign_student_to_group", {
      _package_id: packageId,
      _user_id: userId,
      _enrollment_id: enr ? enr.id : null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const r = result as Record<string, unknown> | null;
      if (r?.status === "assigned") {
        toast({ title: "Assigned!", description: `Student moved to "${r.group_name}".` });
      } else if (r?.status === "waitlisted") {
        toast({ title: "Still waitlisted", description: "Target package also full.", variant: "destructive" });
      } else {
        toast({ title: "Result", description: r?.status || "Unknown" });
      }
    }
    setAssigning(null);
    fetchWaitlist();
  };

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading waitlist...</p>;
  if (rows.length === 0) return <p className="text-muted-foreground text-center py-8">No waitlisted students.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{rows.length} student(s) on waitlist</p>
      {rows.map((r) => (
        <Card key={`${r.group_id}-${r.user_id}`}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{r.profiles?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{r.profiles?.email || r.user_id}</p>
              </div>
              <Badge variant="secondary">Waitlisted</Badge>
            </div>
            {r.preferredPackage && (
              <p className="text-xs text-muted-foreground">
                Preferred: {getLevelShortLabel(r.preferredPackage.level)} · {DAY_NAMES[r.preferredPackage.day_of_week]} {formatTime(r.preferredPackage.start_time)} (Full)
              </p>
            )}
            {r.alternatives && r.alternatives.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Alternatives with seats:</p>
                {r.alternatives.map((alt) => (
                  <div key={alt.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <span className="text-xs text-foreground">
                      {getLevelShortLabel(alt.level)} · {DAY_NAMES[alt.day_of_week]} {formatTime(alt.start_time)}
                      <span className="text-muted-foreground ml-1">({alt.capacity - (alt.member_count || 0)} seats)</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      disabled={assigning === r.user_id}
                      onClick={() => handleAssign(r.user_id, alt.id)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" /> Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {(!r.alternatives || r.alternatives.length === 0) && (
              <p className="text-xs text-destructive">No alternatives available at same level.</p>
            )}
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" size="sm" onClick={fetchWaitlist}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
    </div>
  );
};

// ─── Private Time Config ──────────────────────────────────────────────────────

const PrivateTimeConfig = () => {
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("10:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Private class days config
  const [privateDays, setPrivateDays] = useState<string[]>([]);
  const [groupDays, setGroupDays] = useState<number[]>([]);
  const [savingDays, setSavingDays] = useState(false);

  const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const load = async () => {
      const [timeRes, daysRes, pkgRes] = await Promise.all([
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "private_time_options")
          .maybeSingle(),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "private_class_days")
          .maybeSingle(),
        supabase
          .from("schedule_packages")
          .select("day_of_week")
          .eq("is_active", true)
          .neq("course_type", "private"),
      ]);

      // Times
      if (timeRes.data?.value) {
        try { setTimes(JSON.parse(timeRes.data.value)); } catch { setTimes(["10:00", "18:00"]); }
      } else {
        setTimes(["10:00", "18:00"]);
      }

      // Group days (blocked for private)
      const gDays = [...new Set((pkgRes.data || []).map((r) => r.day_of_week))];
      setGroupDays(gDays);

      // Private days
      if (daysRes.data?.value) {
        try { setPrivateDays(JSON.parse(daysRes.data.value)); } catch { setPrivateDays([]); }
      }

      setLoading(false);
    };
    load();
  }, []);

  const availableDaysForPrivate = ALL_DAYS.filter((_, i) => !groupDays.includes(i));

  const saveTimeOptions = async (updated: string[]) => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "private_time_options", value: JSON.stringify(updated), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setTimes(updated);
      toast({ title: "Private times updated" });
    }
    setSaving(false);
  };

  const savePrivateDays = async (updated: string[]) => {
    setSavingDays(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "private_class_days", value: JSON.stringify(updated), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setPrivateDays(updated);
      toast({ title: "Private class days updated" });
    }
    setSavingDays(false);
  };

  const togglePrivateDay = (day: string) => {
    let updated: string[];
    if (privateDays.includes(day)) {
      updated = privateDays.filter((d) => d !== day);
    } else {
      if (privateDays.length >= 2) {
        toast({ title: "Maximum 2 private days", description: "Remove one day before adding another.", variant: "destructive" });
        return;
      }
      updated = [...privateDays, day];
    }
    savePrivateDays(updated);
  };

  const addTime = () => {
    if (!newTime || times.includes(newTime)) return;
    const updated = [...times, newTime].sort();
    saveTimeOptions(updated);
  };

  const removeTime = (t: string) => {
    const updated = times.filter((x) => x !== t);
    if (updated.length === 0) {
      toast({ title: "At least one time required", variant: "destructive" });
      return;
    }
    saveTimeOptions(updated);
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>;

  return (
    <div className="space-y-4">
      {/* Private Class Days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Private Class Days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose up to <strong>2 days</strong> for private classes. Only days without active group slots are available.
          </p>
          {availableDaysForPrivate.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">All weekdays have group classes — no days available for private.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableDaysForPrivate.map((day) => {
                const selected = privateDays.includes(day);
                return (
                  <Button
                    key={day}
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => togglePrivateDay(day)}
                    disabled={savingDays}
                  >
                    {day}
                  </Button>
                );
              })}
            </div>
          )}
          {groupDays.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Blocked by group classes: {groupDays.map(d => ALL_DAYS[d]).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Private Class Time Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Private Class Time Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These times are shown to students booking private classes on the selected private days above.
          </p>
          <div className="flex flex-wrap gap-2">
            {times.map((t) => (
              <Badge key={t} variant="secondary" className="text-sm py-1 px-3 gap-1">
                {formatTime(t)}
                <button
                  onClick={() => removeTime(t)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  disabled={saving}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-32"
            />
            <Button size="sm" onClick={addTime} disabled={saving || !newTime}>
              <Plus className="h-4 w-4 mr-1" /> Add Time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Trial Bookings Manager ──────────────────────────────────────────────────

const TRIAL_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  capacity: number;
  is_active: boolean;
}

const TrialBookingsManager = () => {
  const [bookings, setBookings] = useState<TrialBooking[]>([]);
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [bookingsRes, slotsRes] = await Promise.all([
      supabase.from("trial_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("trial_slots").select("day_of_week, start_time, capacity, is_active").eq("is_active", true),
    ]);
    if (bookingsRes.error) toast({ title: "Error", description: bookingsRes.error.message, variant: "destructive" });
    setBookings((bookingsRes.data as TrialBooking[] | null) || []);
    setSlots((slotsRes.data as TrialSlot[] | null) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirm = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      // 1. Update trial booking status
      const { error: tbErr } = await supabase
        .from("trial_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() } as any)
        .eq("id", booking.id);
      if (tbErr) throw tbErr;

      // 2. Update matching lead (best effort)
      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", booking.email.toLowerCase())
        .maybeSingle();
      if (lead?.id) {
        await supabase.functions.invoke("admin-update-lead", {
          body: { id: lead.id, status: "confirmed" },
        });
      }

      // 3. Send confirmation email (best effort) — gated by feature flag
      if (TRIAL_CONFIRMATION_EMAIL_ENABLED) try {
        const [h, m] = (booking.start_time || "18:00").split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const time12 = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
        const tz = booking.timezone || "Africa/Cairo";
        const dateClean = (booking.trial_date || "").replace(/-/g, "");
        const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
        const endH = h + Math.floor((m + 45) / 60);
        const endM = (m + 45) % 60;
        const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
        const calParams = new URLSearchParams({
          action: "TEMPLATE",
          text: "Free Korean Trial Class — Klovers Academy",
          dates: `${start}/${end}`,
          details: `Level: ${booking.level || "Beginner"}`,
          ctz: tz,
        });
        const calendarUrl = `https://calendar.google.com/calendar/render?${calParams.toString()}`;
        const trialDateFormatted = new Date(booking.trial_date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric",
        });
        await supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "trial_confirmed",
            email: booking.email,
            name: booking.name || booking.email,
            level: booking.level,
            trial_date: trialDateFormatted,
            trial_time: time12,
            trial_timezone: tz,
            calendar_url: calendarUrl,
            language: "ar",
          },
        });
      } catch (emailErr) {
        console.error("send-confirmation-email failed:", emailErr);
      }

      toast({ title: "Trial confirmed", description: TRIAL_CONFIRMATION_EMAIL_ENABLED ? `${booking.name} has been notified.` : `${booking.name} marked confirmed (email disabled).` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error: tbErr } = await supabase
        .from("trial_bookings")
        .update({ status: "cancelled" } as any)
        .eq("id", booking.id);
      if (tbErr) throw tbErr;

      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", booking.email.toLowerCase())
        .maybeSingle();
      if (lead?.id) {
        await supabase.functions.invoke("admin-update-lead", {
          body: { id: lead.id, status: "rejected" },
        });
      }

      toast({ title: "Trial cancelled", description: `${booking.name}'s trial has been cancelled.` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const [viewTab, setViewTab] = useState<"upcoming" | "history">("upcoming");
  const [historyWindow, setHistoryWindow] = useState<"7" | "14" | "30" | "all">("all");

  // ── Partition all bookings into upcoming vs past by trial_date (not created_at)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const trialDateObj = (b: TrialBooking) => new Date(`${b.trial_date}T00:00:00`);

  // Repeat-booking detection: any email appearing more than once anywhere in the table
  const emailCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const k = (b.email || "").toLowerCase();
    if (!k) return;
    emailCounts[k] = (emailCounts[k] || 0) + 1;
  });
  const isRepeat = (b: TrialBooking) =>
    (emailCounts[(b.email || "").toLowerCase()] || 0) > 1;

  const upcomingBookings = bookings
    .filter((b) => trialDateObj(b) >= startOfToday)
    .sort((a, b) => a.trial_date.localeCompare(b.trial_date) || a.start_time.localeCompare(b.start_time));

  const windowDays = historyWindow === "all" ? null : parseInt(historyWindow, 10);
  const cutoff = windowDays
    ? new Date(startOfToday.getTime() - windowDays * 24 * 60 * 60 * 1000)
    : null;

  const pastBookings = bookings
    .filter((b) => {
      const d = trialDateObj(b);
      if (d >= startOfToday) return false;
      if (cutoff && d < cutoff) return false;
      return true;
    })
    // most recent first
    .sort((a, b) => b.trial_date.localeCompare(a.trial_date) || b.start_time.localeCompare(a.start_time));

  // Group by exact session (trial_date + start_time). Source of truth = trial_bookings,
  // so legacy/removed slots still surface here.
  const groupBySession = (list: TrialBooking[]) => {
    const groups: Record<string, TrialBooking[]> = {};
    list.forEach((b) => {
      const key = `${b.trial_date}__${b.start_time}`;
      (groups[key] ||= []).push(b);
    });
    return Object.entries(groups).map(([key, items]) => {
      const [date, time] = key.split("__");
      return { key, date, time, items };
    });
  };
  const upcomingSessions = groupBySession(upcomingBookings);
  const pastSessions = groupBySession(pastBookings);

  // Next-7-days slot availability card (kept from prior view)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const slotStudents: Record<string, TrialBooking[]> = {};
  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    const d = trialDateObj(b);
    if (d >= now && d <= nextWeek) {
      const key = `${b.day_of_week}-${b.start_time}`;
      (slotStudents[key] ||= []).push(b);
    }
  });

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading trial bookings...</p>;

  const formatSessionLabel = (date: string, time: string) => {
    const d = new Date(`${date}T00:00:00`);
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${weekday}, ${dateLabel} — ${formatTime(time)}`;
  };

  const renderSessionCard = (session: { key: string; date: string; time: string; items: TrialBooking[] }) => {
    const activeCount = session.items.filter((i) => i.status !== "cancelled" && i.status !== "no_show").length;
    const matchedSlot = slots.find((s) => s.start_time === session.time);
    const legacy = !slots.some((s) => s.start_time === session.time);
    return (
      <Card key={session.key} className="mb-3">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{formatSessionLabel(session.date, session.time)}</CardTitle>
              {legacy && <Badge variant="outline" className="text-[10px]">legacy slot</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">
              {session.items.length} booking{session.items.length === 1 ? "" : "s"} · {activeCount} active
              {matchedSlot ? ` · capacity ${matchedSlot.capacity}` : ""}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <span>{b.name || "—"}</span>
                        {isRepeat(b) && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">repeat</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{b.email || "—"}</TableCell>
                    <TableCell className="text-xs">{b.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{b.level ? getLevelShortLabel(mapLegacyLevel(b.level)) : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TRIAL_STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                        {(b.status || "unknown").replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={b.goal || ""}>
                      {b.goal || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status === "pending" ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleConfirm(b)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleReject(b)}>
                            <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Slot availability (next 7 days) — quick glance */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Trial Slot Availability (next 7 days)</h3>
        <div className="flex flex-wrap gap-3">
          {slots.map((s) => {
            const key = `${s.day_of_week}-${s.start_time}`;
            const students = slotStudents[key] || [];
            const spotsLeft = Math.max(0, s.capacity - students.length);
            return (
              <Card key={key} className="min-w-[220px] flex-1">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{DAY_NAMES[s.day_of_week]} {formatTime(s.start_time)}</p>
                    <Badge variant={spotsLeft === 0 ? "destructive" : "secondary"} className="text-xs">
                      {spotsLeft === 0 ? "Full" : `${spotsLeft}/${s.capacity} left`}
                    </Badge>
                  </div>
                  {students.length > 0 ? (
                    <ul className="space-y-2">
                      {students.map((st) => (
                        <li key={st.id} className="flex items-center gap-2 text-xs">
                          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate flex-1">{st.name || "—"}</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${TRIAL_STATUS_COLORS[st.status] || "bg-gray-100 text-gray-600"}`}>
                            {st.status.replace("_", " ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No bookings yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {slots.length === 0 && <p className="text-sm text-muted-foreground">No trial slots configured.</p>}
        </div>
      </div>

      {/* Upcoming / History tabs */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "upcoming" | "history")}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Trials ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="history">Trial History ({pastBookings.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {viewTab === "history" && (
              <Select value={historyWindow} onValueChange={(v) => setHistoryWindow(v as any)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="upcoming">
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming trial bookings.</p>
          ) : (
            upcomingSessions.map(renderSessionCard)
          )}
        </TabsContent>

        <TabsContent value="history">
          {pastSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No past trial bookings in this window.</p>
          ) : (
            pastSessions.map(renderSessionCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SchedulingManager = () => {
  const [activeTab, setActiveTab] = useState("packages");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="packages">Teacher Available Slots</TabsTrigger>
        <TabsTrigger value="groups">Groups</TabsTrigger>
        <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        <TabsTrigger value="config">Private Config</TabsTrigger>
        <TabsTrigger value="trials">Trial Bookings</TabsTrigger>
        <TabsTrigger value="trial-classes">Trial Classes</TabsTrigger>
        <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="packages"><PackagesManager onSwitchToGroups={() => setActiveTab("groups")} /></TabsContent>
      <TabsContent value="groups"><GroupsManager /></TabsContent>
      <TabsContent value="waitlist"><WaitlistManager /></TabsContent>
      <TabsContent value="config"><PrivateTimeConfig /></TabsContent>
      <TabsContent value="trials"><TrialBookingsManager /></TabsContent>
      <TabsContent value="trial-classes"><TrialClassesTab /></TabsContent>
      <TabsContent value="notifications"><AdminNotifications /></TabsContent>
    </Tabs>
  );
};

export default memo(SchedulingManager);
