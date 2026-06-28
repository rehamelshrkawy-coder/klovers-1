import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface LearningGoal {
  id: string;
  user_id: string;
  goal_type: string;
  goal_name: string;
  target_value: number;
  time_period: string;
  current_progress: number;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  target_date: string;
  completed_at?: string;
  updated_at: string;
}

export function useLearningGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_learning_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("target_date");

    if (data) {
      setGoals(data as LearningGoal[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchGoals();
  }, [fetchGoals, user]);

  const createGoal = useCallback(
    async (
      goalType: string,
      goalName: string,
      targetValue: number,
      timePeriod: string
    ) => {
      if (!user) return;

      const targetDate = new Date();
      if (timePeriod === "daily") targetDate.setDate(targetDate.getDate() + 1);
      else if (timePeriod === "weekly") targetDate.setDate(targetDate.getDate() + 7);
      else if (timePeriod === "monthly") targetDate.setMonth(targetDate.getMonth() + 1);

      const { error } = await (supabase as any).from("user_learning_goals").insert({
        user_id: user.id,
        goal_type: goalType,
        goal_name: goalName,
        target_value: targetValue,
        time_period: timePeriod,
        target_date: targetDate.toISOString(),
      });

      if (!error) {
        await fetchGoals();
        return true;
      }
      return false;
    },
    [fetchGoals, user]
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, progress: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const isCompleted = progress >= goal.target_value;

      const { error } = await (supabase as any)
        .from("user_learning_goals")
        .update({
          current_progress: Math.min(progress, goal.target_value),
          status: isCompleted ? "completed" : "active",
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId);

      if (!error) {
        await fetchGoals();
      }
    },
    [fetchGoals, goals]
  );

  const deleteGoal = useCallback(async (goalId: string) => {
    const { error } = await (supabase as any)
      .from("user_learning_goals")
      .delete()
      .eq("id", goalId);

    if (!error) {
      await fetchGoals();
    }
  }, [fetchGoals]);

  const getCompletionPercentage = (goal: LearningGoal): number => {
    return Math.min(Math.round((goal.current_progress / goal.target_value) * 100), 100);
  };

  const getDaysRemaining = (goal: LearningGoal): number => {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoalProgress,
    deleteGoal,
    getCompletionPercentage,
    getDaysRemaining,
    refetch: fetchGoals,
  };
}
