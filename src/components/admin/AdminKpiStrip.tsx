import { useMemo } from "react";
import { Users, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { AT_RISK_SESSION_THRESHOLD } from "@/lib/admin-utils";
import type { OverviewRow } from "@/types/admin";

interface Props {
  overviewRows: OverviewRow[];
  actionableEnrollments: number;
  isLoading: boolean;
}

interface KpiCard {
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  sublabel?: string;
  alert?: boolean;
}

export function AdminKpiStrip({ overviewRows, actionableEnrollments, isLoading }: Props) {
  const kpis = useMemo<KpiCard[]>(() => {
    const activeRows = overviewRows.filter(r => r.derived_status === "ACTIVE");
    const atRisk = activeRows.filter(
      r => r.sessions_remaining <= AT_RISK_SESSION_THRESHOLD && r.sessions_remaining > 0
    );
    const locked = overviewRows.filter(r => r.derived_status === "LOCKED");

    // Revenue: sum of amount from all APPROVED enrollments (amount_due = extra sessions owed)
    const totalRevenue = overviewRows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const revenueStr = totalRevenue >= 1_000_000
      ? `${(totalRevenue / 1_000_000).toFixed(1)}M`
      : totalRevenue >= 1_000
      ? `${(totalRevenue / 1_000).toFixed(0)}K`
      : String(totalRevenue);
    const currency = overviewRows.find(r => r.currency)?.currency ?? "EGP";

    return [
      {
        icon: Users,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        value: activeRows.length,
        label: "Active Students",
        sublabel: `${overviewRows.length} total`,
      },
      {
        icon: DollarSign,
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        value: `${revenueStr} ${currency}`,
        label: "Total Revenue",
        sublabel: "all enrollments",
      },
      {
        icon: AlertTriangle,
        iconBg: atRisk.length > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted",
        iconColor: atRisk.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        value: atRisk.length,
        label: "At-Risk Students",
        sublabel: `≤${AT_RISK_SESSION_THRESHOLD} sessions left`,
        alert: atRisk.length > 0,
      },
      {
        icon: TrendingUp,
        iconBg: actionableEnrollments > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted",
        iconColor: actionableEnrollments > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
        value: actionableEnrollments + locked.length,
        label: "Need Attention",
        sublabel: `${actionableEnrollments} pending · ${locked.length} locked`,
        alert: actionableEnrollments > 0 || locked.length > 0,
      },
    ];
  }, [overviewRows, actionableEnrollments]);

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      role="region"
      aria-label="Key performance indicators"
      aria-busy={isLoading}
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className={`rounded-2xl border bg-card px-4 py-3 flex items-center gap-3 transition-shadow hover:shadow-sm ${kpi.alert ? "border-amber-300/60 dark:border-amber-700/40" : "border-border"}`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
              <Icon className={`h-4 w-4 ${kpi.iconColor}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-12 bg-muted animate-pulse rounded mb-1" />
              ) : (
                <p className="text-lg font-bold text-foreground leading-tight tabular-nums">{kpi.value}</p>
              )}
              <p className="text-[11px] font-medium text-foreground/80 leading-tight truncate">{kpi.label}</p>
              {kpi.sublabel && (
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{kpi.sublabel}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
