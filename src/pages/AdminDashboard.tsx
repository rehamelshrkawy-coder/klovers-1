import { Component, ReactNode, lazy, Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getDerivedStatusBadgeVariant } from "@/lib/badge-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { LogOut, Search, Download, Trash2, Check, X, Eye, Undo2, AlertCircle, Bell, ChevronLeft, ChevronRight, Pencil, Mail, Eraser, Sparkles, Settings, BarChart3, RefreshCw, Users, FileCheck, Copy, Clock, Tag, UserPlus, Loader2, Image, Trophy, TrendingUp, Link } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Columns3, Package } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
// Lazy-load heavy tab components — each loads only when its tab is first opened
const BlogManager = lazy(() => import("@/components/admin/BlogManager"));
const StudentManager = lazy(() => import("@/components/admin/StudentManager"));
const LifecycleFunnel = lazy(() => import("@/components/admin/LifecycleFunnel"));
const GroupAttendanceManager = lazy(() => import("@/components/admin/GroupAttendanceManager"));
const AdminNotifications = lazy(() => import("@/components/admin/AdminNotifications"));
const AdminAttendancePanel = lazy(() => import("@/components/admin/AdminAttendancePanel"));
const GroupMatcher = lazy(() => import("@/components/admin/GroupMatcher"));
const TeacherAvailabilityManager = lazy(() => import("@/components/admin/TeacherAvailabilityManager"));
const StudentPreferenceDashboard = lazy(() => import("@/components/admin/StudentPreferenceDashboard"));
const BulkEmailManager = lazy(() => import("@/components/admin/BulkEmailManager"));
const SchedulingManager = lazy(() => import("@/components/admin/SchedulingManager"));
const TrialClassesManager = lazy(() => import("@/components/admin/TrialClassesManager"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const PlacementTestsManager = lazy(() => import("@/components/admin/PlacementTestsManager"));
const SalesAnalytics = lazy(() => import("@/components/admin/SalesAnalytics"));
const SessionAttendanceManager = lazy(() => import("@/components/admin/SessionAttendanceManager"));
const StudentHealthPanel = lazy(() => import("@/components/admin/StudentHealthPanel"));
const PromoCodesManager = lazy(() => import("@/components/admin/PromoCodesManager"));
const SeoOrchestrationPanel = lazy(() => import("@/components/admin/SeoOrchestrationPanel"));
const ImageAuditPanel = lazy(() => import("@/components/admin/ImageAuditPanel"));
const LeadsPanel = lazy(() => import("@/components/admin/LeadsPanel").catch(() => import("@/components/admin/LeadsPanel")));
const LeagueUsersPanel = lazy(() => import("@/components/admin/LeagueUsersPanel"));
const LeadFunnelPanel = lazy(() => import("@/components/admin/LeadFunnelPanel"));

const TabLoader = () => (
  <div role="status" aria-label="Loading content" className="flex items-center justify-center py-20">
    <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

// Human-readable explanations for every derived student status
const STATUS_TOOLTIPS: Record<string, string> = {
  LEAD:      "Registered profile but no paid enrollment yet — needs follow-up",
  ACTIVE:    "Currently enrolled with sessions remaining",
  COMPLETED: "All package sessions used — ready to renew",
  LOCKED:    "Account on hold — contact student to resolve",
  PENDING:   "Enrollment submitted, awaiting admin review",
  REJECTED:  "Enrollment was declined",
};

// Lead, Enrollment, AttendanceReq, OverviewRow — imported from @/types/admin

const STATUS_OPTIONS = ["new", "trial_booked", "contacted", "enrolled", "rejected", "lost"];

// Error boundary for lazy-loaded tab components
class TabErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { error: boolean; errorMsg: string }
> {
  state = { error: false, errorMsg: "" };
  static getDerivedStateFromError(error: Error) { return { error: true, errorMsg: error?.message || "Unknown error" }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[TabErrorBoundary] ${this.props.name} crashed:`, error, errorInfo);
    // Strip absolute file paths from stack traces before remote logging to avoid
    // leaking build-machine paths or internal module structure.
    const sanitizeStack = (s: string | undefined) =>
      s?.replace(/\(.*?\)/g, "(...)").replace(/at \/[^\s]+/g, "at [path]").slice(0, 4000) ?? null;
    // Best-effort remote log. Table is created on demand — if it doesn't
    // exist in this env, silently skip so the fallback UI still renders.
    try {
      void supabase.from("admin_error_log" as never).insert({
        tab: this.props.name,
        message: error?.message?.slice(0, 500) ?? "Unknown error",
        stack: sanitizeStack(error?.stack),
        component_stack: sanitizeStack(errorInfo?.componentStack),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : null,
      } as never).then(({ error: insertErr }) => {
        if (insertErr && insertErr.code !== "42P01") {
          // 42P01 = relation does not exist; expected if table not yet deployed.
          console.warn("[TabErrorBoundary] remote log failed:", insertErr.message);
        }
      });
    } catch {
      /* ignore — logging must never throw */
    }
  }
  render() {
    if (this.state.error) {
      return (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load <strong>{this.props.name}</strong>.
            </p>
            <p className="text-xs text-destructive/80 font-mono max-w-md mx-auto break-all">
              {this.state.errorMsg}
            </p>
            <Button variant="outline" size="sm" onClick={() => this.setState({ error: false, errorMsg: "" })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

import { normalizeLevel, LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import type { Lead, Enrollment, AttendanceReq, OverviewRow } from "@/types/admin";
import { formatTime, ADMIN_PAGE_SIZE as PAGE_SIZE } from "@/lib/admin-utils";
import { useProfiles } from "@/hooks/admin/useProfiles";
import { useStudentOverview, buildOverviewByEmail } from "@/hooks/admin/useStudentOverview";
import { useLeads } from "@/hooks/admin/useLeads";
import { useEnrollments } from "@/hooks/admin/useEnrollments";
import { useAttendanceRequests } from "@/hooks/admin/useAttendanceRequests";
import { useReferralStats } from "@/hooks/admin/useReferralStats";
import { useTrialStats } from "@/hooks/admin/useTrialStats";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatMoney, formatDate } from "@/lib/format";
import { EnrollmentCard } from "@/components/admin/EnrollmentCard";

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  // ── React Query: shared data (cached, deduplicated) ───────────────────────
  const { data: profileMap } = useProfiles();
  const { data: overviewRows = [], isLoading: overviewLoading } = useStudentOverview();
  const overviewByEmail = useMemo(() => buildOverviewByEmail(overviewRows), [overviewRows]);
  const { data: leads = [], isLoading: leadsLoading, error: leadsQueryError } = useLeads({ overviewByEmail });
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments({ profileMap });
  const { data: attendanceReqs = [], isLoading: attendanceLoading } = useAttendanceRequests({ profileMap, overviewRows });
  const { data: referralStats = { total: 0, thisMonth: 0, totalClicks: 0, clicksThisMonth: 0, perUser: [] } } = useReferralStats();
  const { data: trialStats = { pending: 0, upcoming: 0, thisWeek: 0, total: 0 } } = useTrialStats();

  // Lead count: "new" status = hasn't been contacted yet
  const newLeadsCount = useMemo(() => leads.filter(l => (l.status ?? "new") === "new").length, [leads]);

  // Needed by the visibleStudentCols useState initializer below — must be declared first
  // to avoid a temporal-dead-zone ReferenceError on the very first render.
  const isMobile = useIsMobile();

  // Students table column visibility — persisted
  type StudentCol = "country" | "level" | "attendance" | "source" | "joined";
  const ALL_STUDENT_COLS: StudentCol[] = ["country", "level", "attendance", "source", "joined"];
  const STUDENT_COL_LABELS: Record<StudentCol, string> = {
    country: "Country", level: "Level", attendance: "Attendance %", source: "Source", joined: "Joined",
  };
  const [visibleStudentCols, setVisibleStudentCols] = useState<Set<StudentCol>>(() => {
    try {
      const raw = localStorage.getItem("admin:studentCols");
      if (raw) return new Set(JSON.parse(raw) as StudentCol[]);
    } catch { /* ignore */ }
    return new Set(isMobile ? ["attendance"] : ALL_STUDENT_COLS);
  });
  useEffect(() => {
    try { localStorage.setItem("admin:studentCols", JSON.stringify(Array.from(visibleStudentCols))); } catch { /* ignore */ }
  }, [visibleStudentCols]);
  // Screen-reader announcement when a column is toggled
  const [colAnnouncement, setColAnnouncement] = useState("");
  const toggleStudentCol = useCallback((c: StudentCol) => {
    setVisibleStudentCols(prev => {
      const next = new Set(prev);
      const wasVisible = next.has(c);
      if (wasVisible) next.delete(c); else next.add(c);
      setColAnnouncement(`${STUDENT_COL_LABELS[c]} column ${wasVisible ? "hidden" : "shown"}`);
      return next;
    });
  }, []);

  // Hero "Insights" open by default — restore last explicit choice from localStorage
  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("admin:insightsOpen");
      return stored === null ? true : stored === "1"; // first visit → open
    } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("admin:insightsOpen", insightsOpen ? "1" : "0"); } catch { /* ignore */ }
  }, [insightsOpen]);


  const loading = leadsLoading || enrollmentsLoading || overviewLoading || attendanceLoading;
  const leadsError = leadsQueryError?.message ?? null;

  /** Targeted refetch — replaces the old monolithic invalidateAll(). */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }, [queryClient]);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const adminTab = searchParams.get("tab") ?? "students";
  const setAdminTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const [sendingReminder, setSendingReminder] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState<"payment_not_received" | "time_slots_unavailable" | "other">("payment_not_received");
  const [classLinkTarget, setClassLinkTarget] = useState<Enrollment | null>(null);
  const [classLinkUrl, setClassLinkUrl] = useState("");
  const [classLinkSendToGroup, setClassLinkSendToGroup] = useState(false);
  const [classLinkSlotDay, setClassLinkSlotDay] = useState("");
  const [classLinkSlotTime, setClassLinkSlotTime] = useState("");
  const [classLinkSlotTimezone, setClassLinkSlotTimezone] = useState("Africa/Cairo");
  const [classLinkFirstClassDate, setClassLinkFirstClassDate] = useState("");
  const [isSendingClassLink, setIsSendingClassLink] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ url: string; isPdf: boolean; studentName: string } | null>(null);
  const [receiptModalLoading, setReceiptModalLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [studentFilter, setStudentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [studentSort, setStudentSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "joined_at", dir: "desc" });
  const [studentPage, setStudentPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showLegacyEnrollments, setShowLegacyEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentPage, setEnrollmentPage] = useState(0);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const navigate = useNavigate();

  // Derived leadsByEmail map for level fallback
  const leadsByEmail = useMemo(() => {
    const map: Record<string, Lead> = {};
    for (const l of leads) if (l.email) map[l.email.toLowerCase()] = l;
    return map;
  }, [leads]);

  // ── Manual Enroll ────────────────────────────────────────────────────────
  const SESSIONS_BY_DURATION: Record<string, string> = { "1": "4", "3": "12", "6": "24" };

  const [pkgGroups, setPkgGroups] = useState<{ id: string; name: string }[]>([]);
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<OverviewRow | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    plan_type: "group",
    duration: "1",
    sessions: "4",
    amount: "",
    currency: "EGP",
    group_id: "",
    level: "",
    notes: "",
  });
  const [enrollSaving, setEnrollSaving] = useState(false);

  useEffect(() => {
    supabase.from("pkg_groups").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setPkgGroups(data); });
  }, []);

  function openManualEnroll(u: OverviewRow) {
    setEnrollTarget(u);
    setEnrollForm({ plan_type: "group", duration: "1", sessions: "4", amount: "", currency: "EGP", group_id: "", level: u.level || "", notes: "" });
    setManualEnrollOpen(true);
  }

  async function handleManualEnroll() {
    if (!enrollTarget) return;
    if (enrollForm.plan_type === "group" && !enrollForm.group_id) {
      toast({ title: "Select a group", variant: "destructive" }); return;
    }
    const sessions = parseInt(enrollForm.sessions) || 4;
    const amount = parseFloat(enrollForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    setEnrollSaving(true);
    try {
      const txRef = "manual_" + crypto.randomUUID().replace(/-/g, "");
      const { data: enrollment, error } = await supabase
        .from("enrollments")
        .insert({
          user_id: enrollTarget.user_id,
          plan_type: enrollForm.plan_type,
          duration: parseInt(enrollForm.duration),
          classes_included: sessions,
          sessions_remaining: sessions,
          sessions_total: sessions,
          amount,
          currency: enrollForm.currency,
          payment_provider: "manual",
          payment_status: "PAID",
          status: "APPROVED",
          approval_status: "APPROVED",
          tx_ref: txRef,
          receipt_url: "manual",
          reviewed_at: new Date().toISOString(),
          level: enrollForm.level || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (enrollForm.plan_type === "group" && enrollForm.group_id) {
        const { error: gmError } = await supabase
          .from("pkg_group_members")
          .insert({ group_id: enrollForm.group_id, user_id: enrollTarget.user_id, enrollment_id: enrollment.id, member_status: "active" });
        if (gmError) throw gmError;
      }
      const desc = enrollForm.plan_type === "private"
        ? `${enrollTarget.name} enrolled as private — assign slot via matcher.`
        : `${enrollTarget.name} added to group with ${sessions} sessions.`;
      toast({ title: "Enrolled!", description: desc });
      setManualEnrollOpen(false);
      invalidateAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrollSaving(false);
    }
  }

  // fetchAll replaced by React Query hooks — see useLeads, useEnrollments, etc.
  // invalidateAll() triggers targeted cache refresh instead of re-fetching everything.

  const handleDeleteStudent = async (userId: string) => {
    // Fire-and-forget audit log — does not block deletion if table doesn't exist yet
    void supabase.from("admin_audit_log" as never).insert({
      action: "delete_student",
      target_user_id: userId,
      performed_at: new Date().toISOString(),
    } as never);
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) { toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin", "student-overview"] });
    toast({ title: "Deleted", description: "Student record removed." });
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      let resubmitLink: string | undefined;
      if (rejectReason === "time_slots_unavailable") {
        const token = crypto.randomUUID().replace(/-/g, "");
        await supabase.from("schedule_resubmission_requests").insert({
          enrollment_id: rejectTarget.id,
          user_id: rejectTarget.user_id,
          email: rejectTarget.profiles?.email || "",
          token,
        });
        resubmitLink = `${window.location.origin}/resubmit-schedule?token=${token}`;
      }
      await handleEnrollmentAction(rejectTarget, "REJECTED");
      const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "rejection",
          email: rejectTarget.profiles?.email,
          name: rejectTarget.profiles?.name ?? "Student",
          language: "ar",
          rejection_reason: rejectReason,
          rejection_note: rejectNote.trim() || undefined,
          resubmit_link: resubmitLink,
        },
      });
      if (emailError) {
        toast({ title: "Rejected", description: "Enrollment rejected, but the notification email failed to send. Check Resend logs.", variant: "destructive" });
      } else {
        toast({ title: "Rejected & notified", description: `Email sent to ${rejectTarget.profiles?.email}` });
      }
      setRejectTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to reject or send email.", variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  };

  // Stable callbacks so memoized hero children don't re-render on every tick.
  const goToEnrollmentsTab = useCallback(() => setAdminTab("enrollments"), [setAdminTab]);

  // View a receipt URL stored on an enrollment — handles stripe: sentinel,
  // plain http(s) URLs, and storage object keys (resolved via signed URL).
  const handleViewReceipt = useCallback(async (e: Enrollment) => {
    if (!e.receipt_url || e.receipt_url.length === 0) return;
    if (e.receipt_url.startsWith("stripe:")) {
      toast({ title: "Stripe payment", description: "Paid via Stripe — no manual receipt to view." });
      return;
    }
    setReceiptModalLoading(true);
    let url = e.receipt_url;
    if (!e.receipt_url.startsWith("http")) {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(e.receipt_url, 3600);
      if (error || !data?.signedUrl) {
        toast({ title: "Error", description: "Could not load receipt.", variant: "destructive" });
        setReceiptModalLoading(false);
        return;
      }
      url = data.signedUrl;
    }
    const isPdf = e.receipt_url.toLowerCase().endsWith(".pdf");
    const studentName = e.profiles?.name || e.profiles?.email || "Unknown";
    setReceiptModal({ url, isPdf, studentName });
    setReceiptModalLoading(false);
  }, []);

  // Timezones used by Arabic-speaking countries (Egypt, Gulf, Levant, North Africa)
  const ARABIC_TIMEZONES = new Set([
    "Africa/Cairo", "Africa/Tripoli", "Africa/Tunis", "Africa/Algiers", "Africa/Casablanca",
    "Africa/Khartoum", "Africa/Mogadishu", "Africa/Djibouti", "Africa/Asmara",
    "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Bahrain", "Asia/Qatar",
    "Asia/Muscat", "Asia/Aden", "Asia/Amman", "Asia/Baghdad", "Asia/Beirut",
    "Asia/Damascus", "Asia/Gaza", "Asia/Hebron", "Asia/Jerusalem",
  ]);
  const getEmailLanguage = (timezone: string) =>
    ARABIC_TIMEZONES.has(timezone) ? "ar" : timezone ? "en" : "ar";

  // Request schedule resubmission — inserts a token row and copies link.
  const handleRequestResubmission = useCallback(async (e: Enrollment) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error: insertErr } = await supabase
      .from("schedule_resubmission_requests")
      .insert({
        enrollment_id: e.id,
        user_id: e.user_id,
        email: e.profiles?.email || "",
        token,
      });
    if (insertErr) {
      toast({ title: "Error", description: insertErr.message, variant: "destructive" });
      return;
    }
    const link = `${window.location.origin}/resubmit-schedule?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Send this link to the student to update their schedule." });
  }, []);

  const handleSendPaymentMethodReminder = async (e: Enrollment) => {
    setSendingReminder(prev => new Set(prev).add(e.id));
    try {
      await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "payment_method_reminder",
          email: e.profiles?.email,
          name: e.profiles?.name ?? "Student",
          enrollment_id: e.id,
          language: "ar",
        },
      });
      toast({ title: "Reminder sent", description: `Email sent to ${e.profiles?.email}` });
    } catch {
      toast({ title: "Error", description: "Failed to send reminder.", variant: "destructive" });
    } finally {
      setSendingReminder(prev => { const s = new Set(prev); s.delete(e.id); return s; });
    }
  };

  const handleResendPaymentEmail = useCallback(async (e: Enrollment) => {
    const { error } = await supabase.functions.invoke("send-confirmation-email", {
      body: {
        template: "payment_confirmed",
        email: e.profiles?.email,
        name: e.profiles?.name ?? "Student",
        language: "ar",
        plan_type: e.plan_type,
        duration: e.duration,
        sessions_total: e.sessions_total,
        amount: e.amount,
        currency: e.currency ?? "EGP",
        tx_ref: e.tx_ref,
      },
    });
    if (error) {
      toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment email resent", description: `Sent to ${e.profiles?.email}` });
    }
  }, []);

  const handleResendApprovalEmail = useCallback(async (e: Enrollment) => {
    const { error } = await supabase.functions.invoke("send-confirmation-email", {
      body: {
        template: "approval",
        email: e.profiles?.email,
        name: e.profiles?.name ?? "Student",
        language: "ar",
        plan_type: e.plan_type,
        duration: e.duration,
        sessions_total: e.sessions_total,
        amount: e.amount,
        currency: e.currency ?? "EGP",
      },
    });
    if (error) {
      toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Approval email resent", description: `Sent to ${e.profiles?.email}` });
    }
  }, []);

  const handleSendClassLink = async () => {
    if (!classLinkTarget || !classLinkUrl.trim()) return;
    setIsSendingClassLink(true);

    const recipients: { email: string; name: string; language?: string }[] = [];

    if (classLinkSendToGroup) {
      // Find the group this enrollment belongs to, then collect all active member emails
      const { data: memberRow } = await supabase
        .from("pkg_group_members")
        .select("group_id")
        .eq("enrollment_id", classLinkTarget.id)
        .maybeSingle();

      if (memberRow?.group_id) {
        const { data: groupMembers } = await supabase
          .from("pkg_group_members")
          .select("user_id")
          .eq("group_id", memberRow.group_id)
          .eq("member_status", "active");

        if (groupMembers && groupMembers.length > 0) {
          const userIds = groupMembers.map((m: { user_id: string }) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("email, name, timezone")
            .in("user_id", userIds);

          if (profiles) {
            for (const p of profiles) {
              if (p.email && p.name) {
                recipients.push({ email: p.email, name: p.name, language: getEmailLanguage(p.timezone || "") });
              }
            }
          }
        }
      }

      if (recipients.length === 0) {
        toast({ title: "No group members found", description: "This enrollment has no active group members.", variant: "destructive" });
        setIsSendingClassLink(false);
        return;
      }
    } else {
      const email = classLinkTarget.profiles?.email;
      const name = classLinkTarget.profiles?.name ?? "Student";
      if (!email) {
        toast({ title: "No email found", description: "This enrollment has no email address.", variant: "destructive" });
        setIsSendingClassLink(false);
        return;
      }
      recipients.push({ email, name, language: getEmailLanguage(classLinkTarget.timezone || "") });
    }

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const { error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "class_link",
          email: r.email,
          name: r.name,
          language: r.language,
          class_link_url: classLinkUrl.trim(),
          slot_day: classLinkSlotDay.trim() || undefined,
          slot_time: classLinkSlotTime.trim() || undefined,
          slot_timezone: classLinkSlotTimezone || undefined,
        },
      });
      if (error) failed++; else sent++;
    }

    setIsSendingClassLink(false);

    // Stamp class_link_sent_at and first_class_date on the enrollment
    const stampData: Record<string, unknown> = { class_link_sent_at: new Date().toISOString() };
    if (classLinkFirstClassDate) stampData.first_class_date = new Date(classLinkFirstClassDate).toISOString();
    await supabase.from("enrollments").update(stampData).eq("id", classLinkTarget.id);
    invalidateAll();

    setClassLinkTarget(null);
    setClassLinkUrl("");
    setClassLinkSendToGroup(false);
    setClassLinkSlotDay("");
    setClassLinkSlotTime("");
    setClassLinkSlotTimezone("Africa/Cairo");
    setClassLinkFirstClassDate("");

    if (failed > 0) {
      toast({ title: `Sent ${sent}, failed ${failed}`, variant: "destructive" });
    } else {
      toast({ title: `Class link sent to ${sent} student${sent !== 1 ? "s" : ""}` });
    }
  };

  const handleEnrollmentAction = async (enrollment: Enrollment, action: "APPROVED" | "REJECTED") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Block approval until matcher has placed the student (matched_at is set by the
    // matcher functions and is the authoritative signal that placement is complete).
    if (action === "APPROVED" && !enrollment.matched_at) {
      toast({
        title: "Cannot approve yet",
        description: "Assign the student to a class slot first (run the Matcher tab), then approve.",
        variant: "destructive",
      });
      return;
    }

    // Block approval for manual/Egypt payments that have no receipt on file.
    const isManualPayment = enrollment.payment_provider === "egypt_manual" || enrollment.payment_provider === "manual";
    const hasReceipt = enrollment.receipt_url && enrollment.receipt_url.trim() !== "" && enrollment.receipt_url !== "manual";
    if (action === "APPROVED" && isManualPayment && !hasReceipt) {
      toast({
        title: "Receipt required",
        description: "Cannot approve — no payment receipt has been uploaded. Ask the student to submit their receipt first.",
        variant: "destructive",
      });
      return;
    }

    const updates: Record<string, unknown> = {
      status: action,
      approval_status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    };

    if (action === "APPROVED" && (enrollment.payment_provider === "manual" || enrollment.payment_provider === "egypt_manual")) {
      updates.payment_status = "PAID";
    }
    if (action === "REJECTED") {
      updates.payment_status = "UNPAID";
      updates.enrollment_status = "cancelled";
      updates.sessions_remaining = 0;
    }

    const editedPrice = editingUnitPrice[enrollment.id];
    if (editedPrice && action === "APPROVED") {
      const price = Number(editedPrice);
      if (isNaN(price)) {
        toast({ title: "Invalid price", description: "Unit price must be a valid number.", variant: "destructive" });
        return;
      }
      if (price <= 0) {
        toast({ title: "Invalid price", description: "Unit price must be greater than zero.", variant: "destructive" });
        return;
      }
      if (price > 10000) {
        toast({ title: "Invalid price", description: "Unit price seems too high. Please verify.", variant: "destructive" });
        return;
      }
      updates.unit_price = price;
    }

    // Level and days are read-only from enrollment — no admin editing

    if (action === "APPROVED") {
      // Single atomic RPC: updates enrollment + adds credits in one transaction.
      // If either step fails, both roll back — no half-approved state.
      const { error: approveError } = await supabase.rpc("approve_enrollment", {
        _enrollment_id: enrollment.id,
        _admin_id: session.user.id,
        _unit_price: updates.unit_price != null ? Number(updates.unit_price) : null,
      });
      if (approveError) {
        toast({ title: "Error", description: approveError.message || "Failed to approve enrollment.", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("enrollments").update(updates).eq("id", enrollment.id);
      if (error) { toast({ title: "Error", description: "Failed to update enrollment.", variant: "destructive" }); return; }
    }

    toast({ title: `Enrollment ${action.toLowerCase()}` });
    invalidateAll();
  };

  const handleBulkApprove = async () => {
    if (selectedEnrollmentIds.size === 0) return;
    setBulkApproving(true);
    const { data: { session: bulkSession } } = await supabase.auth.getSession();
    if (!bulkSession) { setBulkApproving(false); return; }
    const ids = Array.from(selectedEnrollmentIds);

    // Run all RPCs in parallel — dramatically faster than sequential for large selections
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const enrollment = enrollments.find(e => e.id === id);
        if (!enrollment) throw new Error("not_found");
        if (!enrollment.matched_at) throw new Error("not_matched");
        const isManual = enrollment.payment_provider === "egypt_manual" || enrollment.payment_provider === "manual";
        const hasReceipt = enrollment.receipt_url && enrollment.receipt_url.trim() !== "" && enrollment.receipt_url !== "manual";
        if (isManual && !hasReceipt) throw new Error("no_receipt");
        const { error } = await supabase.rpc("approve_enrollment", {
          _enrollment_id: id,
          _admin_id: bulkSession.user.id,
          _unit_price: null,
        });
        if (error) throw error;
      })
    );

    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;
    setBulkApproving(false);
    setSelectedEnrollmentIds(new Set());
    toast({
      title: `Bulk approve complete`,
      description: `${succeeded} approved${failed > 0 ? `, ${failed} skipped (not matched or missing receipt)` : ""}`,
      variant: failed > 0 ? "destructive" : "default",
    });
    invalidateAll();
  };

  const handleRevertEnrollment = async (enrollment: Enrollment) => {
    const { error } = await supabase.rpc("revert_enrollment", {
      _enrollment_id: enrollment.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment reverted to pending, credits deducted." });
    invalidateAll();
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to delete enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment deleted" });
    invalidateAll();
  };

  const handleAttendanceAction = async (req: AttendanceReq, action: "APPROVED" | "REJECTED") => {
    if (action === "APPROVED") {
      const { data, error } = await supabase.rpc("approve_attendance_request", {
        _request_id: req.id,
      });
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to approve.", variant: "destructive" });
        return;
      }
      toast({ title: "Attendance approved", description: `Sessions remaining: ${data}` });
    } else {
      const { error } = await supabase.rpc("reject_attendance_request", {
        _request_id: req.id,
      });
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to reject.", variant: "destructive" });
        return;
      }
      toast({ title: "Attendance rejected" });
    }
    invalidateAll();
  };

  const handleRevertAttendance = async (req: AttendanceReq) => {
    const { error } = await supabase.rpc("revert_attendance_request", {
      _request_id: req.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert.", variant: "destructive" });
      return;
    }
    toast({ title: "Reverted to pending", description: req.status === "APPROVED" ? "Session restored." : "Request is pending again." });
    invalidateAll();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  // Computed badge counts
  const actionableEnrollments = enrollments.filter(e =>
    e.approval_status === "UNDER_REVIEW" ||
    e.approval_status === "PENDING_PAYMENT" ||
    (e.approval_status === "PENDING" && e.admin_review_required)
  ).length;
  const pendingAttendance = attendanceReqs.filter(a => a.status === "PENDING").length;

  // === UNIFIED DATASET from DB view ===
  const lifecycleLeads = overviewRows.filter(u => u.derived_status === "LEAD").length;
  const lifecycleActive = overviewRows.filter(u => u.derived_status === "ACTIVE").length;
  const lifecycleCompleted = overviewRows.filter(u => u.derived_status === "COMPLETED").length;
  const lifecycleLocked = overviewRows.filter(u => u.derived_status === "LOCKED").length;
  const lifecycleConfirmedTotal = overviewRows.filter(u => ["ACTIVE", "COMPLETED", "LOCKED"].includes(u.derived_status)).length;

  const confirmedCount = lifecycleConfirmedTotal;
  const leadsProfileCount = lifecycleLeads;
  const stripeCount = overviewRows.filter(u => u.source_label === "Stripe").length;
  const egyptCount = overviewRows.filter(u => u.source_label === "Egypt").length;

  // Debounced search values so typing doesn't lag the filter
  const debouncedStudentSearch = useDebouncedValue(studentSearch, 200);
  const debouncedEnrollmentSearch = useDebouncedValue(enrollmentSearch, 200);

  // Filtered + searched users from view
  const filteredUsers = useMemo(() => {
    const q = debouncedStudentSearch.toLowerCase();
    return overviewRows.filter(u => {
      const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesFilter = studentFilter === "confirmed" ? ["ACTIVE", "COMPLETED", "LOCKED"].includes(u.derived_status)
        : studentFilter === "leads" ? u.derived_status === "LEAD"
        : studentFilter === "stripe" ? u.source_label === "Stripe"
        : studentFilter === "egypt" ? u.source_label === "Egypt"
        : studentFilter === "overdue" ? u.amount_due > 0
        : true;
      const matchesLevel = levelFilter === "all" || normalizeLevel(u.level || "") === levelFilter;
      return matchesSearch && matchesFilter && matchesLevel;
    });
  }, [overviewRows, debouncedStudentSearch, studentFilter, levelFilter]);

  // Sorted users (after filter, before pagination)
  const sortedUsers = useMemo(() => {
    if (!studentSort.col) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const v = (x: typeof a) =>
        studentSort.col === "sessions_remaining" ? x.sessions_remaining
        : studentSort.col === "amount_due" ? x.amount_due
        : studentSort.col === "remaining_balance" ? x.remaining_balance
        : studentSort.col === "joined_at" ? new Date(x.joined_at).getTime()
        : studentSort.col === "attendance_pct" ? (x.sessions_total > 0 ? (x.sessions_total - x.sessions_remaining) / x.sessions_total : -1)
        : 0;
      return studentSort.dir === "asc" ? v(a) - v(b) : v(b) - v(a);
    });
  }, [filteredUsers, studentSort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const pagedUsers = sortedUsers.slice(studentPage * PAGE_SIZE, (studentPage + 1) * PAGE_SIZE);

  // Reset pages when filters change (debounced so fast typing doesn't thrash)
  useEffect(() => { setStudentPage(0); }, [debouncedStudentSearch, studentFilter, levelFilter]);
  useEffect(() => { setEnrollmentPage(0); }, [debouncedEnrollmentSearch]);

  const overdueCount = overviewRows.filter(u => u.amount_due > 0).length;
  const studentFilterOptions = [
    { value: "all", label: `All (${overviewRows.length})` },
    { value: "confirmed", label: `Confirmed (${confirmedCount})` },
    { value: "leads", label: `Leads (${leadsProfileCount})` },
    { value: "stripe", label: `Stripe (${stripeCount})` },
    { value: "egypt", label: `Egypt Manual (${egyptCount})` },
    { value: "overdue", label: `Outstanding Balance (${overdueCount})` },
  ];

  const legacyEnrollmentCount = useMemo(() =>
    enrollments.filter(e => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0))).length,
    [enrollments]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await invalidateAll();
    setRefreshing(false);
  };

  const TAB_CLS = "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border border-border/60 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-primary data-[state=active]:shadow-sm bg-background hover:bg-muted transition-colors gap-1.5 h-auto";

  const TAB_GROUPS: { id: string; label: string; icon: typeof Users; tabs: string[] }[] = [
    { id: "ops",     label: "Operations", icon: BarChart3, tabs: ["students", "enrollments", "leads", "trials", "lead-funnel", "manage", "sales", "promos"] },
    { id: "learn",   label: "Learning",   icon: Users,     tabs: ["group-attendance", "group-matcher", "placement-tests", "session-attendance", "preferences", "league-users"] },
    { id: "content", label: "Content",    icon: Sparkles,  tabs: ["blog", "seo-orchestration", "image-audit", "campaigns"] },
    { id: "config",  label: "Config",     icon: Settings,  tabs: ["notifications", "scheduling", "availability", "settings"] },
  ];
  const activeGroup = TAB_GROUPS.find(g => g.tabs.includes(adminTab))?.id ?? "ops";
  const [tabGroup, setTabGroup] = useState<string>(activeGroup);
  useEffect(() => { setTabGroup(activeGroup); }, [activeGroup]);
  const currentGroup = useMemo(() => TAB_GROUPS.find(g => g.id === tabGroup), [tabGroup]);
  const inActiveGroup = useCallback((tab: string) => !!currentGroup?.tabs.includes(tab), [currentGroup]);

  // Alt+1..4 jump between groups; ignore if user is typing in an input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx < 0) return;
      const group = TAB_GROUPS[idx];
      if (!group) return;
      e.preventDefault();
      setTabGroup(group.id);
      setAdminTab(group.tabs[0]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setAdminTab]);

  return (
    <TooltipProvider>
      {/* Screen-reader live region for column toggle announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{colAnnouncement}</div>
      <div id="main-content" className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/40" />
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-3 px-4 md:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold text-foreground leading-tight truncate">Admin Dashboard</h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block">Manage students, enrollments & content</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2" aria-label="Refresh dashboard data">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
              </Button>
              {/* Keyboard shortcut reference */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Keyboard shortcuts reference"
                    className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                  >
                    ?
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs space-y-1 p-3 max-w-[200px]">
                  <p className="font-semibold text-foreground mb-1.5">Keyboard shortcuts</p>
                  <p><kbd className="font-mono bg-muted px-1 rounded">Alt+1</kbd> → Operations</p>
                  <p><kbd className="font-mono bg-muted px-1 rounded">Alt+2</kbd> → Learning</p>
                  <p><kbd className="font-mono bg-muted px-1 rounded">Alt+3</kbd> → Content</p>
                  <p><kbd className="font-mono bg-muted px-1 rounded">Alt+4</kbd> → Config</p>
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/marketing")} className="gap-2" aria-label="Open marketing dashboard">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Marketing</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2" aria-label="Log out">
                <LogOut className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {leadsError && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-medium">Data load error</p>
                <p className="text-xs mt-0.5 opacity-80">{leadsError}</p>
              </div>
              <button
                onClick={() => invalidateAll()}
                className="shrink-0 text-xs underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          <LifecycleFunnel
            leadsCount={lifecycleLeads}
            registeredCount={overviewRows.length}
            enrolledCount={lifecycleConfirmedTotal}
            activeCount={lifecycleActive}
            completedCount={lifecycleCompleted + lifecycleLocked}
            pendingCount={actionableEnrollments}
            onPendingClick={goToEnrollmentsTab}
          />

          {/* Collapsible Insights — student health + referral program */}
          {(overviewRows.length > 0 || referralStats.total > 0 || referralStats.totalClicks > 0) && (
            <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2.5 text-sm transition-colors">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Insights</span>
                  <span className="text-xs text-muted-foreground">
                    Student health · Referrals ({referralStats.total})
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", insightsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 pt-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <StudentHealthPanel overviewRows={overviewRows} />
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
                    {referralStats.thisMonth > 0 && <span className="text-green-600 dark:text-green-400 ml-2">· +{referralStats.thisMonth} this month</span>}
                    {referralStats.clicksThisMonth > 0 && <span className="text-blue-600 dark:text-blue-400 ml-1">· {referralStats.clicksThisMonth} click{referralStats.clicksThisMonth !== 1 ? "s" : ""} this month</span>}
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
                  <p className="text-lg font-bold text-foreground">{Math.max(0, referralStats.totalClicks - referralStats.total)}</p>
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
                              <span className={`font-semibold ${u.bonusPercent >= 10 ? "text-green-600 dark:text-green-400" : u.bonusPercent > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
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
          )}

          {/* Unified "Action needed" bar — stacks quick-actions into one row */}
          {(actionableEnrollments > 0 || trialStats.pending > 0) && (
            <div className="rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/25 dark:to-amber-900/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-400/30">
                <Bell className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  Action needed ({(actionableEnrollments > 0 ? 1 : 0) + (trialStats.pending > 0 ? 1 : 0)})
                </span>
              </div>
              <div className="divide-y divide-amber-400/20">
                {actionableEnrollments > 0 && (
                  <button
                    type="button"
                    onClick={() => { setAdminTab("enrollments"); setTabGroup("ops"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <FileCheck className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">{actionableEnrollments}</span>
                      <span className="text-amber-800 dark:text-amber-300"> enrollment{actionableEnrollments > 1 ? "s" : ""} pending review or payment</span>
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">Review →</span>
                  </button>
                )}
                {trialStats.pending > 0 && (
                  <button
                    type="button"
                    onClick={() => { setAdminTab("trials"); setTabGroup("ops"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
                  >
                    <Users className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">{trialStats.pending}</span>
                      <span className="text-amber-800 dark:text-amber-300"> trial booking{trialStats.pending > 1 ? "s" : ""} awaiting confirmation</span>
                      {trialStats.thisWeek > 0 && (
                        <span className="text-xs text-amber-700/80 dark:text-amber-400/80 ml-2">· {trialStats.thisWeek} this week</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">Confirm →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <Suspense fallback={<TabLoader />}>
          <Tabs id="admin-tabs-root" value={adminTab} onValueChange={setAdminTab}>
            {/* Two-level navigation: group selector + contextual tabs */}
            <div className="w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Group selector */}
              <div className="flex items-center gap-1 p-2 bg-muted/40 border-b border-border/60 overflow-x-auto">
                {TAB_GROUPS.map((g, idx) => {
                  const GroupIcon = g.icon;
                  const isActive = tabGroup === g.id;
                  const hasAlert =
                    (g.id === "ops" && (actionableEnrollments > 0 || trialStats.pending > 0)) ||
                    (g.id === "learn" && pendingAttendance > 0);
                  return (
                    <Tooltip key={g.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setTabGroup(g.id)}
                          className={cn(
                            "relative shrink-0 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                            isActive
                              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                          )}
                        >
                          <GroupIcon className="h-3.5 w-3.5" />
                          {g.label}
                          {hasAlert && (
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">
                        Alt+{idx + 1}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Mobile tab selector (< sm) */}
              {isMobile && currentGroup && (
                <div className="p-3 border-b border-border/60 bg-background">
                  <Select value={adminTab} onValueChange={setAdminTab}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentGroup.tabs.map(t => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <TabsList className={cn(
                "w-full h-auto bg-transparent border-0 rounded-none p-3 flex-wrap items-center gap-1.5 justify-start",
                isMobile ? "hidden" : "flex"
              )}>
                {inActiveGroup("students") && (
                  <TabsTrigger value="students" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Users
                    <span className="opacity-60">({overviewRows.length})</span>
                  </TabsTrigger>
                )}
                {inActiveGroup("enrollments") && (
                  <TabsTrigger value="enrollments" className={TAB_CLS}>
                    <FileCheck className="h-3.5 w-3.5" /> Enrollments
                    {actionableEnrollments > 0 && (
                      <span className="relative inline-flex">
                        <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{actionableEnrollments}</Badge>
                        <span className="absolute inset-0 rounded-full bg-destructive/60 animate-ping" />
                      </span>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("leads") && (
                  <TabsTrigger value="leads" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> New Leads
                    {newLeadsCount > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{newLeadsCount}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("trials") && (
                  <TabsTrigger value="trials" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Trial Classes
                    {trialStats.pending > 0 && (
                      <span className="relative inline-flex">
                        <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{trialStats.pending}</Badge>
                        <span className="absolute inset-0 rounded-full bg-destructive/60 animate-ping" />
                      </span>
                    )}
                    {trialStats.pending === 0 && trialStats.upcoming > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{trialStats.upcoming}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("lead-funnel") && (
                  <TabsTrigger value="lead-funnel" className={TAB_CLS}>
                    <TrendingUp className="h-3.5 w-3.5" /> Funnel Analytics
                  </TabsTrigger>
                )}
                {inActiveGroup("manage") && (
                  <TabsTrigger value="manage" className={TAB_CLS}>
                    <Package className="h-3.5 w-3.5" /> Student Admin
                  </TabsTrigger>
                )}
                {inActiveGroup("sales") && (
                  <TabsTrigger value="sales" className={TAB_CLS}>
                    <BarChart3 className="h-3.5 w-3.5" /> Sales
                  </TabsTrigger>
                )}
                {inActiveGroup("promos") && (
                  <TabsTrigger value="promos" className={TAB_CLS}>
                    <Tag className="h-3.5 w-3.5" /> Promos
                  </TabsTrigger>
                )}
                {inActiveGroup("group-attendance") && (
                  <TabsTrigger value="group-attendance" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Groups
                    {pendingAttendance > 0 && (
                      <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{pendingAttendance}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("group-matcher") && (
                  <TabsTrigger value="group-matcher" className={TAB_CLS}>Matcher</TabsTrigger>
                )}
                {inActiveGroup("placement-tests") && (
                  <TabsTrigger value="placement-tests" className={TAB_CLS}>Placement Tests</TabsTrigger>
                )}
                {inActiveGroup("session-attendance") && (
                  <TabsTrigger value="session-attendance" className={TAB_CLS}>
                    <FileCheck className="h-3.5 w-3.5" /> Attendance
                  </TabsTrigger>
                )}
                {inActiveGroup("preferences") && (
                  <TabsTrigger value="preferences" className={TAB_CLS}>
                    <BarChart3 className="h-3.5 w-3.5" /> Preferences
                  </TabsTrigger>
                )}
                {inActiveGroup("league-users") && (
                  <TabsTrigger value="league-users" className={TAB_CLS}>
                    <Trophy className="h-3.5 w-3.5" /> Leagues
                  </TabsTrigger>
                )}
                {inActiveGroup("blog") && (
                  <TabsTrigger value="blog" className={TAB_CLS}>Blog</TabsTrigger>
                )}
                {inActiveGroup("seo-orchestration") && (
                  <TabsTrigger value="seo-orchestration" className={TAB_CLS}>
                    <Sparkles className="h-3.5 w-3.5" /> SEO AI
                  </TabsTrigger>
                )}
                {inActiveGroup("image-audit") && (
                  <TabsTrigger value="image-audit" className={TAB_CLS}>
                    <Image className="h-3.5 w-3.5" /> Images
                  </TabsTrigger>
                )}
                {inActiveGroup("campaigns") && (
                  <TabsTrigger value="campaigns" className={TAB_CLS}>
                    <Mail className="h-3.5 w-3.5" /> Campaigns
                  </TabsTrigger>
                )}
                {inActiveGroup("notifications") && (
                  <TabsTrigger value="notifications" className={TAB_CLS}>
                    <Bell className="h-3.5 w-3.5" /> Alerts
                  </TabsTrigger>
                )}
                {inActiveGroup("scheduling") && (
                  <TabsTrigger value="scheduling" className={TAB_CLS}>Scheduling</TabsTrigger>
                )}
                {inActiveGroup("availability") && (
                  <TabsTrigger value="availability" className={TAB_CLS}>
                    <Clock className="h-3.5 w-3.5" /> Availability
                  </TabsTrigger>
                )}
                {inActiveGroup("settings") && (
                  <TabsTrigger value="settings" className={TAB_CLS}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* STUDENTS TAB */}
            <TabsContent value="students">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base">Users</CardTitle>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Read-only overview of every student. For manual enrollment, packages, or legacy records use
                          <button
                            type="button"
                            onClick={() => setAdminTab("manage")}
                            className="underline underline-offset-2 hover:text-foreground ml-1"
                          >
                            Student Admin →
                          </button>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{filteredUsers.length} of {overviewRows.length}</p>
                    </div>
                    {/* Responsive student filters */}
                    {isMobile ? (
                      <Select value={studentFilter} onValueChange={setStudentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {studentFilterOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                        {studentFilterOptions.map(opt => (
                          <Button
                            key={opt.value}
                            variant={studentFilter === opt.value ? "default" : "outline"}
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => setStudentFilter(opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Search + Level filter + Export */}
                    <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="pl-9"
                          aria-label="Search students by name or email"
                          type="search"
                        />
                      </div>
                      <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {LEVEL_SELECT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size={isMobile ? "icon" : "sm"} aria-label="Toggle table columns">
                            <Columns3 className="h-4 w-4" />
                            {!isMobile && <span className="ml-1">Columns</span>}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs">Visible columns</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {ALL_STUDENT_COLS.map(col => (
                            <DropdownMenuCheckboxItem
                              key={col}
                              checked={visibleStudentCols.has(col)}
                              onCheckedChange={() => toggleStudentCol(col)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {STUDENT_COL_LABELS[col]}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => {
                        const headers = ["Name", "Email", "Country", "Level", "Remaining Sessions", "Status", "Source", "Joined"];
                        const rows = filteredUsers.map(u => [u.name, u.email, u.country, u.level, u.sessions_remaining, u.derived_status, u.source_label, new Date(u.joined_at).toLocaleDateString()]);
                        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                        URL.revokeObjectURL(url);
                      }}>
                        <Download className="h-4 w-4" />
                        {!isMobile && <span className="ml-1">Export CSV</span>}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
              {loading ? (
                <div className="py-2">
                  <div className="flex items-center gap-3 py-3 border-b border-border/50">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-40 flex-1" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/3" />
                        <Skeleton className="h-3 w-1/2 opacity-70" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-7 w-20 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : sortedUsers.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-foreground">No students match your filters</p>
                    <p className="text-xs text-muted-foreground">Try clearing filters or adjusting your search term</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStudentFilter("all"); setLevelFilter("all"); setStudentSearch(""); }}
                  >
                    <Eraser className="h-4 w-4 mr-1.5" /> Clear all filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border rounded-xl overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                          <TableHead className="py-3 px-3 font-semibold">Name</TableHead>
                          <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                          {visibleStudentCols.has("country") && (
                            <TableHead className="py-3 px-3 font-semibold">Country</TableHead>
                          )}
                          {visibleStudentCols.has("level") && (
                            <TableHead className="py-3 px-3 font-semibold">Level</TableHead>
                          )}
                          <TableHead
                            aria-sort={studentSort.col === "sessions_remaining" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                            className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "sessions_remaining", dir: s.col === "sessions_remaining" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Remaining {studentSort.col === "sessions_remaining" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          {visibleStudentCols.has("attendance") && (
                            <TableHead
                              aria-sort={studentSort.col === "attendance_pct" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                              className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary"
                              onClick={() => setStudentSort(s => ({ col: "attendance_pct", dir: s.col === "attendance_pct" && s.dir === "asc" ? "desc" : "asc" }))}
                            >
                              Attend% {studentSort.col === "attendance_pct" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                            </TableHead>
                          )}
                          <TableHead className="py-3 px-3 font-semibold text-center">Negative</TableHead>
                          <TableHead
                            aria-sort={studentSort.col === "amount_due" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                            className="py-3 px-3 font-semibold text-right cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "amount_due", dir: s.col === "amount_due" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Amount Due {studentSort.col === "amount_due" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead
                            aria-sort={studentSort.col === "remaining_balance" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                            className="py-3 px-3 font-semibold text-right cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "remaining_balance", dir: s.col === "remaining_balance" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Balance {studentSort.col === "remaining_balance" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                          {visibleStudentCols.has("source") && (
                            <TableHead className="py-3 px-3 font-semibold">Source</TableHead>
                          )}
                          {visibleStudentCols.has("joined") && (
                            <TableHead
                              aria-sort={studentSort.col === "joined_at" ? (studentSort.dir === "asc" ? "ascending" : "descending") : "none"}
                              className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-primary"
                              onClick={() => setStudentSort(s => ({ col: "joined_at", dir: s.col === "joined_at" && s.dir === "asc" ? "desc" : "asc" }))}
                            >
                              Joined {studentSort.col === "joined_at" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                            </TableHead>
                          )}
                          <TableHead className="py-3 px-3 w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedUsers.map((u) => (
                          <TableRow key={u.user_id} className={cn("group odd:bg-muted/30 hover:bg-muted/50 transition cursor-pointer", selectedStudentId === u.user_id && "ring-2 ring-primary/40")} onClick={() => setSelectedStudentId(selectedStudentId === u.user_id ? null : (u.enrollment_id ? u.user_id : null))}>
                            <TableCell className="py-3 px-3 font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>{u.name || "—"}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                  title="Manually enroll"
                                  aria-label={`Manually enroll ${u.name || u.email}`}
                                  onClick={e => { e.stopPropagation(); openManualEnroll(u); }}
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <div className="flex items-center gap-1 max-w-[240px]">
                                <span className="truncate flex-1 text-sm">{u.email}</span>
                                <button
                                  className="shrink-0 p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.email); toast({ title: "Copied" }); }}
                                  aria-label={`Copy email ${u.email}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                            {visibleStudentCols.has("country") && (
                              <TableCell className="py-3 px-3 text-muted-foreground">{u.country || "—"}</TableCell>
                            )}
                            {visibleStudentCols.has("level") && (
                              <TableCell className="py-3 px-3 text-muted-foreground">{u.level || "—"}</TableCell>
                            )}
                            <TableCell className="py-3 px-3 text-center font-mono">{u.sessions_remaining}</TableCell>
                            {visibleStudentCols.has("attendance") && (
                            <TableCell className="py-3 px-3 text-center">
                              {u.sessions_total > 0 ? (() => {
                                const pct = Math.round(((u.sessions_total - u.sessions_remaining) / u.sessions_total) * 100);
                                return (
                                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${pct >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : pct >= 50 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`} aria-label={`${pct}% attendance`}>
                                    {pct}%
                                  </span>
                                );
                              })() : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            )}
                            <TableCell className="py-3 px-3 text-center font-mono">
                              {u.negative_sessions > 0 ? (
                                <span className="inline-flex items-center gap-1 text-destructive font-semibold" aria-label={`${u.negative_sessions} negative sessions`}>
                                  <AlertCircle className="h-3 w-3" aria-hidden="true" /> {u.negative_sessions}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                              {u.amount_due > 0 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={`mailto:${u.email}?subject=Outstanding Balance - Klovers&body=Hi ${(u.name || "").split(" ")[0]},%0A%0AYou have an outstanding balance of ${formatMoney(u.amount_due, u.currency)}. Please arrange payment at your earliest convenience.%0A%0ABest,%0AKlovers Team`}
                                        className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors text-xs font-semibold"
                                        aria-label={`Send payment request to ${u.name}`}
                                      >
                                        {formatMoney(u.amount_due, u.currency)}
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>Send payment request email</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right font-mono">
                              {u.remaining_balance > 0 ? (
                                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                  {formatMoney(u.remaining_balance, u.currency)}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant={getDerivedStatusBadgeVariant(u.derived_status)} className="text-xs cursor-help">{u.derived_status}</Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  {STATUS_TOOLTIPS[u.derived_status] ?? u.derived_status}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            {visibleStudentCols.has("source") && (
                              <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                  onClick={() => {
                                    const f = u.source_label === "Stripe" ? "stripe" : u.source_label === "Egypt" ? "egypt" : null;
                                    if (f) { setStudentFilter(f); setStudentPage(0); }
                                  }}
                                  title={`Filter by ${u.source_label}`}
                                  role="button"
                                  aria-label={`Filter students by source: ${u.source_label}`}
                                >
                                  {u.source_label}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleStudentCols.has("joined") && (
                              <TableCell className="py-3 px-3 text-muted-foreground text-xs">{formatDate(u.joined_at)}</TableCell>
                            )}
                            <TableCell className="py-3 px-3 w-10" onClick={(e) => e.stopPropagation()}>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="p-1 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/40 transition-colors"
                                    aria-label="Delete student"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete student?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete {u.name || u.email}'s profile. This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteStudent(u.user_id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-muted-foreground">
                        Page {studentPage + 1} of {totalPages} · {sortedUsers.length} results
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage === 0} onClick={() => setStudentPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage >= totalPages - 1} onClick={() => setStudentPage(p => p + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
                </CardContent>
              </Card>

              {/* Attendance Panel */}
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
                    onClose={() => setSelectedStudentId(null)}
                    onUpdated={invalidateAll}
                  />
                );
              })()}
            </TabsContent>

            <TabsContent value="enrollments">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">Enrollments</CardTitle>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showLegacyEnrollments}
                          onChange={(e) => setShowLegacyEnrollments(e.target.checked)}
                          className="rounded"
                        />
                        Show Legacy ({legacyEnrollmentCount})
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={async () => {
                          const { data, error } = await supabase.rpc("backfill_missing_enrollments");
                          if (error) {
                            toast({ title: "Backfill failed", description: error.message, variant: "destructive" });
                          } else {
                            const result = data as Record<string, number> | null;
                            toast({ title: "Backfill complete", description: `Fixed: ${result?.fixed ?? 0}, Remaining: ${result?.remaining ?? 0}` });
                            invalidateAll();
                          }
                        }}
                      >
                        Backfill Missing
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {/* Funnel summary strip */}
                {!loading && (() => {
                  const paidUnplaced = enrollments.filter(e => e.payment_status === "PAID" && !e.matched_at && e.approval_status !== "REJECTED" && e.approval_status !== "CANCELLED").length;
                  const noLink = enrollments.filter(e => e.approval_status === "APPROVED" && e.matched_at && !e.class_link_sent_at).length;
                  const pendingReceipt = enrollments.filter(e => (e.payment_provider === "egypt_manual" || e.payment_provider === "manual") && (!e.receipt_url || e.receipt_url === "" || e.receipt_url === "manual") && (e.approval_status === "PENDING" || e.approval_status === "UNDER_REVIEW")).length;
                  if (paidUnplaced === 0 && noLink === 0 && pendingReceipt === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2 px-6 pb-3">
                      {paidUnplaced > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
                          ⏳ {paidUnplaced} paid, awaiting placement
                        </div>
                      )}
                      {noLink > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium dark:bg-red-950/20 dark:border-red-800 dark:text-red-400">
                          🔗 {noLink} approved, no class link sent
                        </div>
                      )}
                      {pendingReceipt > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400">
                          📄 {pendingReceipt} missing receipt
                        </div>
                      )}
                    </div>
                  );
                })()}
                <CardContent className="pt-0">
              {loading ? (
                <div className="py-2 space-y-2">
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 w-28 rounded-md" />
                  </div>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border/40">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="h-3 w-1/3 opacity-70" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-7 w-24 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="under_review" onValueChange={() => setEnrollmentPage(0)}>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email or plan…"
                        value={enrollmentSearch}
                        onChange={(e) => setEnrollmentSearch(e.target.value)}
                        className="pl-9"
                        aria-label="Search enrollments by name, email or plan"
                        type="search"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={showOverdueOnly ? "default" : "outline"}
                      onClick={() => setShowOverdueOnly(v => !v)}
                      className="shrink-0 gap-1.5"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {!isMobile && "Overdue only"}
                    </Button>
                  </div>
                  {(() => {
                    const missing = enrollments.filter(e => e.currency === "EGP" && !e.payment_method && (e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW"));
                    if (missing.length === 0) return null;
                    return (
                      <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 mb-3">
                        <span className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {missing.length} Egypt enrollment{missing.length > 1 ? "s" : ""} missing payment method
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                          disabled={missing.some(e => sendingReminder.has(e.id))}
                          onClick={async () => { for (const e of missing) await handleSendPaymentMethodReminder(e); }}
                        >
                          Notify All ({missing.length})
                        </Button>
                      </div>
                    );
                  })()}
                  <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3 h-auto bg-transparent p-0 w-full">
                    {[
                      { value: "under_review", label: "Under Review", count: enrollments.filter(e => e.approval_status === "UNDER_REVIEW").length },
                      { value: "pending_payment", label: "Pending Payment", count: enrollments.filter(e => e.approval_status === "PENDING_PAYMENT").length },
                      { value: "pending", label: "Pending", count: enrollments.filter(e => e.approval_status === "PENDING").length },
                      { value: "approved", label: "Approved", count: enrollments.filter(e => e.approval_status === "APPROVED").length },
                      { value: "rejected", label: "Rejected", count: enrollments.filter(e => e.approval_status === "REJECTED").length },
                    ].map(t => (
                      <TabsTrigger key={t.value} value={t.value} className="shrink-0 rounded-full px-4 py-2 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                        {t.label} ({t.count})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(["pending_payment", "under_review", "pending", "approved", "rejected"] as const).map((tab) => {
                    const isLegacy = (e: Enrollment) => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0));
                    const filtered = enrollments.filter((e) => {
                      const matchesTab = tab === "pending_payment" ? e.approval_status === "PENDING_PAYMENT"
                        : tab === "under_review" ? e.approval_status === "UNDER_REVIEW"
                        : tab === "pending" ? e.approval_status === "PENDING"
                        : tab === "approved" ? e.approval_status === "APPROVED"
                        : e.approval_status === "REJECTED";
                      if (!matchesTab) return false;
                      const isActionable = e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW";
                      if (!showLegacyEnrollments && isLegacy(e) && !isActionable) return false;
                      if (showOverdueOnly && !e.negative_since) return false;
                      if (debouncedEnrollmentSearch) {
                        const q = debouncedEnrollmentSearch.toLowerCase();
                        const name = e.profiles?.name?.toLowerCase() ?? "";
                        const email = e.profiles?.email?.toLowerCase() ?? "";
                        const plan = e.plan_type?.toLowerCase() ?? "";
                        if (!name.includes(q) && !email.includes(q) && !plan.includes(q)) return false;
                      }
                      return true;
                    });
                    const isActionableTab = tab === "under_review" || tab === "pending_payment";
                    const enrollPageCount = Math.ceil(filtered.length / PAGE_SIZE);
                    const pagedEnrollments = filtered.slice(enrollmentPage * PAGE_SIZE, (enrollmentPage + 1) * PAGE_SIZE);
                    const allPageSelected = pagedEnrollments.length > 0 && pagedEnrollments.every(e => selectedEnrollmentIds.has(e.id));
                    return (
                      <TabsContent key={tab} value={tab} className="space-y-4">
                        {isActionableTab && filtered.length > 1 && (
                          <div className="flex items-center gap-2 px-1 pb-1 border-b border-border">
                            <Checkbox
                              id={`select-all-${tab}`}
                              checked={allPageSelected}
                              onCheckedChange={(checked) => {
                                setSelectedEnrollmentIds(prev => {
                                  const next = new Set(prev);
                                  pagedEnrollments.forEach(e => checked ? next.add(e.id) : next.delete(e.id));
                                  return next;
                                });
                              }}
                            />
                            <label htmlFor={`select-all-${tab}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                              {allPageSelected ? "Deselect all on page" : `Select all on page (${pagedEnrollments.length})`}
                            </label>
                          </div>
                        )}
                        {filtered.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No {tab.replace(/_/g, " ")} enrollments.</p>
                        ) : pagedEnrollments.map((e) => {
                          const profileEmail = e.profiles?.email?.toLowerCase() ?? "";
                          const leadLvl = profileEmail && leadsByEmail[profileEmail]?.level?.trim()
                            ? normalizeLevel(leadsByEmail[profileEmail].level)
                            : "";
                          const resolvedLevelFallback = (e.level?.trim() ? normalizeLevel(e.level) : null) ?? leadLvl ?? "";
                          return (
                            <EnrollmentCard
                              key={e.id}
                              enrollment={e}
                              isActionableTab={isActionableTab}
                              isSelected={selectedEnrollmentIds.has(e.id)}
                              onToggleSelect={(id, checked) => {
                                setSelectedEnrollmentIds(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.add(id); else next.delete(id);
                                  return next;
                                });
                              }}
                              editingPrice={editingUnitPrice[e.id]}
                              onStartEditPrice={(en) => setEditingUnitPrice(prev => ({ ...prev, [en.id]: String(en.unit_price) }))}
                              onChangeEditPrice={(id, val) => setEditingUnitPrice(prev => ({ ...prev, [id]: val }))}
                              isSendingReminder={sendingReminder.has(e.id)}
                              onSendPaymentMethodReminder={handleSendPaymentMethodReminder}
                              resolvedLevelFallback={resolvedLevelFallback}
                              onApprove={(en) => handleEnrollmentAction(en, "APPROVED")}
                              onApproveAndMatch={async (en) => { await handleEnrollmentAction(en, "APPROVED"); setAdminTab("group-matcher"); }}
                              onReject={(en) => { setRejectTarget(en); setRejectReason("payment_not_received"); setRejectNote(""); }}
                              onRevert={handleRevertEnrollment}
                              onDelete={handleDeleteEnrollment}
                              onViewReceipt={handleViewReceipt}
                              onRequestResubmission={handleRequestResubmission}
                              onSendClassLink={(en) => { setClassLinkTarget(en); setClassLinkUrl(""); setClassLinkSendToGroup(false); }}
                              onResendPaymentEmail={handleResendPaymentEmail}
                              onResendApprovalEmail={handleResendApprovalEmail}
                            />
                          );
                        })}
                        {enrollPageCount > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                              Page {enrollmentPage + 1} of {enrollPageCount} · {filtered.length} enrollments
                            </p>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" disabled={enrollmentPage === 0} onClick={() => setEnrollmentPage(p => p - 1)} aria-label="Previous page">
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-8 w-8" disabled={enrollmentPage >= enrollPageCount - 1} onClick={() => setEnrollmentPage(p => p + 1)} aria-label="Next page">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sticky bulk action bar — floats above bottom when enrollments are selected */}
            {selectedEnrollmentIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background/95 backdrop-blur border border-border shadow-xl rounded-2xl px-5 py-3 animate-slide-up">
                <p className="text-sm font-semibold text-foreground">
                  {selectedEnrollmentIds.size} enrollment{selectedEnrollmentIds.size > 1 ? "s" : ""} selected
                </p>
                <Button size="sm" onClick={handleBulkApprove} disabled={bulkApproving}>
                  {bulkApproving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Approving…</> : <><Check className="h-4 w-4 mr-1.5" /> Approve All</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedEnrollmentIds(new Set())}>
                  <X className="h-4 w-4 mr-1.5" /> Clear
                </Button>
              </div>
            )}

            {/* LEADS TAB */}
            <TabsContent value="leads">
              <TabErrorBoundary name="Leads">
                <Suspense fallback={<TabLoader />}>
                  <LeadsPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* TRIAL CLASSES TAB */}
            <TabsContent value="trials">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Trial Classes</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Trial Classes">
                    <Suspense fallback={<TabLoader />}>
                      <TrialClassesManager />
                    </Suspense>
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LEAD FUNNEL TAB */}
            <TabsContent value="lead-funnel">
              <TabErrorBoundary name="Lead Funnel">
                <Suspense fallback={<TabLoader />}>
                  <LeadFunnelPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* MANAGE STUDENTS TAB */}
            <TabsContent value="manage">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Student Admin</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Create / edit student records, assign packages, and manage legacy attendance. For the high-level overview use
                    <button
                      type="button"
                      onClick={() => setAdminTab("students")}
                      className="underline underline-offset-2 hover:text-foreground ml-1"
                    >
                      Users →
                    </button>
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Student Manager">
                    <StudentManager />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROMO CODES TAB */}
            <TabsContent value="promos">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Promo Codes</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Promo Codes">
                    <Suspense fallback={<TabLoader />}>
                      <PromoCodesManager />
                    </Suspense>
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP ATTENDANCE TAB */}
            <TabsContent value="group-attendance">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Group Attendance</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Group Attendance">
                    <GroupAttendanceManager
                      overviewRows={overviewRows}
                      selectedStudentId={selectedStudentId}
                      onStudentSelect={setSelectedStudentId}
                      attendanceReqs={attendanceReqs}
                      onAttendanceAction={handleAttendanceAction}
                      onRevertAttendance={handleRevertAttendance}
                      userGroupMap={{}}
                      onUpdated={invalidateAll}
                    />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP MATCHER TAB */}
            <TabsContent value="group-matcher">
              <TabErrorBoundary name="Group Matcher">
                <GroupMatcher />
              </TabErrorBoundary>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Notifications">
                    <AdminNotifications />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BLOG TAB */}
            <TabsContent value="blog">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Blog Manager</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Blog Manager">
                    <BlogManager />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO ORCHESTRATION TAB */}
            <TabsContent value="seo-orchestration">
              <SeoOrchestrationPanel />
            </TabsContent>

            {/* IMAGE AUDIT TAB */}
            <TabsContent value="image-audit">
              <ImageAuditPanel />
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns">
              <div className="space-y-6">
                <TabErrorBoundary name="Email Campaigns">
                  <BulkEmailManager />
                </TabErrorBoundary>
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Profile Completion Reminders
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Send automated emails to students with incomplete profiles, prompting them to fill in missing information on their dashboard.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={async () => {
                        try {
                          toast({ title: "Sending reminders…", description: "Scanning for incomplete profiles." });
                          const { data, error } = await supabase.functions.invoke("send-profile-reminders");
                          if (error) throw error;
                          toast({ title: "Done!", description: `Sent: ${data?.sent || 0}, Skipped (complete): ${data?.skipped || 0}` });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" /> Send Profile Reminder Emails
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


            {/* SCHEDULING TAB */}
            <TabsContent value="scheduling">
              <div className="space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Scheduling Operations</CardTitle>
                    <p className="text-sm text-muted-foreground">Manage packages, groups, waitlists, and notifications.</p>
                  </CardHeader>
                  <CardContent>
                    <TabErrorBoundary name="Scheduling Manager">
                      <SchedulingManager />
                    </TabErrorBoundary>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PLACEMENT TESTS TAB */}
            <TabsContent value="placement-tests">
              <TabErrorBoundary name="Placement Tests">
                <PlacementTestsManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* TEACHER AVAILABILITY TAB */}
            <TabsContent value="availability">
              <TabErrorBoundary name="Teacher Availability">
                <TeacherAvailabilityManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* STUDENT PREFERENCES TAB */}
            <TabsContent value="preferences">
              <TabErrorBoundary name="Student Preferences">
                <StudentPreferenceDashboard />
              </TabErrorBoundary>
            </TabsContent>

            {/* LEAGUE USERS TAB */}
            <TabsContent value="league-users">
              <TabErrorBoundary name="League Users">
                <Suspense fallback={<TabLoader />}>
                  <LeagueUsersPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* SALES ANALYTICS TAB */}
            <TabsContent value="sales">
              <TabErrorBoundary name="Sales Analytics">
                <SalesAnalytics />
              </TabErrorBoundary>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="session-attendance">
              <TabErrorBoundary name="Session Attendance">
                <SessionAttendanceManager />
              </TabErrorBoundary>
            </TabsContent>
            <TabsContent value="settings">
              <TabErrorBoundary name="Settings">
                <AdminSettings />
              </TabErrorBoundary>
            </TabsContent>
          </Tabs>
          </Suspense>
        </div>
      </div>
      {/* Send Class Link dialog */}
      <Dialog open={!!classLinkTarget} onOpenChange={(open) => { if (!open) { setClassLinkTarget(null); setClassLinkUrl(""); setClassLinkSendToGroup(false); setClassLinkSlotDay(""); setClassLinkSlotTime(""); setClassLinkSlotTimezone("Africa/Cairo"); setClassLinkFirstClassDate(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-4 w-4" /> Send Class Link
            </DialogTitle>
            <DialogDescription>
              {classLinkTarget && (
                <span>
                  Sending to: <strong>{classLinkTarget.profiles?.name || classLinkTarget.profiles?.email || "Unknown"}</strong>
                  {classLinkSendToGroup && " and their entire group"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="class-link-url">Meeting Link (Zoom / Google Meet)</Label>
              <Input
                id="class-link-url"
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                value={classLinkUrl}
                onChange={(e) => setClassLinkUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-to-group"
                checked={classLinkSendToGroup}
                onCheckedChange={(v) => setClassLinkSendToGroup(!!v)}
              />
              <Label htmlFor="send-to-group" className="cursor-pointer font-normal">
                Send to entire group (all active members)
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="slot-day" className="text-xs text-muted-foreground">Day of week (optional)</Label>
                <Input id="slot-day" placeholder="e.g. Monday" value={classLinkSlotDay} onChange={(e) => setClassLinkSlotDay(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slot-time" className="text-xs text-muted-foreground">Time (optional)</Label>
                <Input id="slot-time" placeholder="e.g. 7:00 PM" value={classLinkSlotTime} onChange={(e) => setClassLinkSlotTime(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="first-class-date" className="text-xs text-muted-foreground">First class date/time — for pre-class reminder (optional)</Label>
              <Input id="first-class-date" type="datetime-local" value={classLinkFirstClassDate} onChange={(e) => setClassLinkFirstClassDate(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClassLinkTarget(null); setClassLinkUrl(""); setClassLinkSendToGroup(false); }}>
              Cancel
            </Button>
            <Button
              disabled={!classLinkUrl.trim() || isSendingClassLink}
              onClick={handleSendClassLink}
            >
              {isSendingClassLink ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : <><Link className="h-4 w-4 mr-2" /> Send Link</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt preview modal */}
      <Dialog open={!!receiptModal} onOpenChange={(open) => { if (!open) setReceiptModal(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Receipt — {receiptModal?.studentName}
            </DialogTitle>
            <DialogDescription>Payment receipt uploaded by the student.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[300px] bg-muted/30 rounded-lg overflow-hidden">
            {receiptModal?.isPdf ? (
              <div className="text-center space-y-3 p-6">
                <p className="text-muted-foreground text-sm">PDF receipt — cannot preview inline.</p>
                <Button variant="outline" onClick={() => window.open(receiptModal.url, "_blank")}>
                  <Eye className="h-4 w-4 mr-2" /> Open PDF
                </Button>
              </div>
            ) : receiptModal ? (
              <img
                src={receiptModal.url}
                alt={`Receipt for ${receiptModal.studentName}`}
                className="max-w-full max-h-[60vh] object-contain rounded"
              />
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            {receiptModal && !receiptModal.isPdf && (
              <Button variant="outline" onClick={() => window.open(receiptModal.url, "_blank")}>
                <Eye className="h-4 w-4 mr-2" /> Open full size
              </Button>
            )}
            <Button onClick={() => setReceiptModal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection reason dialog — uses proper Dialog for focus trap + Escape handling */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Enrollment</DialogTitle>
            <DialogDescription>
              {rejectTarget?.profiles?.name || "Unknown"} — {rejectTarget?.profiles?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Reason *</p>
              <div className="space-y-2">
                {([
                  { value: "payment_not_received", label: "💳 Payment not received", desc: "We couldn't confirm the transfer." },
                  { value: "time_slots_unavailable", label: "📅 Time slots unavailable", desc: "Student gets a link to pick new available slots." },
                  { value: "other", label: "✏️ Other", desc: "Provide a note below." },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRejectReason(opt.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${rejectReason === opt.value ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/40"}`}
                  >
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Additional note (optional)</p>
              <Textarea
                placeholder="e.g. Please re-enroll with a clearer receipt."
                value={rejectNote}
                onChange={ev => setRejectNote(ev.target.value)}
                maxLength={300}
                className="h-20 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={rejecting}>
              {rejecting ? "Rejecting…" : "Confirm Reject & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Manual Enroll Dialog */}
      <Dialog open={manualEnrollOpen} onOpenChange={setManualEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manually Enroll — {enrollTarget?.name}</DialogTitle>
            <DialogDescription>{enrollTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Plan type */}
            <div className="space-y-1">
              <Label>Plan Type</Label>
              <div className="flex gap-2">
                {(["group", "private"] as const).map(pt => (
                  <button
                    key={pt}
                    onClick={() => setEnrollForm(f => ({ ...f, plan_type: pt, group_id: "" }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      enrollForm.plan_type === pt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pt === "group" ? "👥 Group" : "👤 Private"}
                  </button>
                ))}
              </div>
              {enrollForm.plan_type === "private" && (
                <p className="text-xs text-muted-foreground">Private enrollment — assign a slot via the Matcher after saving.</p>
              )}
            </div>

            {/* Duration + Sessions */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Duration</Label>
                <Select
                  value={enrollForm.duration}
                  onValueChange={v => setEnrollForm(f => ({ ...f, duration: v, sessions: SESSIONS_BY_DURATION[v] ?? f.sessions }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <Label>Sessions</Label>
                <Input
                  type="number"
                  min="1"
                  value={enrollForm.sessions}
                  onChange={e => setEnrollForm(f => ({ ...f, sessions: e.target.value }))}
                />
              </div>
            </div>

            {/* Amount + Currency */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Amount paid</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter amount..."
                  value={enrollForm.amount}
                  onChange={e => setEnrollForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="w-28 space-y-1">
                <Label>Currency</Label>
                <Select value={enrollForm.currency} onValueChange={v => setEnrollForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Group — only for group plan */}
            {enrollForm.plan_type === "group" && (
              <div className="space-y-1">
                <Label>Group *</Label>
                <Select value={enrollForm.group_id} onValueChange={v => setEnrollForm(f => ({ ...f, group_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
                  <SelectContent>
                    {pkgGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level */}
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={enrollForm.level || "__none__"} onValueChange={v => setEnrollForm(f => ({ ...f, level: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not set —</SelectItem>
                  {LEVEL_SELECT_OPTIONS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                  <SelectItem value="A2 Elementary">A2 Elementary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={enrollForm.notes} onChange={e => setEnrollForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Payment reference, special notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualEnrollOpen(false)}>Cancel</Button>
            <Button
              onClick={handleManualEnroll}
              disabled={enrollSaving || (enrollForm.plan_type === "group" && !enrollForm.group_id) || !enrollForm.amount}
            >
              {enrollSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AdminDashboard;
