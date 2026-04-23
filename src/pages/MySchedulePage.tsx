import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulePicker from "@/components/SchedulePicker";
import { ArrowLeft, CalendarDays, Clock, Users, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { getLevelShortLabel } from "@/constants/levels";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

import { formatTime, convertSlotToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

interface PackageDetails {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
}

interface GroupInfo {
  id: string;
  name: string;
  next_session?: string | null;
}

interface AlternativePkg {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  seats_left: number;
}

const MySchedulePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState("");
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Preference
  const [preference, setPreference] = useState<{ package_id: string | null; level: string } | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);

  // Assignment
  const [assignmentStatus, setAssignmentStatus] = useState<"pending" | "assigned" | "waitlisted" | "none">("none");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // Alternatives (waitlist state)
  const [alternatives, setAlternatives] = useState<AlternativePkg[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Change schedule modal
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCourseType, setSelectedCourseType] = useState<"group" | "private" | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPackageLabel, setSelectedPackageLabel] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase.from("profiles").select("level, country").eq("user_id", session.user.id).maybeSingle();
      const level = (profile as any)?.level || "";
      setUserLevel(level);

      const { data: enr } = await supabase.from("enrollments").select("timezone").eq("user_id", session.user.id).eq("approval_status", "APPROVED").eq("payment_status", "PAID").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if ((enr as any)?.timezone) setUserTimezone((enr as any).timezone);

      // Load package preference
      const { data: pref } = await (supabase as any).from("student_package_preferences").select("package_id, level").eq("user_id", session.user.id).maybeSingle();
      setPreference(pref || null);

      if (pref?.package_id) {
        const { data: pkg } = await (supabase as any).from("schedule_packages").select("*").eq("id", pref.package_id).maybeSingle();
        setPackageDetails(pkg || null);
      }

      // Check group membership
      const { data: groups } = await (supabase as any).from("pkg_groups").select("id, name, package_id");
      const groupIds = (groups || []).map((g: any) => g.id);
      if (groupIds.length > 0) {
        const { data: membership } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").eq("user_id", session.user.id).in("group_id", groupIds).maybeSingle();
        if (membership) {
          const grp = (groups || []).find((g: any) => g.id === (membership as any).group_id);
          if ((membership as any).member_status === "active") {
            setAssignmentStatus("assigned");
            if (grp) {
              // Fetch next session
              const { data: sessions } = await (supabase as any)
                .from("pkg_group_sessions")
                .select("session_date")
                .eq("group_id", grp.id)
                .gte("session_date", new Date().toISOString().slice(0, 10))
                .order("session_date")
                .limit(1)
                .maybeSingle();
              setGroupInfo({ id: grp.id, name: grp.name, next_session: (sessions as any)?.session_date || null });
            }
          } else if ((membership as any).member_status === "waitlist") {
            setAssignmentStatus("waitlisted");
            if (grp) setGroupInfo({ id: grp.id, name: grp.name });
            // Load alternatives
            if (level) {
              const { data: allPkgs } = await (supabase as any).from("schedule_packages").select("*").eq("is_active", true).eq("level", level);
              const pkgIds2 = (allPkgs || []).map((p: any) => p.id);
              const pkgCount: Record<string, number> = {};
              if (pkgIds2.length > 0) {
                const { data: gs } = await (supabase as any).from("pkg_groups").select("id, package_id").in("package_id", pkgIds2);
                const gIds2 = (gs || []).map((g: any) => g.id);
                const gPkg: Record<string, string> = {};
                (gs || []).forEach((g: any) => { gPkg[g.id] = g.package_id; });
                if (gIds2.length > 0) {
                  const { data: mems } = await (supabase as any).from("pkg_group_members").select("group_id, member_status").in("group_id", gIds2).eq("member_status", "active");
                  (mems || []).forEach((m: any) => {
                    const pid = gPkg[m.group_id];
                    if (pid) pkgCount[pid] = (pkgCount[pid] || 0) + 1;
                  });
                }
              }
              const alts: AlternativePkg[] = (allPkgs || [])
                .filter((p: any) => p.id !== pref?.package_id)
                .map((p: any) => ({ ...p, seats_left: Math.max(0, p.capacity - (pkgCount[p.id] || 0)) }))
                .filter((p: AlternativePkg) => p.seats_left > 0)
                .sort((a: AlternativePkg, b: AlternativePkg) => Math.abs(parseInt(a.start_time) - 18) - Math.abs(parseInt(b.start_time) - 18));
              setAlternatives(alts);
            }
          } else {
            setAssignmentStatus("pending");
          }
        } else {
          setAssignmentStatus(pref?.package_id ? "pending" : "none");
        }
      } else {
        setAssignmentStatus(pref?.package_id ? "pending" : "none");
      }

      setLoading(false);

      // Auto-open picker if redirected from email
      const autoOpen = new URLSearchParams(window.location.search).get("autoOpen");
      if (autoOpen === "private" || autoOpen === "group") {
        setShowPicker(true);
        setSelectedCourseType(autoOpen);
        // Clear param to prevent re-trigger on refresh
        const url = new URL(window.location.href);
        url.searchParams.delete("autoOpen");
        window.history.replaceState({}, "", url.pathname);
      }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Failed to load your schedule.");
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handlePickerSelect = (pkgId: string, label: string) => {
    setSelectedPackageId(pkgId || null);
    setSelectedPackageLabel(label);
  };

  const handleConfirmChange = async () => {
    if (!selectedPackageId || !userId) return;
    setAssigning(true);

    // 1. Update package preference
    await (supabase as any).from("student_package_preferences").upsert(
      { user_id: userId, package_id: selectedPackageId, level: userLevel, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    // 2. Update the latest approved enrollment: set new package_id and clear matched_at so it appears in the Matcher
    const { data: latestEnr } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("approval_status", "APPROVED")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEnr) {
      await supabase
        .from("enrollments")
        .update({ package_id: selectedPackageId, matched_at: null } as any)
        .eq("id", (latestEnr as any).id);
    }

    // 3. Remove student from current pkg_group so they can be re-assigned
    await (supabase as any)
      .from("pkg_group_members")
      .delete()
      .eq("user_id", userId);

    // 4. Insert admin notification
    const { data: { session } } = await supabase.auth.getSession();
    const userName = session?.user?.user_metadata?.name || session?.user?.email || "A student";
    await (supabase as any).from("admin_notifications").insert({
      message: `${userName} changed their schedule (new package: ${selectedPackageLabel})`,
      type: "STUDENT_CHANGED_SLOT",
      related_user_id: userId,
    });

    toast({ title: "Schedule updated", description: "Your new schedule preference has been saved." });
    setShowPicker(false);
    setAssigning(false);
    window.location.reload();
  };

  const handleAssignToAlternative = async (pkg: AlternativePkg) => {
    if (!userId) return;
    setAssigning(true);
    await (supabase as any).from("student_package_preferences").upsert(
      { user_id: userId, package_id: pkg.id, level: userLevel, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    const { data: enr } = await supabase.from("enrollments").select("id").eq("user_id", userId).eq("approval_status", "APPROVED").eq("payment_status", "PAID").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (enr) {
      await (supabase as any).rpc("assign_student_to_pkg_group", { _user_id: userId, _enrollment_id: (enr as any).id });
    }
    await (supabase as any).from("admin_notifications").insert({
      message: `Waitlisted student moved to alternative: ${getLevelShortLabel(pkg.level)} ${DAY_NAMES[pkg.day_of_week]} ${formatTime(pkg.start_time)}`,
      type: "STUDENT_CHANGED_SLOT",
      related_user_id: userId,
    });
    toast({ title: "Moved to alternative slot" });
    setAssigning(false);
    window.location.reload();
  };

  if (fetchError) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-sm">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <h2 className="font-semibold text-foreground">Couldn't load your schedule</h2>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          </div>

          {/* Package Details */}
          {packageDetails ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Selected Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const uTz = getUserTimezone();
                  const lcl = convertSlotToTimezone(packageDetails.day_of_week, packageDetails.start_time, packageDetails.timezone, uTz);
                  return (
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge variant="outline" className="text-sm">{getLevelShortLabel(packageDetails.level)}</Badge>
                  <span className="text-sm text-foreground font-medium">{lcl.weekday}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {lcl.timeFormatted} · {packageDetails.duration_min}min
                  </span>
                  <span className="text-xs text-muted-foreground">{uTz.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-muted-foreground/70 basis-full">({DAY_NAMES[packageDetails.day_of_week]} {formatTime(packageDetails.start_time)} {packageDetails.timezone.replace(/_/g, " ")})</span>
                </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700">
              <CardContent className="pt-6 text-center space-y-4">
                <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
                <h2 className="text-lg font-semibold text-foreground">Choose Your Class Schedule</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  You need to pick a preferred day and time to complete your registration. This helps us assign you to the right group.
                </p>
                <Button size="lg" onClick={() => setShowPicker(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" /> Pick a Day & Time
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assignment Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Assignment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignmentStatus === "assigned" && groupInfo && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Assigned to <span className="text-primary">{groupInfo.name}</span></p>
                    {groupInfo.next_session ? (
                      <p className="text-sm text-muted-foreground mt-1">Next session: <strong>{groupInfo.next_session}</strong></p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">No upcoming sessions scheduled yet.</p>
                    )}
                  </div>
                </div>
              )}

              {assignmentStatus === "pending" && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Loader2 className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-medium text-foreground">Awaiting Group Assignment</p>
                    <p className="text-sm text-muted-foreground mt-1">Your payment is confirmed! We're assigning you to a class group — this usually takes 24–48 hours.</p>
                  </div>
                </div>
              )}

              {assignmentStatus === "waitlisted" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Waitlisted</p>
                      <p className="text-sm text-muted-foreground mt-1">All groups for your selected slot are full. Please choose an alternative.</p>
                    </div>
                  </div>
                  {alternatives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Available alternatives:</p>
                      {alternatives.map((alt) => {
                        const aTz = getUserTimezone();
                        const aLcl = convertSlotToTimezone(alt.day_of_week, alt.start_time, alt.timezone, aTz);
                        return (
                        <div key={alt.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {aLcl.weekday} · {aLcl.timeFormatted}
                            </p>
                            <p className="text-xs text-muted-foreground">{alt.duration_min}min · {aTz.replace(/_/g, " ")} · {alt.seats_left} seats left</p>
                          </div>
                          <Button size="sm" disabled={assigning} onClick={() => handleAssignToAlternative(alt)}>
                            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4 mr-1" /> Choose</>}
                          </Button>
                        </div>
                        );
                      })}
                    </div>
                  )}
                  {alternatives.length === 0 && (
                    <p className="text-sm text-muted-foreground">No alternatives available. Please contact support.</p>
                  )}
                </div>
              )}

              {assignmentStatus === "none" && (
                <p className="text-sm text-muted-foreground">You haven't selected a schedule yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Change Schedule Button */}
          {packageDetails && (
            <Button variant="outline" onClick={() => setShowPicker(true)} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Change Schedule
            </Button>
          )}
        </div>
      </main>
      <Footer />

      {/* Schedule Picker Modal */}
      <Dialog open={showPicker} onOpenChange={(open) => { setShowPicker(open); if (!open) { setSelectedCourseType(null); setSelectedPackageId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{packageDetails ? "Change Schedule" : "Choose Your Schedule"}</DialogTitle>
            <DialogDescription>
              {!selectedCourseType
                ? "First, choose your class type."
                : "Select a class slot. Your preference will be saved and admin notified."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedCourseType ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourseType("group")}
                  className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-center space-y-2"
                >
                  <Users className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold text-foreground">Group Class</p>
                  <p className="text-xs text-muted-foreground">Learn with other students</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseType("private")}
                  className="p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all text-center space-y-2"
                >
                  <Clock className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold text-foreground">Private Class</p>
                  <p className="text-xs text-muted-foreground">One-on-one sessions</p>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCourseType(null); setSelectedPackageId(null); }}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Badge variant="outline">{selectedCourseType === "group" ? "Group" : "Private"}</Badge>
                </div>
                <SchedulePicker
                  courseType={selectedCourseType}
                  userTimezone={userTimezone}
                  selectedLevel={userLevel}
                  onSelect={handlePickerSelect}
                />
                {selectedPackageId && (
                  <Button className="w-full" disabled={assigning} onClick={handleConfirmChange}>
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Confirm New Schedule
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySchedulePage;
