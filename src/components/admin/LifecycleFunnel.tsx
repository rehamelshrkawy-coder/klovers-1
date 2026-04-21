import { memo } from "react";
import { UserPlus, Users, CreditCard, GraduationCap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelProps {
  leadsCount: number;
  registeredCount: number;
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount?: number;
  onPendingClick?: () => void;
}

const stages = [
  { key: "leads", label: "Leads", icon: UserPlus, accent: "bg-blue-500", light: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { key: "registered", label: "Registered", icon: Users, accent: "bg-blue-500", light: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { key: "enrolled", label: "Enrolled", icon: CreditCard, accent: "bg-amber-500", light: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { key: "active", label: "Active", icon: GraduationCap, accent: "bg-green-500", light: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  { key: "completed", label: "Completed", icon: Award, accent: "bg-primary", light: "bg-primary/10", text: "text-primary" },
];

const LifecycleFunnel = ({ leadsCount, registeredCount, enrolledCount, activeCount, completedCount, pendingCount, onPendingClick }: FunnelProps) => {
  const counts: Record<string, number> = {
    leads: leadsCount,
    registered: registeredCount,
    enrolled: enrolledCount,
    active: activeCount,
    completed: completedCount,
  };
  const total = Math.max(leadsCount, 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isEnrolled = stage.key === "enrolled";
        const hasPending = isEnrolled && pendingCount && pendingCount > 0;
        const count = counts[stage.key];
        const pct = idx === 0 ? 100 : Math.round((count / total) * 100);
        return (
          <Card
            key={stage.key}
            className={`rounded-2xl overflow-hidden transition-all ${hasPending ? "cursor-pointer border-amber-400/60 hover:border-amber-500 hover:shadow-md" : "hover:shadow-sm"}`}
            onClick={hasPending ? onPendingClick : undefined}
          >
            <CardContent className="p-0">
              {/* Color bar at top */}
              <div className={`h-1 ${stage.accent}`} style={{ width: `${pct}%`, minWidth: "8px", transition: "width 0.4s ease" }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`rounded-xl p-2 ${stage.light} shrink-0`}>
                    <Icon className={`h-4 w-4 ${stage.text}`} />
                  </div>
                  {hasPending && (
                    <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none shrink-0">
                      +{pendingCount}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-black text-foreground leading-none tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                  {stage.label}
                </p>
                {idx > 0 && (
                  <p className={`text-[10px] mt-0.5 font-semibold ${stage.text}`}>{pct}% of leads</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default memo(LifecycleFunnel);
