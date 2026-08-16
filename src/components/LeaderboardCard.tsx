import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Trophy, Flame, Crown, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-100 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700 ring-1 ring-black/10",
  2: "bg-muted border-muted-foreground/30",
  3: "bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700 ring-1 ring-black/10",
};

const RANK_ICONS: Record<number, React.ReactNode> = {
  1: <Crown className="h-4 w-4 text-yellow-500" />,
  2: <Medal className="h-4 w-4 text-gray-400" />,
  3: <Medal className="h-4 w-4 text-amber-600" />,
};

interface EntryRowProps {
  rank: number;
  name: string;
  avatarUrl: string | null;
  value: number;
  unit: string;
  isCurrentUser: boolean;
}

function EntryRow({ rank, name, avatarUrl, value, unit, isCurrentUser }: EntryRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        RANK_STYLES[rank] || "border-border bg-card",
        isCurrentUser && "ring-2 ring-amber-400 ring-offset-1 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
      )}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {RANK_ICONS[rank] || (
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="text-xs bg-amber-100 text-foreground font-semibold border border-black/10">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-amber-700")}>
          {name}
          {isCurrentUser && (
            <span className="ms-1 text-xs text-amber-700">(You)</span>
          )}
        </p>
      </div>

      {/* Value */}
      <Badge variant="outline" className="flex-shrink-0 font-bold">
        {value.toLocaleString()} {unit}
      </Badge>
    </div>
  );
}

export function LeaderboardCard() {
  const {
    xpLeaderboard,
    streakLeaderboard,
    weeklyLeaderboard,
    currentUserXpRank,
    currentUserStreakRank,
    loading,
  } = useLeaderboard();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Global Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="xp">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="xp" className="gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> XP Ranking
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Streak Ranking
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" /> This Week
            </TabsTrigger>
          </TabsList>

          {/* XP Tab */}
          <TabsContent value="xp">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : xpLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No learners on the board yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {xpLeaderboard.map((entry) => (
                  <EntryRow
                    key={entry.user_id}
                    rank={entry.rank}
                    name={entry.name}
                    avatarUrl={entry.avatar_url}
                    value={entry.value}
                    unit="XP"
                    isCurrentUser={entry.isCurrentUser}
                  />
                ))}
                {currentUserXpRank && currentUserXpRank > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                    Your rank: <span className="font-bold text-amber-700">#{currentUserXpRank}</span>
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Streak Tab */}
          <TabsContent value="streak">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : streakLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No active streaks yet. Start learning daily!
              </p>
            ) : (
              <div className="space-y-2">
                {streakLeaderboard.map((entry) => (
                  <EntryRow
                    key={entry.user_id}
                    rank={entry.rank}
                    name={entry.name}
                    avatarUrl={entry.avatar_url}
                    value={entry.value}
                    unit="days"
                    isCurrentUser={entry.isCurrentUser}
                  />
                ))}
                {currentUserStreakRank && currentUserStreakRank > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                    Your streak rank: <span className="font-bold text-amber-700">#{currentUserStreakRank}</span>
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          {/* Weekly XP Tab */}
          <TabsContent value="weekly">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : weeklyLeaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No activity this week yet. Start learning!
              </p>
            ) : (
              <div className="space-y-2">
                {weeklyLeaderboard.map((entry) => (
                  <EntryRow
                    key={entry.user_id}
                    rank={entry.rank}
                    name={entry.name}
                    avatarUrl={entry.avatar_url}
                    value={entry.value}
                    unit="XP"
                    isCurrentUser={entry.isCurrentUser}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
