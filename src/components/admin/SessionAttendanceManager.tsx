import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronLeft, ChevronRight, Plus, Loader2, Users, RefreshCw
} from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;
type AttendanceStatus = typeof STATUS_OPTIONS[number] | "unmarked";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  present:  { label: "Present",  color: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  absent:   { label: "Absent",   color: "bg-red-100 text-red-700 border-red-200",         icon: XCircle      },
  late:     { label: "Late",     color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock        },
  excused:  { label: "Excused",  color: "bg-blue-100 text-blue-700 border-blue-200",      icon: AlertCircle  },
  unmarked: { label: "Unmarked", color: "bg-muted text-muted-foreground border-border",   icon: CalendarDays },
};

interface Group {
  id: string;
  name: string;
  package_id: string;
  level: string;
  day_of_week: number;
  start_time: string;
}

interface SessionSummary {
  session_id: string;
  session_date: string;
  marked_count: number;
  present_count: number;
  total_members: number;
}

interface RosterRow {
  user_id: string;
  full_name: string;
  email: string;
  attendance_status: AttendanceStatus;
  admin_approved: boolean;
}

import { formatTime, convertSlotToTimezone } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";

function formatDate(d: string) {
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const SessionAttendanceManager = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weeksAhead, setWeeksAhead] = useState(8);

  // Load all active groups with package info
  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("pkg_groups")
        .select("id, name, package_id, schedule_packages(level, day_of_week, start_time)")
        .eq("is_active", true)
        .order("name");

      if (data) {
        setGroups(data.map((g: any) => ({
          id: g.id,
          name: g.name,
          package_id: g.package_id,
          level: g.schedule_packages?.level || "",
          day_of_week: g.schedule_packages?.day_of_week ?? 0,
          start_time: g.schedule_packages?.start_time || "",
        })));
      }
    };
    load();
  }, []);

  // Load sessions for selected group
  const loadSessions = useCallback(async (groupId: string) => {
    if (!groupId) return;
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_group_sessions", { p_group_id: groupId });
    if (!error && data) setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      setSessions([]);
      setSelectedSessionId("");
      setRoster([]);
      setAttendance({});
      loadSessions(selectedGroupId);
    }
  }, [selectedGroupId, loadSessions]);

  // Load roster for selected session
  useEffect(() => {
    if (!selectedSessionId) { setRoster([]); setAttendance({}); return; }
    const load = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("get_session_roster", { p_session_id: selectedSessionId });
      if (!error && data) {
        setRoster(data);
        const initial: Record<string, AttendanceStatus> = {};
        data.forEach((r: RosterRow) => { initial[r.user_id] = r.attendance_status; });
        setAttendance(initial);
      }
      setLoading(false);
    };
    load();
  }, [selectedSessionId]);

  // Generate sessions
  const handleGenerate = async () => {
    if (!selectedGroupId) return;
    setGenerating(true);
    const { data, error } = await (supabase as any).rpc("generate_sessions_for_group", {
      p_group_id:   selectedGroupId,
      p_start_date: new Date().toISOString().split("T")[0],
      p_weeks:      weeksAhead,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sessions Generated", description: `${data} new sessions created.` });
      loadSessions(selectedGroupId);
    }
    setGenerating(false);
  };

  // Save attendance
  const handleSave = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    const records = Object.entries(attendance)
      .filter(([, s]) => s !== "unmarked")
      .map(([user_id, status]) => ({ user_id, status }));

    const { error } = await (supabase as any).rpc("save_session_attendance", {
      p_session_id: selectedSessionId,
      p_records:    records,
    });

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance Saved ✓", description: `${records.length} records saved.` });
      loadSessions(selectedGroupId);
    }
    setSaving(false);
  };

  // Mark all at once
  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    roster.forEach(r => { updated[r.user_id] = status; });
    setAttendance(updated);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedSession = sessions.find(s => s.session_id === selectedSessionId);
  const sessionIndex = sessions.findIndex(s => s.session_id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Session Attendance
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Generate sessions and mark attendance per session</p>
        </div>
      </div>

      {/* Group selector */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Select Group</label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group…" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {(() => { const adminTz = getAdminTimezone(); const l = convertSlotToTimezone(g.day_of_week, g.start_time, "Africa/Cairo", adminTz); return `${g.name} — ${g.level} · ${l.weekday.slice(0,3)} ${l.timeFormatted}`; })()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroupId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Generate Sessions</label>
                <div className="flex gap-2">
                  <Select value={String(weeksAhead)} onValueChange={v => setWeeksAhead(Number(v))}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 8, 12, 16, 24].map(w => (
                        <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerate} disabled={generating} variant="secondary">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {generating ? "Generating…" : "Generate"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => loadSessions(selectedGroupId)} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session list + attendance side-by-side */}
      {selectedGroupId && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Sessions list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Sessions
                {sessions.length > 0 && <Badge variant="secondary">{sessions.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !sessions.length ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No sessions yet — click Generate above
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                  {sessions.map(s => {
                    const isSelected = s.session_id === selectedSessionId;
                    const isPast = new Date(s.session_date) < new Date();
                    const allMarked = s.marked_count >= s.total_members && s.total_members > 0;
                    return (
                      <button
                        key={s.session_id}
                        onClick={() => setSelectedSessionId(s.session_id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{formatDate(s.session_date)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {s.marked_count}/{s.total_members} marked · {s.present_count} present
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {!isPast && (
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Upcoming</Badge>
                            )}
                            {isPast && allMarked && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">Done ✓</Badge>
                            )}
                            {isPast && !allMarked && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Pending</Badge>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        {s.total_members > 0 && (
                          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(s.marked_count / s.total_members) * 100}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance marking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {selectedSession ? (
                  <span>Mark Attendance — {formatDate(selectedSession.session_date)}</span>
                ) : (
                  <span>Select a session</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSessionId ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Click a session on the left to mark attendance
                </div>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No active students in this group
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick mark all */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground self-center">Mark all:</span>
                    {STATUS_OPTIONS.map(s => (
                      <Button key={s} size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAll(s)}>
                        {STATUS_CONFIG[s].label}
                      </Button>
                    ))}
                  </div>

                  {/* Student rows */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {roster.map(student => {
                      const status = attendance[student.user_id] || "unmarked";
                      const cfg = STATUS_CONFIG[status];
                      return (
                        <div key={student.user_id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                          <Select
                            value={status}
                            onValueChange={(v) => setAttendance(prev => ({ ...prev, [student.user_id]: v as AttendanceStatus }))}
                          >
                            <SelectTrigger className={`w-32 h-8 text-xs border ${cfg.color}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[...STATUS_OPTIONS, "unmarked" as const].map(s => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {STATUS_CONFIG[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Session navigation + save */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex gap-1">
                      <Button
                        size="icon" variant="outline"
                        disabled={sessionIndex <= 0}
                        onClick={() => setSelectedSessionId(sessions[sessionIndex - 1].session_id)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="outline"
                        disabled={sessionIndex >= sessions.length - 1}
                        onClick={() => setSelectedSessionId(sessions[sessionIndex + 1].session_id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {saving ? "Saving…" : "Save Attendance"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default memo(SessionAttendanceManager);
