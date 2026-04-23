import { useMemo, useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, DollarSign, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { AT_RISK_SESSION_THRESHOLD } from "@/lib/admin-utils";
import type { OverviewRow } from "@/types/admin";

interface Props {
  overviewRows: OverviewRow[];
}

const waLink = (name: string, email: string) =>
  `${WHATSAPP_BASE}?text=${encodeURIComponent(`Hi ${name || "there"}! We noticed you're running low on sessions. Ready to continue your Korean journey? 🇰🇷`)}`;

const StudentHealthPanel = ({ overviewRows }: Props) => {
  const [openCard, setOpenCard] = useState<string | null>(null);

  const activeRows = useMemo(
    () => overviewRows.filter(r => r.approval_status === "APPROVED" && r.derived_status !== "COMPLETED"),
    [overviewRows]
  );

  const atRisk = useMemo(
    () => activeRows.filter(r => r.sessions_remaining <= AT_RISK_SESSION_THRESHOLD && r.sessions_remaining > 0),
    [activeRows]
  );

  const expiring = useMemo(
    () => activeRows.filter(r => r.sessions_remaining === 0),
    [activeRows]
  );

  const avgUnitPrice = useMemo(() => {
    const withPrice = activeRows.filter(r => r.unit_price && r.unit_price > 0);
    if (!withPrice.length) return 0;
    return withPrice.reduce((s, r) => s + (r.unit_price ?? 0), 0) / withPrice.length;
  }, [activeRows]);

  const renewalPipelineValue = Math.round(atRisk.length * avgUnitPrice);

  const cards = [
    {
      key: "at-risk",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800/40",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      count: atRisk.length,
      label: "At-Risk Students",
      sublabel: `≤${AT_RISK_SESSION_THRESHOLD} sessions remaining`,
      rows: atRisk,
    },
    {
      key: "expiring",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800/40",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      count: expiring.length,
      label: "Expiring Students",
      sublabel: "0 sessions left",
      rows: expiring,
    },
  ];

  if (atRisk.length === 0 && expiring.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student Health</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map(({ key, icon: Icon, iconColor, bgColor, borderColor, badgeClass, count, label, sublabel, rows }) => (
          <Card
            key={key}
            className={`rounded-2xl border ${borderColor} ${bgColor} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => setOpenCard(openCard === key ? null : key)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                  <div>
                    <p className="text-2xl font-black text-foreground leading-none">{count}</p>
                    <p className="text-xs font-semibold text-foreground/80 mt-0.5">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sublabel}</p>
                  </div>
                </div>
                {count > 0 && (
                  openCard === key ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                )}
              </div>

              {openCard === key && rows.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3" onClick={e => e.stopPropagation()}>
                  {rows.slice(0, 8).map(r => (
                    <div key={r.user_id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground truncate block">{r.name || r.email}</span>
                        <span className="text-muted-foreground truncate block">{r.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={`text-[10px] border ${badgeClass}`}>
                          {r.sessions_remaining} left
                        </Badge>
                        <a
                          href={waLink(r.name, r.email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md bg-green-500/10 hover:bg-green-500/20 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3 text-green-600" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {rows.length > 8 && (
                    <p className="text-[11px] text-muted-foreground text-center pt-1">+{rows.length - 8} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Renewal Pipeline Value */}
        <Card className="rounded-2xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <DollarSign className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <div>
                <p className="text-2xl font-black text-foreground leading-none">
                  {avgUnitPrice > 0
                    ? `$${renewalPipelineValue.toLocaleString()}`
                    : "—"}
                </p>
                <p className="text-xs font-semibold text-foreground/80 mt-0.5">Renewal Pipeline</p>
                <p className="text-[11px] text-muted-foreground">{atRisk.length} at-risk × avg price</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(StudentHealthPanel);
