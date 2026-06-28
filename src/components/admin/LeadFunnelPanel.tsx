import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, MousePointerClick, Users, UserPlus, Eye, ChevronLeft, ChevronRight, Download, Mail } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Types ───────────────────────────────────────────────────────────────────

interface LeadEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  source_type: string;
  source_page: string;
  cta_label: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  created_at: string;
}

interface FunnelRow {
  session_id: string | null;
  first_seen: string | null;
  last_seen: string | null;
  touchpoints: string[] | null;
  clicked_whatsapp: boolean | null;
  clicked_free_trial: boolean | null;
  started_placement: boolean | null;
  viewed_pricing_cta: boolean | null;
  received_broadcast: boolean | null;
  user_id: string | null;
  signup_completed: boolean | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const pct = (num: number, den: number) =>
  den === 0 ? "0%" : `${((num / den) * 100).toFixed(1)}%`;

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  free_trial: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  placement_test: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  pricing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  enroll: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  contact: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  email: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
};

const PAGE_SIZE = 30;

// ── Component ───────────────────────────────────────────────────────────────

const LeadFunnelPanel: React.FC = () => {
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const [eventsPage, setEventsPage] = useState(0);
  const [activeView, setActiveView] = useState<"funnel" | "events" | "sources" | "enrollments">("funnel");

  const rangeDate = useMemo(() => {
    if (range === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return d.toISOString();
  }, [range]);

  // ── Queries ─────────────────────────────────────────────────────────────

  const {
    data: events = [],
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["lead_events", range],
    queryFn: async () => {
      let q = supabase
        .from("lead_events")
        .select("id, session_id, user_id, source_type, source_page, cta_label, campaign, utm_source, utm_medium, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (rangeDate) q = q.gte("created_at", rangeDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LeadEvent[];
    },
  });

  const {
    data: funnelRows = [],
    isLoading: funnelLoading,
    refetch: refetchFunnel,
  } = useQuery({
    queryKey: ["lead_funnel", range],
    queryFn: async () => {
      let q = supabase
        .from("lead_funnel")
        .select("*")
        .order("first_seen", { ascending: false })
        .limit(5000);
      if (rangeDate) q = q.gte("first_seen", rangeDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FunnelRow[];
    },
  });

  // Week-over-week delta for KPI cards
  const prevRangeDate = useMemo(() => {
    if (range === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range) * 2);
    return d.toISOString();
  }, [range]);

  const { data: prevFunnelRows = [] } = useQuery({
    queryKey: ["lead_funnel_prev", range],
    queryFn: async () => {
      if (!prevRangeDate || !rangeDate) return [];
      const { data } = await supabase
        .from("lead_funnel")
        .select("clicked_whatsapp, clicked_free_trial, started_placement, viewed_pricing_cta, received_broadcast, signup_completed")
        .gte("first_seen", prevRangeDate)
        .lt("first_seen", rangeDate)
        .limit(5000);
      return data ?? [];
    },
    enabled: range !== "all",
  });

  // ── Enrollment sources query ─────────────────────────────────────────────
  interface EnrollmentRow {
    id: string;
    user_id: string | null;
    status: string | null;
    acquisition_source: string | null;
    created_at: string | null;
  }

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ["enrollments_sources", range],
    queryFn: async () => {
      let q = supabase
        .from("enrollments")
        .select("id, user_id, status, acquisition_source, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (rangeDate) q = q.gte("created_at", rangeDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EnrollmentRow[];
    },
  });

  const refresh = () => { refetchEvents(); refetchFunnel(); refetchEnrollments(); };

  // ── Computed stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = funnelRows.length;
    const wa = funnelRows.filter((r) => r.clicked_whatsapp).length;
    const trial = funnelRows.filter((r) => r.clicked_free_trial).length;
    const placement = funnelRows.filter((r) => r.started_placement).length;
    const pricing = funnelRows.filter((r) => r.viewed_pricing_cta).length;
    const broadcast = funnelRows.filter((r) => r.received_broadcast).length;
    const signups = funnelRows.filter((r) => r.signup_completed).length;

    const prevTotal = prevFunnelRows.length;
    const prevWa = (prevFunnelRows as typeof funnelRows).filter((r) => r.clicked_whatsapp).length;
    const prevTrial = (prevFunnelRows as typeof funnelRows).filter((r) => r.clicked_free_trial).length;
    const prevPlacement = (prevFunnelRows as typeof funnelRows).filter((r) => r.started_placement).length;
    const prevPricing = (prevFunnelRows as typeof funnelRows).filter((r) => r.viewed_pricing_cta).length;
    const prevBroadcast = (prevFunnelRows as typeof funnelRows).filter((r) => r.received_broadcast).length;
    const prevSignups = (prevFunnelRows as typeof funnelRows).filter((r) => r.signup_completed).length;

    const delta = (cur: number, prev: number) =>
      prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

    return {
      total, wa, trial, placement, pricing, broadcast, signups,
      deltas: {
        total: delta(total, prevTotal),
        wa: delta(wa, prevWa),
        trial: delta(trial, prevTrial),
        placement: delta(placement, prevPlacement),
        pricing: delta(pricing, prevPricing),
        broadcast: delta(broadcast, prevBroadcast),
        signups: delta(signups, prevSignups),
      },
    };
  }, [funnelRows]);

  // Source breakdown for the "sources" tab
  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, { clicks: number; pages: Set<string>; labels: Set<string> }>();
    for (const e of events) {
      const entry = map.get(e.source_type) ?? { clicks: 0, pages: new Set(), labels: new Set() };
      entry.clicks++;
      entry.pages.add(e.source_page);
      if (e.cta_label) entry.labels.add(e.cta_label);
      map.set(e.source_type, entry);
    }
    return Array.from(map.entries())
      .map(([type, v]) => ({ type, clicks: v.clicks, pages: v.pages.size, labels: Array.from(v.labels) }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [events]);

  // Campaign breakdown
  const campaignBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const src = e.campaign || e.utm_source || "direct";
      map.set(src, (map.get(src) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [events]);

  // Enrollment acquisition source breakdown
  const enrollmentSourceBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>();
    for (const e of enrollments) {
      const src = e.acquisition_source ?? "unknown";
      const entry = map.get(src) ?? { total: 0, approved: 0 };
      entry.total++;
      if (e.status === "APPROVED") entry.approved++;
      map.set(src, entry);
    }
    return Array.from(map.entries())
      .map(([source, v]) => ({ source, ...v, convRate: v.total === 0 ? 0 : Math.round((v.approved / v.total) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [enrollments]);

  // Daily event volume trend (last 14 days) — for the trend bar chart
  const dailyEventTrend = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      if (map.has(day)) map.set(day, (map.get(day) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));
  }, [events]);

  // Paginated events
  const pagedEvents = useMemo(() => {
    const start = eventsPage * PAGE_SIZE;
    return events.slice(start, start + PAGE_SIZE);
  }, [events, eventsPage]);

  const totalPages = Math.ceil(events.length / PAGE_SIZE);

  // CSV export
  const exportEventsCSV = () => {
    if (events.length === 0) return;
    const headers = ["created_at", "source_type", "source_page", "cta_label", "campaign", "utm_source", "session_id", "user_id"];
    const rows = events.map((e) =>
      headers.map((h) => JSON.stringify((e as unknown as Record<string, unknown>)[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead_events_${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = eventsLoading || funnelLoading;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Lead Funnel Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => { setRange(v as typeof range); setEventsPage(0); }}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: "Sessions", value: stats.total, icon: Eye, color: "text-slate-600", deltaKey: "total" as const },
          { label: "WhatsApp Clicks", value: stats.wa, icon: MousePointerClick, color: "text-green-600", deltaKey: "wa" as const },
          { label: "Placement Starts", value: stats.placement, icon: TrendingUp, color: "text-purple-600", deltaKey: "placement" as const },
          { label: "Free Trial Clicks", value: stats.trial, icon: MousePointerClick, color: "text-blue-600", deltaKey: "trial" as const },
          { label: "Pricing Views", value: stats.pricing, icon: Eye, color: "text-amber-600", deltaKey: "pricing" as const },
          { label: "Broadcast Sent", value: stats.broadcast, icon: Mail, color: "text-indigo-600", sub: pct(stats.broadcast, stats.total), deltaKey: "broadcast" as const },
          { label: "Signups", value: stats.signups, icon: UserPlus, color: "text-rose-600", sub: pct(stats.signups, stats.total), deltaKey: "signups" as const },
        ].map((kpi) => {
          const d = stats.deltas?.[kpi.deltaKey] ?? null;
          return (
          <Card key={kpi.label} className="rounded-xl">
            <CardContent className="p-3">
              {loading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {kpi.value}
                    {kpi.sub && <span className="text-xs font-normal text-muted-foreground ml-1">({kpi.sub})</span>}
                  </div>
                  {d !== null && range !== "all" && (
                    <div className={`text-[10px] font-medium mt-0.5 ${d >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {d >= 0 ? "▲" : "▼"} {Math.abs(d)}% vs prev
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 border rounded-lg p-0.5 w-fit flex-wrap">
        {(["funnel", "events", "sources", "enrollments"] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setActiveView(v); setEventsPage(0); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeView === v
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {v === "funnel" ? "Funnel Sessions" : v === "events" ? "Raw Events" : v === "sources" ? "Source Breakdown" : "Enrollment Sources"}
          </button>
        ))}
      </div>

      {/* ── Funnel sessions view ─────────────────────────────────────────── */}
      {activeView === "funnel" && (
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session Funnel ({funnelRows.length} sessions)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">First Seen</TableHead>
                    <TableHead className="text-xs">Touchpoints</TableHead>
                    <TableHead className="text-xs text-center">WA</TableHead>
                    <TableHead className="text-xs text-center">Trial</TableHead>
                    <TableHead className="text-xs text-center">Placement</TableHead>
                    <TableHead className="text-xs text-center">Pricing</TableHead>
                    <TableHead className="text-xs text-center">Signed Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : funnelRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No lead sessions yet. Events will appear once visitors interact with CTAs.
                      </TableCell>
                    </TableRow>
                  ) : (
                    funnelRows.slice(0, 50).map((r) => (
                      <TableRow key={r.session_id}>
                        <TableCell className="text-xs whitespace-nowrap">{fmt(r.first_seen)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(r.touchpoints ?? []).map((t) => (
                              <Badge key={t} variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[t] ?? ""}`}>
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{r.clicked_whatsapp ? "✓" : ""}</TableCell>
                        <TableCell className="text-center">{r.clicked_free_trial ? "✓" : ""}</TableCell>
                        <TableCell className="text-center">{r.started_placement ? "✓" : ""}</TableCell>
                        <TableCell className="text-center">{r.viewed_pricing_cta ? "✓" : ""}</TableCell>
                        <TableCell className="text-center">
                          {r.signup_completed ? (
                            <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">Yes</Badge>
                          ) : ""}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Raw events view ──────────────────────────────────────────────── */}
      {activeView === "events" && (
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Raw Events ({events.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={exportEventsCSV} disabled={events.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Page</TableHead>
                    <TableHead className="text-xs">CTA</TableHead>
                    <TableHead className="text-xs">Campaign</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : pagedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No events in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedEvents.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">{fmt(e.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[e.source_type] ?? ""}`}>
                            {e.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{e.source_page}</TableCell>
                        <TableCell className="text-xs">{e.cta_label ?? "—"}</TableCell>
                        <TableCell className="text-xs">{e.campaign || e.utm_source || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{e.user_id ? e.user_id.slice(0, 8) + "…" : "anon"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Page {eventsPage + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" disabled={eventsPage === 0} onClick={() => setEventsPage((p) => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={eventsPage >= totalPages - 1} onClick={() => setEventsPage((p) => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Source breakdown view ─────────────────────────────────────────── */}
      {activeView === "sources" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* By source type */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Source Type</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs text-right">Clicks</TableHead>
                    <TableHead className="text-xs text-right">Pages</TableHead>
                    <TableHead className="text-xs">CTAs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceBreakdown.map((s) => (
                    <TableRow key={s.type}>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[s.type] ?? ""}`}>
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">{s.clicks}</TableCell>
                      <TableCell className="text-right text-xs">{s.pages}</TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {s.labels.slice(0, 5).map((l) => (
                            <span key={l} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{l}</span>
                          ))}
                          {s.labels.length > 5 && (
                            <span className="text-muted-foreground text-[10px]">+{s.labels.length - 5}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sourceBreakdown.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* By campaign / utm_source */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Campaign / UTM Source</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs text-right">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignBreakdown.map((c) => (
                    <TableRow key={c.source}>
                      <TableCell className="text-xs">{c.source}</TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">{c.count}</TableCell>
                    </TableRow>
                  ))}
                  {campaignBreakdown.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Enrollment sources view ────────────────────────────────────────── */}
      {activeView === "enrollments" && (
        <div className="space-y-4">
          {/* Daily event volume trend */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily Lead Event Volume — Last 14 Days</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dailyEventTrend} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: number) => [value, "Events"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Enrollment acquisition source breakdown */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Enrollment Acquisition Sources ({enrollments.length} enrollments)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Acquisition Source</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Approved</TableHead>
                    <TableHead className="text-xs text-right">Conv. Rate</TableHead>
                    <TableHead className="text-xs text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : enrollmentSourceBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No enrollment data in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollmentSourceBreakdown.map((s) => (
                      <TableRow key={s.source}>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[s.source] ?? "bg-gray-100 text-gray-700"}`}>
                            {s.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">{s.total}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{s.approved}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          <span className={s.convRate >= 50 ? "text-green-600 font-semibold" : s.convRate >= 25 ? "text-amber-600" : "text-muted-foreground"}>
                            {s.convRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct(s.total, enrollments.length)}` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {pct(s.total, enrollments.length)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LeadFunnelPanel;
