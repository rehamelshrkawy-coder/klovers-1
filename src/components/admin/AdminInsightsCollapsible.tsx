import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart3, Tag, ChevronDown } from "lucide-react";
import type { OverviewRow } from "@/types/admin";

const StudentHealthPanel = lazy(() => import("@/components/admin/StudentHealthPanel"));

interface ReferrerBreakdown {
  userId: string;
  conversions: number;
  clicks: number;
  bonusPercent: number;
}

export interface ReferralStats {
  total: number;
  thisMonth: number;
  totalClicks: number;
  clicksThisMonth: number;
  perUser: ReferrerBreakdown[];
}

interface AdminInsightsCollapsibleProps {
  overviewRows: OverviewRow[];
  referralStats: ReferralStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Collapsible "Insights" panel shown above the main admin tabs.
 * Renders the StudentHealthPanel (lazy-loaded) and the Referral Program stats card.
 * Returns null when there is no data worth showing.
 */
export function AdminInsightsCollapsible({
  overviewRows,
  referralStats,
  open,
  onOpenChange,
}: AdminInsightsCollapsibleProps) {
  if (overviewRows.length === 0 && referralStats.total === 0 && referralStats.totalClicks === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2.5 text-sm transition-colors">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Insights</span>
          <span className="text-xs text-muted-foreground">
            Student health · Referrals ({referralStats.total})
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-6 pt-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <Suspense fallback={<div className="h-20 rounded-xl bg-muted/30 animate-pulse" />}>
          <StudentHealthPanel overviewRows={overviewRows} />
        </Suspense>

        {(referralStats.total > 0 || referralStats.totalClicks > 0) && (
          <div className="rounded-2xl border border-border bg-card px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 shrink-0">
                <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Referral Program</p>
                <p className="font-semibold text-sm text-foreground">
                  {referralStats.total} conversion{referralStats.total !== 1 ? "s" : ""} · {referralStats.totalClicks} link click{referralStats.totalClicks !== 1 ? "s" : ""}
                  {referralStats.thisMonth > 0 && (
                    <span className="text-green-600 dark:text-green-400 ml-2">
                      · +{referralStats.thisMonth} this month
                    </span>
                  )}
                  {referralStats.clicksThisMonth > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 ml-1">
                      · {referralStats.clicksThisMonth} click{referralStats.clicksThisMonth !== 1 ? "s" : ""} this month
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-bold text-foreground">{referralStats.total}</p>
                <p className="text-[10px] text-muted-foreground">Friends Enrolled</p>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">+5% each</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-bold text-foreground">
                  {Math.max(0, referralStats.totalClicks - referralStats.total)}
                </p>
                <p className="text-[10px] text-muted-foreground">Link-Only Visitors</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">+2% each</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                <p className="text-lg font-bold text-foreground">{referralStats.perUser.length}</p>
                <p className="text-[10px] text-muted-foreground">Active Referrers</p>
                <p className="text-[10px] text-muted-foreground">max 15% bonus</p>
              </div>
            </div>

            {/* Per-user breakdown table */}
            {referralStats.perUser.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Top referrers</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/40">
                        <th className="text-start pb-1.5 font-medium">User</th>
                        <th className="text-center pb-1.5 font-medium">Enrolled</th>
                        <th className="text-center pb-1.5 font-medium">Clicks</th>
                        <th className="text-end pb-1.5 font-medium">Bonus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralStats.perUser.slice(0, 10).map((u) => (
                        <tr key={u.userId} className="border-b border-border/20 last:border-0">
                          <td className="py-1.5 font-mono text-muted-foreground">{u.userId.slice(0, 8)}...</td>
                          <td className="py-1.5 text-center text-foreground">{u.conversions}</td>
                          <td className="py-1.5 text-center text-foreground">{u.clicks}</td>
                          <td className="py-1.5 text-end">
                            <span
                              className={`font-semibold ${
                                u.bonusPercent >= 10
                                  ? "text-green-600 dark:text-green-400"
                                  : u.bonusPercent > 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              +{u.bonusPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  Formula: (enrolled x 5%) + (click-only visitors x 2%), capped at 15%. Stacks with 20% promo code for up to 35% total.
                </p>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
