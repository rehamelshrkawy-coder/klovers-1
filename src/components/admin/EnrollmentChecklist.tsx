import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2, XCircle, AlertTriangle, Info, Search, Download,
  RefreshCw, Loader2, Filter, ChevronRight, ShieldCheck, ShieldAlert, ShieldX,
  Pencil, Save, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchEnrollmentChecklists, type EnrollmentChecklist as ChecklistData, type ChecklistItem, type OverallState } from "@/lib/checklistEngine";
import { toast } from "@/hooks/use-toast";

// No hardcoded fallback — weekdays come exclusively from schedule_options (active only)
const COMMON_TIMEZONES = [
  "Africa/Cairo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Riyadh",
  "Asia/Kolkata", "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland",
];

/* ─── State badge helper ─── */
const STATE_CONFIG: Record<OverallState, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SUCCESS: { label: "Success", icon: <ShieldCheck className="h-3 w-3" />, variant: "default" },
  NEEDS_REVIEW: { label: "Review", icon: <ShieldAlert className="h-3 w-3" />, variant: "secondary" },
  BLOCKED: { label: "Blocked", icon: <ShieldX className="h-3 w-3" />, variant: "destructive" },
};

const statusIcon = (status: ChecklistItem["status"]) => {
  switch (status) {
    case "PASS": return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
    case "WARN": return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    case "BLOCKER": return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "INFO": return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
};

/* ─── Inline Editors ─── */
function PreferredDaysEditor({ enrollmentId, currentDays, currentTimezone, studentLevel, onSaved }: {
  enrollmentId: string; currentDays: string[]; currentTimezone: string; studentLevel?: string; onSaved: () => void;
}) {
  const [days, setDays] = useState<string[]>(currentDays);
  const [saving, setSaving] = useState(false);
  const [availableDays, setAvailableDays] = useState<{ day: string; time: string }[]>([]);

  useEffect(() => {
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const fetchDays = async () => {
      if (studentLevel) {
        const normalizedLevel = studentLevel.toLowerCase().replace(/\s+/g, "_");
        const { data } = await supabase
          .from("schedule_packages" as any)
          .select("day_of_week, start_time")
          .eq("level", normalizedLevel)
          .eq("is_active", true);
        const rows = (data as any[]) || [];
        if (rows.length > 0) {
          // Sort by day_of_week, deduplicate by day
          const seen = new Set<number>();
          const levelDays = rows
            .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
            .filter((r: any) => { if (seen.has(r.day_of_week)) return false; seen.add(r.day_of_week); return true; })
            .map((r: any) => ({ day: DAY_NAMES[r.day_of_week], time: r.start_time ? r.start_time.slice(0, 5) : "" }));
          setAvailableDays(levelDays);
          return;
        }
      }
      // Fallback: all active weekdays from schedule_options (only when no level provided)
      const { data } = await supabase
        .from("schedule_options" as any)
        .select("label, sort_order")
        .eq("category", "weekday")
        .eq("is_active", true)
        .order("sort_order");
      setAvailableDays(((data as any[]) ?? []).map((r: any) => ({ day: r.label, time: "" })));
    };
    fetchDays();
  }, [studentLevel]);

  const MAX_DAYS = 2;
  const toggle = (day: string) => setDays(prev => {
    if (prev.includes(day)) return prev.filter(d => d !== day);
    if (prev.length >= MAX_DAYS) return prev;
    return [...prev, day];
  });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("update_student_preferences" as any, {
      _enrollment_id: enrollmentId,
      _preferred_days: days,
      _timezone: currentTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Saved", description: "Preferred days updated." }); onSaved(); }
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs font-medium text-foreground">Select preferred days: <span className="text-muted-foreground font-normal">(max 2)</span></p>
      <div className="flex flex-wrap gap-1.5">
        {availableDays.map(({ day, time }) => (
          <button key={day} type="button" onClick={() => toggle(day)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ${
              days.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}>
            {day.slice(0, 3)}{time ? ` · ${time}` : ""}
          </button>
        ))}
        {availableDays.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No days configured for this level.</p>
        )}
      </div>
      <Button size="sm" onClick={save} disabled={saving || days.length === 0} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save Days
      </Button>
    </div>
  );
}

function TimezoneEditor({ enrollmentId, currentDays, currentTimezone, onSaved }: {
  enrollmentId: string; currentDays: string[]; currentTimezone: string; onSaved: () => void;
}) {
  const [tz, setTz] = useState(currentTimezone || "Africa/Cairo");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("update_student_preferences" as any, {
      _enrollment_id: enrollmentId,
      _preferred_days: currentDays || [],
      _timezone: tz,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Saved", description: `Timezone set to ${tz}.` }); onSaved(); }
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs font-medium text-foreground">Select timezone:</p>
      <Select value={tz} onValueChange={setTz}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {COMMON_TIMEZONES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save Timezone
      </Button>
    </div>
  );
}

function PaymentApprover({ enrollmentId, planType, onSaved }: { enrollmentId: string; planType: string; onSaved: () => void; }) {
  const [saving, setSaving] = useState(false);

  const approve = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ payment_status: "PAID", approval_status: "APPROVED", status: "APPROVED", reviewed_at: new Date().toISOString() } as any)
      .eq("id", enrollmentId);
    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Auto-assign to slot/group
    let assigned = false;
    try {
      const { data: slotId } = await supabase.rpc("match_enrollment_to_slot", { _enrollment_id: enrollmentId });
      if (slotId) {
        // Also assign to pkg group from the matched slot
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("user_id")
          .eq("id", enrollmentId)
          .single();
        if (enrollment) {
          await (supabase as any).rpc("assign_student_to_group_from_slot", {
            _slot_id: slotId,
            _user_id: enrollment.user_id,
            _enrollment_id: enrollmentId,
          });
        }
        assigned = true;
        toast({ title: "Approved & Assigned ✓", description: "Payment approved and student auto-assigned to a slot." });
      }
    } catch (e) {
      console.error("Auto-assign error:", e);
    }

    if (!assigned) {
      // Create admin notification reminder
      const { data: enrollData } = await supabase.from("enrollments").select("user_id, plan_type").eq("id", enrollmentId).single();
      await supabase.from("admin_notifications").insert({
        message: `Paid student (enrollment ${enrollmentId.slice(0, 8)}…) could not be auto-assigned to a slot. Please assign manually.`,
        type: "unassigned_paid_student",
        related_user_id: enrollData?.user_id || null,
      } as any);

      // Auto-send private reminder email for missing info
      if (planType === "private" && enrollData?.user_id) {
        supabase.functions.invoke("send-private-reminder", {
          body: { user_ids: [enrollData.user_id] },
        }).catch(err => console.error("Private reminder email error:", err));
      }

      toast({ title: "Approved", description: "Payment approved but no matching slot found. A reminder has been created." });
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs text-muted-foreground">This will mark the enrollment as PAID + APPROVED.</p>
      <Button size="sm" onClick={approve} disabled={saving} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} Approve Payment
      </Button>
    </div>
  );
}

function PaymentDateEditor({ enrollmentId, currentDate, onSaved }: { enrollmentId: string; currentDate: string | null; onSaved: () => void; }) {
  const [date, setDate] = useState(currentDate || new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ payment_date: date } as any)
      .eq("id", enrollmentId);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Saved", description: "Payment date updated." }); onSaved(); }
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs font-medium text-foreground">Set payment date:</p>
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs w-44" />
      <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save Date
      </Button>
    </div>
  );
}

function SlotAssigner({ enrollmentId, slots, onSaved }: { enrollmentId: string; slots: any[]; onSaved: () => void; }) {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const available = slots.filter(s => s.current_count < s.max_students);

  const assign = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    const { error } = await supabase.rpc("reassign_student_slot" as any, {
      _enrollment_id: enrollmentId,
      _new_slot_id: selectedSlot,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Assigned", description: "Slot assigned successfully." }); onSaved(); }
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs font-medium text-foreground">Assign to a slot:</p>
      <Select value={selectedSlot} onValueChange={setSelectedSlot}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select slot…" /></SelectTrigger>
        <SelectContent>
          {available.map(s => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.day} {s.time} ({s.course_level}) — {s.current_count}/{s.max_students}
            </SelectItem>
          ))}
          {available.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">No slots available</p>}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={assign} disabled={saving || !selectedSlot} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Assign Slot
      </Button>
    </div>
  );
}

function PaymentMethodEditor({ enrollmentId, currentMethod, onSaved }: { enrollmentId: string; currentMethod: string | null; onSaved: () => void; }) {
  const methods = ["vodafone_cash", "instapay", "bank_transfer", "stripe"];
  const [method, setMethod] = useState(currentMethod || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("enrollments")
      .update({ payment_method: method } as any)
      .eq("id", enrollmentId);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Saved", description: "Payment method updated." }); onSaved(); }
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
      <p className="text-xs font-medium text-foreground">Set payment method:</p>
      <Select value={method} onValueChange={setMethod}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select method…" /></SelectTrigger>
        <SelectContent>
          {methods.map(m => <SelectItem key={m} value={m} className="text-xs capitalize">{m.replace(/_/g, " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={save} disabled={saving || !method} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save Method
      </Button>
    </div>
  );
}

/* ─── Side panel for one student ─── */
function AdminNotesEditor({ enrollmentId, initialNotes }: { enrollmentId: string; initialNotes: string }) {
  const notesId = `enrollment-admin-notes-${enrollmentId}`;
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("enrollments").update({ admin_notes: notes.trim() } as any).eq("id", enrollmentId);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Notes saved" });
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={notesId}>Admin Notes</label>
      <textarea
        id={notesId}
        className="w-full text-xs border border-border rounded-md p-2 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        rows={2}
        placeholder="Internal notes (not visible to student)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button size="sm" variant="outline" onClick={save} disabled={saving} className="h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Save Notes
      </Button>
    </div>
  );
}

function CancelEnrollmentButton({ enrollmentId, onCancelled }: { enrollmentId: string; onCancelled: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    const { error } = await supabase.rpc("cancel_enrollment" as any, { _enrollment_id: enrollmentId });
    setCancelling(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setConfirming(false);
      return;
    }
    toast({ title: "Enrollment cancelled", description: "Credits deducted and student removed from groups." });
    setConfirming(false);
    onCancelled();
  };

  if (!confirming) {
    return (
      <Button size="sm" variant="destructive" onClick={() => setConfirming(true)} className="h-7 text-xs gap-1">
        <XCircle className="h-3 w-3" /> Cancel Enrollment
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
      <p className="text-xs text-destructive flex-1">This will deduct credits and remove from groups. Confirm?</p>
      <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancelling} className="h-7 text-xs">
        {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Cancel"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirming(false)} className="h-7 text-xs">No</Button>
    </div>
  );
}

function ChecklistPanel({ data, open, onClose, onRefresh, slots, setAdminTab }: {
  data: ChecklistData | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  slots: any[];
  setAdminTab?: (tab: string) => void;
}) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  if (!data) return null;
  const cfg = STATE_CONFIG[data.overall_state];

  const grouped = {
    blockers: data.items.filter(i => i.status === "BLOCKER"),
    warnings: data.items.filter(i => i.status === "WARN"),
    passed: data.items.filter(i => i.status === "PASS"),
    info: data.items.filter(i => i.status === "INFO"),
  };

  const toggleAction = (key: string) => setExpandedAction(prev => prev === key ? null : key);

  const handleSaved = () => {
    setExpandedAction(null);
    onRefresh();
  };

  const handlePaymentApproved = () => {
    setExpandedAction(null);
    onRefresh();
    if (data?.plan_type === "group" && setAdminTab) {
      setAdminTab("group-matcher");
    }
  };

  // Derive enrollment data from checklist for editors
  const currentDays = (() => {
    const item = data.items.find(i => i.key === "preferred_days");
    if (!item || item.status !== "PASS") return [];
    return item.details.split(", ").filter(Boolean);
  })();
  const currentTimezone = (() => {
    const item = data.items.find(i => i.key === "timezone");
    return item?.status === "PASS" ? item.details : "";
  })();
  const currentPaymentDate = (() => {
    const item = data.items.find(i => i.key === "payment_date");
    return item?.status === "PASS" ? item.details : null;
  })();
  const currentPaymentMethod = (() => {
    const item = data.items.find(i => i.key === "payment_method");
    return item?.status === "PASS" ? item.details : null;
  })();

  const renderEditor = (item: ChecklistItem) => {
    if (expandedAction !== item.key) return null;

    switch (item.action || item.key) {
      case "update_preferences":
        return <PreferredDaysEditor enrollmentId={data.enrollment_id} currentDays={currentDays} currentTimezone={currentTimezone} studentLevel={data.level} onSaved={handleSaved} />;
      case "fix_timezone":
        return <TimezoneEditor enrollmentId={data.enrollment_id} currentDays={currentDays} currentTimezone={currentTimezone} onSaved={handleSaved} />;
      case "approve_payment":
        return <PaymentApprover enrollmentId={data.enrollment_id} planType={data.plan_type} onSaved={handlePaymentApproved} />;
      case "assign_slot":
        return <SlotAssigner enrollmentId={data.enrollment_id} slots={slots} onSaved={handleSaved} />;
      default:
        if (item.key === "payment_date") return <PaymentDateEditor enrollmentId={data.enrollment_id} currentDate={currentPaymentDate} onSaved={handleSaved} />;
        if (item.key === "payment_method") return <PaymentMethodEditor enrollmentId={data.enrollment_id} currentMethod={currentPaymentMethod} onSaved={handleSaved} />;
        if (item.key === "timezone") return <TimezoneEditor enrollmentId={data.enrollment_id} currentDays={currentDays} currentTimezone={currentTimezone} onSaved={handleSaved} />;
        if (item.key === "preferred_days" || item.key === "preference_exists") return <PreferredDaysEditor enrollmentId={data.enrollment_id} currentDays={currentDays} currentTimezone={currentTimezone} studentLevel={data.level} onSaved={handleSaved} />;
        if (item.key === "slot_assigned") return <SlotAssigner enrollmentId={data.enrollment_id} slots={slots} onSaved={handleSaved} />;
        return null;
    }
  };

  const isEditable = (item: ChecklistItem) => {
    if (item.status === "PASS") return false;
    const editableKeys = ["preferred_days", "preference_exists", "timezone", "payment_approved", "payment_date", "payment_method", "slot_assigned", "confirmation_email", "group_assigned"];
    return editableKeys.includes(item.key) || !!item.action;
  };

  const getActionLabel = (item: ChecklistItem) => {
    if (item.action === "approve_payment") return "Approve";
    if (item.action === "send_email") return "Send Email";
    if (item.key === "payment_date") return "Set Date";
    if (item.key === "payment_method") return "Set Method";
    return "Edit";
  };

  const renderItems = (items: ChecklistItem[]) => (
    <div className="space-y-1">
      {items.map(item => (
        <div key={item.key}>
          <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
            {statusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.details}</p>
            </div>
            {isEditable(item) && (
              <Button size="sm" variant={expandedAction === item.key ? "secondary" : "outline"} className="h-7 text-xs shrink-0 gap-1"
                onClick={() => toggleAction(item.key)}>
                {expandedAction === item.key ? <><X className="h-3 w-3" /> Close</> : <><Pencil className="h-3 w-3" /> {getActionLabel(item)}</>}
              </Button>
            )}
          </div>
          {renderEditor(item)}
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { setExpandedAction(null); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Student Checklist
            <Badge variant={cfg.variant} className="text-xs gap-1">{cfg.icon} {cfg.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">{data.student_name}</p>
          <p className="text-xs text-muted-foreground">{data.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] capitalize">{data.plan_type}</Badge>
            {data.level && <Badge variant="outline" className="text-[10px]">{data.level}</Badge>}
          </div>
        </div>

        {/* Admin Notes + Cancel */}
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <AdminNotesEditor enrollmentId={data.enrollment_id} initialNotes={(data as any).admin_notes || ""} />
          {data.overall_state !== "SUCCESS" && (
            <CancelEnrollmentButton enrollmentId={data.enrollment_id} onCancelled={() => { onClose(); onRefresh(); }} />
          )}
        </div>

        <div className="mt-6 space-y-5">
          {grouped.blockers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-destructive uppercase mb-2 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Blockers ({grouped.blockers.length})
              </h4>
              {renderItems(grouped.blockers)}
            </div>
          )}
          {grouped.warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-600 uppercase mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Warnings ({grouped.warnings.length})
              </h4>
              {renderItems(grouped.warnings)}
            </div>
          )}
          {grouped.passed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Passed ({grouped.passed.length})
              </h4>
              {renderItems(grouped.passed)}
            </div>
          )}
          {grouped.info.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Info ({grouped.info.length})
              </h4>
              {renderItems(grouped.info)}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Checklist badge for table rows ─── */
export function ChecklistBadge({ data, onClick }: { data: ChecklistData; onClick: () => void }) {
  const cfg = STATE_CONFIG[data.overall_state];
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
      <Badge variant={cfg.variant} className="text-[10px] gap-1 px-2 py-0.5">
        {cfg.icon} {cfg.label}
      </Badge>
      {(data.blockers_count > 0 || data.warnings_count > 0) && (
        <span className="text-[10px] text-muted-foreground">
          {data.blockers_count > 0 && <span className="text-destructive">{data.blockers_count}B</span>}
          {data.blockers_count > 0 && data.warnings_count > 0 && " "}
          {data.warnings_count > 0 && <span className="text-yellow-600">{data.warnings_count}W</span>}
        </span>
      )}
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

/* ─── Main component ─── */
function EnrollmentChecklistManager({ onAction, setAdminTab }: {
  onAction: (enrollmentId: string, action: string) => void;
  setAdminTab?: (tab: string) => void;
}) {
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<OverallState | "ALL">("ALL");
  const [missingFilter, setMissingFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, slotsRes] = await Promise.all([
        fetchEnrollmentChecklists(),
        supabase.from("matching_slots").select("*").order("course_level").order("day"),
      ]);
      setChecklists(data);
      setSlots(slotsRes.data || []);
    } catch (err: any) {
      toast({ title: "Error loading checklists", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = checklists;
    const q = search.toLowerCase();
    if (q) list = list.filter(c => c.student_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    if (stateFilter !== "ALL") list = list.filter(c => c.overall_state === stateFilter);
    if (missingFilter !== "all") {
      list = list.filter(c => c.items.some(i => i.key === missingFilter && i.status !== "PASS"));
    }
    return list;
  }, [checklists, search, stateFilter, missingFilter]);

  const counts = useMemo(() => ({
    total: checklists.length,
    blocked: checklists.filter(c => c.overall_state === "BLOCKED").length,
    review: checklists.filter(c => c.overall_state === "NEEDS_REVIEW").length,
    success: checklists.filter(c => c.overall_state === "SUCCESS").length,
  }), [checklists]);

  const exportCSV = () => {
    const rows = filtered.map(c => ({
      Name: c.student_name,
      Email: c.email,
      Plan: c.plan_type,
      Level: c.level,
      State: c.overall_state,
      Blockers: c.blockers_count,
      Warnings: c.warnings_count,
      "Blocker Details": c.items.filter(i => i.status === "BLOCKER").map(i => i.label).join("; "),
      "Warning Details": c.items.filter(i => i.status === "WARN").map(i => i.label).join("; "),
    }));
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String((r as any)[k]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enrollment-checklist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = selectedId ? checklists.find(c => c.enrollment_id === selectedId) || null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading checklists…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: counts.total, color: "text-foreground" },
          { label: "Blocked", count: counts.blocked, color: "text-destructive" },
          { label: "Review", count: counts.review, color: "text-yellow-600" },
          { label: "Success", count: counts.success, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 text-xs pl-7 w-44" />
        </div>
        <Select value={stateFilter} onValueChange={v => setStateFilter(v as any)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <Filter className="h-3 w-3 mr-1" /> <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All States</SelectItem>
            <SelectItem value="BLOCKED">Blocked only</SelectItem>
            <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missingFilter} onValueChange={setMissingFilter}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Missing…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="receipt_uploaded">Missing Receipt</SelectItem>
            <SelectItem value="preferred_days">Missing Preferences</SelectItem>
            <SelectItem value="slot_assigned">Missing Slot</SelectItem>
            <SelectItem value="confirmation_email">Email Not Sent</SelectItem>
            <SelectItem value="no_duplicate_profiles">Duplicates</SelectItem>
            <SelectItem value="timezone">Missing Timezone</SelectItem>
            <SelectItem value="payment_approved">Payment Not Approved</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No enrollments match filters.</p>
        )}
        {filtered.map(c => {
          const cfg = STATE_CONFIG[c.overall_state];
          return (
            <Card key={c.enrollment_id} className={`cursor-pointer hover:border-primary/40 transition-colors ${
              c.overall_state === "BLOCKED" ? "border-destructive/30" : c.overall_state === "NEEDS_REVIEW" ? "border-yellow-500/30" : ""
            }`} onClick={() => setSelectedId(c.enrollment_id)}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{c.student_name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{c.plan_type}</Badge>
                    {c.level && <Badge variant="outline" className="text-[10px] shrink-0">{c.level}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.blockers_count > 0 && (
                    <span className="text-xs text-destructive font-medium">{c.blockers_count} blocker{c.blockers_count > 1 ? "s" : ""}</span>
                  )}
                  {c.warnings_count > 0 && (
                    <span className="text-xs text-yellow-600 font-medium">{c.warnings_count} warning{c.warnings_count > 1 ? "s" : ""}</span>
                  )}
                  <Badge variant={cfg.variant} className="text-[10px] gap-1">{cfg.icon} {cfg.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Side panel */}
      <ChecklistPanel data={selected} open={!!selectedId} onClose={() => setSelectedId(null)} onRefresh={load} slots={slots} setAdminTab={setAdminTab} />
    </div>
  );
}

export default memo(EnrollmentChecklistManager);
