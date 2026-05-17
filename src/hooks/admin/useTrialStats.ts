import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrialStats {
  pending: number;
  upcoming: number;
  thisWeek: number;
  total: number;
}

export function useTrialStats() {
  return useQuery<TrialStats>({
    queryKey: ["admin", "trial-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      const todayIso = today.toISOString().slice(0, 10);
      const weekIso = weekAhead.toISOString().slice(0, 10);

      const [pendingRes, upcomingRes, weekRes, totalRes] = await Promise.all([
        // Only count future non-TBA pending bookings (exclude legacy sentinel rows)
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).eq("status", "pending").eq("is_tba", false).gte("trial_date", todayIso).neq("trial_date", "2099-12-31").neq("start_time", "TBA"),
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).gte("trial_date", todayIso).in("status", ["pending", "confirmed"]),
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }).gte("trial_date", todayIso).lt("trial_date", weekIso).in("status", ["pending", "confirmed"]),
        supabase.from("trial_bookings").select("id", { count: "exact", head: true }),
      ]);

      return {
        pending: pendingRes.count ?? 0,
        upcoming: upcomingRes.count ?? 0,
        thisWeek: weekRes.count ?? 0,
        total: totalRes.count ?? 0,
      };
    },
    staleTime: 60 * 1000,
  });
}
