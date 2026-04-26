import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Mail, RefreshCw, Users, XCircle } from "lucide-react";
import { formatTime, convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";
import { getLevelShortLabel } from "@/constants/levels";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

interface TrialBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  goal: string | null;
  day_of_week: number;
  start_time: string | null;
  trial_date: string | null;
  timezone: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  user_id?: string | null;
  rebook_email_sent_at?: string | null;
  is_tba?: boolean;
}

// Source of truth for unscheduled placeholders. Post-migration, TBA rows
// have start_time/trial_date=NULL; the DB trigger keeps is_tba in sync.
// Legacy sentinel checks remain defensive.
const isTbaBooking = (b: Pick<TrialBooking, "is_tba" | "start_time" | "trial_date">) =>
  b.is_tba === true ||
  !b.start_time || !b.trial_date ||
  b.start_time === "TBA" || b.trial_date === "2099-12-31";

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  is_active: boolean;
}

type TimeFilter = "all" | "upcoming" | "past";
type StatusFilter = "all" | "pending" | "confirmed" | "no_show" | "cancelled";

interface UpcomingSlot {
  value: string; // "YYYY-MM-DD|dow|HH:mm"
  label: string;
  date: string;
  day_of_week: number;
  start_time: string;
}

function getActualUpcomingGroups(bookings: TrialBooking[]): UpcomingSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const seen = new Set<string>();
  const results: UpcomingSlot[] = [];
  for (const b of bookings) {
    if (!b.trial_date || !b.start_time || b.is_tba || b.start_time === "TBA") continue;
    if (b.trial_date < todayStr || b.status === "cancelled") continue;
    const key = `${b.trial_date}|${b.day_of_week}|${b.start_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const d = new Date(b.trial_date + "T00:00:00");
    const dow = b.day_of_week ?? d.getDay();
    const [h, m] = b.start_time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const label = `${DAY_NAMES[dow]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    results.push({ value: key, label, date: b.trial_date, day_of_week: dow, start_time: b.start_time });
  }
  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}

const TrialClassesManager = () => {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [trialSlotMap, setTrialSlotMap] = useState<Record<string, string>>({});

  const { data: bookings = [], isLoading: loadingBookings } = useQuery<TrialBooking[]>({
    queryKey: ["admin", "trial-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_bookings")
        .select("*")
        .order("trial_date", { ascending: false })
        .order("start_time", { ascending: true });
      if (error) {
        toast({ title: "Error loading bookings", description: error.message, variant: "destructive" });
        throw error;
      }
      return (data as TrialBooking[] | null) ?? [];
    },
    staleTime: 60 * 1000,
  });

  const { data: activeSlots = [], isLoading: loadingSlots } = useQuery<TrialSlot[]>({
    queryKey: ["admin", "trial-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_slots")
        .select("day_of_week, start_time, is_active")
        .eq("is_active", true);
      if (error) throw error;
      return (data as TrialSlot[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingBookings || loadingSlots;
  const upcomingSlots = useMemo(() => getActualUpcomingGroups(bookings), [bookings]);

  const fetchData = () => {
    // Invalidate trials-related caches so both the local table and the
    // dashboard's pending-count badge refresh from the same source.
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-slots"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "trial-stats"] });
    // Clear stale slot selections so re-confirms always use fresh upcoming slots.
    setTrialSlotMap({});
  };

  const handleConfirm = async (booking: TrialBooking, slotValue: string) => {
    const [date, dowStr, time] = slotValue.split("|");
    setActioningId(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          trial_date: date,
          day_of_week: Number(dowStr),
          start_time: time,
          is_tba: false,
        } as any)
        .eq("id", booking.id);
      if (error) throw error;
      toast({ title: "Confirmed", description: `${booking.name || booking.email} → ${date} at ${time}` });
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
      const { error } = await supabase
        .from("trial_bookings")
        .update({ status: "cancelled" } as any)
        .eq("id", booking.id);
      if (error) throw error;
      toast({ title: "Cancelled", description: booking.name || booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleUnschedule = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({
          start_time: "TBA",
          trial_date: "2099-12-31",
          day_of_week: 0,
          status: "pending",
          is_tba: true,
          confirmed_at: null,
          rebook_email_sent_at: null,
        } as any)
        .eq("id", booking.id);
      if (error) throw error;
      toast({ title: "Moved to TBA", description: booking.name || booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const sendRebookEmail = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_rebook_request",
          email: booking.email,
          name: booking.name || booking.email,
          language: "ar",
          rebook_url: `${window.location.origin}/trial-booking`,
          available_slots: upcomingSlots.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            timezone: "Africa/Cairo",
            date: s.date,
          })),
        },
      });
      if (emailErr) throw emailErr;
      // Best-effort timestamp write — column is added by a pending migration
      // and may not exist on this env yet. Silently skip on missing-column.
      const { error: updErr } = await supabase
        .from("trial_bookings")
        .update({ rebook_email_sent_at: new Date().toISOString() } as any)
        .eq("id", booking.id);
      if (updErr && updErr.code !== "42703" && !/rebook_email_sent_at/i.test(updErr.message || "")) {
        console.warn("rebook timestamp update failed:", updErr);
      }
      toast({ title: "Rebook email sent", description: booking.email });
      fetchData();
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const handleSendRebookToAllTBA = async () => {
    const tba = bookings.filter(isTbaBooking);
    if (tba.length === 0) {
      toast({ title: "Nothing to send", description: "No unscheduled (TBA) bookings right now." });
      return;
    }
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const b of tba) {
      try {
        const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "trial_rebook_request",
            email: b.email,
            name: b.name || b.email,
            language: "ar",
            rebook_url: `${window.location.origin}/trial-booking`,
            available_slots: upcomingSlots.map((s) => ({
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              timezone: "Africa/Cairo",
              date: s.date,
            })),
          },
        });
        if (emailErr) throw emailErr;
        const { error: updErr } = await supabase.from("trial_bookings").update({ rebook_email_sent_at: new Date().toISOString() } as any).eq("id", b.id);
        if (updErr && updErr.code !== "42703" && !/rebook_email_sent_at/i.test(updErr.message || "")) {
          console.warn("rebook timestamp update failed:", updErr);
        }
        ok++;
      } catch {
        fail++;
      }
    }
    toast({ title: "Rebook emails", description: `${ok} sent${fail ? `, ${fail} failed` : ""}.` });
    fetchData();
    setBulkBusy(false);
  };

  const handleAcceptAllPending = async () => {
    const pending = bookings.filter((b) => b.status === "pending");
    if (pending.length === 0) {
      toast({ title: "Nothing to accept", description: "No pending bookings." });
      return;
    }
    setBulkBusy(true);
    try {
      const ids = pending.map((p) => p.id);
      const { error } = await supabase
        .from("trial_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() } as any)
        .in("id", ids);
      if (error) throw error;
      toast({ title: "All pending accepted", description: `${ids.length} booking${ids.length === 1 ? "" : "s"} marked confirmed.` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Bulk accept failed", description: err.message, variant: "destructive" });
    } finally {
      setBulkBusy(false);
    }
  };

  // ── Repeat detection (same email appearing more than once)
  const emailCounts = useMemo(() => {
    const m: Record<string, number> = {};
    bookings.forEach((b) => {
      const k = (b.email || "").toLowerCase();
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [bookings]);
  const isRepeat = (b: TrialBooking) => (emailCounts[(b.email || "").toLowerCase()] || 0) > 1;

  // ── Filter
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (timeFilter !== "all") {
        // TBA rows have no date; exclude from upcoming/past filters.
        if (!b.trial_date || isTbaBooking(b)) return false;
        const d = new Date(`${b.trial_date}T00:00:00`);
        if (timeFilter === "upcoming" && d < startOfToday) return false;
        if (timeFilter === "past" && d >= startOfToday) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, timeFilter, startOfToday]);

  // ── Group by exact session (trial_date + start_time). TBA rows fold into a
  // single synthetic session so admins see one "Unscheduled" card.
  const TBA_KEY = "__tba__";
  const sessions = useMemo(() => {
    const groups: Record<string, TrialBooking[]> = {};
    filtered.forEach((b) => {
      const key = isTbaBooking(b) ? TBA_KEY : `${b.trial_date}__${b.start_time}`;
      (groups[key] ||= []).push(b);
    });
    return Object.entries(groups)
      .map(([key, items]) => {
        if (key === TBA_KEY) {
          return { key, date: null, time: null, items, dow: items[0]?.day_of_week ?? 0, isTba: true };
        }
        const [date, time] = key.split("__");
        return { key, date, time, items, dow: items[0]?.day_of_week ?? 0, isTba: false };
      })
      // TBA pinned on top; real sessions sorted most-recent first.
      .sort((a, b) => {
        if (a.isTba) return -1;
        if (b.isTba) return 1;
        return (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || "");
      });
  }, [filtered]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading trial bookings...</p>;

  const formatSessionLabel = (date: string | null, time: string | null, dow: number) => {
    // NULL (or legacy sentinel) → unscheduled placeholder.
    if (!date || !time || time === "TBA" || date === "2099-12-31") return "TBA — Unscheduled";
    const adminTz = getAdminTimezone();
    const lcl = convertDateTimeToTimezone(date, time, "Africa/Cairo", adminTz);
    const d = new Date(`${lcl.dateStr}T00:00:00`);
    const weekday = lcl.weekday || DAY_NAMES[dow] || d.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${weekday}, ${dateLabel} — ${lcl.timeFormatted} (${adminTz})`;
  };

  const isLegacySlot = (time: string | null) => !!time && !activeSlots.some((s) => s.start_time === time);

  const isPastSession = (date: string | null) => !!date && new Date(`${date}T00:00:00`) < startOfToday;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">
            All Trial Bookings
            <span className="ml-2 text-xs text-muted-foreground font-normal">({bookings.length} total · {pendingCount} pending)</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="upcoming">Upcoming only</SelectItem>
              <SelectItem value="past">Past only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending only</SelectItem>
              <SelectItem value="confirmed">Confirmed only</SelectItem>
              <SelectItem value="no_show">No-show only</SelectItem>
              <SelectItem value="cancelled">Cancelled only</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="default"
                disabled={bulkBusy || pendingCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept all pending ({pendingCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accept all pending bookings?</AlertDialogTitle>
                <AlertDialogDescription>
                  Mark {pendingCount} pending booking{pendingCount === 1 ? "" : "s"} as confirmed. No emails will be sent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAcceptAllPending}>Confirm {pendingCount}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No trial bookings match the current filters.</p>
      ) : (
        sessions.map((session) => {
          const active = session.items.filter((i) => i.status !== "cancelled" && i.status !== "no_show").length;
          const confirmed = session.items.filter((i) => i.status === "confirmed").length;
          const past = isPastSession(session.date);
          const isTbaSession = session.isTba;
          const tbaUnsentCount = isTbaSession ? session.items.length : 0;
          return (
            <Card key={session.key}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">
                      {formatSessionLabel(session.date, session.time, session.dow)}
                    </CardTitle>
                    {past && <Badge variant="outline" className="text-[10px]">past</Badge>}
                    {!isTbaSession && isLegacySlot(session.time) && (
                      <Badge variant="outline" className="text-[10px]">legacy slot</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {session.items.length} booked
                    </span>
                    <span>{confirmed} confirmed · {active} active</span>
                    {isTbaSession && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7"
                            disabled={bulkBusy || tbaUnsentCount === 0}
                            title={tbaUnsentCount === 0 ? "No unscheduled students" : `Email ${tbaUnsentCount} unscheduled student${tbaUnsentCount === 1 ? "" : "s"}`}
                          >
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Send rebook email ({tbaUnsentCount})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Send rebook email to {tbaUnsentCount} student{tbaUnsentCount === 1 ? "" : "s"}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              An Arabic rebook email with active slot options will be sent to each unscheduled student in this TBA session.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSendRebookToAllTBA}>Send {tbaUnsentCount}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
                            <div className="flex items-center gap-1 flex-wrap">
                              <span>{b.name || "—"}</span>
                              {isRepeat(b) && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">repeat</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{b.email || "—"}</TableCell>
                          <TableCell className="text-xs">{b.phone || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {b.level ? (getLevelShortLabel(b.level) || b.level) : "—"}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                              {(b.status || "unknown").replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(b.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={b.goal || ""}>
                            {b.goal || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end items-center flex-wrap">
                              {isTbaSession && (
                                <>
                                  {b.rebook_email_sent_at && (
                                    <Badge variant="secondary" className="text-[10px]" title={`Sent ${new Date(b.rebook_email_sent_at).toLocaleString()}`}>
                                      email sent {Math.max(0, Math.floor((Date.now() - new Date(b.rebook_email_sent_at).getTime()) / 86400000))}d ago
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7"
                                    disabled={actioningId === b.id}
                                    onClick={() => sendRebookEmail(b)}
                                    title={b.rebook_email_sent_at ? "Resend rebook email" : "Email student to pick a slot"}
                                  >
                                    <Mail className="h-3.5 w-3.5 mr-1" />
                                    {b.rebook_email_sent_at ? "Resend" : "Email"}
                                  </Button>
                                </>
                              )}
                              {b.status === "pending" && (
                                <>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Select
                                      value={trialSlotMap[b.id] ?? upcomingSlots[0]?.value ?? ""}
                                      onValueChange={(v) => setTrialSlotMap((prev) => ({ ...prev, [b.id]: v }))}
                                    >
                                      <SelectTrigger className="h-7 w-[160px] text-xs">
                                        <SelectValue placeholder="Pick class date" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {upcomingSlots.map((s) => (
                                          <SelectItem key={s.value} value={s.value} className="text-xs">
                                            {s.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id || !upcomingSlots.length}
                                      onClick={() => handleConfirm(b, trialSlotMap[b.id] ?? upcomingSlots[0]?.value ?? "")}
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Confirm
                                    </Button>
                                  </div>
                                  <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleReject(b)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Reject
                                  </Button>
                                </>
                              )}
                              {!isTbaSession && b.status !== "cancelled" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id}
                                      title="Move student back to the TBA (unscheduled) list"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Unschedule
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Move {b.name || b.email} back to TBA?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        The booking returns to the unscheduled list and its confirmation is cleared. The student can rebook via the link in their rebook email.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleUnschedule(b)}>Unschedule</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {!isTbaSession && b.status === "cancelled" && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default TrialClassesManager;
