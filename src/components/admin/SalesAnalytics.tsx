import { useEffect, useState, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, CreditCard, BarChart3, ArrowUpRight, ArrowDownRight, Download, AlertCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import type { Enrollment } from "@/types/admin";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 24%))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 27 87% 67%))",
  "hsl(12 76% 61%)",
];

const SalesAnalytics = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6");

  useEffect(() => {
    const fetch = async () => {
      const [eRes, lRes, pRes] = await Promise.all([
        supabase.from("enrollments").select("id,user_id,plan_type,duration,classes_included,amount,currency,payment_status,approval_status,payment_provider,created_at,level,enrollment_status,sessions_remaining,sessions_total,unit_price,payment_date,profiles(name,email)"),
        supabase.from("leads").select("id,status,created_at,user_id"),
        supabase.from("profiles").select("user_id,status,created_at"),
      ]);
      setEnrollments((eRes.data as any[]) || []);
      setLeads((lRes.data as any[]) || []);
      setProfiles((pRes.data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const months = parseInt(range);
  const now = useMemo(() => new Date(), []);

  const paidEnrollments = useMemo(() =>
    enrollments.filter(e => e.payment_status === "PAID" && e.approval_status === "APPROVED"),
    [enrollments]
  );

  // Revenue over time
  const revenueByMonth = useMemo(() => {
    const data: { month: string; revenue: number; count: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, "MMM yyyy");
      const inRange = paidEnrollments.filter(e => {
        const cd = parseISO(e.created_at);
        return isWithinInterval(cd, { start, end });
      });
      data.push({ month: label, revenue: inRange.reduce((s, e) => s + Number(e.amount), 0), count: inRange.length });
    }
    return data;
  }, [paidEnrollments, months, now]);

  const activeStudents = paidEnrollments.filter(e => (e.sessions_remaining ?? 0) > 0).length;

  const prevMonthActiveEnrollments = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    return paidEnrollments.filter(e => {
      const cd = parseISO(e.created_at);
      return isWithinInterval(cd, { start: lastMonthStart, end: lastMonthEnd });
    }).length;
  }, [paidEnrollments, now]);

  const totalRevenue = paidEnrollments.reduce((s, e) => s + Number(e.amount), 0);
  const avgOrderValue = paidEnrollments.length > 0 ? totalRevenue / paidEnrollments.length : 0;

  const currentMonthRevenue = revenueByMonth[revenueByMonth.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = revenueByMonth[revenueByMonth.length - 2]?.revenue ?? 0;
  const revenueGrowth = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  // Plan breakdown with MoM
  const planBreakdown = useMemo(() => {
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const map: Record<string, { count: number; revenue: number; thisMonth: number; lastMonth: number }> = {};
    paidEnrollments.forEach(e => {
      const key = `${e.plan_type} – ${e.duration}mo`;
      if (!map[key]) map[key] = { count: 0, revenue: 0, thisMonth: 0, lastMonth: 0 };
      map[key].count++;
      map[key].revenue += Number(e.amount);
      const cd = parseISO(e.created_at);
      if (isWithinInterval(cd, { start: thisMonthStart, end: thisMonthEnd })) map[key].thisMonth++;
      else if (isWithinInterval(cd, { start: lastMonthStart, end: lastMonthEnd })) map[key].lastMonth++;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [paidEnrollments, now]);

  // Group vs Private pie
  const typePie = useMemo(() => {
    const group = paidEnrollments.filter(e => e.plan_type === "group");
    const priv = paidEnrollments.filter(e => e.plan_type === "private");
    return [
      { name: "Group", value: group.length, revenue: group.reduce((s, e) => s + Number(e.amount), 0) },
      { name: "Private", value: priv.length, revenue: priv.reduce((s, e) => s + Number(e.amount), 0) },
    ];
  }, [paidEnrollments]);

  // Provider pie
  const providerPie = useMemo(() => {
    const map: Record<string, number> = {};
    paidEnrollments.forEach(e => {
      const p = e.payment_provider || "manual";
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [paidEnrollments]);

  // Conversion funnel
  const funnel = useMemo(() => ({
    leads: leads.length,
    registered: profiles.length,
    enrolled: enrollments.length,
    active: paidEnrollments.filter(e => e.enrollment_status === "active").length,
    completed: enrollments.filter(e => e.enrollment_status === "completed" || e.enrollment_status === "expired").length,
  }), [leads, profiles, enrollments, paidEnrollments]);

  const conversionRates = useMemo(() => [
    { stage: "Lead → Registered", rate: funnel.leads > 0 ? ((funnel.registered / funnel.leads) * 100).toFixed(1) : "0" },
    { stage: "Registered → Enrolled", rate: funnel.registered > 0 ? ((funnel.enrolled / funnel.registered) * 100).toFixed(1) : "0" },
    { stage: "Enrolled → Active", rate: funnel.enrolled > 0 ? ((funnel.active / funnel.enrolled) * 100).toFixed(1) : "0" },
  ], [funnel]);

  // Currency breakdown
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    paidEnrollments.forEach(e => {
      const c = e.currency || "USD";
      if (!map[c]) map[c] = { count: 0, revenue: 0 };
      map[c].count++;
      map[c].revenue += Number(e.amount);
    });
    return Object.entries(map).map(([currency, v]) => ({ currency, ...v }));
  }, [paidEnrollments]);

  // Outstanding: UNPAID + APPROVED
  const outstandingEnrollments = useMemo(() =>
    enrollments.filter(e => e.payment_status === "UNPAID" && e.approval_status === "APPROVED"),
    [enrollments]
  );
  const outstandingTotal = outstandingEnrollments.reduce((s, e) => s + Number(e.amount), 0);

  // At-risk for renewal pipeline (sessions_remaining ≤ 3 and > 0)
  const atRiskCount = useMemo(() =>
    paidEnrollments.filter(e => (e.sessions_remaining ?? 0) <= 3 && (e.sessions_remaining ?? 0) > 0).length,
    [paidEnrollments]
  );
  const avgUnitPrice = useMemo(() => {
    const with_price = paidEnrollments.filter(e => e.unit_price && e.unit_price > 0);
    if (!with_price.length) return 0;
    return with_price.reduce((s, e) => s + (e.unit_price ?? 0), 0) / with_price.length;
  }, [paidEnrollments]);

  // Avg sessions used %
  const avgSessionsUsed = useMemo(() => {
    const withSessions = paidEnrollments.filter(e => e.sessions_total && e.sessions_total > 0);
    if (!withSessions.length) return 0;
    return withSessions.reduce((s, e) => {
      const total = e.sessions_total ?? 0;
      const used = total - (e.sessions_remaining ?? 0);
      return s + (used / total) * 100;
    }, 0) / withSessions.length;
  }, [paidEnrollments]);

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Sales Analytics</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* NEW: Outstanding */}
        <Card className="rounded-2xl border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-red-500/10"><AlertCircle className="h-4 w-4 text-red-600" /></div>
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${outstandingTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{outstandingEnrollments.length} unpaid approved</p>
          </CardContent>
        </Card>
        {/* NEW: Renewal Pipeline */}
        <Card className="rounded-2xl border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-amber-500/10"><RefreshCw className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Renewal Pipeline</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${Math.round(atRiskCount * avgUnitPrice).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{atRiskCount} at-risk × avg price</p>
          </CardContent>
        </Card>
        {/* NEW: Avg Sessions Used */}
        <Card className="rounded-2xl border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-blue-500/10"><BarChart3 className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">Avg Sessions Used</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{avgSessionsUsed.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">of total sessions per student</p>
          </CardContent>
        </Card>
      </div>

      {/* Original KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-green-500/10"><DollarSign className="h-4 w-4 text-green-600" /></div>
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-blue-500/10"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${currentMonthRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              {revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <span className={`text-xs ${revenueGrowth >= 0 ? "text-green-600" : "text-destructive"}`}>{Math.abs(revenueGrowth).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-amber-500/10"><CreditCard className="h-4 w-4 text-amber-600" /></div>
              <span className="text-xs text-muted-foreground">Avg Order</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${avgOrderValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-primary/10"><Users className="h-4 w-4 text-primary" /></div>
              <span className="text-xs text-muted-foreground">Paid Students</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{paidEnrollments.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-teal-500/10"><BarChart3 className="h-4 w-4 text-teal-600" /></div>
              <span className="text-xs text-muted-foreground">Active Students</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeStudents}</p>
            <div className="flex items-center gap-1 mt-1">
              {activeStudents >= prevMonthActiveEnrollments
                ? <ArrowUpRight className="h-3 w-3 text-green-600" />
                : <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <span className={`text-xs ${activeStudents >= prevMonthActiveEnrollments ? "text-green-600" : "text-destructive"}`}>vs {prevMonthActiveEnrollments} last mo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue List */}
      {outstandingEnrollments.length > 0 && (
        <Card className="rounded-2xl border-red-200 dark:border-red-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Unpaid Approved Enrollments ({outstandingEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2 px-4">Student</TableHead>
                    <TableHead className="py-2 px-4">Amount</TableHead>
                    <TableHead className="py-2 px-4 hidden sm:table-cell">Days Overdue</TableHead>
                    <TableHead className="py-2 px-4 text-right">Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingEnrollments.slice(0, 10).map(e => {
                    const daysSince = e.payment_date
                      ? Math.floor((Date.now() - new Date(e.payment_date).getTime()) / 86400000)
                      : Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
                    const name = (e.profiles as any)?.name || (e.profiles as any)?.email || "—";
                    const email = (e.profiles as any)?.email || "";
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="py-2 px-4">
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <span className="font-mono text-sm text-destructive font-semibold">
                            {e.currency === "EGP" ? "LE" : "$"}{Number(e.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-4 hidden sm:table-cell">
                          <Badge variant={daysSince > 14 ? "destructive" : "secondary"} className="text-xs">
                            {daysSince}d
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right">
                          {email && (
                            <a
                              href={`${WHATSAPP_BASE}?text=${encodeURIComponent(`Hi ${name}! This is a reminder about your pending payment for the Korean course. Please let us know if you need any help completing it.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number, _name: string, props: any) => [`$${v.toLocaleString()} (${props.payload.count} enrollments)`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0 md:justify-between">
            {[
              { label: "Leads", count: funnel.leads, color: "bg-blue-500" },
              { label: "Registered", count: funnel.registered, color: "bg-blue-500" },
              { label: "Enrolled", count: funnel.enrolled, color: "bg-amber-500" },
              { label: "Active", count: funnel.active, color: "bg-green-500" },
              { label: "Completed", count: funnel.completed, color: "bg-primary" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2 md:gap-3">
                <div className="text-center">
                  <div className={`${s.color} text-primary-foreground rounded-xl px-4 py-2 text-lg font-bold min-w-[60px]`}>{s.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-xs text-muted-foreground font-medium hidden md:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {conversionRates.map(cr => (
              <div key={cr.stage} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-lg font-bold text-foreground">{cr.rate}%</p>
                <p className="text-xs text-muted-foreground">{cr.stage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Group vs Private */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Group vs Private</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typePie} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string, props: any) => [`${v} enrollments ($${props.payload.revenue})`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Provider */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payment Provider</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={providerPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {providerPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan breakdown table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Plan Breakdown</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => {
            const headers = ["Plan", "Enrollments", "Revenue", "Avg", "MoM %"];
            const rows = planBreakdown.map(p => {
              const mom = p.lastMonth > 0 ? ((p.thisMonth - p.lastMonth) / p.lastMonth * 100).toFixed(0) + "%" : p.thisMonth > 0 ? "New" : "—";
              return [p.name, p.count, p.revenue, (p.revenue / p.count).toFixed(0), mom];
            });
            const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `plan-breakdown-${new Date().toISOString().slice(0,10)}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Enrollments</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">MoM %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planBreakdown.map(p => {
                const mom = p.lastMonth > 0 ? ((p.thisMonth - p.lastMonth) / p.lastMonth * 100) : null;
                const momLabel = mom !== null ? `${mom >= 0 ? "+" : ""}${mom.toFixed(0)}%` : p.thisMonth > 0 ? "New" : "—";
                const momColor = mom !== null ? (mom >= 0 ? "text-green-600" : "text-destructive") : p.thisMonth > 0 ? "text-blue-600" : "text-muted-foreground";
                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.count}</TableCell>
                    <TableCell className="text-right">${p.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${(p.revenue / p.count).toFixed(0)}</TableCell>
                    <TableCell className="text-right">
                      <span className={momColor}>{momLabel}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency breakdown */}
      {currencyBreakdown.length > 1 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Currency</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currencyBreakdown.map(c => (
                <div key={c.currency} className="p-3 rounded-xl bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{c.revenue.toLocaleString()} {c.currency}</p>
                  <p className="text-xs text-muted-foreground">{c.count} enrollments</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(SalesAnalytics);
