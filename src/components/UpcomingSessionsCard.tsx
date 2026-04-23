import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Loader2, Video } from "lucide-react";

interface UpcomingSession {
  session_id: string;
  session_date: string;
  group_name: string;
  start_time: string;
  duration_min: number;
  timezone: string;
  level: string;
  attendance_status: string | null;
}

import { formatTime, convertDateTimeToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

function tzOffsetMs(date: Date, tz: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).reduce((a, x) => { a[x.type] = x.value; return a; }, {} as Record<string, string>);
  const h = p.hour === "24" ? 0 : +p.hour;
  return Date.UTC(+p.year, +p.month - 1, +p.day, h, +p.minute, +p.second) - date.getTime();
}

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
  const diff = Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
  return diff;
}

/** Returns true if the class is within the window (10 min before → end). Works across timezones. */
function isClassActive(sessionDate: string, startTime: string, durationMin: number, sourceTz: string): boolean {
  const [y, mo, d] = sessionDate.split("-").map(Number);
  const [h, mi] = startTime.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const startMs = guess - tzOffsetMs(new Date(guess), sourceTz);
  const openMs = startMs - 10 * 60 * 1000;
  const closeMs = startMs + durationMin * 60 * 1000;
  const nowMs = Date.now();
  return nowMs >= openMs && nowMs <= closeMs;
}

const UpcomingSessionsCard = () => {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [sessRes, zoomRes] = await Promise.all([
        (supabase as any).rpc("get_student_upcoming_sessions", { p_user_id: session.user.id }),
        (supabase as any).from("app_settings").select("value").eq("key", "zoom_meeting_url").maybeSingle(),
      ]);

      if (!sessRes.error && sessRes.data) setSessions(sessRes.data);
      if (!zoomRes.error && zoomRes.data) setZoomUrl((zoomRes.data as any).value || null);
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

  if (sessions.length === 0) return null;

  const next = sessions[0];
  const userTz = getUserTimezone();
  const nextLocal = convertDateTimeToTimezone(next.session_date, next.start_time, next.timezone || "Africa/Cairo", userTz);
  const days = daysUntil(nextLocal.dateStr);
  const classActive = isClassActive(next.session_date, next.start_time, next.duration_min, next.timezone || "Africa/Cairo");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Upcoming Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next class highlight */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Next Class</p>
              <p className="font-bold text-foreground text-lg">{formatDate(nextLocal.dateStr)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {nextLocal.timeFormatted} · {next.duration_min} min · {userTz.replace(/_/g, " ")}
              </p>
              <p className="text-[11px] text-muted-foreground/70">({formatDate(next.session_date)} {formatTime(next.start_time)} {(next.timezone || "Africa/Cairo").replace(/_/g, " ")})</p>
              <p className="text-xs text-muted-foreground mt-1">{next.group_name} · {next.level}</p>

              {/* Join Class button */}
              {zoomUrl && days === 0 && (
                <a
                  href={zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2"
                >
                  <Button
                    size="sm"
                    className={`gap-1.5 font-bold shadow-md transition-all ${
                      classActive
                        ? "bg-green-600 hover:bg-green-700 text-white animate-pulse shadow-green-500/30"
                        : "opacity-70"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    {classActive ? "Join Class Now →" : "Class Link"}
                  </Button>
                </a>
              )}
            </div>
            <Badge className={days === 0 ? "bg-green-500" : days === 1 ? "bg-yellow-500" : "bg-primary"}>
              {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`}
            </Badge>
          </div>
        </div>

        {/* Remaining sessions */}
        {sessions.slice(1).map(s => {
          const l = convertDateTimeToTimezone(s.session_date, s.start_time, s.timezone || "Africa/Cairo", userTz);
          return (
          <div key={s.session_id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{formatDate(l.dateStr)}</p>
              <p className="text-xs text-muted-foreground">{l.timeFormatted} · {s.group_name}</p>
            </div>
            <span className="text-xs text-muted-foreground">In {daysUntil(l.dateStr)}d</span>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessionsCard;
