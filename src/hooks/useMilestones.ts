import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Milestone {
  id: number;
  user_id: string;
  milestone_type: string;
  milestone_tier: number;
  milestone_name: string;
  target_value: number;
  progress_value: number;
  is_achieved: boolean;
  achieved_at?: string;
}

export interface MilestoneGroup {
  type: string;
  tiers: Milestone[];
}

export function useMilestones() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyAchieved, setNewlyAchieved] = useState<Milestone | null>(null);
  const achievementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMilestones = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await (supabase as any)
      .from("achievement_milestones")
      .select("*")
      .eq("user_id", user.id)
      .order("milestone_type")
      .order("milestone_tier");

    if (data) {
      setMilestones(data as Milestone[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchMilestones();
  }, [fetchMilestones, user]);

  useEffect(() => () => {
    if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
  }, []);

  const updateMilestoneProgress = useCallback(
    async (
      milestoneType: string,
      currentProgress: number
    ) => {
      if (!user) return;

      const milestonesToUpdate = milestones.filter(
        (m) => m.milestone_type === milestoneType && !m.is_achieved
      );

      for (const milestone of milestonesToUpdate) {
        const newProgress = Math.min(
          currentProgress,
          milestone.target_value
        );
        const isAchieved = newProgress >= milestone.target_value;

        const { error } = await (supabase as any)
          .from("achievement_milestones")
          .update({
            progress_value: newProgress,
            is_achieved: isAchieved,
            achieved_at: isAchieved ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", milestone.id);

        if (!error && isAchieved) {
          setNewlyAchieved(milestone);
          if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
          achievementTimerRef.current = setTimeout(() => setNewlyAchieved(null), 5000);
        }
      }

      // Refresh milestones
      await fetchMilestones();
    },
    [fetchMilestones, user, milestones]
  );

  const getGroupedMilestones = (): MilestoneGroup[] => {
    const grouped: Record<string, Milestone[]> = {};
    milestones.forEach((m) => {
      if (!grouped[m.milestone_type]) {
        grouped[m.milestone_type] = [];
      }
      grouped[m.milestone_type].push(m);
    });

    return Object.entries(grouped).map(([type, tiers]) => ({
      type,
      tiers: tiers.sort((a, b) => a.milestone_tier - b.milestone_tier),
    }));
  };

  const getCompletionPercentage = (): number => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.is_achieved).length;
    return Math.round((completed / milestones.length) * 100);
  };

  return {
    milestones,
    groupedMilestones: getGroupedMilestones(),
    completionPercentage: getCompletionPercentage(),
    loading,
    newlyAchieved,
    updateMilestoneProgress,
    refetch: fetchMilestones,
  };
}
