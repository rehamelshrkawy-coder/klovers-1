import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Mail, RefreshCw, Users, XCircle } from "lucide-react";
import { formatTime } from "@/lib/admin-utils";
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
  start_time: string;
  trial_date: string;
  timezone: string;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  user_id?: string | null;
  rebook_email_sent_at?: string | null;
}

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  is_active: boolean;
}

type TimeFilter = "all" | "upcoming" | "past";
type StatusFilter = "all" | "pending" | "confirmed" | "no_show" | "cancelled";

const TrialClassesManager = () => {
  const [bookings, setBookings] = useState<TrialBooking[]>([]);
  const [activeSlots, setActiveSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchData = async () => {
    setLoading(true);
    // Source of truth: trial_bookings. No date or status filter — show everything.
    const [bookingsRes, slotsRes] = await Promise.all([
      supabase
        .from("trial_bookings")
        .select("*")
        .order("trial_date", { ascending: false })
        .order("start_time", { ascending: true }),
      supabase
        .from("trial_slots")
        .select("day_of_week, start_time, is_active")
        .eq("is_active", true),
    ]);
    if (bookingsRes.error) {
      toast({ title: "Error loading bookings", description: bookingsRes.error.message, variant: "destructive" });
    }
    setBookings((bookingsRes.data as TrialBooking[] | null) || []);
    setActiveSlots((slotsRes.data as TrialSlot[] | null) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirm = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() } as any)
        .eq("id", booking.id);
      if (error) throw error;
      toast({ title: "Confirmed", description: booking.name || booking.email });
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

  const sendRebookEmail = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_rebook_request",
          email: booking.email,
          name: booking.name || booking.email,
          language: "ar",
          rebook_url: `${window.location.origin}/free-trial`,
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
    const tba = bookings.filter((b) => b.start_time === "TBA" && !b.rebook_email_sent_at);
    if (tba.length === 0) {
      toast({ title: "Nothing to send", description: "Every TBA booking already has a rebook email logged." });
      return;
    }
    if (!confirm(`Send rebook email to ${tba.length} unscheduled student${tba.length === 1 ? "" : "s"}?`)) return;
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
            rebook_url: `${window.location.origin}/free-trial`,
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
    if (!confirm(`Mark ${pending.length} pending booking${pending.length === 1 ? "" : "s"} as confirmed? No emails will be sent.`)) {
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
        const d = new Date(`${b.trial_date}T00:00:00`);
        if (timeFilter === "upcoming" && d < startOfToday) return false;
        if (timeFilter === "past" && d >= startOfToday) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, timeFilter, startOfToday]);

  // ── Group by exact session (trial_date + start_time). Capacity is NOT enforced
  // in display — all bookings for a session are shown.
  const sessions = useMemo(() => {
    const groups: Record<string, TrialBooking[]> = {};
    filtered.forEach((b) => {
      const key = `${b.trial_date}__${b.start_time}`;
      (groups[key] ||= []).push(b);
    });
    return Object.entries(groups)
      .map(([key, items]) => {
        const [date, time] = key.split("__");
        return { key, date, time, items, dow: items[0]?.day_of_week ?? 0 };
      })
      // Most recent first (future dates before past dates; within same date, later times first)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [filtered]);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading trial bookings...</p>;

  const formatSessionLabel = (date: string, time: string, dow: number) => {
    // Sentinel date+time used for rows that need to be rescheduled
    if (time === "TBA" || date === "2099-12-31") return "TBA — Unscheduled";
    const d = new Date(`${date}T00:00:00`);
    const weekday = DAY_NAMES[dow] || d.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${weekday}, ${dateLabel} — ${formatTime(time)}`;
  };

  const isLegacySlot = (time: string) => !activeSlots.some((s) => s.start_time === time);

  const isPastSession = (date: string) => new Date(`${date}T00:00:00`) < startOfToday;

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
          <Button
            size="sm"
            variant="default"
            disabled={bulkBusy || pendingCount === 0}
            onClick={handleAcceptAllPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept all pending ({pendingCount})
          </Button>
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
          const isTbaSession = session.time === "TBA";
          const tbaUnsentCount = isTbaSession ? session.items.filter((i) => !i.rebook_email_sent_at).length : 0;
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
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7"
                        disabled={bulkBusy || tbaUnsentCount === 0}
                        onClick={handleSendRebookToAllTBA}
                        title={tbaUnsentCount === 0 ? "All students already emailed" : `Email ${tbaUnsentCount} unscheduled student${tbaUnsentCount === 1 ? "" : "s"}`}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Send rebook email ({tbaUnsentCount})
                      </Button>
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
                                b.rebook_email_sent_at ? (
                                  <Badge variant="secondary" className="text-[10px]" title={`Sent ${new Date(b.rebook_email_sent_at).toLocaleString()}`}>
                                    email sent {Math.max(0, Math.floor((Date.now() - new Date(b.rebook_email_sent_at).getTime()) / 86400000))}d ago
                                  </Badge>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => sendRebookEmail(b)} title="Email student to pick a slot">
                                    <Mail className="h-3.5 w-3.5 mr-1" /> Email
                                  </Button>
                                )
                              )}
                              {b.status === "pending" ? (
                                <>
                                  <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleConfirm(b)}>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7" disabled={actioningId === b.id} onClick={() => handleReject(b)}>
                                    <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Reject
                                  </Button>
                                </>
                              ) : (!isTbaSession && <span className="text-xs text-muted-foreground">—</span>)}
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
