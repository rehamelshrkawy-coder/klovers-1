import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CalendarCheck, AlertTriangle, Plus, Trash2, X,
  Pencil, Check, Users, CreditCard, BookOpen, Eraser,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminAttendancePanelProps {
  enrollmentId: string;
  userId: string;
  studentName: string;
  sessionsRemaining: number;
  negativeSessions: number;
  amountDue: number;
  currency: string | null;
  derivedStatus: string;
  onClose: () => void;
  onUpdated: () => void;
}

interface UnifiedRecord {
  id: string;
  session_date: string;
  source: "Admin" | "Group" | "Student";
  group_name?: string;
  created_at: string;
}

interface EnrollmentDetails {
  plan_type: string;
  duration: number;
  sessions_total: number;
  sessions_remaining: number;
  amount: number;
  unit_price: number;
  currency: string;
  payment_status: string;
  level: string | null;
}

const AdminAttendancePanel = ({
  enrollmentId, userId, studentName, sessionsRemaining,
  negativeSessions, amountDue, currency, derivedStatus,
  onClose, onUpdated,
}: AdminAttendancePanelProps) => {
  const [records, setRecords] = useState<UnifiedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);

  // Inline editing state
  const [editingRemaining, setEditingRemaining] = useState(false);
  const [editRemaining, setEditRemaining] = useState("");
  const [editingUnitPrice, setEditingUnitPrice] = useState(false);
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editingPlan, setEditingPlan] = useState(false);
  const [editPlanType, setEditPlanType] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editingPaid, setEditingPaid] = useState(false);
  const [editPaid, setEditPaid] = useState("");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editNewDate, setEditNewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [enrollRes, adminRes, pkgRes, selfRes, groupRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("plan_type, duration, sessions_total, sessions_remaining, amount, unit_price, currency, payment_status, level")
        .eq("id", enrollmentId)
        .single(),
      supabase
        .from("admin_attendance_log")
        .select("id, session_date, created_at")
        .eq("enrollment_id", enrollmentId)
        .order("session_date", { ascending: false }),
      supabase
        .from("pkg_attendance")
        .select("session_id, created_at, status, pkg_group_sessions(id, session_date, group_id, pkg_groups(name))")
        .eq("user_id", userId)
        .eq("admin_approved", true),
      supabase
        .from("attendance_requests")
        .select("id, request_date, created_at")
        .eq("enrollment_id", enrollmentId)
        .eq("status", "APPROVED")
        .order("request_date", { ascending: false }),
      supabase
        .from("pkg_group_members")
        .select("group_id, pkg_groups(name)")
        .eq("user_id", userId)
        .eq("member_status", "active")
        .limit(1),
    ]);

    if (enrollRes.data) setEnrollment(enrollRes.data as EnrollmentDetails);

    if (groupRes.data && groupRes.data.length > 0) {
      const member = groupRes.data[0] as { group_id: string; pkg_groups: { name: string } | null };
      setGroupName(member.pkg_groups?.name || null);
    }

    const unified: UnifiedRecord[] = [];

    if (adminRes.data) {
      for (const r of adminRes.data) {
        unified.push({ id: r.id, session_date: r.session_date, source: "Admin", created_at: r.created_at });
      }
    }

    if (pkgRes.data) {
      for (const r of pkgRes.data) {
        const session = r.pkg_group_sessions;
        if (session) {
          unified.push({
            id: r.session_id,
            session_date: session.session_date,
            source: "Group",
            group_name: session.pkg_groups?.name || "",
            created_at: r.created_at,
          });
        }
      }
    }

    if (selfRes.data) {
      for (const r of selfRes.data) {
        unified.push({ id: r.id, session_date: r.request_date, source: "Student", created_at: r.created_at });
      }
    }

    // Sort ascending by date (oldest first)
    unified.sort((a, b) => a.session_date.localeCompare(b.session_date));
    setRecords(unified);
    setLoading(false);
  }, [enrollmentId, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-calculated stats
  const stats = useMemo(() => {
    if (!enrollment) return null;
    const totalUsed = records.length;
    const packageSize = enrollment.sessions_total;
    const remaining = packageSize - totalUsed;
    const extra = remaining < 0 ? Math.abs(remaining) : 0;
    const balance = Math.round(extra * enrollment.unit_price);
    return { totalUsed, packageSize, remaining, extra, balance };
  }, [records, enrollment]);

  // Duplicate detection
  const duplicates = useMemo(() => {
    const dateCount: Record<string, number> = {};
    for (const r of records) {
      dateCount[r.session_date] = (dateCount[r.session_date] || 0) + 1;
    }
    return Object.entries(dateCount).filter(([, c]) => c > 1).map(([d]) => d);
  }, [records]);

  // Calendar modifiers
  const { groupDates, adminDates, studentDates } = useMemo(() => {
    const g: Date[] = [], a: Date[] = [], s: Date[] = [];
    for (const r of records) {
      const d = new Date(r.session_date + "T00:00:00");
      if (r.source === "Group") g.push(d);
      else if (r.source === "Admin") a.push(d);
      else s.push(d);
    }
    return { groupDates: g, adminDates: a, studentDates: s };
  }, [records]);

  const isLocked = derivedStatus === "LOCKED" || sessionsRemaining <= -3;
  const currLabel = currency === "EGP" ? "LE" : "$";

  const handleAddAttendance = async () => {
    if (!selectedDate) return;
    setAdding(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data, error } = await supabase.rpc("admin_add_attendance", {
      p_enrollment_id: enrollmentId,
      p_session_date: dateStr,
    });
    if (error) {
      toast({ title: "Error", description: error.message?.includes("duplicate") ? "Already recorded." : error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance added", description: `Remaining: ${data}` });
      setSelectedDate(undefined);
      fetchAll();
      onUpdated();
    }
    setAdding(false);
  };

  const handleRemoveAttendance = async (sessionDate: string) => {
    const { data, error } = await supabase.rpc("admin_remove_attendance", {
      p_enrollment_id: enrollmentId,
      p_session_date: sessionDate,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: `Remaining: ${data}` });
      fetchAll();
      onUpdated();
    }
  };

  const handleRemoveRecord = async (r: UnifiedRecord) => {
    if (r.source === "Admin") {
      await handleRemoveAttendance(r.session_date);
    } else if (r.source === "Group") {
      // Delete from pkg_attendance by session_id + user_id
      const { error } = await supabase
        .from("pkg_attendance")
        .delete()
        .eq("session_id", r.id)
        .eq("user_id", userId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        // Restore 1 session
        await supabase.from("enrollments").update({ sessions_remaining: (enrollment?.sessions_remaining ?? 0) + 1 }).eq("id", enrollmentId);
        // Also remove charge record
        await supabase.from("pkg_class_charges").delete().eq("session_id", r.id).eq("user_id", userId);
        toast({ title: "Group session removed" });
        fetchAll();
        onUpdated();
      }
    } else if (r.source === "Student") {
      const { error } = await supabase
        .from("attendance_requests")
        .delete()
        .eq("id", r.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Student request removed" });
        fetchAll();
        onUpdated();
      }
    }
  };

  const handleEditDate = async (oldDate: string) => {
    if (!editNewDate) return;
    setSaving(true);
    // Remove old, add new
    const { error: removeErr } = await supabase.rpc("admin_remove_attendance", {
      p_enrollment_id: enrollmentId,
      p_session_date: oldDate,
    });
    if (removeErr) {
      toast({ title: "Error removing old date", description: removeErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error: addErr } = await supabase.rpc("admin_add_attendance", {
      p_enrollment_id: enrollmentId,
      p_session_date: editNewDate,
    });
    if (addErr) {
      toast({ title: "Error adding new date", description: addErr.message, variant: "destructive" });
    } else {
      toast({ title: "Date updated", description: `Changed ${oldDate} → ${editNewDate}` });
    }
    setEditingDate(null);
    setEditNewDate("");
    fetchAll();
    onUpdated();
    setSaving(false);
  };

  const handleRemoveDuplicates = async () => {
    if (duplicates.length === 0) return;
    setSaving(true);
    let removed = 0;
    for (const dupeDate of duplicates) {
      // Find admin-logged duplicates for this date and remove extras
      const dupeRecords = records.filter(r => r.session_date === dupeDate && r.source === "Admin");
      // Keep the first, remove the rest
      for (let i = 1; i < dupeRecords.length; i++) {
        const { error } = await supabase.rpc("admin_remove_attendance", {
          p_enrollment_id: enrollmentId,
          p_session_date: dupeDate,
        });
        if (!error) removed++;
        // Only remove once per duplicate since the RPC deletes by date
        break;
      }
    }
    toast({ title: "Duplicates cleaned", description: `Removed ${removed} duplicate(s)` });
    fetchAll();
    onUpdated();
    setSaving(false);
  };

  const handleSyncRemaining = async () => {
    if (!stats || !enrollment) return;
    setSaving(true);
    const newRemaining = stats.remaining;
    const { error } = await supabase
      .from("enrollments")
      .update({ sessions_remaining: newRemaining })
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Synced", description: `Remaining set to ${newRemaining}` });
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSaveRemaining = async () => {
    const val = parseInt(editRemaining, 10);
    if (isNaN(val)) return;
    setSaving(true);
    const { error } = await supabase.from("enrollments").update({ sessions_remaining: val }).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Remaining set to ${val}` });
      setEditingRemaining(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSaveUnitPrice = async () => {
    const val = parseFloat(editUnitPrice);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    const { error } = await supabase.from("enrollments").update({ unit_price: val }).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Unit price set to ${currLabel}${val}` });
      setEditingUnitPrice(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSavePlan = async () => {
    if (!editPlanType || !editDuration) return;
    const dur = parseInt(editDuration, 10);
    if (![1, 3, 6].includes(dur)) return;
    setSaving(true);
    const newTotal = dur === 1 ? 4 : dur === 3 ? 12 : 24;
    const { error } = await supabase
      .from("enrollments")
      .update({ plan_type: editPlanType, duration: dur, sessions_total: newTotal })
      .eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Plan set to ${editPlanType} ${dur}mo (${newTotal} sessions)` });
      setEditingPlan(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleSavePaid = async () => {
    const val = parseFloat(editPaid);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    const { error } = await supabase.from("enrollments").update({ amount: val }).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Paid set to ${currLabel}${val}` });
      setEditingPaid(false);
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const handleUnlock = async () => {
    setSaving(true);
    const { error } = await supabase.from("enrollments").update({ sessions_remaining: 0 }).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Unlocked", description: "Student is now active." });
      fetchAll();
      onUpdated();
    }
    setSaving(false);
  };

  const sourceBadgeVariant = (s: UnifiedRecord["source"]) =>
    s === "Group" ? "default" : s === "Admin" ? "secondary" : "outline";

  const modifiers = { group: groupDates, admin: adminDates, student: studentDates };
  const modifiersStyles = {
    group: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    admin: { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: "9999px" },
    student: { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", borderRadius: "9999px" },
  };

  // Check if DB remaining is out of sync with calculated
  const outOfSync = stats && enrollment && enrollment.sessions_remaining !== stats.remaining;

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Attendance — {studentName}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close attendance panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-Calculated Stats */}
        {stats && enrollment && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
              <span className="text-[10px] text-muted-foreground">Package</span>
              <p className="text-lg font-bold text-foreground">{stats.packageSize}</p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
              <span className="text-[10px] text-muted-foreground">Used</span>
              <p className="text-lg font-bold text-foreground">{stats.totalUsed}</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${stats.remaining >= 0 ? "bg-muted/50 border-border" : "bg-destructive/10 border-destructive/30"}`}>
              <span className="text-[10px] text-muted-foreground">{stats.remaining >= 0 ? "Remaining" : "Extra"}</span>
              <p className={`text-lg font-bold ${stats.remaining >= 0 ? "text-foreground" : "text-destructive"}`}>
                {stats.remaining >= 0 ? stats.remaining : stats.extra}
              </p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${stats.balance > 0 ? "bg-destructive/10 border-destructive/30" : "bg-muted/50 border-border"}`}>
              <span className="text-[10px] text-muted-foreground">Balance Due</span>
              <p className={`text-lg font-bold ${stats.balance > 0 ? "text-destructive" : "text-foreground"}`}>
                {currLabel}{Math.round(stats.balance).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Sync warning + Recount */}
        {stats && enrollment && (
          <div className="flex items-center justify-between gap-2">
            {outOfSync ? (
              <div className="flex-1 flex items-center justify-between bg-destructive/10 rounded-lg p-2 text-sm">
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  DB shows {enrollment.sessions_remaining} remaining, but {stats.totalUsed} used of {stats.packageSize} = {stats.remaining} remaining
                </span>
                <Button size="sm" variant="destructive" onClick={handleSyncRemaining} disabled={saving}>
                  <Check className="h-3 w-3 mr-1" /> Sync
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">In sync ✓</span>
            )}
            <Button size="sm" variant="outline" onClick={() => fetchAll()} disabled={loading}>
              Recount
            </Button>
          </div>
        )}

        {/* Status & actions row */}
        <div className="flex flex-wrap gap-2">
          {isLocked && (
            <Badge variant="destructive" className="cursor-pointer" onClick={handleUnlock} title="Click to unlock">
              <AlertTriangle className="h-3 w-3 mr-1" /> LOCKED — click to unlock
            </Badge>
          )}
          {duplicates.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleRemoveDuplicates} disabled={saving}>
              <Eraser className="h-3 w-3 mr-1" /> Remove {duplicates.length} duplicate(s)
            </Button>
          )}
        </div>

        {/* Enrollment Details */}
        {enrollment && (
          <div className="grid grid-cols-2 gap-2 text-sm border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Plan:</span>
              {editingPlan ? (
                <div className="flex items-center gap-1">
                  <select value={editPlanType} onChange={(e) => setEditPlanType(e.target.value)} className="h-6 text-xs border border-border rounded px-1 bg-background">
                    <option value="group">group</option>
                    <option value="private">private</option>
                  </select>
                  <select value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="h-6 text-xs border border-border rounded px-1 bg-background">
                    <option value="1">1mo</option>
                    <option value="3">3mo</option>
                    <option value="6">6mo</option>
                  </select>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSavePlan} disabled={saving} aria-label="Save plan"><Check className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPlan(false)} aria-label="Cancel edit plan"><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{enrollment.plan_type} {enrollment.duration}mo</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditPlanType(enrollment.plan_type); setEditDuration(String(enrollment.duration)); setEditingPlan(true); }} aria-label="Edit plan">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Paid:</span>
              {editingPaid ? (
                <div className="flex items-center gap-1">
                  <Input type="number" step="0.01" value={editPaid} onChange={(e) => setEditPaid(e.target.value)} className="h-6 w-20 text-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSavePaid} disabled={saving} aria-label="Save paid amount"><Check className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPaid(false)} aria-label="Cancel edit paid amount"><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{currLabel}{Math.round(enrollment.amount).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditPaid(String(enrollment.amount)); setEditingPaid(true); }} aria-label="Edit paid amount">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {groupName && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Group:</span>
                <span className="font-medium">{groupName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Remaining:</span>
              {editingRemaining ? (
                <div className="flex items-center gap-1">
                  <Input type="number" value={editRemaining} onChange={(e) => setEditRemaining(e.target.value)} className="h-6 w-16 text-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveRemaining} disabled={saving} aria-label="Save remaining sessions"><Check className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingRemaining(false)} aria-label="Cancel edit remaining sessions"><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{enrollment.sessions_remaining}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditRemaining(String(enrollment.sessions_remaining)); setEditingRemaining(true); }} aria-label="Edit remaining sessions">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Unit price:</span>
              {editingUnitPrice ? (
                <div className="flex items-center gap-1">
                  <Input type="number" step="0.01" value={editUnitPrice} onChange={(e) => setEditUnitPrice(e.target.value)} className="h-6 w-20 text-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveUnitPrice} disabled={saving} aria-label="Save unit price"><Check className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingUnitPrice(false)} aria-label="Cancel edit unit price"><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{currLabel}{Math.round(enrollment.unit_price).toLocaleString()}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditUnitPrice(String(enrollment.unit_price)); setEditingUnitPrice(true); }} aria-label="Edit unit price">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className={cn("p-3 pointer-events-auto w-full")}
          />
          <div className="flex gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Group</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary" /><span className="text-xs text-muted-foreground">Admin</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent" /><span className="text-xs text-muted-foreground">Student</span></div>
          </div>
        </div>

        {/* Add button */}
        <Button onClick={handleAddAttendance} disabled={adding || !selectedDate || isLocked} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {adding ? "Adding..." : selectedDate ? `Add attendance for ${format(selectedDate, "MMM d, yyyy")}` : "Select a date to add"}
        </Button>

        {/* Attendance Dates List — sorted oldest to newest */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet.</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              All Sessions ({records.length}) — oldest first
            </p>
            {records.map((r, idx) => (
              <div key={`${r.source}-${r.id}-${idx}`} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                  {editingDate === `${r.source}-${r.id}` ? (
                    <div className="flex items-center gap-1">
                      <Input type="date" value={editNewDate} onChange={(e) => setEditNewDate(e.target.value)} className="h-6 text-xs w-36" />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditDate(r.session_date)} disabled={saving} aria-label="Save date edit">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingDate(null)} aria-label="Cancel date edit">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {new Date(r.session_date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  )}
                  <Badge variant={sourceBadgeVariant(r.source)} className="text-[10px] px-1.5 py-0">
                    {r.source === "Group" ? "Group" : r.source === "Admin" ? "Admin" : "Self"}
                  </Badge>
                  {r.group_name && <span className="text-xs text-muted-foreground">{r.group_name}</span>}
                  {duplicates.includes(r.session_date) && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">DUP</Badge>
                  )}
                </div>
                {editingDate !== `${r.source}-${r.id}` && (
                  <div className="flex items-center gap-1">
                    {r.source === "Admin" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingDate(`${r.source}-${r.id}`); setEditNewDate(r.session_date); }} aria-label={`Edit session date ${r.session_date}`}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Delete session ${r.session_date}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove attendance?</AlertDialogTitle>
                          <AlertDialogDescription>Remove {r.session_date} ({r.source}) and restore 1 session.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveRecord(r)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(AdminAttendancePanel);
