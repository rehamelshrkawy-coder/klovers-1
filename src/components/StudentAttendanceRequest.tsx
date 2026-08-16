import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, CheckCircle2, Clock, XCircle, Loader2, Lock, AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AttendanceRequest {
  id: string;
  request_date: string;
  status: string;
  created_at: string;
}

interface AdminAttendanceEntry {
  id: string;
  session_date: string;
  status: string;
  created_at: string;
}

interface StudentAttendanceRequestProps {
  userId: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING: { label: "Pending", icon: Clock, variant: "secondary", color: "text-muted-foreground" },
  APPROVED: { label: "Approved", icon: CheckCircle2, variant: "default", color: "text-primary-text" },
  REJECTED: { label: "Rejected", icon: XCircle, variant: "destructive", color: "text-destructive" },
};

interface EligibleEnrollment {
  id: string;
  approval_status: string;
  payment_status: string;
  sessions_remaining: number;
}

const fetchActiveEnrollment = async (userId: string): Promise<EligibleEnrollment | null> => {
  const { data } = await supabase
    .from("enrollments")
    .select("id, approval_status, payment_status, sessions_remaining")
    .eq("user_id", userId)
    .eq("approval_status", "APPROVED")
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0] : null;
};

const NEGATIVE_LIMIT = -3;

const LockedCard = ({ reason }: { reason?: "unpaid" | "limit" }) => {
  const navigate = useNavigate();
  const isLimit = reason === "limit";
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          {isLimit ? "Reached limit (−3). Renew required." : "Attendance is available after payment"}
        </CardTitle>
        <CardDescription>
          {isLimit
            ? "You've used 3 extra classes beyond your package. Please renew to continue."
            : "Complete enrollment and payment to unlock attendance tracking."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button onClick={() => navigate(isLimit ? "/courses" : "/enroll-now")}>
          {isLimit ? "Renew Package" : "Enroll Now"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/student")}>View My Enrollments</Button>
      </CardContent>
    </Card>
  );
};

const NegativeBalanceBanner = ({ remaining }: { remaining: number }) => {
  const navigate = useNavigate();
  const overCount = Math.abs(remaining);
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10 mb-4">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">Balance negative ({remaining})</p>
        <p className="text-xs text-muted-foreground">
          You've exceeded your package by {overCount} {overCount === 1 ? "class" : "classes"}. Allowed until −3. A reminder will be sent.
        </p>
        <Button size="sm" variant="destructive" className="mt-2" onClick={() => navigate("/enroll-now")}>
          Renew Package
        </Button>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-60 mt-2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[280px] w-full" />
    </CardContent>
  </Card>
);

const StudentAttendanceRequest = ({ userId }: StudentAttendanceRequestProps) => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [adminDates, setAdminDates] = useState<AdminAttendanceEntry[]>([]);
  const [enrollment, setEnrollment] = useState<EligibleEnrollment | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const eligible = await fetchActiveEnrollment(userId);

    if (!eligible) {
      setUnlocked(false);
      setEnrollment(null);
      setLoading(false);
      return;
    }

    setUnlocked(true);
    setEnrollment(eligible);

    const [reqsRes, adminRes] = await Promise.all([
      supabase
        .from("attendance_requests")
        .select("id, request_date, status, created_at")
        .eq("user_id", userId)
        .order("request_date", { ascending: false }),
      supabase
        .from("admin_attendance_log")
        .select("id, session_date, status, created_at")
        .eq("enrollment_id", eligible.id)
        .order("session_date", { ascending: false }),
    ]);

    if (reqsRes.data) setRequests(reqsRes.data as AttendanceRequest[]);
    if (adminRes.data) setAdminDates(adminRes.data as AdminAttendanceEntry[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !enrollment || submitting) return;

    // Safety re-check: must still be PAID + APPROVED
    const eligible = await fetchActiveEnrollment(userId);
    if (!eligible) {
      setUnlocked(false);
      setEnrollment(null);
      toast({ title: "You need an active paid enrollment", description: "Please enroll and complete payment first.", variant: "destructive" });
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const exists = requests.find(r => r.request_date === dateStr && r.status !== "REJECTED");
    if (exists) {
      toast({ title: "Already requested", description: "You already have a request for this date.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("attendance_requests")
      .insert({
        user_id: userId,
        enrollment_id: enrollment.id,
        request_date: dateStr,
      } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance submitted!", description: `${format(date, "MMM d, yyyy")} added.` });
      loadData();
    }
    setSubmitting(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    setDeleting(requestId);
    const { error } = await supabase
      .from("attendance_requests")
      .delete()
      .eq("id", requestId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request cancelled", description: "Your pending attendance request has been removed." });
      loadData();
    }
    setDeleting(null);
  };

  const adminLoggedDates = useMemo(
    () => adminDates.map(a => new Date(a.session_date + "T00:00:00")),
    [adminDates]
  );
  const approvedDates = useMemo(
    () => requests.filter(r => r.status === "APPROVED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const pendingDates = useMemo(
    () => requests.filter(r => r.status === "PENDING").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );
  const rejectedDates = useMemo(
    () => requests.filter(r => r.status === "REJECTED").map(r => new Date(r.request_date + "T00:00:00")),
    [requests]
  );

  const modifiers = { adminLogged: adminLoggedDates, approved: approvedDates, pending: pendingDates, rejected: rejectedDates };
  const modifiersStyles = {
    adminLogged: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    approved: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "9999px" },
    pending: { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))", borderRadius: "9999px" },
    rejected: { backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))", borderRadius: "9999px" },
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return <LoadingSkeleton />;
  if (!unlocked) return <LockedCard reason="unpaid" />;

  const remaining = enrollment?.sessions_remaining ?? 0;
  const isLocked = remaining <= NEGATIVE_LIMIT;
  const isNegative = remaining < 0;

  if (isLocked) return <LockedCard reason="limit" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            My Class Dates
          </CardTitle>
          <p className="text-xs text-muted-foreground">Tap a date to mark your attendance</p>
          <div className="flex gap-3 flex-wrap mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary border border-foreground/30" />
              <span className="text-xs text-muted-foreground">Attended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary border border-foreground/20" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-destructive border border-destructive/50" />
              <span className="text-xs text-muted-foreground">Rejected</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isNegative && <NegativeBalanceBanner remaining={remaining} />}
          {submitting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </div>
          )}
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
            className={cn("p-3 pointer-events-auto w-full")}
          />
        </CardContent>
      </Card>

      {/* Session History — combines admin-logged and student requests */}
      {(adminDates.length > 0 || requests.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Session History</CardTitle>
            <p className="text-xs text-muted-foreground">{adminDates.length + requests.filter(r => r.status === "APPROVED").length} attended sessions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Admin-logged sessions */}
              {adminDates.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-primary-text">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(a.session_date)}</p>
                      <p className="text-xs text-muted-foreground">Logged by teacher</p>
                    </div>
                  </div>
                  <Badge variant="default">Attended</Badge>
                </div>
              ))}

              {/* Student-initiated requests */}
              {requests.map((r) => {
                const cfg = statusConfig[r.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-muted", cfg.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDate(r.request_date)}</p>
                        <p className="text-xs text-muted-foreground">Self-reported</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {r.status === "PENDING" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={deleting === r.id}
                            >
                              {deleting === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove your pending attendance request for {formatDate(r.request_date)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelRequest(r.id)}>
                                Cancel Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAttendanceRequest;
