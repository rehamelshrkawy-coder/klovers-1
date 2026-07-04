import { useState, useMemo } from "react";
import { useLeagueUsers, LeagueUserRow } from "@/hooks/admin/useLeagueUsers";
import { LEAGUES } from "@/constants/gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin-utils";

type SortKey = "xp_desc" | "xp_asc" | "streak_desc" | "badges_desc" | "activity_desc";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

function downloadCsv(rows: LeagueUserRow[]) {
  const header = "Name,Email,Total XP,League,Current Streak,Badges,Last Activity";
  const lines = rows.map((r) =>
    [r.name, r.email, r.total_xp, r.league.name, r.current_streak, r.badges_count, r.last_activity ?? ""].join(",")
  );
  const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "league-users.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeagueUsersPanel() {
  const { data, isLoading } = useLeagueUsers();
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("xp_desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.rows;

    if (leagueFilter !== "all") {
      rows = rows.filter((r) => r.league.key === leagueFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }

    const sorters: Record<SortKey, (a: LeagueUserRow, b: LeagueUserRow) => number> = {
      xp_desc: (a, b) => b.total_xp - a.total_xp,
      xp_asc: (a, b) => a.total_xp - b.total_xp,
      streak_desc: (a, b) => b.current_streak - a.current_streak,
      badges_desc: (a, b) => b.badges_count - a.badges_count,
      activity_desc: (a, b) => {
        if (!a.last_activity) return 1;
        if (!b.last_activity) return -1;
        return b.last_activity.localeCompare(a.last_activity);
      },
    };
    rows = [...rows].sort(sorters[sortBy]);
    return rows;
  }, [data, leagueFilter, search, sortBy]);

  // Reset page when filters change
  useMemo(() => setPage(0), [leagueFilter, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const summary = data?.leagueSummary ?? {};

  return (
    <div className="space-y-4">
      {/* League summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {LEAGUES.map((league) => {
          const count = summary[league.key] ?? 0;
          const isActive = leagueFilter === league.key;
          return (
            <button
              key={league.key}
              onClick={() => setLeagueFilter(isActive ? "all" : league.key)}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition-all hover:shadow-md",
                isActive
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="text-2xl">{league.emoji}</div>
              <div className="text-xs font-medium mt-1 truncate">{league.name.replace(" League", "")}</div>
              <div className="text-lg font-bold" style={{ color: league.color }}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base mr-auto">
              League Users <span className="text-muted-foreground font-normal">({filtered.length})</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56 h-9 rounded-full text-sm"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-44 h-9 rounded-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp_desc">XP (High to Low)</SelectItem>
                <SelectItem value="xp_asc">XP (Low to High)</SelectItem>
                <SelectItem value="streak_desc">Streak (High to Low)</SelectItem>
                <SelectItem value="badges_desc">Badges (High to Low)</SelectItem>
                <SelectItem value="activity_desc">Last Active</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="rounded-full h-9" onClick={() => downloadCsv(filtered)}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>League</TableHead>
                  <TableHead className="text-right">Total XP</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Badges</TableHead>
                  <TableHead className="hidden md:table-cell">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell>
                        <div className="font-medium text-sm">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="whitespace-nowrap"
                          style={{ borderColor: r.league.color, color: r.league.color }}
                        >
                          {r.league.emoji} {r.league.name.replace(" League", "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {r.total_xp.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.current_streak > 0 ? `${r.current_streak} 🔥` : "0"}
                      </TableCell>
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {r.badges_count}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {formatDate(r.last_activity)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
