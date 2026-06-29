import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getLast12Weeks(): Date[][] {
  const weeks: Date[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find most recent Sunday
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - today.getDay() + (7 * 11)); // 11 weeks back start

  // Build 12 weeks of days
  const startSunday = new Date(today);
  startSunday.setDate(today.getDate() - today.getDay() - 7 * 11);

  for (let w = 0; w < 12; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(startSunday);
      day.setDate(startSunday.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }
  return weeks;
}

export function StreakCalendar() {
  const { user } = useAuth();
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchActivityDates = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get all XP activity dates (any activity = active day)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 84);

    const { data: xpData } = await supabase
      .from("student_xp")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", threeMonthsAgo.toISOString());

    const dates = new Set<string>();
    (xpData || []).forEach((r) => {
      dates.add(new Date(r.created_at).toISOString().split("T")[0]);
    });
    setActiveDates(dates);

    // Get streak from table
    const { data: streakData } = await supabase
      .from("student_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    if (streakData) {
      setCurrentStreak(streakData.current_streak || 0);
      setLongestStreak(streakData.longest_streak || 0);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchActivityDates();
  }, [fetchActivityDates, user]);

  const weeks = getLast12Weeks();
  const today = new Date().toISOString().split("T")[0];

  // Determine month labels
  const monthLabels: { label: string; colIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay.getMonth() !== lastMonth) {
      monthLabels.push({ label: MONTHS[firstDay.getMonth()], colIdx: wi });
      lastMonth = firstDay.getMonth();
    }
  });

  const getColor = (dateStr: string) => {
    const isFuture = dateStr > today;
    if (isFuture) return "bg-muted/30 border border-border/20";
    if (activeDates.has(dateStr)) return "bg-primary";
    return "bg-muted/50 border border-border/30";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-28 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            Activity Calendar
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600">
              🔥 {currentStreak} day streak
            </Badge>
            {longestStreak > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Best: {longestStreak}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Month labels */}
            <div className="flex mb-1 pl-8">
              {weeks.map((week, wi) => {
                const label = monthLabels.find(m => m.colIdx === wi);
                return (
                  <div key={wi} className="flex-1 text-center">
                    {label && (
                      <span className="text-xs text-muted-foreground">{label.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar grid */}
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-1">
                {DAYS.map((d, di) => (
                  <div key={d} className="h-3.5 flex items-center">
                    {di % 2 === 1 && (
                      <span className="text-xs text-muted-foreground w-6">{d.slice(0,1)}</span>
                    )}
                    {di % 2 !== 1 && <span className="w-6" />}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map((day, di) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const isToday = dateStr === today;
                    const isActive = activeDates.has(dateStr);
                    const cellDelay = (wi * 7 + di) * 8;
                    return (
                      <div
                        key={di}
                        title={`${dateStr}${isActive ? " ✓ Active" : ""}`}
                        className={cn(
                          "h-3.5 rounded-sm transition-all animate-cell-pop",
                          getColor(dateStr),
                          isToday && "ring-1 ring-primary ring-offset-1",
                          isActive && "opacity-100",
                        )}
                        style={{ animationDelay: `${cellDelay}ms` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="h-3 w-3 rounded-sm bg-muted/50 border border-border/30" />
              <div className="h-3 w-3 rounded-sm bg-primary/40" />
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
