import { useState, useEffect, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS: { [key: number]: string } = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"
};

interface PreferenceTrend {
  level: string;
  day_of_week: number;
  preferred_start_time: string;
  request_count: number;
}

const StudentPreferenceDashboard = () => {
  const { toast } = useToast();
  const [trends, setTrends] = useState<PreferenceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc("get_student_preference_trends", {
          days_back: daysBack,
        });

      if (error) throw error;
      setTrends(data || []);

      // Auto-select first level if none selected
      if ((data || []).length > 0) {
        const levels = Array.from(new Set((data as any[]).map((t: any) => t.level)));
        setSelectedLevel((current) => current ?? levels[0]);
      }
    } catch (error) {
      console.error("Error fetching trends:", error);
      toast({
        title: "Error",
        description: "Failed to load preference data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [daysBack, toast]);

  useEffect(() => {
    void fetchTrends();
  }, [fetchTrends]);

  // Get unique levels
  const levels = Array.from(new Set(trends.map((t) => t.level)));

  // Filter trends by selected level
  const filteredTrends = selectedLevel
    ? trends.filter((t) => t.level === selectedLevel)
    : [];

  // Build heatmap data
  const heatmapData: { [dayIndex: number]: { [time: string]: number } } = {};
  for (let i = 0; i <= 6; i++) {
    heatmapData[i] = {};
  }

  const times = new Set<string>();
  filteredTrends.forEach((trend) => {
    if (!heatmapData[trend.day_of_week]) {
      heatmapData[trend.day_of_week] = {};
    }
    heatmapData[trend.day_of_week][trend.preferred_start_time] = trend.request_count;
    times.add(trend.preferred_start_time);
  });

  const sortedTimes = Array.from(times).sort();
  const maxCount = filteredTrends.length > 0 ? Math.max(...filteredTrends.map((t) => t.request_count)) : 0;

  // Get intensity color for heatmap
  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return "bg-muted";
    const intensity = count / max;
    if (intensity > 0.75) return "bg-red-500/80 text-white";
    if (intensity > 0.5) return "bg-orange-500/70 text-white";
    if (intensity > 0.25) return "bg-yellow-500/60 text-white";
    return "bg-blue-500/50 text-white";
  };

  // Top requests
  const topRequests = filteredTrends
    .sort((a, b) => b.request_count - a.request_count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Student Preference Trends
          </CardTitle>
          <CardDescription>
            Last {daysBack} days of enrollment preferences to guide scheduling decisions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Time Period
              </label>
              <div className="flex gap-2">
                {[7, 14, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={daysBack === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDaysBack(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>

            {levels.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Level
                </label>
                <div className="flex gap-2 flex-wrap">
                  {levels.map((level) => (
                    <Button
                      key={level}
                      variant={selectedLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLevel(level)}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Requests */}
      {topRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Top Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRequests.map((request, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {DAYS[request.day_of_week]} @ {request.preferred_start_time}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{selectedLevel}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="font-semibold text-lg"
                  >
                    {request.request_count} {request.request_count === 1 ? "student" : "students"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading preference data...</div>
          </CardContent>
        </Card>
      ) : filteredTrends.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No student preferences yet for this level.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heatmap: {selectedLevel}</CardTitle>
            <CardDescription>
              Darker = more student requests. Hover to see count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Heatmap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-semibold px-2 py-2">Day / Time</th>
                    {sortedTimes.map((time) => (
                      <th key={time} className="text-center font-semibold px-2 py-2 min-w-16">
                        {time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((dayName, dayIdx) => (
                    <tr key={dayIdx} className="border-t border-border">
                      <td className="font-medium px-2 py-2 text-muted-foreground">
                        {dayName}
                      </td>
                      {sortedTimes.map((time) => {
                        const count = heatmapData[dayIdx]?.[time] || 0;
                        return (
                          <td key={time} className="text-center px-2 py-2">
                            {count > 0 && (
                              <div
                                className={`${getHeatColor(count, maxCount)} rounded px-2 py-1 font-semibold text-center cursor-help`}
                                title={`${count} ${count === 1 ? "student" : "students"}`}
                              >
                                {count}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/50 rounded"></div>
                <span>Low demand</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-500/60 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500/70 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500/80 rounded"></div>
                <span>Very high demand</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(StudentPreferenceDashboard);
