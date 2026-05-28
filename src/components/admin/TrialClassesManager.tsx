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
  date_selected: "bg-blue-100 text-blue-700",
  awaiting_attendance: "bg-purple-100 text-purple-800",
  confirmed_attendance: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  date_selected: "Date Selected",
  awaiting_attendance: "Awaiting Confirmation",
  confirmed_attendance: "Attendance Confirmed",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
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
  language?: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  changed_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  user_id?: string | null;
  rebook_email_sent_at?: string | null;
  is_tba?: boolean;
  attendance_confirmed_at?: string | null;
  confirmation_token?: string | null;
}

// Source of truth for unscheduled placeholders. Post-migration, TBA rows
// have start_time/trial_date=NULL; the DB trigger keeps is_tba in sync.
// Legacy sentinel checks remain defensive.
const isTbaBooking = (b: Pick<TrialBooking, "is_tba" | "start_time" | "trial_date">) =>
  b.is_tba === true ||
  !b.start_time || !b.trial_date ||
  b.start_time === "TBA" || b.trial_date === "2099-12-31";

const isMissingAuditColumn = (error: any) =>
  error?.code === "42703" || /changed_at|cancelled_at|cancel_reason/i.test(error?.message || "");

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  is_active: boolean;
  trial_date?: string | null;
  meeting_url?: string | null;
  class_language?: string | null;
}

type TimeFilter = "all" | "upcoming" | "past";
type StatusFilter = "all" | "pending" | "confirmed" | "no_show" | "cancelled";

interface UpcomingSlot {
  value: string; // "YYYY-MM-DD|dow|HH:mm"
  label: string;
  date: string;
  day_of_week: number;
  start_time: string;
  meeting_url?: string | null;
  class_language?: string | null;
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
        .select("day_of_week, start_time, is_active, trial_date, meeting_url, class_language")
        .eq("is_active", true);
      if (error) throw error;
      return (data as TrialSlot[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingBookings || loadingSlots;
  const upcomingSlots = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    return activeSlots
      .filter((s) => s.trial_date && s.trial_date >= todayStr)
      .sort((a, b) => (a.trial_date ?? "").localeCompare(b.trial_date ?? ""))
      .map((s) => {
        const d = new Date(s.trial_date + "T00:00:00");
        const dow = s.day_of_week;
        const [h, m] = s.start_time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        const label = `${DAY_NAMES[dow]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${h12}:${String(m).padStart(2, "0")} ${ampm}`;
        return {
          value: `${s.trial_date}|${dow}|${s.start_time}`,
          label,
          date: s.trial_date!,
          day_of_week: dow,
          start_time: s.start_time,
          meeting_url: s.meeting_url ?? null,
          class_language: s.class_language ?? null,
        };
      });
  }, [activeSlots]);

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";

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

      // Fetch meeting URL + class language for this specific session date
      const { data: slotRow } = await supabase
        .from("trial_slots")
        .select("meeting_url, class_language")
        .eq("trial_date", date)
        .eq("start_time", time)
        .maybeSingle();
      const meetingUrl = (slotRow as { meeting_url?: string | null; class_language?: string | null } | null)?.meeting_url ?? null;
      const slotLang = (slotRow as { class_language?: string | null } | null)?.class_language ?? booking.language ?? "en";
      // Normalise "arabic"→"ar", "english"→"en" for the email template
      const emailLang = slotLang === "arabic" ? "ar" : slotLang === "english" ? "en" : slotLang;

      // Send confirmation email with join link to the student
      const emailBody: Record<string, unknown> = {
        template: "trial_confirmed",
        email: booking.email,
        name: booking.name || booking.email,
        language: emailLang,
        trial_date: date,
        trial_time: time,
        trial_timezone: "Africa/Cairo",
        level: booking.level?.trim() || "",
      };
      if (meetingUrl) emailBody.class_link_url = meetingUrl;
      await supabase.functions.invoke("send-confirmation-email", { body: emailBody });

      toast({ title: "Confirmed & email sent", description: `${booking.name || booking.email} → ${date} at ${time}` });
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
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: "admin_reject",
        } as any)
        .eq("id", booking.id);
      if (error) {
        if (!isMissingAuditColumn(error)) throw error;
        const fallback = await supabase
          .from("trial_bookings")
          .update({ status: "cancelled" } as any)
          .eq("id", booking.id);
        if (fallback.error) throw fallback.error;
      }
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
          changed_at: new Date().toISOString(),
        } as any)
        .eq("id", booking.id);
      if (error) {
        if (!isMissingAuditColumn(error)) throw error;
        const fallback = await supabase
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
        if (fallback.error) throw fallback.error;
      }
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
      // Use active trial slots as the canonical slot list (not derived from bookings).
      const meetingUrl = activeSlots.find((s) => s.meeting_url)?.meeting_url ?? null;
      if (!meetingUrl) {
        toast({
          title: "No Google Meet link found for this class.",
          description: "Add it in the trial slot settings before sending.",
          variant: "destructive",
        });
      }
      // class_language on the booking is "arabic" | "english" (stored at booking time).
      // Normalise to the ISO code expected by the email template ("ar" / "en").
      const rawLang = booking.class_language ?? "en";
      const bookingLang = rawLang === "arabic" ? "ar" : rawLang === "english" ? "en" : rawLang;
      const langSlots = activeSlots.filter(
        (s) => s.trial_date && (!s.class_language || s.class_language === rawLang)
      );
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_rebook_request",
          email: booking.email,
          name: booking.name || booking.email,
          language: bookingLang,
          rebook_url: `${window.location.origin}/trial-booking`,
          class_link_url: meetingUrl,
          available_slots: langSlots.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            timezone: "Africa/Cairo",
            date: s.trial_date,
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
    // Use active trial slots as the canonical slot list (not derived from bookings).
    const bulkMeetingUrl = activeSlots.find((s) => s.meeting_url)?.meeting_url ?? null;
    if (!bulkMeetingUrl) {
      toast({
        title: "No Google Meet link found for this class.",
        description: "Add it in the trial slot settings before sending.",
        variant: "destructive",
      });
    }
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const b of tba) {
      try {
        const bRawLang = b.class_language ?? "en";
        const bLang = bRawLang === "arabic" ? "ar" : bRawLang === "english" ? "en" : bRawLang;
        const bSlots = activeSlots
          .filter((s) => s.trial_date && (!s.class_language || s.class_language === bRawLang))
          .map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            timezone: "Africa/Cairo",
            date: s.trial_date,
          }));
        const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "trial_rebook_request",
            email: b.email,
            name: b.name || b.email,
            language: bLang,
            rebook_url: `${window.location.origin}/trial-booking`,
            class_link_url: bulkMeetingUrl,
            available_slots: bSlots,
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
      // Cancelled bookings move to Unscheduled so admin can reschedule them.
      const key = (isTbaBooking(b) || b.status === "cancelled") ? TBA_KEY : `${b.trial_date}__${b.start_time}`;
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

  const sendResendConfirmation = async (booking: TrialBooking) => {
    setActioningId(booking.id);
    try {
      const { data: slotRow } = await supabase
        .from("trial_slots")
        .select("meeting_url, class_language")
        .eq("trial_date", booking.trial_date ?? "")
        .eq("start_time", booking.start_time ?? "")
        .maybeSingle();
      const meetingUrl = (slotRow as { meeting_url?: string | null; class_language?: string | null } | null)?.meeting_url ?? null;
      const resendLang = (slotRow as { class_language?: string | null } | null)?.class_language ?? booking.language ?? "en";
      const resendEmailLang = resendLang === "arabic" ? "ar" : resendLang === "english" ? "en" : resendLang;
      const { error: emailErr } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "trial_attendance_confirmation",
          email: booking.email,
          name: booking.name || booking.email,
          language: resendEmailLang,
          trial_date: booking.trial_date,
          trial_time: booking.start_time,
          class_link_url: meetingUrl,
          booking_id: booking.id,
          confirmation_token: booking.confirmation_token,
        },
      });
      if (emailErr) throw emailErr;
      toast({ title: "Confirmation resent", description: booking.email });
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading trial bookings...</p>;

  const formatSessionLabel = (date: string | null, time: string | null, dow: number, slotTz?: string | null) => {
    if (!date || !time || time === "TBA" || date === "2099-12-31") return "TBA — Unscheduled";
    const adminTz = getAdminTimezone();
    const srcTz = slotTz || "Asia/Kuala_Lumpur";
    const lcl = convertDateTimeToTimezone(date, time, srcTz, adminTz);
    const d = new Date(`${lcl.dateStr}T00:00:00`);
    const weekday = lcl.weekday || DAY_NAMES[dow] || d.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Also show the time in the browser's local timezone if it differs from adminTz
    const browserTz = typeof window !== "undefined"
      ? (Intl.DateTimeFormat().resolvedOptions().timeZone || "")
      : "";
    const showBrowser = browserTz && browserTz !== adminTz && browserTz !== srcTz;
    let browserSuffix = "";
    if (showBrowser) {
      const br = convertDateTimeToTimezone(date, time, srcTz, browserTz);
      const tzCity = browserTz.includes("/") ? browserTz.split("/").pop()!.replace(/_/g, " ") : browserTz;
      browserSuffix = ` · ${br.timeFormatted} (${tzCity})`;
    }

    return `${weekday}, ${dateLabel} — ${lcl.timeFormatted} (${adminTz})${browserSuffix}`;
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
          const slotMatch = !session.isTba && session.date && session.time
            ? activeSlots.find((s) => s.trial_date === session.date && s.start_time === session.time)
              ?? activeSlots.find((s) => s.start_time === session.time)
            : null;
          const sessionLanguage = slotMatch?.class_language ?? session.items[0]?.language ?? null;
          const tbaUnsentCount = isTbaSession ? session.items.length : 0;
          return (
            <Card key={session.key}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">
                      {formatSessionLabel(session.date, session.time, session.dow, session.items[0]?.timezone)}
                    </CardTitle>
                    {past && <Badge variant="outline" className="text-[10px]">past</Badge>}
                    {!isTbaSession && isLegacySlot(session.time) && (
                      <Badge variant="outline" className="text-[10px]">legacy slot</Badge>
                    )}
                    {sessionLanguage === "arabic" && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-100">Arabic</Badge>
                    )}
                    {sessionLanguage === "english" && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-100">English</Badge>
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
                            Resend with new dates ({tbaUnsentCount})
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
                        <TableHead>Changed</TableHead>
                        <TableHead>Cancelled</TableHead>
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
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                                {STATUS_LABELS[b.status] || (b.status || "unknown")}
                              </span>
                              {b.status === "confirmed_attendance" && b.attendance_confirmed_at && (
                                <span className="text-[10px] text-muted-foreground">
                                  Confirmed {new Date(b.attendance_confirmed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(b.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(b.changed_at)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div>{formatDateTime(b.cancelled_at)}</div>
                            {b.cancel_reason && (
                              <div className="text-[10px] text-muted-foreground/80">{b.cancel_reason.replace(/_/g, " ")}</div>
                            )}
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
                                  <div className="flex flex-col items-end gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id}
                                      onClick={() => sendRebookEmail(b)}
                                      title={b.rebook_email_sent_at ? "Resend with new dates" : "Invite student to choose a new trial date"}
                                    >
                                      <Mail className="h-3.5 w-3.5 mr-1" />
                                      Resend with new dates
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground">Invite students to choose a new trial date</span>
                                  </div>
                                </>
                              )}
                              {b.status === "awaiting_attendance" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  disabled={actioningId === b.id}
                                  onClick={() => sendResendConfirmation(b)}
                                  title="Resend attendance confirmation email"
                                >
                                  <Mail className="h-3.5 w-3.5 mr-1" />
                                  Resend confirmation
                                </Button>
                              )}
                              {b.status === "pending" && (
                                <>
                                  {(() => {
                                    const lang = b.language ?? null;
                                    const filtered = lang
                                      ? upcomingSlots.filter((s) => s.class_language === lang)
                                      : upcomingSlots;
                                    const slots = filtered.length ? filtered : upcomingSlots;
                                    const defaultVal = trialSlotMap[b.id] ?? slots[0]?.value ?? "";
                                    return (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Select
                                      value={defaultVal}
                                      onValueChange={(v) => setTrialSlotMap((prev) => ({ ...prev, [b.id]: v }))}
                                    >
                                      <SelectTrigger className="h-7 w-[185px] text-xs">
                                        <SelectValue placeholder="Pick class date" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {slots.map((s) => (
                                          <SelectItem key={s.value} value={s.value} className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                              <span className={`inline-block px-1 py-0.5 rounded text-[10px] font-medium leading-none ${s.class_language === "arabic" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                                                {s.class_language === "arabic" ? "AR" : "EN"}
                                              </span>
                                              {s.label}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7"
                                      disabled={actioningId === b.id || !slots.length}
                                      onClick={() => handleConfirm(b, defaultVal)}
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Confirm
                                    </Button>
                                  </div>
                                    );
                                  })()}
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
