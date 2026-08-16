import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, AlertCircle, CalendarDays } from "lucide-react";

interface SessionRow {
  attendance_id: string;
  session_id: string;
  session_date: string;
  group_name: string;
  status: string;
  source: string;
  admin_approved: boolean;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  present: { icon: CheckCircle2, label: "Present", color: "text-primary-text" },
  absent: { icon: XCircle, label: "Absent", color: "text-destructive" },
  late: { icon: Clock, label: "Late", color: "text-secondary-foreground" },
  excused: { icon: AlertCircle, label: "Excused", color: "text-muted-foreground" },
};

const StudentGroupAttendance = () => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: attendance, error } = await supabase
      .from("group_attendance")
      .select("id, session_id, status, source, admin_approved")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error || !attendance || attendance.length === 0) {
      setLoading(false);
      return;
    }

    const sessionIds = [...new Set((attendance as any[]).map(a => a.session_id))];
    const { data: sessions } = await supabase
      .from("group_sessions")
      .select("id, session_date, group_id")
      .in("id", sessionIds);

    const groupIds = [...new Set((sessions || []).map((s: any) => s.group_id))];
    const { data: groups } = await supabase
      .from("student_groups")
      .select("id, name")
      .in("id", groupIds);

    const sessionMap: Record<string, { session_date: string; group_id: string }> = {};
    (sessions || []).forEach((s: any) => { sessionMap[s.id] = s; });
    const groupMap: Record<string, string> = {};
    (groups || []).forEach((g: any) => { groupMap[g.id] = g.name; });

    const result: SessionRow[] = (attendance as any[]).map(a => {
      const sess = sessionMap[a.session_id];
      return {
        attendance_id: a.id,
        session_id: a.session_id,
        session_date: sess?.session_date || "",
        group_name: sess ? (groupMap[sess.group_id] || "") : "",
        status: a.status,
        source: a.source,
        admin_approved: a.admin_approved,
      };
    });

    const attendableRows = result.filter(r => r.status === "present" || r.status === "late");
    if (attendableRows.length > 0) {
      const activityTypes = attendableRows.map(r => `attendance_${r.session_id}`);
      const { data: existingXp } = await supabase
        .from("student_xp")
        .select("activity_type")
        .eq("user_id", session.user.id)
        .in("activity_type", activityTypes);

      const awardedSet = new Set((existingXp || []).map((x: any) => x.activity_type));

      for (const row of attendableRows) {
        const actType = `attendance_${row.session_id}`;
        if (!awardedSet.has(actType)) {
          const xp = row.status === "present" ? 25 : 10;
          await supabase.from("student_xp").insert({
            user_id: session.user.id,
            lesson_id: null,
            activity_type: actType,
            xp_earned: xp,
          });
        }
      }
    }

    setRows(result.sort((a, b) => b.session_date.localeCompare(a.session_date)));
    setLoading(false);
  };

  if (loading || rows.length === 0) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rows.map((r) => {
            const cfg = statusConfig[r.status] || statusConfig.absent;
            const Icon = cfg.icon;
            return (
              <div
                key={r.attendance_id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-muted ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatDate(r.session_date)}</p>
                    <p className="text-xs text-muted-foreground">{r.group_name}</p>
                  </div>
                </div>
                <Badge variant={
                  r.status === "present" ? "default"
                  : r.status === "late" ? "secondary"
                  : r.status === "excused" ? "outline"
                  : "destructive"
                }>
                  {cfg.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentGroupAttendance;
