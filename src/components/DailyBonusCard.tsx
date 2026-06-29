import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Streak milestones and their bonus XP
const STREAK_BONUSES = [
  { days: 3,  bonus: 15,  label: "3-Day Streak" },
  { days: 7,  bonus: 30,  label: "7-Day Streak" },
  { days: 14, bonus: 50,  label: "14-Day Streak" },
  { days: 30, bonus: 100, label: "30-Day Streak" },
];

export function DailyBonusCard() {
  const { user } = useAuth();
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bonusXp, setBonusXp] = useState(10);
  const [streakBonus, setStreakBonus] = useState(0);
  const [streakBonusLabel, setStreakBonusLabel] = useState("");

  const checkDailyBonus = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already claimed today
    const { data: existing } = await supabase
      .from("student_xp")
      .select("id")
      .eq("user_id", user.id)
      .eq("activity_type", "daily_bonus")
      .gte("created_at", today.toISOString())
      .limit(1)
      .maybeSingle();

    setClaimed(!!existing);

    // Get current streak
    const { data: streakData } = await supabase
      .from("student_streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    const streak = streakData?.current_streak || 0;
    setCurrentStreak(streak);

    // Calculate streak bonus
    let bonus = 0;
    let bonusLabel = "";
    for (const tier of STREAK_BONUSES) {
      if (streak >= tier.days) {
        bonus = tier.bonus;
        bonusLabel = tier.label;
      }
    }
    setStreakBonus(bonus);
    setStreakBonusLabel(bonusLabel);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void checkDailyBonus();
  }, [checkDailyBonus, user]);

  const handleClaim = async () => {
    if (!user || claimed || claiming) return;
    setClaiming(true);

    const total = bonusXp + streakBonus;

    const { error } = await supabase.from("student_xp").insert({
      user_id: user.id,
      lesson_id: null,
      activity_type: "daily_bonus",
      xp_earned: total,
    });

    if (!error) {
      setClaimed(true);
    }

    setClaiming(false);
  };

  if (loading) return null;

  const totalBonus = bonusXp + streakBonus;

  return (
    <Card className={cn(
      "border-2 transition-all",
      claimed
        ? "border-green-500/30 bg-green-500/5 dark:border-green-500/20 dark:bg-green-500/10"
        : "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 ring-1 ring-black/10"
    )}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
              claimed ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 border border-black/10"
            )}>
              {claimed
                ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <Gift className="h-5 w-5 text-amber-600" />
              }
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {claimed ? "Daily Bonus Claimed!" : "Daily Login Bonus"}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <Badge variant="outline" className="text-xs gap-1 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 ring-1 ring-black/10">
                  <Zap className="h-3 w-3" /> +{bonusXp} XP base
                </Badge>
                {streakBonus > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 ring-1 ring-black/10">
                    🔥 +{streakBonus} XP ({streakBonusLabel})
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {!claimed ? (
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={claiming}
              className="flex-shrink-0"
            >
              {claiming ? "Claiming..." : `Claim +${totalBonus} XP`}
            </Button>
          ) : (
            <Badge className="bg-green-600 dark:bg-green-500 flex-shrink-0">
              +{totalBonus} XP earned
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
