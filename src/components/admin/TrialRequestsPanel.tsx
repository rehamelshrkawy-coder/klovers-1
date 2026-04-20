import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Check, X, RefreshCw, CalendarPlus, Loader2 } from "lucide-react";
import { TRIAL_CONFIRMATION_EMAIL_ENABLED } from "@/lib/siteConfig";

interface TrialBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  goal: string | null;
  day_of_week: number | null;
  start_time: string | null;
  trial_date: string | null;
  timezone: string | null;
  status: string;
  user_id: string | null;
  created_at: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function buildCalendarUrl(params: {
  title: string; date: string; time: string; durationMin: number; description: string; timezone: string;
}): string {
  const { title, date, time, durationMin, description, timezone } = params;
  const [h, m_] = time.split(":").map(Number);
  const dateClean = date.replace(/-/g, "");
  const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m_).padStart(2, "0")}00`;
  const endH = h + Math.floor((m_ + durationMin) / 60);
  const endM = (m_ + durationMin) % 60;
  const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
  const p = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${end}`, details: description, ctz: timezone });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  no_show: "bg-gray-100 text-gray-800 border-gray-300",
  converted: "bg-blue-100 text-blue-800 border-blue-300",
  new: "bg-orange-100 text-orange-800 border-orange-300",
};

const TrialRequestsPanel = () => {
  const [bookings, setBookings] = useState<TrialBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trial_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Failed to fetch trial bookings:", error);
      toast({ title: "Error", description: "Failed to load trial bookings", variant: "destructive" });
    } else {
      setBookings((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleApprove = async (booking: TrialBooking) => {
    setActionLoading(booking.id);
    try {
      // Update status to confirmed
      const { error: updateError } = await supabase
        .from("trial_bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);
      if (updateError) throw updateError;

      // Build calendar URL for the email
      const calendarUrl = booking.trial_date && booking.start_time
        ? buildCalendarUrl({
            title: "Free Korean Trial Class â Klovers Academy",
            date: booking.trial_date,
            time: booking.start_time,
            durationMin: 45,
            description: `Trial class with Klovers Academy.\nLevel: ${booking.level || "Beginner"}\nhttps://kloversegy.com`,
            timezone: booking.timezone || "Africa/Cairo",
          })
        : "";

      // Send confirmation email
      const trialDateFormatted = booking.trial_date
        ? new Date(booking.trial_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : "";

      if (TRIAL_CONFIRMATION_EMAIL_ENABLED) {
        await supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "trial_confirmed",
            email: booking.email,
            name: booking.name,
            trial_date: trialDateFormatted,
            trial_time: booking.start_time ? formatTime12h(booking.start_time) : "",
            trial_timezone: booking.timezone || "Africa/Cairo",
            level: booking.level || "Beginner",
            calendar_url: calendarUrl,
          },
        });
      }

      toast({ title: "Approved", description: TRIAL_CONFIRMATION_EMAIL_ENABLED ? `Trial confirmed for ${booking.name}. Confirmation email sent.` : `Trial confirmed for ${booking.name} (email disabled).` });
      fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to approve", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (booking: TrialBooking) => {
    setActionLoading(booking.id);
    try {
      const { error } = await supabase
        .from("trial_bookings")
        .update({ status: "rejected" })
        .eq("id", booking.id);
      if (error) throw error;
      toast({ title: "Rejected", description: `Trial booking for ${booking.name} rejected.` });
      fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reject", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Trial Class Requests</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 text-xs">
                {pendingCount} pending
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No trial bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Day & Time</TableHead>
                  <TableHead>Trial Date</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => {
                  const dayTime = b.day_of_week != null && b.start_time
                    ? `${DAY_NAMES[b.day_of_week]} ${formatTime12h(b.start_time)}`
                    : "â";
                  const trialDate = b.trial_date
                    ? new Date(b.trial_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "â";
                  const bookedAt = new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

                  return (
                    <TableRow key={b.id} className={b.status === "pending" ? "bg-yellow-50/50" : ""}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.email}</TableCell>
                      <TableCell className="text-sm">{b.phone || "â"}</TableCell>
                      <TableCell className="font-medium">{dayTime}</TableCell>
                      <TableCell>{trialDate}</TableCell>
                      <TableCell className="text-sm">{b.level || "â"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[b.status] || "bg-gray-100 text-gray-700"}`}>
                          {b.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{bookedAt}</TableCell>
                      <TableCell className="text-right">
                        {b.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-green-700 border-green-300 hover:bg-green-50"
                              disabled={actionLoading === b.id}
                              onClick={() => handleApprove(b)}
                            >
                              {actionLoading === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-red-700 border-red-300 hover:bg-red-50"
                              disabled={actionLoading === b.id}
                              onClick={() => handleReject(b)}
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {b.status === "confirmed" && b.trial_date && b.start_time && (
                          <a
                            href={buildCalendarUrl({
                              title: `Trial: ${b.name}`,
                              date: b.trial_date,
                              time: b.start_time,
                              durationMin: 45,
                              description: `Trial class with ${b.name} (${b.email})`,
                              timezone: b.timezone || "Africa/Cairo",
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <CalendarPlus className="h-3 w-3" /> Calendar
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialRequestsPanel;
