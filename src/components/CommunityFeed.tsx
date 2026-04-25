import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGES } from "@/constants/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface FeedItem {
  id: string;
  displayName: string;
  badgeKey: string;
  earnedAt: string;
}

const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.key, b]));

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Community achievements feed — shows recent badges earned by other students.
 * Uses a simple public query (no RLS leak: only badge_key + first-name initial).
 * Refreshes every 60 seconds via polling.
 */
export default function CommunityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      // Join student_badges with profiles to get a display name
      // RLS: student_badges is readable by all authenticated users (public league data)
      const { data } = await supabase
        .from("student_badges" as never)
        .select("id, badge_key, created_at, user_id, profiles!inner(full_name)")
        .order("created_at", { ascending: false })
        .limit(20) as any;

      if (!data) return;

      const feed: FeedItem[] = data
        .filter((r: any) => BADGE_MAP[r.badge_key])
        .map((r: any) => ({
          id: r.id,
          badgeKey: r.badge_key,
          earnedAt: r.created_at,
          displayName: r.profiles?.full_name
            ? r.profiles.full_name.split(" ")[0]   // first name only for privacy
            : "A student",
        }));

      setItems(feed);
    } catch {
      // Feed is non-critical — fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    // Subscribe to real-time inserts on student_badges so the feed updates
    // instantly when any student earns a new badge — no polling needed.
    const channel = supabase
      .channel("community-badges")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "student_badges" },
        () => fetchFeed()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading community feed" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" aria-hidden="true" />
          Community Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul
          aria-label="Recent achievements by other students"
          className="divide-y divide-border"
        >
          {items.slice(0, 10).map(item => {
            const badge = BADGE_MAP[item.badgeKey];
            if (!badge) return null;
            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-2xl" aria-hidden="true">{badge.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    <span className="text-primary">{item.displayName}</span>
                    {" earned "}
                    <span className="font-semibold">{badge.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
                <time
                  dateTime={item.earnedAt}
                  className="text-xs text-muted-foreground whitespace-nowrap"
                >
                  {timeAgo(item.earnedAt)}
                </time>
              </li>
            );
          })}
        </ul>
        <div className="px-4 py-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🌏 {items.length}+ achievements earned by the Klovers community
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
