import React, { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { getLeadStatusBadgeClass } from "@/lib/badge-styles";
import { exportCSV as exportCSVUtil, ADMIN_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin-utils";
import { TRIAL_CONFIRMATION_EMAIL_ENABLED } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Download, Trash2, Check, X, AlertCircle, ChevronLeft, ChevronRight,
  Pencil, Mail, Eraser, Sparkles, Copy, Clock, CalendarCheck, XCircle,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLeads } from "@/hooks/admin/useLeads";
import { useStudentOverview, buildOverviewByEmail } from "@/hooks/admin/useStudentOverview";
import { useScheduleWeekdays } from "@/hooks/admin/useScheduleWeekdays";
import type { Lead } from "@/types/admin";

const STATUS_OPTIONS = ["new", "trial_booked", "contacted", "enrolled", "rejected", "lost"];

const LeadsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: overviewRows = [] } = useStudentOverview();
  const overviewByEmail = useMemo(() => buildOverviewByEmail(overviewRows), [overviewRows]);
  const { data: leads = [], isLoading: leadsLoading, error: leadsQueryError } = useLeads({ overviewByEmail });
  const { data: scheduleWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] } = useScheduleWeekdays();

  const leadsError = leadsQueryError?.message ?? null;

  // ── Local UI state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("confirmed");
  const [planFilter, setPlanFilter] = useState("all");
  const [leadsSort, setLeadsSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "created_at", dir: "desc" });
  const [leadsPage, setLeadsPage] = useState(0);
  const [quickStatusLeadId, setQuickStatusLeadId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [contactedLeadIds, setContactedLeadIds] = useState<Set<string>>(new Set());
  const [leadsSourceFilter, setLeadsSourceFilter] = useState("");
  const [sendingNameEmails, setSendingNameEmails] = useState(false);
  const [recoveryKpi, setRecoveryKpi] = useState<{
    total_sent: number; leads_emailed: number; leads_opened: number; leads_clicked: number;
    leads_converted: number; open_rate_pct: number; click_rate_pct: number; recovery_rate_pct: number;
  } | null>(null);
  const [recoveryTracker, setRecoveryTracker] = useState<Array<{
    lead_id: string; name: string | null; email: string; plan_type: string | null;
    emails_sent: number; last_stage_sent: number | null;
    last_sent_at: string | null; last_opened_at: string | null;
    last_clicked_at: string | null; converted_at: string | null; unsubscribed: boolean;
  }>>([]);
  const [showRecoveryTracker, setShowRecoveryTracker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [kpiRes, trackerRes] = await Promise.all([
        (supabase as any)
          .from("checkout_recovery_kpi")
          .select("total_sent, leads_emailed, leads_opened, leads_clicked, leads_converted, open_rate_pct, click_rate_pct, recovery_rate_pct")
          .maybeSingle(),
        (supabase as any)
          .from("checkout_recovery_tracker")
          .select("lead_id, name, email, plan_type, emails_sent, last_stage_sent, last_sent_at, last_opened_at, last_clicked_at, converted_at, unsubscribed")
          .order("last_sent_at", { ascending: false })
          .limit(100),
      ]);
      if (!cancelled && !kpiRes.error && kpiRes.data) setRecoveryKpi(kpiRes.data);
      if (!cancelled && !trackerRes.error && trackerRes.data) setRecoveryTracker(trackerRes.data);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateLeadViaFn = useCallback(async (id: string, fields: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-update-lead", {
      body: { id, ...fields },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await updateLeadViaFn(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update status.", variant: "destructive" });
    }
  }, [updateLeadViaFn, queryClient]);

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); }
    else { queryClient.invalidateQueries({ queryKey: ["admin", "leads"] }); toast({ title: "Deleted" }); }
  }, [queryClient]);

  const handleDeduplicateLeads = useCallback(async () => {
    const emailMap: Record<string, typeof leads> = {};
    for (const l of leads) {
      const key = (l.email || "").toLowerCase().trim();
      if (!emailMap[key]) emailMap[key] = [];
      emailMap[key].push(l);
    }
    const dupeIds: string[] = [];
    for (const [, group] of Object.entries(emailMap)) {
      if (group.length <= 1) continue;
      for (let i = 1; i < group.length; i++) {
        dupeIds.push(group[i].id);
      }
    }
    if (dupeIds.length === 0) {
      toast({ title: "No duplicates", description: "All leads are unique." });
      return;
    }
    const { error } = await supabase.from("leads").delete().in("id", dupeIds);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast({ title: "Duplicates removed", description: `Deleted ${dupeIds.length} duplicate lead(s).` });
    }
  }, [leads, queryClient]);

  const handleEditLead = useCallback(async () => {
    if (!editingLeadId) return;
    try {
      await updateLeadViaFn(editingLeadId, {
        name: editForm.name,
        email: editForm.email,
        country: editForm.country || "",
        plan_type: editForm.plan_type || "",
        duration: editForm.duration || "",
        schedule: editForm.schedule || "",
        timezone: editForm.timezone || "",
        status: editForm.status || "new",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      setEditingLeadId(null);
      setEditForm({});
      toast({ title: "Lead updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update lead.", variant: "destructive" });
    }
  }, [editingLeadId, editForm, updateLeadViaFn, queryClient]);

  const startEditLead = useCallback((lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditForm({ ...lead });
  }, []);

  const cancelEditLead = useCallback(() => {
    setEditingLeadId(null);
    setEditForm({});
  }, []);

  const handleSendNameCollectionEmails = useCallback(async () => {
    setSendingNameEmails(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-name-collection-email");
      if (error) throw error;
      toast({ title: "Done!", description: `Name request emails sent: ${data?.sent ?? 0} · Skipped: ${data?.skipped ?? 0}` });
    } catch (err: any) {
      toast({ title: "Error sending name emails", description: err.message, variant: "destructive" });
    } finally {
      setSendingNameEmails(false);
    }
  }, []);

  const handleLinkLeadsByEmail = useCallback(async () => {
    const unlinked = leads.filter(l => !l.user_id);
    if (unlinked.length === 0) {
      toast({ title: "All leads already linked" });
      return;
    }
    let linked = 0;
    const { data: profiles } = await supabase.from("profiles").select("user_id, email");
    if (!profiles) return;
    const profileByEmail: Record<string, string> = {};
    for (const p of (profiles ?? []) as { user_id: string; email: string }[]) {
      if (p.email) profileByEmail[p.email.toLowerCase().trim()] = p.user_id;
    }
    for (const lead of unlinked) {
      const userId = profileByEmail[(lead.email || "").toLowerCase().trim()];
      if (userId) {
        try {
          await updateLeadViaFn(lead.id, { user_id: userId });
          // Enrich empty profile fields from lead data
          if (lead.country || lead.level) {
            const { data: prof } = await supabase.from("profiles").select("country, level").eq("user_id", userId).single();
            if (prof) {
              const updates: Record<string, string> = {};
              if (lead.country && (!prof.country || prof.country === "")) updates.country = lead.country;
              if (lead.level && (!prof.level || prof.level === "")) updates.level = lead.level;
              if (Object.keys(updates).length > 0) {
                await supabase.from("profiles").update(updates).eq("user_id", userId);
              }
            }
          }
          linked++;
        } catch { /* skip */ }
      }
    }
    toast({ title: `Linked ${linked} lead(s)`, description: `${unlinked.length - linked} remain unlinked.` });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }, [leads, updateLeadViaFn, queryClient]);

  // ── Trial approve / reject ────────────────────────────────────────────────

  const [approvingTrialId, setApprovingTrialId] = useState<string | null>(null);

  const handleApproveTrial = useCallback(async (lead: Lead) => {
    setApprovingTrialId(lead.id);
    try {
      // 1. Confirm trial_booking
      const { error: tbErr } = await supabase
        .from("trial_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() } as any)
        .eq("email", lead.email.toLowerCase())
        .eq("status", "pending");
      if (tbErr) console.error("trial_bookings update error:", tbErr.message);

      // 2. Update lead status
      await updateLeadViaFn(lead.id, { status: "confirmed" });

      // 3. Fetch booking details for the email
      const { data: booking } = await supabase
        .from("trial_bookings")
        .select("trial_date, start_time, timezone, day_of_week")
        .eq("email", lead.email.toLowerCase())
        .eq("status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (booking) {
        const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = DAY_NAMES[booking.day_of_week] || "";
        const [h, m] = (booking.start_time || "18:00").split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const time12 = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
        const tz = booking.timezone || "Africa/Cairo";

        // Build calendar URL
        const dateClean = (booking.trial_date || "").replace(/-/g, "");
        const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
        const endH = h + Math.floor((m + 45) / 60);
        const endM = (m + 45) % 60;
        const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
        const calParams = new URLSearchParams({ action: "TEMPLATE", text: "Free Korean Trial Class — Klovers Academy", dates: `${start}/${end}`, details: `Level: ${lead.level || "Beginner"}`, ctz: tz });
        const calendarUrl = `https://calendar.google.com/calendar/render?${calParams.toString()}`;

        const trialDateFormatted = new Date(booking.trial_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        // 4. Send confirmation email — gated by feature flag
        if (TRIAL_CONFIRMATION_EMAIL_ENABLED) {
          await supabase.functions.invoke("send-confirmation-email", {
            body: {
              template: "trial_confirmed",
              email: lead.email,
              name: lead.name || lead.email,
              level: lead.level,
              trial_date: trialDateFormatted,
              trial_time: time12,
              trial_timezone: tz,
              calendar_url: calendarUrl,
              language: "ar",
            },
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast({ title: "Trial approved", description: TRIAL_CONFIRMATION_EMAIL_ENABLED ? `${lead.name} has been notified via email.` : `${lead.name} approved (email disabled).` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setApprovingTrialId(null);
    }
  }, [updateLeadViaFn, queryClient]);

  const handleRejectTrial = useCallback(async (lead: Lead) => {
    try {
      await supabase
        .from("trial_bookings")
        .update({ status: "cancelled" } as any)
        .eq("email", lead.email.toLowerCase())
        .in("status", ["pending", "confirmed"]);
      await updateLeadViaFn(lead.id, { status: "rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast({ title: "Trial rejected", description: `${lead.name}'s trial has been cancelled.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [updateLeadViaFn, queryClient]);

  // ── Computed values ───────────────────────────────────────────────────────

  const confirmedEmails = useMemo(() => {
    const emails = new Set<string>();
    overviewRows.forEach((r) => {
      if (r.payment_status === "PAID" && r.approval_status === "APPROVED" && r.email) {
        emails.add(r.email.toLowerCase());
      }
    });
    return emails;
  }, [overviewRows]);

  const uniqueSources = useMemo(() =>
    [...new Set(leads.map(l => l.source).filter(Boolean))] as string[],
    [leads]
  );

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = !search || (l.name || "").toLowerCase().includes(search.toLowerCase()) || (l.email || "").toLowerCase().includes(search.toLowerCase());
      const isConfirmed = l.status === "enrolled" || confirmedEmails.has((l.email || "").toLowerCase());
      const matchesPlan = planFilter === "all" || l.plan_type === planFilter;
      const matchesSource = !leadsSourceFilter || l.source === leadsSourceFilter;
      if (statusFilter === "confirmed") return matchesSearch && isConfirmed && matchesPlan && matchesSource;
      if (statusFilter === "all") return matchesSearch && matchesPlan && matchesSource;
      return matchesSearch && l.status === statusFilter && matchesPlan && matchesSource;
    });
  }, [leads, search, statusFilter, planFilter, confirmedEmails, leadsSourceFilter]);

  const statusCounts = useMemo(() =>
    leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>),
    [leads]
  );

  const sortedLeads = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (leadsSort.col === "name") {
        const cmp = (a.name || "").localeCompare(b.name || "");
        return leadsSort.dir === "asc" ? cmp : -cmp;
      }
      if (leadsSort.col === "country") {
        const cmp = (a.country || "").localeCompare(b.country || "");
        return leadsSort.dir === "asc" ? cmp : -cmp;
      }
      // default: created_at
      const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return leadsSort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, leadsSort]);

  const leadsPageCount = Math.ceil(sortedLeads.length / PAGE_SIZE);
  const pagedLeads = sortedLeads.slice(leadsPage * PAGE_SIZE, (leadsPage + 1) * PAGE_SIZE);

  const exportCSV = useCallback(() => {
    const headers = ["Name", "Email", "Country", "Level", "Plan", "Duration", "Schedule", "Timezone", "Source", "Status", "Goal", "Date"];
    const rows = sortedLeads.map((l) => [l.name, l.email, l.country, l.level, l.plan_type, l.duration, l.schedule, l.timezone, l.source, l.status, l.goal, new Date(l.created_at).toLocaleDateString()]);
    exportCSVUtil(headers, rows, "leads");
  }, [sortedLeads]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Our Students</CardTitle>
          <p className="text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setLeadsPage(0); }} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setLeadsPage(0); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed (Paid) ({confirmedEmails.size})</SelectItem>
              <SelectItem value="all">All ({leads.length})</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s} ({statusCounts[s] ?? 0})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setLeadsPage(0); }}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Plan type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          {uniqueSources.length > 0 && (
            <Select value={leadsSourceFilter || "__all__"} onValueChange={(v) => { setLeadsSourceFilter(v === "__all__" ? "" : v); setLeadsPage(0); }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All sources</SelectItem>
                {uniqueSources.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleDeduplicateLeads}>
            <Eraser className="h-4 w-4" />
            {!isMobile && <span className="ml-1">Deduplicate</span>}
          </Button>
          <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleLinkLeadsByEmail}>
            <Sparkles className="h-4 w-4" />
            {!isMobile && <span className="ml-1">Link All</span>}
          </Button>
          <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleSendNameCollectionEmails} disabled={sendingNameEmails}>
            <Mail className="h-4 w-4" />
            {!isMobile && <span className="ml-1">{sendingNameEmails ? "Sending\u2026" : "Request Names"}</span>}
          </Button>
          <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={exportCSV}>
            <Download className="h-4 w-4" />
            {!isMobile && <span className="ml-1">Export CSV</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">

        {/* Abandoned Checkout Recovery — KPI + tracker */}
        {recoveryKpi && recoveryKpi.total_sent > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Abandoned Checkout Recovery</span>
              <span className="text-xs text-muted-foreground ml-1">— automated email sequence</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 px-2 text-xs"
                onClick={() => setShowRecoveryTracker(v => !v)}
              >
                {showRecoveryTracker ? "Hide details" : "View details"}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sent</p>
                <p className="text-lg font-bold">{recoveryKpi.total_sent}</p>
              </div>
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Opened</p>
                <p className="text-lg font-bold">{recoveryKpi.leads_opened}</p>
                <p className="text-[10px] text-muted-foreground">{recoveryKpi.open_rate_pct}%</p>
              </div>
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Clicked</p>
                <p className="text-lg font-bold">{recoveryKpi.leads_clicked}</p>
                <p className="text-[10px] text-muted-foreground">{recoveryKpi.click_rate_pct}%</p>
              </div>
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Booked</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{recoveryKpi.leads_converted}</p>
              </div>
              <div className="bg-background border border-border rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recovery</p>
                <p className="text-lg font-bold">{recoveryKpi.recovery_rate_pct}%</p>
              </div>
            </div>

            {showRecoveryTracker && recoveryTracker.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Lead</th>
                        <th className="px-3 py-2 font-medium">Plan</th>
                        <th className="px-3 py-2 font-medium text-center">Stage</th>
                        <th className="px-3 py-2 font-medium text-center">Sent</th>
                        <th className="px-3 py-2 font-medium text-center">Opened</th>
                        <th className="px-3 py-2 font-medium text-center">Clicked</th>
                        <th className="px-3 py-2 font-medium text-center">Booked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recoveryTracker.map(row => {
                        const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
                        const Dot = ({ on, colorClass }: { on: boolean; colorClass: string }) =>
                          on ? <span className={`inline-block w-2 h-2 rounded-full ${colorClass}`} /> : <span className="text-muted-foreground">—</span>;
                        return (
                          <tr key={row.lead_id} className="border-t border-border">
                            <td className="px-3 py-2">
                              <div className="font-medium truncate max-w-[160px]">{row.name || "—"}</div>
                              <div className="text-muted-foreground truncate max-w-[160px]">{row.email}</div>
                            </td>
                            <td className="px-3 py-2 capitalize text-muted-foreground">{row.plan_type || "—"}</td>
                            <td className="px-3 py-2 text-center">{row.last_stage_sent ?? "—"}</td>
                            <td className="px-3 py-2 text-center" title={row.last_sent_at || ""}>{fmt(row.last_sent_at)}</td>
                            <td className="px-3 py-2 text-center" title={row.last_opened_at || ""}>
                              {row.last_opened_at ? <span className="text-blue-600 dark:text-blue-400">{fmt(row.last_opened_at)}</span> : <Dot on={false} colorClass="" />}
                            </td>
                            <td className="px-3 py-2 text-center" title={row.last_clicked_at || ""}>
                              {row.last_clicked_at ? <span className="text-purple-600 dark:text-purple-400">{fmt(row.last_clicked_at)}</span> : <Dot on={false} colorClass="" />}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {row.converted_at
                                ? <span className="text-green-600 dark:text-green-400 font-semibold">✓ {fmt(row.converted_at)}</span>
                                : <Dot on={false} colorClass="" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Abandoned Checkouts — reached step 4 but didn't pay */}
        {(() => {
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const abandoned = leads.filter(l =>
            l.plan_type &&
            l.user_id &&
            !confirmedEmails.has((l.email || "").toLowerCase()) &&
            l.status !== "enrolled" &&
            new Date(l.created_at) > cutoff
          ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
          if (abandoned.length === 0) return null;
          return (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{abandoned.length} Abandoned Checkout{abandoned.length > 1 ? "s" : ""}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">— reached checkout but didn't pay</span>
              </div>
              <div className="space-y-2">
                {abandoned.map(l => {
                  const hoursAgo = Math.round((Date.now() - new Date(l.created_at).getTime()) / 3600000);
                  const timeLabel = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;
                  const waMsg = encodeURIComponent(`Hi ${(l.name || "").split(" ")[0]}! \u{1F44B} We noticed you were almost done enrolling in Klovers Korean. Your spot is still available \u2014 would you like to complete your ${l.plan_type} class enrollment? \u{1F1F0}\u{1F1F7}`);
                  const waLink = `https://wa.me/?text=${waMsg}`;
                  return (
                    <div key={l.id} className="flex items-center justify-between bg-white dark:bg-background border border-amber-100 dark:border-amber-900/40 rounded-lg px-3 py-2 gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                        <span className="capitalize">{l.plan_type} · {l.duration}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeLabel}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className={`h-7 px-2 text-xs ${contactedLeadIds.has(l.id) && copiedLeadId !== l.id ? "border-green-400 text-green-700 dark:text-green-400" : ""}`}
                          onClick={() => {
                            navigator.clipboard.writeText(`Hi ${(l.name || "").split(" ")[0]}! \u{1F44B} We noticed you were almost done enrolling. Your spot is still available \u2014 complete your ${l.plan_type} class enrollment: https://kloversegy.com/enroll-now`);
                            toast({ title: "Copied!", description: "Follow-up message copied to clipboard" });
                            setContactedLeadIds(prev => new Set(prev).add(l.id));
                            setCopiedLeadId(l.id);
                            setTimeout(() => setCopiedLeadId(id => id === l.id ? null : id), 1500);
                          }}>
                          {copiedLeadId === l.id
                            ? <><Check className="h-3 w-3 mr-1 text-green-600" />Copied!</>
                            : contactedLeadIds.has(l.id)
                              ? <><Check className="h-3 w-3 mr-1 text-green-600" />Sent ✓</>
                              : <><Copy className="h-3 w-3 mr-1" />Copy</>}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                          <a href={`mailto:${l.email}?subject=Your Korean class spot is waiting!&body=Hi ${(l.name || "").split(" ")[0]},%0A%0AWe noticed you were almost done enrolling in Klovers Korean. Your spot is still available!%0A%0AComplete your enrollment: https://kloversegy.com/enroll-now%0A%0ABest,%0AKlovers Team`} target="_blank" rel="noreferrer">
                            <Mail className="h-3 w-3 mr-1" />Email
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Lead Conversion Summary */}
        {leads.length > 0 && (() => {
          const sourceMap: Record<string, { total: number; converted: number }> = {};
          leads.forEach(l => {
            const src = l.source || "unknown";
            if (!sourceMap[src]) sourceMap[src] = { total: 0, converted: 0 };
            sourceMap[src].total++;
            if (l.user_id || l.status === "enrolled") sourceMap[src].converted++;
          });
          const totalNew = leads.filter(l => l.status === "new").length;
          const staleNew = leads.filter(l => l.status === "new" && new Date(l.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length;
          const funnelNew = leads.filter(l => l.status === "new").length;
          const funnelContacted = leads.filter(l => l.status === "contacted").length;
          const funnelEnrolled = leads.filter(l => l.status === "enrolled" || confirmedEmails.has(l.email?.toLowerCase())).length;
          const funnelMax = Math.max(funnelNew, 1);
          return (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              {/* Source pills */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(sourceMap).sort((a, b) => b[1].total - a[1].total).slice(0, 6).map(([src, { total, converted }]) => (
                  <span key={src} className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-background border border-border rounded-full px-2.5 py-1">
                    <span className="text-foreground capitalize">{src}</span>
                    <span className="text-muted-foreground">{total}</span>
                    <span className="text-green-600 font-bold">{total > 0 ? Math.round((converted / total) * 100) : 0}%</span>
                  </span>
                ))}
              </div>
              {/* Follow-up alert */}
              {staleNew > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span><strong>{staleNew}</strong> new lead{staleNew > 1 ? "s" : ""} older than 3 days with no follow-up</span>
                </div>
              )}
              {/* Mini funnel */}
              <div className="flex items-center gap-3 text-xs">
                {[
                  { label: "New", count: funnelNew, color: "bg-blue-500" },
                  { label: "Contacted", count: funnelContacted, color: "bg-amber-500" },
                  { label: "Enrolled", count: funnelEnrolled, color: "bg-green-500" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round((count / leads.length) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {leadsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Query Error</AlertTitle>
            <AlertDescription>{leadsError}</AlertDescription>
          </Alert>
        )}

        {leadsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24 hidden md:block" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && !leadsError ? (
          <p className="text-muted-foreground text-center py-12">No leads found.</p>
        ) : !leadsError ? (
          <div className="border rounded-xl max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                  <TableHead
                    className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-primary"
                    onClick={() => setLeadsSort(s => ({ col: "name", dir: s.col === "name" && s.dir === "asc" ? "desc" : "asc" }))}
                  >Name {leadsSort.col === "name" ? (leadsSort.dir === "asc" ? "\u2191" : "\u2193") : "\u2195"}</TableHead>
                  <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                  <TableHead
                    className="py-3 px-3 hidden md:table-cell font-semibold cursor-pointer select-none hover:text-primary"
                    onClick={() => setLeadsSort(s => ({ col: "country", dir: s.col === "country" && s.dir === "asc" ? "desc" : "asc" }))}
                  >Country {leadsSort.col === "country" ? (leadsSort.dir === "asc" ? "\u2191" : "\u2193") : "\u2195"}</TableHead>
                  <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Plan</TableHead>
                  <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Duration</TableHead>
                  <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Schedule</TableHead>
                  <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Goal</TableHead>
                  <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                  <TableHead className="py-3 px-3 hidden sm:table-cell font-semibold">Linked</TableHead>
                  <TableHead
                    className="py-3 px-3 hidden sm:table-cell font-semibold cursor-pointer select-none hover:text-primary"
                    onClick={() => setLeadsSort(s => ({ col: "created_at", dir: s.col === "created_at" && s.dir === "asc" ? "desc" : "asc" }))}
                  >Date {leadsSort.col === "created_at" ? (leadsSort.dir === "asc" ? "\u2191" : "\u2193") : "\u2195"}</TableHead>
                  <TableHead className="py-3 px-3 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLeads.map((lead) => (
                  <TableRow key={lead.id} className="group odd:bg-muted/30 hover:bg-muted/50 transition">
                    <TableCell className="py-3 px-3 font-medium">
                      {editingLeadId === lead.id ? (
                        <Input value={editForm.name || ""} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" />
                      ) : lead.name}
                    </TableCell>
                    <TableCell className="py-3 px-3">
                      {editingLeadId === lead.id ? (
                        <Input value={editForm.email || ""} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm" />
                      ) : (
                        <div className="flex items-center gap-1 max-w-[220px]">
                          <span className="truncate flex-1 text-sm">{lead.email}</span>
                          <button
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lead.email); toast({ title: "Copied" }); setCopiedLeadId(lead.id + "_email"); setTimeout(() => setCopiedLeadId(id => id === lead.id + "_email" ? null : id), 1500); }}
                            aria-label="Copy email address"
                          >
                            {copiedLeadId === lead.id + "_email" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">
                      {editingLeadId === lead.id ? (
                        <Input value={editForm.country || ""} onChange={(e) => setEditForm(f => ({ ...f, country: e.target.value }))} className="h-8 text-sm" />
                      ) : lead.country || "\u2014"}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden md:table-cell">
                      {editingLeadId === lead.id ? (
                        <Select value={editForm.plan_type || ""} onValueChange={(v) => setEditForm(f => ({ ...f, plan_type: v }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="group">group</SelectItem>
                            <SelectItem value="private">private</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : lead.plan_type ? <Badge variant={lead.plan_type === "private" ? "default" : "secondary"} className="text-xs capitalize">{lead.plan_type}</Badge> : "\u2014"}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">
                      {editingLeadId === lead.id ? (
                        <Input value={editForm.duration || ""} onChange={(e) => setEditForm(f => ({ ...f, duration: e.target.value }))} className="h-8 text-sm w-20" />
                      ) : lead.duration || "\u2014"}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {editingLeadId === lead.id ? (
                        <div className="flex flex-wrap gap-1 min-w-[160px]">
                          {scheduleWeekdays.map((day) => {
                            const currentDays = (editForm.schedule || "").split("/").map(s => s.trim()).filter(Boolean);
                            const selected = currentDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const days = (editForm.schedule || "").split("/").map(s => s.trim()).filter(Boolean);
                                  const next = selected ? days.filter(d => d !== day) : [...days, day];
                                  setEditForm(f => ({ ...f, schedule: next.join("/") }));
                                }}
                                className={`px-2 py-0.5 rounded text-xs border transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      ) : lead.schedule || "\u2014"}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                      {lead.goal || "\u2014"}
                    </TableCell>
                    <TableCell className="py-3 px-3">
                      {editingLeadId === lead.id ? (
                        <Select value={editForm.status || "new"} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger className="h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : quickStatusLeadId === lead.id ? (
                        <Select
                          value={lead.status}
                          onValueChange={async (v) => {
                            await handleStatusChange(lead.id, v);
                            setQuickStatusLeadId(null);
                          }}
                          open
                          onOpenChange={(open) => { if (!open) setQuickStatusLeadId(null); }}
                        >
                          <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={`text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getLeadStatusBadgeClass(lead.status)}`}
                          onClick={() => setQuickStatusLeadId(lead.id)}
                          title="Click to change status"
                          aria-label={`Lead status: ${lead.status}. Click to change.`}
                        >
                          {lead.status === "trial_booked" ? "\u{1F381} Trial Booked" : lead.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden sm:table-cell">
                      {lead.user_id ? (
                        <Badge variant="default" className="text-xs">Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {editingLeadId === lead.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditLead} aria-label="Save lead edit">
                              <Check className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditLead} aria-label="Cancel lead edit">
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {lead.status === "trial_booked" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleApproveTrial(lead)}
                                  disabled={approvingTrialId === lead.id}
                                  aria-label="Approve trial"
                                  title="Approve trial & send confirmation email"
                                >
                                  <CalendarCheck className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRejectTrial(lead)}
                                  aria-label="Reject trial"
                                  title="Reject trial"
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditLead(lead)} aria-label="Edit lead">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete lead"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete lead?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete {lead.name}'s record.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(lead.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leadsPageCount > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Page {leadsPage + 1} of {leadsPageCount} · {sortedLeads.length} leads
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={leadsPage === 0} onClick={() => setLeadsPage(p => p - 1)} aria-label="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={leadsPage >= leadsPageCount - 1} onClick={() => setLeadsPage(p => p + 1)} aria-label="Next page">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default React.memo(LeadsPanel);
