import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarCheck, Flame, TrendingUp, Award, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "late" | "excused";
}

interface AttendanceCalendarProps {
  days: AttendanceDay[];
  totalClasses: number;
  usedClasses: number;
}

const statusDisplay: Record<string, { label: string; icon: React.ElementType; variant: "default" | "destructive" | "secondary" | "outline"; color: string }> = {
  present: { label: "Present", icon: CheckCircle2, variant: "default", color: "text-primary-text" },
  absent: { label: "Absent", icon: XCircle, variant: "destructive", color: "text-destructive" },
  late: { label: "Late", icon: Clock, variant: "secondary", color: "text-muted-foreground" },
  excused: { label: "Excused", icon: Clock, variant: "outline", color: "text-muted-foreground" },
};

const AttendanceCalendar = ({ days, totalClasses, usedClasses }: AttendanceCalendarProps) => {
  const presentDates = useMemo(
    () => days.filter(d => d.status === "present").map(d => new Date(d.date + "T00:00:00")),
    [days]
  );
  const absentDates = useMemo(
    () => days.filter(d => d.status === "absent").map(d => new Date(d.date + "T00:00:00")),
    [days]
  );
  const lateDates = useMemo(
    () => days.filter(d => d.status === "late").map(d => new Date(d.date + "T00:00:00")),
    [days]
  );

  const sortedDays = useMemo(
    () => [...days].sort((a, b) => b.date.localeCompare(a.date)),
    [days]
  );

  // Stats
  const presentCount = days.filter(d => d.status === "present").length;
  const attendanceRate = days.length > 0 ? Math.round((presentCount / days.length) * 100) : 0;

  // Streak
  const sortedPresent = [...presentDates].sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  if (sortedPresent.length > 0) {
    streak = 1;
    for (let i = 1; i < sortedPresent.length; i++) {
      const diff = (sortedPresent[i - 1].getTime() - sortedPresent[i].getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 7) streak++;
      else break;
    }
  }

  const modifiers = { present: presentDates, absent: absentDates, late: lateDates };
  const modifiersStyles = {
    present: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    absent: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", borderRadius: "9999px" },
    late: { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: "9999px" },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center space-y-1">
            <TrendingUp className="h-5 w-5 mx-auto text-primary-text" />
            <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
            <p className="text-[10px] text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center space-y-1">
            <CalendarCheck className="h-5 w-5 mx-auto text-primary-text" />
            <p className="text-2xl font-bold text-foreground">{presentCount}</p>
            <p className="text-[10px] text-muted-foreground">Classes Attended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center space-y-1">
            <Flame className="h-5 w-5 mx-auto text-destructive" />
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Week Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center space-y-1">
            <Award className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{usedClasses}/{totalClasses}</p>
            <p className="text-[10px] text-muted-foreground">Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar (view only) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
          <div className="flex gap-3 flex-wrap mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">Late</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="pointer-events-none">
            <Calendar
              mode="multiple"
              selected={presentDates}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className={cn("p-3 w-full")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Written date list */}
      {sortedDays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedDays.map((d, i) => {
                const cfg = statusDisplay[d.status] || statusDisplay.absent;
                const Icon = cfg.icon;
                return (
                  <div
                    key={`${d.date}-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-muted", cfg.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatDate(d.date)}</p>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceCalendar;
