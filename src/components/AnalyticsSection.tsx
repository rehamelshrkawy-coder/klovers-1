import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TrendingUp, BookOpen, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#E8D9FF"];
const MASTERY_COLORS = ["#FFE5CC", "#D6E8FF", "#CFF7D3"];

export function AnalyticsSection() {
  const {
    weeklyXp,
    sectionProgress,
    vocabMastery,
    totalLessonsCompleted,
    currentStreak,
    totalXp,
    loading,
  } = useAnalytics();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="xp" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="xp" className="gap-2">
          <TrendingUp className="h-4 w-4" /> XP Trend
        </TabsTrigger>
        <TabsTrigger value="progress" className="gap-2">
          <BookOpen className="h-4 w-4" /> Progress
        </TabsTrigger>
        <TabsTrigger value="mastery" className="gap-2">
          <Award className="h-4 w-4" /> Mastery
        </TabsTrigger>
      </TabsList>

      {/* XP Trend Tab */}
      <TabsContent value="xp">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly XP Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyXp.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>No XP data yet. Start learning to see your progress!</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total XP (Last 8 weeks)</p>
                  <p className="text-3xl font-bold text-primary-text">{totalXp}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyXp} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      formatter={(value: any) => [value, "XP"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Progress Tab */}
      <TabsContent value="progress">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Section Completion Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {sectionProgress.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>No progress data yet. Complete lessons to see your progress!</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground">Lessons Completed</p>
                  <p className="text-3xl font-bold text-blue-600">{totalLessonsCompleted}</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={sectionProgress}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="section"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "Percentage", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      formatter={(value: any) => `${value.toFixed(0)}%`}
                    />
                    <Bar dataKey="percentage" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Mastery Tab */}
      <TabsContent value="mastery">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vocabulary Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            {vocabMastery.learning === 0 &&
            vocabMastery.reviewing === 0 &&
            vocabMastery.mastered === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <p>Start reviewing vocabulary to track mastery!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-center">
                    <p className="text-xs text-muted-foreground">Learning</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {vocabMastery.learning}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-xs text-muted-foreground">Reviewing</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {vocabMastery.reviewing}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center">
                    <p className="text-xs text-muted-foreground">Mastered</p>
                    <p className="text-2xl font-bold text-green-600">
                      {vocabMastery.mastered}
                    </p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Learning", value: vocabMastery.learning },
                        { name: "Reviewing", value: vocabMastery.reviewing },
                        { name: "Mastered", value: vocabMastery.mastered },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {MASTERY_COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
