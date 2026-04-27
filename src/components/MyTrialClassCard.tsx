import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CalendarPlus, Clock, Loader2, Clock3 } from "lucide-react";
import { buildGoogleCalendarUrl, formatTime12h } from "@/lib/calendarUrl";
import { convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

interface TrialBookingRow {
  id: string;
  trial_date: string;
  start_time: string;
  timezone: string | null;
  level: string | null;
  status: "pending" | "confirmed";
  is_tba: boolean | null;
}

const TRIAL_DURATION_MIN = 45;

function formatDate(d: string) {
  const date = new Date(d + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
}

const MyTrialClassCard = () => {
  const [booking, setBooking] = useState<TrialBookingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setLoading(false); return; }

      const { data } = await supabase
        .from("trial_bookings")
        .select("id, trial_date, start_time, timezone, level, status, is_tba")
        .eq("user_id", session.user.id)
        .in("status", ["pending", "confirmed"])
        .order("trial_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) setBooking(data as TrialBookingRow);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!booking) return null;

  // TBA placeholder — user is on waitlist, no confirmed date yet
  if (booking.is_tba) {
    return (
      <Card className="border-amber-300/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-500" />
            My Trial Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-base leading-tight">You're on the waitlist!</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  We're assigning you to the next available session. You'll receive an email with your confirmed date and class link within 24 hours.
                </p>
              </div>
              <Badge className="bg-amber-500 flex-shrink-0">Waitlist</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConfirmed = booking.status === "confirmed";
  const timezone = booking.timezone || "Africa/Cairo";
  const userTz = getUserTimezone();
  const local = convertDateTimeToTimezone(booking.trial_date, booking.start_time, timezone, userTz);
  const days = daysUntil(local.dateStr);

  const calendarUrl = buildGoogleCalendarUrl({
    title: "Free Korean Trial Class — Klovers Academy",
    date: booking.trial_date,
    time: booking.start_time,
    durationMin: TRIAL_DURATION_MIN,
    description: `Trial class with Klovers Academy.\nLevel: ${booking.level || "Beginner"}\nhttps://kloversegy.com`,
    timezone,
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          My Trial Class
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-lg">{formatDate(local.dateStr)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {local.timeFormatted} · {TRIAL_DURATION_MIN} min · {userTz.replace(/_/g, " ")}
              </p>
              <p className="text-[11px] text-muted-foreground/70">({formatDate(booking.trial_date)} {formatTime12h(booking.start_time)} {timezone.replace(/_/g, " ")})</p>

              {isConfirmed ? (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg shadow transition-all text-sm"
                  aria-label="Add trial class to Google Calendar"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to Google Calendar
                </a>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
                  Waiting for teacher confirmation. You'll get an email with a calendar link once it's approved.
                </p>
              )}
            </div>
            <Badge className={isConfirmed ? "bg-green-500" : "bg-amber-500"}>
              {isConfirmed
                ? (days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days}d`)
                : "Pending"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTrialClassCard;
