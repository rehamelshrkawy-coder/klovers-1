import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyXpData {
  date: string;
  xp: number;
}

export interface SectionProgress {
  section: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface VocabMastery {
  learning: number;
  reviewing: number;
  mastered: number;
}

export interface AnalyticsData {
  weeklyXp: WeeklyXpData[];
  sectionProgress: SectionProgress[];
  vocabMastery: VocabMastery;
  totalLessonsCompleted: number;
  currentStreak: number;
  totalXp: number;
  loading: boolean;
}

export function useAnalytics(): AnalyticsData {
  const { user } = useAuth();
  const [weeklyXp, setWeeklyXp] = useState<WeeklyXpData[]>([]);
  const [sectionProgress, setSectionProgress] = useState<SectionProgress[]>([]);
  const [vocabMastery, setVocabMastery] = useState<VocabMastery>({
    learning: 0,
    reviewing: 0,
    mastered: 0,
  });
  const [totalLessonsCompleted, setTotalLessonsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Get XP data for past 8 weeks
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const { data: xpData } = await supabase
        .from("student_xp")
        .select("xp_earned, created_at")
        .eq("user_id", user.id)
        .gte("created_at", eightWeeksAgo.toISOString());

      // Group by week
      if (xpData) {
        const weeklyData: Record<string, number> = {};
        xpData.forEach((record: any) => {
          const date = new Date(record.created_at);
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const key = weekStart.toISOString().split("T")[0];
          weeklyData[key] = (weeklyData[key] || 0) + record.xp_earned;
        });

        const sortedWeeks = Object.entries(weeklyData)
          .map(([date, xp]) => ({ date, xp }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setWeeklyXp(sortedWeeks);
        setTotalXp(
          xpData.reduce((sum: number, record: any) => sum + record.xp_earned, 0)
        );
      }

      // Get section progress
      const { data: progressData } = await supabase
        .from("student_lesson_progress")
        .select("vocab_done, grammar_done, dialogue_done, exercises_done, reading_done")
        .eq("user_id", user.id);

      if (progressData) {
        const sections = [
          { name: "Vocabulary", key: "vocab_done" as const },
          { name: "Grammar", key: "grammar_done" as const },
          { name: "Dialogue", key: "dialogue_done" as const },
          { name: "Exercises", key: "exercises_done" as const },
          { name: "Reading", key: "reading_done" as const },
        ];

        const sectionsProgress = sections.map((section) => {
          const completed = progressData.filter(
            (p: any) => p[section.key]
          ).length;
          return {
            section: section.name,
            completed,
            total: progressData.length,
            percentage: progressData.length > 0 ? (completed / progressData.length) * 100 : 0,
          };
        });

        setSectionProgress(sectionsProgress);
        setTotalLessonsCompleted(
          progressData.filter((p: any) => p.vocab_done || p.grammar_done).length
        );
      }

      // Get vocabulary mastery levels
      const { data: reviewData } = await (supabase as any)
        .from("vocabulary_review_history")
        .select("interval_days")
        .eq("user_id", user.id);

      if (reviewData && reviewData.length > 0) {
        let learning = 0;
        let reviewing = 0;
        let mastered = 0;

        reviewData.forEach((record: any) => {
          const interval = record.interval_days || 1;
          if (interval <= 1) learning++;
          else if (interval <= 7) reviewing++;
          else mastered++;
        });

        setVocabMastery({ learning, reviewing, mastered });
      } else {
        setVocabMastery({ learning: 0, reviewing: 0, mastered: 0 });
      }

      // Get current streak
      const { data: streakData } = await supabase
        .from("student_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle();

      if (streakData) {
        setCurrentStreak(streakData.current_streak || 0);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchAnalytics();
  }, [fetchAnalytics, user]);

  return useMemo(
    () => ({
      weeklyXp,
      sectionProgress,
      vocabMastery,
      totalLessonsCompleted,
      currentStreak,
      totalXp,
      loading,
    }),
    [weeklyXp, sectionProgress, vocabMastery, totalLessonsCompleted, currentStreak, totalXp, loading]
  );
}
