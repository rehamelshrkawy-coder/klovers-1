import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CalendarDays, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { LEVEL_SELECT_OPTIONS, normalizeLevel, getLevelShortLabel } from "@/constants/levels";
import { useLanguage } from "@/contexts/LanguageContext";
// Keep the canonical short keys (hangul, l1 … l6) as values so the RPC
// receives exactly what schedule_packages.level contains. Labels stay friendly.
const LEVELS = LEVEL_SELECT_OPTIONS;
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

import { formatTime, convertSlotToTimezone } from "@/lib/admin-utils";
import { getUserTimezone } from "@/lib/viewerTimezone";

interface ResubRequest {
  id: string;
  enrollment_id: string;
  user_id: string;
  email: string;
  status: string;
  expires_at: string;
}

interface SchedulePackage {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
}

const ResubmitSchedulePage = () => {
  const { t, language } = useLanguage();
  const DAY_NAMES = language === "ar" ? DAY_NAMES_AR : DAY_NAMES_EN;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<ResubRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedLevel, setSelectedLevel] = useState("");
  const [packages, setPackages] = useState<SchedulePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [submitting, setSubmitting] = useState(false);

  // Validate token via secure RPC
  useEffect(() => {
    if (!token) {
      setError(t("resubmitSchedule.errorNoToken"));
      setLoading(false);
      return;
    }
    const validate = async () => {
      const { data, error: err } = await supabase.rpc(
        "validate_resubmission_token" as any,
        { _token: token }
      );
      if (err || !data || (data as any[]).length === 0) {
        setError(t("resubmitSchedule.errorInvalid"));
        setLoading(false);
        return;
      }
      const req = (data as any[])[0] as ResubRequest;
      if (req.status !== "pending") {
        setError(t("resubmitSchedule.errorAlreadyDone"));
        setLoading(false);
        return;
      }
      if (new Date(req.expires_at) < new Date()) {
        setError(t("resubmitSchedule.errorExpired"));
        setLoading(false);
        return;
      }
      setRequest(req);
      setLoading(false);
    };
    validate();
  }, [token]);

  // Fetch packages when level changes
  useEffect(() => {
    if (!selectedLevel) { setPackages([]); return; }
    const fetch = async () => {
      const normalized = normalizeLevel(selectedLevel);
      const { data } = await (supabase as any)
        .from("schedule_packages")
        .select("*")
        .eq("level", normalized)
        .eq("is_active", true)
        .order("day_of_week");
      setPackages((data as SchedulePackage[]) || []);
      setSelectedPackageId("");
    };
    fetch();
  }, [selectedLevel]);

  const handleSubmit = async () => {
    if (!request || !selectedLevel || !selectedPackageId) return;
    setSubmitting(true);
    try {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (!pkg) throw new Error(t("resubmitSchedule.errorPackageNotFound"));

      const normalizedLvl = normalizeLevel(selectedLevel);
      const dayName = DAY_NAMES[pkg.day_of_week];

      // Use secure RPC to complete the resubmission atomically
      const { error: rpcErr } = await supabase.rpc(
        "complete_schedule_resubmission" as any,
        {
          _token: token,
          _level: normalizedLvl,
          _package_id: selectedPackageId,
          _preferred_day: dayName,
          _preferred_time: formatTime(pkg.start_time),
          _timezone: timezone,
        }
      );

      if (rpcErr) throw new Error(rpcErr.message);

      setSubmitted(true);
      toast({ title: t("resubmitSchedule.savedTitle"), description: t("resubmitSchedule.savedDesc") });
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-foreground font-medium">{error}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold text-foreground">{t("resubmitSchedule.successTitle")}</h2>
              <p className="text-muted-foreground">{t("resubmitSchedule.successDesc")}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6" /> {t("resubmitSchedule.pageTitle")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("resubmitSchedule.greeting").replace("{email}", request?.email || "")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Level */}
            <div className="space-y-2">
              <Label>{t("resubmitSchedule.koreanLevel")}</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger><SelectValue placeholder={t("resubmitSchedule.selectLevelPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("resubmitSchedule.timezone")}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                    <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Package selection */}
            {selectedLevel && (
              <div className="space-y-2">
                <Label>{t("resubmitSchedule.preferredSlot")}</Label>
                {packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">{t("resubmitSchedule.noSlots")}</p>
                ) : (
                  <div className="grid gap-2">
                    {packages.map(pkg => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedPackageId === pkg.id
                            ? "border-primary bg-accent"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {(() => {
                          const userTz = getUserTimezone();
                          const local = convertSlotToTimezone(pkg.day_of_week, pkg.start_time, pkg.timezone, userTz);
                          return (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{local.weekday}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {local.timeFormatted} · {pkg.duration_min}{t("mySchedule.minutes")}
                              </span>
                              <span className="text-xs">{userTz.replace(/_/g, " ")}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground/70">({DAY_NAMES[pkg.day_of_week]} {formatTime(pkg.start_time)} {pkg.timezone.replace(/_/g, " ")})</p>
                          </div>
                          <Badge variant="outline">{getLevelShortLabel(pkg.level)}</Badge>
                        </div>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedLevel || !selectedPackageId || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("resubmitSchedule.saving")}</>
              ) : (
                t("resubmitSchedule.submitScheduleBtn")
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResubmitSchedulePage;
