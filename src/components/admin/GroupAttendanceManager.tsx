import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { getLevelShortLabel, LEVEL_SELECT_OPTIONS, LEVEL_KEYS } from "@/constants/levels";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCheck, RefreshCw, UserCheck, UserX, Pencil, Users, Trash2, UserPlus, Clock, ChevronDown, ChevronRight, Check, X, Undo2, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAttendancePanel from "@/components/admin/AdminAttendancePanel";
import type { AttendanceRow, AttendanceReq, GroupMember, OverviewRow } from "@/types/admin";
import { formatTime, getAttendanceStatusColor as statusColor, convertSlotToTimezone } from "@/lib/admin-utils";
import { getAdminTimezone } from "@/lib/viewerTimezone";

interface GroupPackageInfo {
  package_id: string | null;
  day_of_week: number | null;
  start_time: string | null;
  timezone: string | null;
}

interface SchedulePackageDetails {
  course_type: string;
  day_of_week: number;
  level: string;
  start_time: string;
  timezone: string;
}

interface Group {
  id: string;
  name: string;
  schedule_day?: string | null;
  schedule_time?: string | null;
  schedule_timezone?: string | null;
  level?: string | null;
  capacity?: number | null;
  course_type?: string | null;
}

interface Session {
  id: string;
  group_id: string;
  session_date: string;
  created_at: string;
}

interface StudentProfile {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  level?: string;
}

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;
// Canonical course levels — writes to student_groups.level must match the
// short keys used by schedule_packages / enrollments (hangul, l1…l6).
const LEVELS = LEVEL_KEYS;

function nextOccurrenceOf(dayOfWeek: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff === 0 ? 7 : diff));
  return next;
}

function formatStartTime(t: string | null): string {
  if (!t) return "";
  return formatTime(t);
}

interface GroupAttendanceManagerProps {
  overviewRows?: OverviewRow[];
  selectedStudentId?: string | null;
  onStudentSelect?: (id: string | null) => void;
  attendanceReqs?: AttendanceReq[];
  onAttendanceAction?: (req: AttendanceReq, action: "APPROVED" | "REJECTED") => Promise<void>;
  onRevertAttendance?: (req: AttendanceReq) => Promise<void>;
  userGroupMap?: Record<string, string>;
  onUpdated?: () => void;
}

const GroupAttendanceManager = ({
  overviewRows = [],
  selectedStudentId = null,
  onStudentSelect,
  attendanceReqs = [],
  onAttendanceAction,
  onRevertAttendance,
  userGroupMap = {},
  onUpdated,
}: GroupAttendanceManagerProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupPackageInfo, setGroupPackageInfo] = useState<GroupPackageInfo | null>(null);

  // Group management state
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  // Student assignment state
  const [manageStudentsDialog, setManageStudentsDialog] = useState(false);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<GroupMember[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  // Enriched groups for Manage Groups tab
  interface EnrichedMember {
    user_id: string;
    name: string;
    email: string;
    member_status: string;
    sessions_total: number;
    sessions_remaining: number;
    amount_paid: number;
    currency: string;
    attendance_count: number;
  }
  interface EnrichedGroup {
    id: string;
    name: string;
    package_id: string;
    capacity: number;
    level: string;
    course_type: string;
    day_of_week: number;
    start_time: string;
    timezone: string;
    members: EnrichedMember[];
  }
  const [enrichedGroups, setEnrichedGroups] = useState<EnrichedGroup[]>([]);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Notify all groups state
  const [notifyDialog, setNotifyDialog] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [notifying, setNotifying] = useState(false);

  const notifyActiveGroups = async () => {
    setNotifying(true);
    try {
      const { data: activeGroups } = await supabase
        .from("pkg_groups")
        .select("id, name, package_id")
        .eq("is_active", true);
      if (!activeGroups || activeGroups.length === 0) {
        toast({ title: "No active groups found" });
        setNotifying(false);
        return;
      }

      const groupIds = activeGroups.map(g => g.id);
      const packageIds = [...new Set(activeGroups.map(g => g.package_id).filter(Boolean))];

      const [membersRes, pkgsRes] = await Promise.all([
        supabase.from("pkg_group_members").select("group_id, user_id, member_status").in("group_id", groupIds).eq("member_status", "active"),
        packageIds.length > 0
          ? supabase.from("schedule_packages").select("id, level, day_of_week, start_time, timezone").in("id", packageIds)
          : Promise.resolve({ data: [] as Array<{ id: string; level: string; day_of_week: number; start_time: string; timezone: string }> }),
      ]);

      const members = membersRes.data || [];
      const userIds = [...new Set(members.map(m => m.user_id))];
      if (userIds.length === 0) {
        toast({ title: "No active members in any group" });
        setNotifying(false);
        return;
      }

      const { data: profiles } = await supabase.from("profiles").select("user_id, email, name").in("user_id", userIds);
      const profileMap: Record<string, { email: string; name: string }> = {};
      (profiles || []).forEach((p) => { profileMap[p.user_id] = { email: p.email, name: p.name }; });

      const pkgMap: Record<string, { id: string; level: string; day_of_week: number; start_time: string; timezone: string }> = {};
      (pkgsRes.data || []).forEach((p) => { pkgMap[p.id] = p; });

      const membersByGroup: Record<string, string[]> = {};
      const usersByGroup: Record<string, string[]> = {};
      members.forEach(m => {
        if (!membersByGroup[m.group_id]) { membersByGroup[m.group_id] = []; usersByGroup[m.group_id] = []; }
        const name = profileMap[m.user_id]?.name || "Unknown";
        membersByGroup[m.group_id].push(name);
        usersByGroup[m.group_id].push(m.user_id);
      });

      const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      let sent = 0, failed = 0; const total = userIds.length;

      for (const group of activeGroups) {
        const pkg = pkgMap[group.package_id];
        const dayName = pkg?.day_of_week != null ? DAY[pkg.day_of_week] : "";
        const groupMemberNames = membersByGroup[group.id] || [];
        const groupUserIds = usersByGroup[group.id] || [];

        for (const uid of groupUserIds) {
          const profile = profileMap[uid];
          if (!profile?.email) { failed++; continue; }
          try {
            await supabase.functions.invoke("send-confirmation-email", {
              body: {
                template: "group_match",
                email: profile.email,
                name: profile.name,
                group_name: group.name,
                group_level: pkg?.level || undefined,
                group_days: dayName,
                group_time: pkg?.start_time || undefined,
                group_timezone: pkg?.timezone || undefined,
                group_members: groupMemberNames,
                custom_message: broadcastMessage.trim() || undefined,
              },
            });
            sent++;
          } catch {
            failed++;
          }
          // Rate limit
          if (sent % 5 === 0) await new Promise(r => setTimeout(r, 1000));
        }
      }

      toast({ title: `Notifications sent`, description: `✅ ${sent} sent${failed > 0 ? ` · ❌ ${failed} failed` : ""}` });
      setNotifyDialog(false);
      setBroadcastMessage("");
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setNotifying(false);
    }
  };

  const fetchEnrichedGroups = async () => {
    setEnrichedLoading(true);
    // Fetch all active pkg_groups with parent package info
    const { data: pkgGroups } = await supabase
      .from("pkg_groups")
      .select("id, name, package_id, capacity, is_active, schedule_packages(level, day_of_week, start_time, timezone, course_type)")
      .eq("is_active", true)
      .order("name");

    if (!pkgGroups || pkgGroups.length === 0) {
      setEnrichedGroups([]);
      setEnrichedLoading(false);
      return;
    }

    const groupIds = pkgGroups.map(g => g.id);

    // Fetch all members for these groups
    const { data: members } = await supabase
      .from("pkg_group_members")
      .select("group_id, user_id, member_status")
      .in("group_id", groupIds);

    // Fetch profiles for all member user_ids
    const userIds = [...new Set((members || []).map(m => m.user_id))];
    const [profilesRes, enrollmentsRes, attendanceRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, name, email").in("user_id", userIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from("enrollments")
            .select("user_id, sessions_total, sessions_remaining, amount, currency, approval_status, payment_status, created_at")
            .in("user_id", userIds)
            .eq("approval_status", "APPROVED")
            .eq("payment_status", "PAID")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from("admin_attendance_log")
            .select("user_id")
            .in("user_id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap: Record<string, { name: string; email: string }> = {};
    (profilesRes.data || []).forEach((p) => { profileMap[p.user_id] = { name: p.name, email: p.email }; });

    // Latest enrollment per user (already sorted by created_at desc)
    const enrollmentMap: Record<string, { sessions_total: number; sessions_remaining: number; amount: number; currency: string }> = {};
    (enrollmentsRes.data || []).forEach((e) => {
      if (!enrollmentMap[e.user_id]) {
        enrollmentMap[e.user_id] = { sessions_total: e.sessions_total, sessions_remaining: e.sessions_remaining, amount: e.amount, currency: e.currency };
      }
    });

    // Count attendance per user
    const attendanceCountMap: Record<string, number> = {};
    (attendanceRes.data || []).forEach((a) => {
      attendanceCountMap[a.user_id] = (attendanceCountMap[a.user_id] || 0) + 1;
    });

    const result: EnrichedGroup[] = pkgGroups.map((g) => {
      const pkg = g.schedule_packages as unknown as SchedulePackageDetails | null;
      const grpMembers: EnrichedMember[] = (members || [])
        .filter(m => m.group_id === g.id)
        .map(m => {
          const enr = enrollmentMap[m.user_id];
          return {
            user_id: m.user_id,
            name: profileMap[m.user_id]?.name || "Unknown",
            email: profileMap[m.user_id]?.email || "",
            member_status: m.member_status,
            sessions_total: enr?.sessions_total ?? 0,
            sessions_remaining: enr?.sessions_remaining ?? 0,
            amount_paid: enr?.amount ?? 0,
            currency: enr?.currency ?? "USD",
            attendance_count: attendanceCountMap[m.user_id] || 0,
          };
        });

      return {
        id: g.id,
        name: g.name,
        package_id: g.package_id,
        capacity: g.capacity,
        level: pkg?.level || "",
        course_type: pkg?.course_type || "group",
        day_of_week: pkg?.day_of_week ?? -1,
        start_time: pkg?.start_time || "",
        timezone: pkg?.timezone || "",
        members: grpMembers,
      };
    });

    setEnrichedGroups(result);
    setEnrichedLoading(false);
  };

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [adminWeekdays, setAdminWeekdays] = useState<string[]>([]);

  const fetchGroups = async () => {
    // Fetch active pkg_groups with schedule info from schedule_packages
    const { data: pkgGroups } = await supabase
      .from("pkg_groups")
      .select("id, name, capacity, package_id, schedule_packages(level, day_of_week, start_time, timezone, course_type)")
      .eq("is_active", true)
      .order("name");

    if (pkgGroups) {
      const DAY_NAMES_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const mapped: Group[] = pkgGroups.map((g) => {
        const pkg = g.schedule_packages as unknown as SchedulePackageDetails | null;
        return {
          id: g.id,
          name: g.name,
          schedule_day: pkg?.day_of_week != null ? DAY_NAMES_MAP[pkg.day_of_week] : null,
          schedule_time: pkg?.start_time ? formatStartTime(pkg.start_time) : null,
          schedule_timezone: pkg?.timezone || null,
          level: pkg?.level || null,
          capacity: g.capacity,
          course_type: pkg?.course_type || "group",
        };
      });
      setGroups(mapped);
    }
  };

  // Fetch available days from schedule_packages
  useEffect(() => {
    supabase
      .from("schedule_packages")
      .select("day_of_week")
      .eq("is_active", true)
      .then(({ data }) => {
        const rows = data ?? [];
        const uniqueDays = [...new Set(rows.map((r) => r.day_of_week))].sort();
        setAdminWeekdays(uniqueDays.map(n => DAY_NAMES[n]));
      });
  }, []);

  useEffect(() => { fetchGroups(); fetchEnrichedGroups(); }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setSessions([]);
      setGroupPackageInfo(null);
      return;
    }

    // Fetch pkg_groups → schedule_packages for date restriction
    supabase
      .from("pkg_groups")
      .select("package_id, schedule_packages(day_of_week, start_time, timezone)")
      .eq("id", selectedGroup)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.schedule_packages) {
          const pkg = data.schedule_packages;
          setGroupPackageInfo({
            package_id: data.package_id,
            day_of_week: pkg.day_of_week,
            start_time: pkg.start_time,
            timezone: pkg.timezone,
          });
          // Auto-jump to next valid date
          const next = nextOccurrenceOf(pkg.day_of_week);
          setSessionDate(format(next, "yyyy-MM-dd"));
        } else {
          // Fallback: parse legacy student_groups.schedule_day string
          const group = groups.find(g => g.id === selectedGroup);
          if (group?.schedule_day) {
            const idx = DAY_NAMES.indexOf(group.schedule_day);
            if (idx !== -1) {
              setGroupPackageInfo({
                package_id: null,
                day_of_week: idx,
                start_time: group.schedule_time ?? null,
                timezone: group.schedule_timezone ?? null,
              });
              const next = nextOccurrenceOf(idx);
              setSessionDate(format(next, "yyyy-MM-dd"));
            } else {
              setGroupPackageInfo(null);
            }
          } else {
            setGroupPackageInfo(null);
          }
        }
      });

    supabase
      .from("pkg_group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data as Session[]);
      });

  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedSession) { setAttendanceRows([]); return; }
    loadAttendance(selectedSession);
  }, [selectedSession]);

  const loadAttendance = async (sessionId: string) => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("pkg_attendance")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");

    if (error || !rows) {
      toast({ title: "Error loading attendance", description: error?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userIds = rows.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string; avatar_url: string }> = {};
    (profiles || []).forEach((p) => { profileMap[p.user_id] = { name: p.name, email: p.email, avatar_url: p.avatar_url || "" }; });

    setAttendanceRows(
      rows.map((r) => ({
        ...r,
        id: `${r.session_id}__${r.user_id}`, // composite key
        source: "system",
        student_name: profileMap[r.user_id]?.name || "Unknown",
        student_email: profileMap[r.user_id]?.email || "",
        student_avatar: profileMap[r.user_id]?.avatar_url || "",
      }))
    );
    setLoading(false);
  };

  const createSession = async () => {
    if (!selectedGroup || !sessionDate) return;

    // Validate date matches package day_of_week
    if (groupPackageInfo?.day_of_week != null) {
      const chosen = new Date(sessionDate + "T00:00:00");
      if (chosen.getDay() !== groupPackageInfo.day_of_week) {
        const dayName = DAY_NAMES[groupPackageInfo.day_of_week];
        toast({
          title: "Invalid date",
          description: `This group can only meet on ${dayName} (${formatStartTime(groupPackageInfo.start_time)} ${groupPackageInfo.timezone ?? ""}).`,
          variant: "destructive",
        });
        return;
      }
    }

    setCreating(true);

    const { data: session, error: sessionErr } = await supabase
      .from("pkg_group_sessions")
      .insert({ group_id: selectedGroup, session_date: sessionDate })
      .select()
      .single();

    if (sessionErr) {
      toast({
        title: "Error",
        description: sessionErr.message.includes("duplicate")
          ? "Session already exists for this date"
          : sessionErr.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    // Pre-populate attendance from pkg_group_members
    const { data: members } = await supabase
      .from("pkg_group_members")
      .select("user_id")
      .eq("group_id", selectedGroup)
      .eq("member_status", "active");

    if (members && members.length > 0) {
      const rows = members.map((m) => ({
        session_id: session.id,
        user_id: m.user_id,
        status: "absent",
        admin_approved: false,
      }));
      await supabase.from("pkg_attendance").insert(rows);
    }

    toast({ title: "Session created" });
    const { data: updatedSessions } = await supabase
      .from("pkg_group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false });
    if (updatedSessions) setSessions(updatedSessions as Session[]);
    setSelectedSession(session.id);
    setCreating(false);
  };

  const handleStatusChange = async (attId: string, newStatus: string) => {
    const row = attendanceRows.find(r => r.id === attId);
    if (!row) return;
    const isPresent = newStatus === "present";
    const { error } = await supabase
      .from("pkg_attendance")
      .update({ status: newStatus, admin_approved: isPresent })
      .eq("session_id", row.session_id)
      .eq("user_id", row.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setAttendanceRows(prev =>
      prev.map(r => r.id === attId ? { ...r, status: newStatus, admin_approved: isPresent || r.admin_approved } : r)
    );
  };

  const handleMarkAllPresent = async () => {
    const toMark = attendanceRows.filter(r => r.status !== "present" || !r.admin_approved);
    if (toMark.length === 0) {
      toast({ title: "All students already marked present" });
      return;
    }

    for (const row of toMark) {
      await supabase
        .from("pkg_attendance")
        .update({ status: "present", admin_approved: true })
        .eq("session_id", row.session_id)
        .eq("user_id", row.user_id);
    }

    toast({ title: "All students marked present ✓" });
    setAttendanceRows(prev =>
      prev.map(r => ({ ...r, status: "present", admin_approved: true }))
    );
  };

  const handleToggleStatus = async (row: AttendanceRow) => {
    const newStatus = row.status === "present" ? "absent" : "present";
    await handleStatusChange(row.id, newStatus);
  };

  // ── Group editing ──
  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditLevel(group.level || "");
    setEditDay(group.schedule_day || "");
    setEditTime(group.schedule_time || "");
    setEditCapacity(String(group.capacity ?? ""));
    setEditGroupDialog(true);
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !editName.trim()) return;
    const oldName = editingGroup.name;
    const { error } = await supabase
      .from("student_groups")
      .update({
        name: editName.trim(),
        level: editLevel || null,
        schedule_day: editDay || null,
        schedule_time: editTime || null,
        capacity: editCapacity ? parseInt(editCapacity) : null,
      })
      .eq("id", editingGroup.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update students table group_name if name changed
    if (oldName !== editName.trim()) {
      await supabase
        .from("students")
        .update({ group_name: editName.trim() })
        .eq("group_name", oldName);
    }

    // Sync capacity & name to pkg_groups (matched by name)
    const newCap = editCapacity ? parseInt(editCapacity) : null;
    const matchingPkg = enrichedGroups.find(pg => pg.name === oldName);
    if (matchingPkg) {
      const pkgUpdate: { name: string; capacity?: number } = { name: editName.trim() };
      if (newCap != null) pkgUpdate.capacity = newCap;
      await supabase.from("pkg_groups").update(pkgUpdate).eq("id", matchingPkg.id);

      // Also sync capacity to schedule_packages
      if (newCap != null && matchingPkg.package_id) {
        await supabase.from("schedule_packages").update({ capacity: newCap }).eq("id", matchingPkg.package_id);
      }
    }

    toast({ title: "Group updated" });
    setEditGroupDialog(false);
    fetchGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    const { error } = await supabase.from("student_groups").delete().eq("id", groupId);
    if (error) {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Group deleted" });
      fetchGroups();
    }
  };

  // ── Student assignment ──
  const openManageStudents = async (group: Group) => {
    setManagingGroup(group);
    setStudentSearch("");

    // Fetch current members
    const { data: members } = await supabase
      .from("students")
      .select("id, full_name, email, group_name")
      .eq("group_name", group.name)
      .order("full_name");

    setGroupMembers((members || []).map((m) => ({
      student_id: m.id,
      full_name: m.full_name,
      email: m.email,
      group_name: m.group_name,
    })));

    // Fetch available students (not in this group)
    const { data: allStudents } = await supabase
      .from("students")
      .select("id, full_name, email, group_name")
      .or(`group_name.is.null,group_name.eq.,group_name.neq.${group.name}`)
      .order("full_name");

    setAvailableStudents((allStudents || []).map((s) => ({
      student_id: s.id,
      full_name: s.full_name,
      email: s.email,
      group_name: s.group_name,
    })));

    setManageStudentsDialog(true);
  };

  const handleAddStudentToGroup = async (student: GroupMember) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("students")
      .update({ group_name: managingGroup.name })
      .eq("id", student.student_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setGroupMembers(prev => [...prev, { ...student, group_name: managingGroup.name }]);
    setAvailableStudents(prev => prev.filter(s => s.student_id !== student.student_id));
    toast({ title: `${student.full_name} added to ${managingGroup.name}` });
  };

  const handleRemoveStudentFromGroup = async (student: GroupMember) => {
    if (!managingGroup) return;
    const { error } = await supabase
      .from("students")
      .update({ group_name: "" })
      .eq("id", student.student_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setAvailableStudents(prev => [...prev, { ...student, group_name: null }]);
    setGroupMembers(prev => prev.filter(s => s.student_id !== student.student_id));
    toast({ title: `${student.full_name} removed from ${managingGroup.name}` });
  };

  const filteredAvailable = availableStudents.filter(s =>
    !studentSearch ||
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const presentCount = attendanceRows.filter(r => r.status === "present").length;
  const totalCount = attendanceRows.length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="log-attendance">Log Attendance</TabsTrigger>
          <TabsTrigger value="groups">Manage Groups</TabsTrigger>
        </TabsList>

        {/* ── ATTENDANCE TAB ── */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>Group</Label>
                    <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setSelectedSession(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => {
                          const schedule = [g.schedule_day, g.schedule_time].filter(Boolean).join(" · ");
                          return (
                            <SelectItem key={g.id} value={g.id}>
                              <span className="font-medium">{g.name}</span>
                              {g.level && <Badge variant="secondary" className="ml-2 text-[10px] py-0">{g.level}</Badge>}
                              {schedule && <span className="text-muted-foreground ml-2 text-xs">({schedule})</span>}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedGroup && (() => {
                    const g = groups.find(gr => gr.id === selectedGroup);
                    if (!g) return null;
                    const infoParts = [
                      g.level && `📚 ${g.level}`,
                      g.schedule_day && `📅 ${g.schedule_day}`,
                      g.schedule_time && `🕐 ${g.schedule_time}`,
                      g.schedule_timezone && `🌍 ${g.schedule_timezone}`,
                      g.capacity != null && `👥 ${g.capacity} seats`,
                    ].filter(Boolean);
                    return infoParts.length > 0 ? (
                      <div className="flex flex-wrap items-end gap-2 text-xs text-muted-foreground">
                        {infoParts.map((info, i) => (
                          <Badge key={i} variant="outline" className="font-normal">{info}</Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>Session Date</Label>
                  {groupPackageInfo?.day_of_week != null && (
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        {(() => {
                          const adminTz = getAdminTimezone();
                          const l = convertSlotToTimezone(groupPackageInfo.day_of_week, groupPackageInfo.start_time || "00:00", "Africa/Cairo", adminTz);
                          return <>📅 {l.weekday}{groupPackageInfo.start_time ? ` · ${l.timeFormatted} ${adminTz}` : ""}</>;
                        })()}
                        {groupPackageInfo.timezone && ` · ${groupPackageInfo.timezone}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                        Only {DAY_NAMES[groupPackageInfo.day_of_week]}s can be selected
                      </Badge>
                    </div>
                  )}
                  <Calendar
                    mode="single"
                    selected={sessionDate ? new Date(sessionDate + "T00:00:00") : undefined}
                    onSelect={(d) => d && setSessionDate(format(d, "yyyy-MM-dd"))}
                    disabled={
                      groupPackageInfo?.day_of_week != null
                        ? [{ dayOfWeek: ([0, 1, 2, 3, 4, 5, 6] as const).filter(d => d !== groupPackageInfo.day_of_week) }]
                        : undefined
                    }
                    className="rounded-md border w-fit"
                  />
                </div>

                <div>
                  <Button onClick={createSession} disabled={!selectedGroup || !sessionDate || creating}>
                    <Plus className="h-4 w-4 mr-1" /> Create Session
                  </Button>
                </div>
              </div>

              {sessions.length > 0 && (
                <div className="space-y-1">
                  <Label>Session</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>
                      {sessions.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.session_date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance */}
          {selectedSession && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Attendance</CardTitle>
                  {totalCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {presentCount}/{totalCount} present
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" onClick={handleMarkAllPresent} disabled={loading || totalCount === 0}>
                    <CheckCheck className="h-4 w-4 mr-1" /> Mark All Present
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => loadAttendance(selectedSession)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : attendanceRows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No students in this session.</p>
                ) : (
                  <>
                    {/* Student avatar grid */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      {attendanceRows.map((row, i) => (
                        <button
                          key={row.id + "-avatar"}
                          onClick={() => handleToggleStatus(row)}
                          className="flex flex-col items-center gap-1.5 animate-fade-in group cursor-pointer"
                          style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                          title={`${row.student_name} — ${row.status} (click to toggle)`}
                        >
                          <div className={`rounded-full ring-2 p-0.5 transition-all duration-200 group-hover:scale-110 ${statusColor(row.status)}`}>
                            <Avatar className="h-11 w-11">
                              {row.student_avatar && (
                                <AvatarImage src={row.student_avatar} alt={row.student_name || "Student"} />
                              )}
                              <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                                {(row.student_name || "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center">
                            {row.student_name?.split(" ")[0] || "—"}
                          </span>
                          {row.status === "present" ? (
                            <UserCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <UserX className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Detail table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRows.map(row => (
                            <TableRow key={row.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    {row.student_avatar && <AvatarImage src={row.student_avatar} alt={row.student_name || ""} />}
                                    <AvatarFallback className="bg-muted text-foreground text-xs">
                                      {(row.student_name || "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground">{row.student_name}</p>
                                    <p className="text-xs text-muted-foreground">{row.student_email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={row.status}
                                  onValueChange={(v) => handleStatusChange(row.id, v)}
                                >
                                  <SelectTrigger className="w-28 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{row.source}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── LOG ATTENDANCE TAB ── */}
        <TabsContent value="log-attendance" className="space-y-4">
          {/* Student picker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Log Attendance</CardTitle>
              <p className="text-xs text-muted-foreground">Select a student to add/view attendance</p>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedStudentId || ""}
                onValueChange={(v) => onStudentSelect?.(v || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {overviewRows
                    .filter(u => u.enrollment_id && (u.derived_status === "ACTIVE" || u.derived_status === "LOCKED"))
                    .sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""))
                    .map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.name || u.email} — {u.sessions_remaining ?? 0} left
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedStudentId && (() => {
            const student = overviewRows.find(u => u.user_id === selectedStudentId);
            if (!student || !student.enrollment_id) return null;
            return (
              <AdminAttendancePanel
                enrollmentId={student.enrollment_id}
                userId={student.user_id}
                studentName={student.name || student.email}
                sessionsRemaining={student.sessions_remaining}
                negativeSessions={student.negative_sessions}
                amountDue={student.amount_due}
                currency={student.currency}
                derivedStatus={student.derived_status}
                onClose={() => onStudentSelect?.(null)}
                onUpdated={() => onUpdated?.()}
              />
            );
          })()}

          {/* Student-initiated requests */}
          {attendanceReqs.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-foreground pt-2">Student Requests</h3>
              {(() => {
                const byUser: Record<string, { name: string; email: string; requests: typeof attendanceReqs }> = {};
                attendanceReqs.forEach((a) => {
                  const key = a.user_id;
                  if (!byUser[key]) {
                    byUser[key] = {
                      name: a.profiles?.name || "Unknown",
                      email: a.profiles?.email || "",
                      requests: [],
                    };
                  }
                  byUser[key].requests.push(a);
                });

                return Object.entries(byUser).map(([userId, { name, email, requests }]) => {
                  const pendingCount = requests.filter(r => r.status === "PENDING").length;
                  const approvedCount = requests.filter(r => r.status === "APPROVED").length;
                  const rejectedCount = requests.filter(r => r.status === "REJECTED").length;
                  const groupName = userGroupMap[userId];
                  const overviewRecord = overviewRows.find(o => o.user_id === userId);
                  const remainingSessions = overviewRecord?.sessions_remaining ?? null;

                  return (
                    <Card key={userId}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {email}
                              {groupName && <> · <span className="font-medium text-foreground">Group: {groupName}</span></>}
                              {remainingSessions !== null && <> · Sessions left: <span className="font-medium text-foreground">{remainingSessions}</span></>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary">{requests.length} total</Badge>
                            {approvedCount > 0 && <Badge variant="default">{approvedCount} approved</Badge>}
                            {pendingCount > 0 && <Badge variant="outline" className="border-yellow-500 text-yellow-600">{pendingCount} pending</Badge>}
                            {rejectedCount > 0 && <Badge variant="destructive">{rejectedCount} rejected</Badge>}
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="py-2 px-3">Date</TableHead>
                                <TableHead className="py-2 px-3">Submitted</TableHead>
                                <TableHead className="py-2 px-3">Status</TableHead>
                                <TableHead className="py-2 px-3 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requests.map((a) => (
                                <TableRow key={a.id} className="even:bg-muted/30 hover:bg-muted/50">
                                  <TableCell className="py-2 px-3 font-medium text-foreground">{a.request_date}</TableCell>
                                  <TableCell className="py-2 px-3 text-muted-foreground text-xs">
                                    {new Date(a.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="py-2 px-3">
                                    <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                                      {a.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2 px-3 text-right">
                                    {a.status === "PENDING" ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button size="sm" onClick={() => onAttendanceAction?.(a, "APPROVED")}>
                                          <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onAttendanceAction?.(a, "REJECTED")}>
                                          <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => onRevertAttendance?.(a)}>
                                        <Undo2 className="h-4 w-4 mr-1" /> Undo
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </>
          )}
        </TabsContent>

        {/* ── MANAGE GROUPS TAB ── */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Groups
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setNotifyDialog(true)}>
                  <Mail className="h-4 w-4 mr-1" /> Notify Active Groups
                </Button>
                <Button variant="outline" size="sm" onClick={fetchEnrichedGroups} disabled={enrichedLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${enrichedLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enrichedLoading ? (
                <p className="text-muted-foreground text-center py-4">Loading groups...</p>
              ) : enrichedGroups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No groups yet.</p>
              ) : (
                <div className="space-y-3">
                  {enrichedGroups.map(g => {
                    const activeMembers = g.members.filter(m => m.member_status === "active");
                    const waitlistMembers = g.members.filter(m => m.member_status === "waitlist");
                    const isExpanded = expandedGroups.has(g.id);
                    const adminTz = getAdminTimezone();
                    const localSlot = (g.day_of_week != null && g.start_time)
                      ? convertSlotToTimezone(g.day_of_week, g.start_time, "Africa/Cairo", adminTz)
                      : null;
                    const dayName = localSlot?.weekday || DAY_NAMES[g.day_of_week] || "—";
                    const timeStr = localSlot?.timeFormatted || formatStartTime(g.start_time);

                    return (
                      <div key={g.id} className="border rounded-lg overflow-hidden">
                        {/* Group header */}
                        <div
                          className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedGroups(prev => {
                            const next = new Set(prev);
                            if (next.has(g.id)) { next.delete(g.id); } else { next.add(g.id); }
                            return next;
                          })}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{g.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {g.level && (
                                  <Badge variant="secondary" className="text-[10px]">{getLevelShortLabel(g.level)}</Badge>
                                )}
                                <Badge variant={g.course_type === "private" ? "destructive" : "outline"} className="text-[10px]">
                                  {g.course_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {dayName} {timeStr && `· ${timeStr}`}
                                  {g.timezone && ` · ${g.timezone.replace(/_/g, " ")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={activeMembers.length >= g.capacity ? "default" : "outline"} className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {activeMembers.length}/{g.capacity}
                              {waitlistMembers.length > 0 && ` (+${waitlistMembers.length} waitlist)`}
                            </Badge>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => {
                                const legacyGroup = groups.find(lg => lg.name === g.name);
                                if (legacyGroup) openEditGroup(legacyGroup);
                              }} title="Edit group">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                const legacyGroup = groups.find(lg => lg.name === g.name);
                                if (legacyGroup) openManageStudents(legacyGroup);
                              }} title="Manage students">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteGroup(g.id)} title="Delete group">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded: student list */}
                        {isExpanded && (
                          <div className="p-3 border-t space-y-1.5">
                            {g.members.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-2">No students in this group.</p>
                            ) : (
                              <>
                                {/* Header row */}
                                <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  <span>Student</span>
                                  <span className="flex gap-4 justify-end">
                                    <span className="w-16 text-center">Attended</span>
                                    <span className="w-16 text-center">Remaining</span>
                                    <span className="w-16 text-center">Paid</span>
                                    <span className="w-16 text-center">Status</span>
                                  </span>
                                </div>
                                {g.members.map(m => {
                                  const currLabel = m.currency === "EGP" ? "LE" : "$";
                                  return (
                                    <div key={m.user_id} className="grid grid-cols-[1fr_auto] gap-2 items-center px-3 py-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="h-7 w-7 shrink-0">
                                          <AvatarFallback className="bg-muted text-foreground text-[10px] font-semibold">
                                            {(m.name || "?").slice(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                                          <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-4 items-center justify-end">
                                        <span className="w-16 text-center">
                                          <Badge variant="outline" className="text-[10px]">{m.attendance_count}</Badge>
                                        </span>
                                        <span className="w-16 text-center">
                                          <Badge variant={m.sessions_remaining <= 0 ? "destructive" : "secondary"} className="text-[10px]">
                                            {m.sessions_remaining}
                                          </Badge>
                                        </span>
                                        <span className="w-16 text-center text-xs text-foreground font-medium">
                                          {currLabel}{m.amount_paid.toLocaleString()}
                                        </span>
                                        <span className="w-16 text-center">
                                          <Badge variant={m.member_status === "active" ? "secondary" : "outline"} className="text-[10px]">
                                            {m.member_status}
                                          </Badge>
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Group Dialog ── */}
      <Dialog open={editGroupDialog} onOpenChange={setEditGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Group Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Group name" />
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={editLevel} onValueChange={setEditLevel}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {LEVEL_SELECT_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Day</Label>
                {adminWeekdays.length > 0 ? (
                  <Select value={editDay} onValueChange={setEditDay}>
                    <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {adminWeekdays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={editDay} onChange={e => setEditDay(e.target.value)} placeholder="e.g. Monday" />
                )}
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="e.g. 18:00" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} placeholder="Max students" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroupDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={!editName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Students Dialog ── */}
      <Dialog open={manageStudentsDialog} onOpenChange={setManageStudentsDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {managingGroup?.name} — Students
              {managingGroup?.level && <Badge variant="secondary">{managingGroup.level}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {/* Current members */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Current Members ({groupMembers.length})</Label>
            {groupMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No students in this group yet.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {groupMembers.map(m => (
                  <div key={m.student_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveStudentFromGroup(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add students */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-sm font-semibold">Add Students</Label>
            <Input
              placeholder="Search by name or email..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">No available students found.</p>
              ) : (
                filteredAvailable.slice(0, 20).map(s => (
                  <div key={s.student_id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-accent/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.email}
                        {s.group_name && <span className="ml-1 text-muted-foreground/70">({s.group_name})</span>}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddStudentToGroup(s)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notify Active Groups Dialog */}
      <Dialog open={notifyDialog} onOpenChange={setNotifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Notify All Active Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send a group_match email to every active member in every active group.
            </p>
            <div className="space-y-1">
              <Label>Optional message</Label>
              <Textarea
                placeholder="Add a custom message (shown in every email)..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialog(false)} disabled={notifying}>Cancel</Button>
            <Button onClick={notifyActiveGroups} disabled={notifying}>
              {notifying ? "Sending…" : "Send Notifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(GroupAttendanceManager);
