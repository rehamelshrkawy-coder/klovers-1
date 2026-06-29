import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  value: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  xpLeaderboard: LeaderboardEntry[];
  streakLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  currentUserXpRank: number | null;
  currentUserStreakRank: number | null;
  loading: boolean;
}

export function useLeaderboard(): LeaderboardData {
  const { user } = useAuth();
  const [xpLeaderboard, setXpLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserXpRank, setCurrentUserXpRank] = useState<number | null>(null);
  const [currentUserStreakRank, setCurrentUserStreakRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      // Use the xp_leaderboard view — already aggregated, sorted desc, limited to 50
      const { data: xpViewData } = await supabase
        .from("xp_leaderboard")
        .select("user_id, name, avatar_url, total_xp");

      // Fetch top streaks
      const { data: streakData } = await supabase
        .from("student_streaks")
        .select("user_id, current_streak")
        .gt("current_streak", 0)
        .order("current_streak", { ascending: false })
        .limit(20);

      // Build XP leaderboard from the view (already sorted, already has name/avatar)
      const allXpRows = (xpViewData || []).filter(
        (row): row is typeof row & { user_id: string } => row.user_id !== null,
      );
      const topXpRows = allXpRows.slice(0, 10);

      const xpBoard: LeaderboardEntry[] = topXpRows.map((row, index) => ({
        user_id: row.user_id,
        name: row.name || "Anonymous",
        avatar_url: row.avatar_url ?? null,
        value: row.total_xp ?? 0,
        rank: index + 1,
        isCurrentUser: row.user_id === user?.id,
      }));

      setXpLeaderboard(xpBoard);

      // Determine current user's XP rank within the full view result
      if (user?.id) {
        const userXpIndex = allXpRows.findIndex((row) => row.user_id === user.id);
        setCurrentUserXpRank(userXpIndex >= 0 ? userXpIndex + 1 : null);
      }

      // Build streak leaderboard — fetch profiles for streak users not already in the XP view
      if (streakData) {
        // Build a profile map from the XP view data we already have
        const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
        allXpRows.forEach((row) => {
          profileMap[row.user_id] = { name: row.name || "Anonymous", avatar_url: row.avatar_url ?? null };
        });

        // Find streak user IDs whose profiles aren't already in the XP view
        const streakUserIds = streakData.slice(0, 10).map((row) => row.user_id);
        const missingIds = streakUserIds.filter((id: string) => !profileMap[id]);

        if (missingIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .in("user_id", missingIds);

          (profiles || []).forEach((profile) => {
            profileMap[profile.user_id] = { name: profile.name || "Anonymous", avatar_url: profile.avatar_url ?? null };
          });
        }

        const streakBoard: LeaderboardEntry[] = streakData
          .slice(0, 10)
          .map((row, index) => ({
            user_id: row.user_id,
            name: profileMap[row.user_id]?.name || "Anonymous",
            avatar_url: profileMap[row.user_id]?.avatar_url ?? null,
            value: row.current_streak,
            rank: index + 1,
            isCurrentUser: row.user_id === user?.id,
          }));

        setStreakLeaderboard(streakBoard);

        if (user?.id) {
          const userStreakRank = streakData.findIndex((row) => row.user_id === user.id);
          setCurrentUserStreakRank(userStreakRank >= 0 ? userStreakRank + 1 : null);
        }
      }

      // Weekly leaderboard: query student_xp for this week, group by user, sum xp
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyXpData } = await supabase
        .from("student_xp")
        .select("user_id, xp_earned")
        .gte("created_at", startOfWeek.toISOString());

      if (weeklyXpData) {
        // Aggregate by user
        const weeklyTotals: Record<string, number> = {};
        weeklyXpData.forEach((row) => {
          weeklyTotals[row.user_id] = (weeklyTotals[row.user_id] || 0) + (row.xp_earned || 0);
        });

        // Sort descending, take top 10
        const sorted = Object.entries(weeklyTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);

        // Build profile map from existing xpViewData
        const profileMap: Record<string, { name: string; avatar_url: string | null }> = {};
        allXpRows.forEach((row) => {
          profileMap[row.user_id] = { name: row.name || "Anonymous", avatar_url: row.avatar_url ?? null };
        });

        // Fetch missing profiles
        const missingIds = sorted.map(([id]) => id).filter(id => !profileMap[id]);
        if (missingIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .in("user_id", missingIds);
          (profiles || []).forEach((profile) => {
            profileMap[profile.user_id] = { name: profile.name || "Anonymous", avatar_url: profile.avatar_url ?? null };
          });
        }

        const weeklyBoard: LeaderboardEntry[] = sorted.map(([userId, total], idx) => ({
          user_id: userId,
          name: profileMap[userId]?.name || "Anonymous",
          avatar_url: profileMap[userId]?.avatar_url ?? null,
          value: total,
          rank: idx + 1,
          isCurrentUser: userId === user?.id,
        }));

        setWeeklyLeaderboard(weeklyBoard);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchLeaderboard(); }, 2000);
  }, [fetchLeaderboard]);

  // Initial fetch and re-fetch when the current user changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Realtime subscription: re-fetch (debounced) on any INSERT into student_xp
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-student-xp")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "student_xp" },
        () => { debouncedFetch(); }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedFetch]);

  return {
    xpLeaderboard,
    streakLeaderboard,
    weeklyLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  };
}
