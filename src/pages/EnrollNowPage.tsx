import { useState, useMemo, useEffect } from "react";
import rehamPhoto from "@/assets/reham-teacher.jpg";
import { useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CreditCard, MapPin, Users, User, Clock, CalendarDays, PartyPopper, ShieldCheck, LogIn, Tag, CheckCircle2, Loader2 } from "lucide-react";
import SchedulePicker from "@/components/SchedulePicker";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchPrivateAvailability } from "@/lib/privateAvailability";
import { LEVEL_SELECT_OPTIONS, normalizeLevel, getLevelByKey } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { type TierKey, type ClassType, type Duration, tierPrices, tierCountries, DURATION_CLASSES } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { track } from "@/lib/tracking";
import { convertSlotToTimezone } from "@/lib/admin-utils";
import { setUserTimezone } from "@/lib/viewerTimezone";

type Step = 1 | 2 | 3 | 4;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const allCountries = (Object.keys(tierCountries) as TierKey[]).flatMap((tier) =>
  tierCountries[tier].map((c) => ({ country: c, tier }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

const egpPrices: Record<ClassType, Record<Duration, number>> = {
  group: { 1: 1200, 3: 3300, 6: 6100 },
  private: { 1: 2350, 3: 6600, 6: 11750 },
};

const durationClasses = DURATION_CLASSES;


const EnrollNowPage = () => {
  useSEO({ title: "Enroll Now | Klovers Korean Academy", description: "Join Klovers Korean Academy — choose your class type, schedule, and start speaking Korean with confidence.", canonical: "https://kloversegy.com/enroll-now" });

  useEffect(() => {
    const el = document.createElement("script");
    el.id = "enroll-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Korean Language Classes — Klovers Academy",
      "description": "Live Korean classes with real teachers. Group and private options available for all levels.",
      "provider": {
        "@type": "Organization",
        "name": "Klovers Korean Academy",
        "url": "https://kloversegy.com"
      },
      "inLanguage": "en",
      "courseMode": "online",
      "url": "https://kloversegy.com/enroll-now",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kloversegy.com/" },
          { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://kloversegy.com/pricing" },
          { "@type": "ListItem", "position": 3, "name": "Enroll Now", "item": "https://kloversegy.com/enroll-now" }
        ]
      }
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => { track.pageView(); }, []);

  const [searchParams] = useSearchParams();
  const { t, tArray } = useLanguage();
  const localDayNames: string[] = tArray("enrollNow", "dayNames").length === 7
    ? tArray("enrollNow", "dayNames") as string[]
    : DAY_NAMES;

  const initialStep = Number(searchParams.get("step")) as Step;
  // Step 3 was removed (redundant with Step 2) — legacy URLs that point to 3
  // bump to 4 so returning users land on Pay & Enroll.
  const [step, setStep] = useState<Step>(
    initialStep === 2 ? 2 :
    initialStep === 3 ? 4 :
    initialStep === 4 ? 4 : 1
  );
  const [classType, setClassType] = useState<ClassType>(
    (searchParams.get("classType") as ClassType) || "group"
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "");
  const [duration, setDuration] = useState<Duration | null>(
    searchParams.get("duration") ? (Number(searchParams.get("duration")) as Duration) : null
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [egyptPaymentMethod, setEgyptPaymentMethod] = useState<string>("");
  const nav = useNavigate();
  const isEgypt = selectedCountry === "Egypt";

  // Rehydrate from URL params first, then localStorage draft as fallback
  const getDraft = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem("enroll_draft");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const draft = getDraft();
  const p = (key: string) => searchParams.get(key) || draft[key] || "";

  // Schedule preferences — restore from URL if returning from signup
  const [timezone, setTimezone] = useState(() => p("tz") || Intl.DateTimeFormat().resolvedOptions().timeZone);
  useEffect(() => { setUserTimezone(timezone); }, [timezone]);
  const [preferredDays, setPreferredDays] = useState<string[]>(() => {
    const d = p("days") || p("day");
    return d ? d.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  });

  // Schedule slot selection
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(p("groupId") || null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>(p("groupName"));

  // Korean level selection — selectedLevel stores the canonical DB key (e.g. "hangul", "l1")
  const [selectedLevel, setSelectedLevel] = useState(p("level"));

  // Student preference for scheduling
  const [preferredDayOfWeek, setPreferredDayOfWeek] = useState<number | null>(null);
  const [preferredStartTime, setPreferredStartTime] = useState<string>("");

  // First-time discount
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Promo code
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string; discount_pct: number | null; discount_flat: number | null; currency: string | null;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Level-specific slot days+times from schedule_packages (includes packageId)
  const [levelSlots, setLevelSlots] = useState<{ day: string; time: string; packageId: string; seatsLeft: number }[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(p("packageId") || null);

  // Draft cleanup is deferred — only clear after successful payment initiation (see handlePay)

  // FIX #1: Explicit rehydration of days/level from URL params on mount
  useEffect(() => {
    const daysParam = searchParams.get("days") || searchParams.get("day");
    if (daysParam && preferredDays.length === 0) {
      setPreferredDays(daysParam.split(",").map(s => s.trim()).filter(Boolean));
    }
    const lvl = searchParams.get("level");
    if (lvl && !selectedLevel) {
      setSelectedLevel(lvl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: run once on mount to rehydrate from URL


  // Day names indexed by day_of_week number
  // Track whether this is the initial load (to avoid clearing rehydrated preferredDays)
  const [initialLevelLoad, setInitialLevelLoad] = useState(true);

  // Reset slots when classType changes
  useEffect(() => {
    setLevelSlots([]);
    setPreferredDays([]);
    setSelectedPackageId(null);
  }, [classType]);

  // Fetch available days+times from schedule_packages when level changes
  useEffect(() => {
    setLevelSlots([]);
    // Only clear preferredDays on level change AFTER initial load (don't clear rehydrated state)
    if (!initialLevelLoad) {
      setPreferredDays([]);
      setSelectedPackageId(null);
    }
    if (!selectedLevel) return;

    // Private classes: fetch private availability (days without group classes)
    if (classType === "private") {
      const loadPrivate = async () => {
        const { options } = await fetchPrivateAvailability();
        const slots = options.map((opt) => ({
          day: opt.weekday,
          time: opt.timeFormatted,
          packageId: `private-${opt.dayIndex}-${opt.time}`,
          seatsLeft: 99, // private slots don't have seat limits in day picker
        }));
        // Deduplicate by day (show first time option per day)
        const seen = new Set<string>();
        const deduped = slots.filter((s) => {
          if (seen.has(s.day)) return false;
          seen.add(s.day);
          return true;
        });
        setLevelSlots(deduped);
        if (initialLevelLoad && preferredDays.length > 0) {
          const matchSlot = deduped.find(s => s.day === preferredDays[0]);
          if (matchSlot) setSelectedPackageId(matchSlot.packageId);
          setInitialLevelLoad(false);
        } else {
          setInitialLevelLoad(false);
        }
      };
      loadPrivate();
      return;
    }

    // Group classes: existing logic
    const fetchLevelSlots = async () => {
      const normalizedLevel = normalizeLevel(selectedLevel);
      const { data } = await supabase
        .from("schedule_packages")
        .select("id, day_of_week, start_time, capacity, timezone")
        .eq("level", normalizedLevel)
        .eq("is_active", true)
        .neq("course_type", "private")
        .order("day_of_week");
      const rows = (data as any[]) || [];
      if (rows.length === 0) { setLevelSlots([]); return; }

      // Compute seats_left per package (same pattern as SchedulePicker)
      const pkgIds = rows.map((r: any) => r.id);
      const { data: groups } = await supabase
        .from("pkg_groups")
        .select("id, package_id")
        .in("package_id", pkgIds)
        .eq("is_active", true);
      const groupList = (groups as any[]) || [];
      const groupIds = groupList.map((g: any) => g.id);

      const memberCounts: Record<string, number> = {};
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from("pkg_group_members")
          .select("group_id")
          .in("group_id", groupIds)
          .eq("member_status", "active");
        for (const m of (members as any[]) || []) {
          memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
        }
      }

      const pkgMemberCount: Record<string, number> = {};
      for (const g of groupList) {
        pkgMemberCount[g.package_id] = (pkgMemberCount[g.package_id] || 0) + (memberCounts[g.id] || 0);
      }

      // Deduplicate by admin-side day_of_week; convert each slot to the learner's timezone for display
      const seen = new Set<number>();
      const slots: { day: string; time: string; packageId: string; seatsLeft: number }[] = [];
      for (const r of rows) {
        if (!seen.has(r.day_of_week)) {
          seen.add(r.day_of_week);
          const srcTz = r.timezone || "Africa/Cairo";
          const local = convertSlotToTimezone(r.day_of_week, r.start_time, srcTz, timezone);
          const seatsLeft = Math.max(0, (r.capacity || 5) - (pkgMemberCount[r.id] || 0));
          slots.push({ day: local.weekday, time: local.timeFormatted, packageId: r.id, seatsLeft });
        }
      }
      setLevelSlots(slots);

      // On initial load, restore selectedPackageId from rehydrated preferredDays
      if (initialLevelLoad && preferredDays.length > 0) {
        const matchSlot = slots.find(s => s.day === preferredDays[0]);
        if (matchSlot) setSelectedPackageId(matchSlot.packageId);
        setInitialLevelLoad(false);
      } else {
        setInitialLevelLoad(false);
      }
    };
    fetchLevelSlots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, classType]); // intentional: initialLevelLoad/preferredDays are read+written inside; adding them causes infinite loop

  useEffect(() => {
    const checkFirstTime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Prefer profile name → user_metadata name → email prefix as last resort
      const metaName = session.user.user_metadata?.name || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const profileName = (profile as any)?.name || "";
      const fallbackName = (session.user.email || "").split("@")[0];
      setName(profileName || metaName || fallbackName);

      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("payment_status", "PAID");

      if (count === 0) setIsFirstTime(true);
    };
    checkFirstTime();
  }, []);

  const tier = useMemo(() => {
    const match = allCountries.find((c) => c.country === selectedCountry);
    return match?.tier ?? null;
  }, [selectedCountry]);

  const originalPrice = useMemo(() => {
    if (!tier || !duration) return null;
    if (isEgypt) return egpPrices[classType][duration];
    return tierPrices[tier][classType][duration];
  }, [tier, classType, duration, isEgypt]);

  const discountAmount = isFirstTime && originalPrice && !isEgypt ? Math.round(originalPrice * 0.1 * 100) / 100 : 0;
  const promoDiscountAmount = useMemo(() => {
    if (!promoApplied || !originalPrice) return 0;
    const base = originalPrice - discountAmount;
    if (promoApplied.discount_pct) return Math.round(base * promoApplied.discount_pct / 100 * 100) / 100;
    if (promoApplied.discount_flat) return Math.min(promoApplied.discount_flat, base);
    return 0;
  }, [promoApplied, originalPrice, discountAmount]);
  const finalPrice = originalPrice ? Math.max(0, originalPrice - discountAmount - promoDiscountAmount) : null;

  const canProceedStep1 = !!selectedCountry && !!tier && !!duration;

  // Day selection: always 1 preferred day
  const maxDays = 1;
  const toggleDay = (day: string) => {
    setPreferredDays((prev) => {
      if (prev.includes(day)) {
        setSelectedPackageId(null);
        return prev.filter((d) => d !== day);
      }
      // Always single-select: replace any existing
      const slot = levelSlots.find((s) => s.day === day);
      setSelectedPackageId(slot?.packageId ?? null);
      return [day];
    });
  };

  // Build a URL that preserves all current selections so user can return after signup
  const buildReturnUrl = (targetStep: Step) => {
    const params = new URLSearchParams();
    params.set("classType", classType);
    if (selectedCountry) params.set("country", selectedCountry);
    if (duration) params.set("duration", String(duration));
    params.set("step", String(targetStep));
    if (preferredDays.length) params.set("days", preferredDays.join(","));
    if (timezone) params.set("tz", timezone);
    if (selectedGroupId) params.set("groupId", selectedGroupId);
    if (selectedGroupName) params.set("groupName", selectedGroupName);
    if (selectedLevel) params.set("level", selectedLevel);
    if (selectedPackageId) params.set("packageId", selectedPackageId);
    return `/enroll-now?${params.toString()}`;
  };

  // Save draft to localStorage as backup (in case URL params are lost e.g. social login)
  const saveDraft = () => {
    const draftData: Record<string, string> = {};
    if (classType) draftData.classType = classType;
    if (selectedCountry) draftData.country = selectedCountry;
    if (duration) draftData.duration = String(duration);
    if (preferredDays.length) draftData.days = preferredDays.join(",");
    if (timezone) draftData.tz = timezone;
    if (selectedGroupId) draftData.groupId = selectedGroupId;
    if (selectedGroupName) draftData.groupName = selectedGroupName;
    if (selectedLevel) draftData.level = selectedLevel;
    if (selectedPackageId) draftData.packageId = selectedPackageId;
    draftData.step = "4";
    localStorage.setItem("enroll_draft", JSON.stringify(draftData));
  };

  const handleGoToStep3 = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      saveDraft(); // backup to localStorage in case social login loses URL
      const returnUrl = buildReturnUrl(4);
      toast({ title: t("auth.accountRequired"), description: t("auth.accountRequiredDesc"), variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    // The old Step 3 (preferred day/time re-ask) was redundant with Step 2 and
    // has been removed. Derive the day-of-week/start-time from the Step 2
    // selections so the enrollment row still carries them into the DB.
    const primaryDay = preferredDays[0];
    if (primaryDay) {
      const dayIdx = DAY_NAMES.indexOf(primaryDay);
      if (dayIdx >= 0) setPreferredDayOfWeek(dayIdx);
      const slot = levelSlots.find((s) => s.day === primaryDay);
      if (slot) {
        // slot.time is a display label like "6:00 PM" — convert to "HH:MM".
        const match = slot.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2];
          const ampm = match[3].toUpperCase();
          if (ampm === "PM" && h < 12) h += 12;
          if (ampm === "AM" && h === 12) h = 0;
          setPreferredStartTime(`${String(h).padStart(2, "0")}:${m}`);
        }
      }
    }
    submitLead(); // lead capture on checkout entry (moved from removed Step 3)
    setStep(4);
  };

  const canProceedStep2 = !!selectedLevel && preferredDays.length > 0;

  const handleEgyptOrder = async () => {
    if (!duration) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        saveDraft();
        const returnUrl = buildReturnUrl(4);
        toast({ title: t("enrollToasts.pleaseLogIn"), description: t("enrollToasts.pleaseLogInDesc"), variant: "destructive" });
        nav(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }
      // Sync country to profile
      if (selectedCountry && session.user.id) {
        supabase.from("profiles").update({ country: selectedCountry }).eq("user_id", session.user.id).then(() => {});
      }

      const { data, error } = await supabase.rpc("create_egypt_order", {
        _plan_type: classType,
        _duration: duration,
      } as any);
      if (error) {
        const desc = error.message?.includes("not found") || error.code === "PGRST202"
          ? "Backend function 'create_egypt_order' is missing or not accessible. Please contact support."
          : error.message;
        throw new Error(desc);
      }
      // Save schedule preferences + level to the enrollment and profile
      const enrollmentId = data as string;
        if (enrollmentId) {
        const schedPrefs: any = {};
        if (preferredDays.length > 0) {
          schedPrefs.preferred_days = preferredDays;
          schedPrefs.preferred_day = preferredDays[0];
        }
        if (selectedPackageId && !selectedPackageId.startsWith("private-")) schedPrefs.package_id = selectedPackageId;
        if (timezone) schedPrefs.timezone = timezone;
        // Always write level to enrollment (triggers sync to profile via DB trigger)
        if (selectedLevel) schedPrefs.level = normalizeLevel(selectedLevel);
        if (egyptPaymentMethod) schedPrefs.payment_method = egyptPaymentMethod;
        if (Object.keys(schedPrefs).length > 0) {
          await supabase.from("enrollments").update(schedPrefs).eq("id", enrollmentId);
        }
        // Level sync to profile is handled by DB trigger on enrollments.level
      }
      track.initiateCheckout({ value: finalPrice ?? 0, currency: selectedCountry === "Egypt" ? "EGP" : "USD" });
      logLeadEvent({ source_type: "enroll", cta_label: "checkout", metadata: { value: finalPrice ?? 0, country: selectedCountry } });
      nav(`/pay/${enrollmentId}`);
    } catch (err: any) {
      toast({ title: t("enrollToasts.orderError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // normalizeLevel imported from constants

  const submitLead = async () => {
    try {
      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          country: selectedCountry,
          level: selectedLevel ? normalizeLevel(selectedLevel) : "",
          goal: `${classType} ${duration}mo – ${tier} tier, ${preferredDays.join("/")}, tz:${timezone}`,
          plan_type: classType,
          duration: `${duration}mo`,
          schedule: preferredDays.join("/"),
          timezone: timezone,
          source: isEgypt ? "egypt" : "stripe",
          user_id: userId || undefined,
        },
      });
      if (error) {
        console.error("Lead submit failed:", error);
        toast({ title: t("enrollToasts.leadCaptureFailed"), description: error.message, variant: "destructive" });
      }
    } catch (err) {
      console.error("Lead submit error:", err);
      toast({ title: t("enrollToasts.couldNotSave"), description: t("enrollToasts.couldNotSaveDesc"), variant: "destructive" });
    }
  };

  // Apply promo code
  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoApplied(null);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_pct, discount_flat, currency, max_uses, uses_count, expires_at, active")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) {
      setPromoError("Invalid promo code. Please check and try again.");
      setPromoLoading(false);
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromoError("This promo code has expired.");
      setPromoLoading(false);
      return;
    }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) {
      setPromoError("This promo code has reached its usage limit.");
      setPromoLoading(false);
      return;
    }
    if (data.currency && data.currency !== (isEgypt ? "EGP" : "USD")) {
      setPromoError(`This code is only valid for ${data.currency} payments.`);
      setPromoLoading(false);
      return;
    }
    setPromoApplied({ code: data.code, discount_pct: data.discount_pct, discount_flat: data.discount_flat, currency: data.currency });
    toast({ title: `Promo code "${code}" applied! 🎉` });
    setPromoLoading(false);
  };

  const handlePay = async () => {
    // Block payment if core schedule fields are missing (package is optional — may be preference-only)
    if (!selectedLevel || preferredDays.length === 0) {
      toast({ title: t("enrollToasts.missingSchedule"), description: t("enrollToasts.missingScheduleDesc"), variant: "destructive" });
      setStep(2);
      return;
    }
    if (!tier || !duration || !finalPrice || !userId) return;

    if (isEgypt) {
      // Submit lead async before Egypt order
      submitLead();
      await handleEgyptOrder();
      return;
    }

    // Auth is enforced — user must be logged in at this point

    // A) Enforce auth before Stripe checkout
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      saveDraft();
      const returnUrl = buildReturnUrl(4);
      toast({ title: t("enrollToasts.accountRequired"), description: t("enrollToasts.accountRequiredDesc"), variant: "destructive" });
      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (loading) return; // Prevent double-click race condition
    setLoading(true);
    try {
      // Submit lead async (don't block checkout)
      submitLead();

      // Sync country to profile
      if (selectedCountry && session.user.id) {
        supabase.from("profiles").update({ country: selectedCountry }).eq("user_id", session.user.id).then(() => {});
      }

      const normalizedLevel = normalizeLevel(selectedLevel);
      const lowerEmail = email.trim().toLowerCase();

      // Level sync to profile is handled by DB trigger on enrollments.level

      // B) Upsert enrollment BEFORE calling create-checkout (safety net)
      const schedFields: Record<string, any> = {
        level: normalizedLevel,
        preferred_day: preferredDays[0],
        timezone,
        status: "PENDING_PAYMENT",
      };
      if (selectedPackageId && !selectedPackageId.startsWith("private-")) schedFields.package_id = selectedPackageId;
      if (preferredDays.length > 0) schedFields.preferred_days = preferredDays;
      // Add student preference for scheduling (from step 3)
      if (preferredDayOfWeek !== null) schedFields.preferred_day_of_week = preferredDayOfWeek;
      if (preferredStartTime) schedFields.preferred_start_time = preferredStartTime;

      const { data: existingRows } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .in("status", ["PENDING", "PENDING_PAYMENT", "DRAFT"] as any)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        await supabase.from("enrollments").update(schedFields as any).eq("id", existingRows[0].id);
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          classType,
          duration,
          name: name.trim(),
          email: lowerEmail,
          level: normalizedLevel,
          package_id: (selectedPackageId && !selectedPackageId.startsWith("private-")) ? selectedPackageId : "",
          schedule: {
            timezone,
            preferred_days: preferredDays,
          },
        },
      });

      if (error) {
        const desc = error.message?.includes("FunctionNotFound") || error.message?.includes("404")
          ? "Backend function 'create-checkout' is not deployed. Please contact support."
          : error.message;
        throw new Error(desc);
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (data?.url) {
        // C) Post-checkout: update enrollment again (belt + suspenders)
        const { data: postRows } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", session.user.id)
          .in("status", ["PENDING", "PENDING_PAYMENT", "DRAFT"] as any)
          .order("created_at", { ascending: false })
          .limit(1);

        if (postRows && postRows.length > 0) {
          await supabase.from("enrollments").update(schedFields as any).eq("id", postRows[0].id);
        }

        // Clear draft BEFORE opening Stripe (so user can't lose state on back-nav)
        localStorage.removeItem("enroll_draft");
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: t("enrollToasts.checkoutError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [t("enrollNow.choosePlan"), t("enrollNow.schedule"), t("enrollNow.payEnroll")];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">

        {/* Social proof banner */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">⭐ <strong className="text-foreground">4.9</strong> rated</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">👥 <strong className="text-foreground">500+</strong> students enrolled</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">🇰🇷 <strong className="text-foreground">A1–C2</strong> all levels</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? "bg-green-500 text-white" :
                  step === i + 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
          {/* Progress track */}
          <div className="relative h-1.5 bg-muted rounded-full mx-4 sm:mx-12">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(step - 1, 2) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Choose Plan */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("enrollNow.chooseYourPlan")}</CardTitle>
              <p className="text-muted-foreground">{t("enrollNow.chooseYourPlanDesc")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("enrollNow.classType")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setClassType("group")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "group" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.groupClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.learnWithOthers")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassType("private")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "private" ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className="h-6 w-6" />
                    <span className="font-semibold text-foreground">{t("enrollNow.privateClasses")}</span>
                    <span className="text-xs text-muted-foreground">{t("enrollNow.oneOnOne")}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("enrollNow.yourCountry")}</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t("enrollNow.selectCountry")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map(({ country }) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tier && (
                <>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{t("enrollNow.pricingTier")}</p>
                    <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("enrollNow.duration")}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {([1, 3, 6] as Duration[]).map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            duration === d ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="font-bold text-foreground">{d} {d === 1 ? t("enrollNow.month") : t("enrollNow.months")}</p>
                          <p className="text-xs text-muted-foreground">{durationClasses[d]} {t("enrollNow.classes")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{isEgypt ? `${egpPrices[classType][d].toLocaleString()} EGP` : `$${tierPrices[tier][classType][d]}`}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isFirstTime && !isEgypt && (
                <div className="bg-accent rounded-lg p-3 flex items-center gap-2 text-sm">
                  <PartyPopper className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-accent-foreground font-medium">{t("enrollNow.welcomeDiscount")}</span>
                </div>
              )}

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                {t("enrollNow.next")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep1 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedCountry ? t("enrollNow.selectCountryError") : !duration ? t("enrollNow.chooseDurationError") : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Schedule Preferences */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CalendarDays className="h-6 w-6" /> {t("enrollNow.schedulePreferences")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{t("enrollNow.schedulePreferencesDesc")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Korean Level */}
              <div className="space-y-2">
                <Label>{t("enrollNow.koreanLevel")}</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger><SelectValue placeholder={t("enrollNow.selectLevel")} /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t("enrollNow.timezone")}</Label>
                <Select value={timezone} onValueChange={(tz) => { setTimezone(tz); setUserTimezone(tz); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                      <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Days */}
              <div className="space-y-2">
                <Label>{t("enrollNow.preferredDay")}</Label>
                {classType === "private" && levelSlots.length > 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    {t("enrollNow.privateOnlyNote")}
                  </p>
                )}
                {!selectedLevel ? (
                  <p className="text-sm text-muted-foreground italic">{t("enrollNow.selectLevelFirst")}</p>
                ) : levelSlots.length === 0 && classType === "private" ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                      {t("enrollNow.noPrivateDays")}
                    </div>
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                        `Hi Klovers — I'd like a private ${selectedLevel || "Korean"} class. The current schedule has no private days available yet — can we arrange a time?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Contact us on WhatsApp to arrange a private time
                    </a>
                  </div>
                ) : levelSlots.length === 0 ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
                      {t("enrollNow.noLiveSchedule")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAY_NAMES.map((day, idx) => (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            preferredDays.includes(day)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          {localDayNames[idx] ?? day}
                        </button>
                      ))}
                    </div>
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(
                        `Hi Klovers — I'd like to request a ${selectedLevel || "Korean"} class${preferredDays.length ? ` on ${preferredDays.join(", ")}` : ""}. The current schedule doesn't have this yet.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-[#25D366] hover:bg-[#1fb855] text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      Or contact us on WhatsApp to find a suitable time
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {levelSlots.map(({ day, time, seatsLeft }) => {
                      const isFull = classType !== "private" && seatsLeft <= 0;
                      const dayIdx = DAY_NAMES.indexOf(day);
                      const translatedDay = dayIdx >= 0 ? (localDayNames[dayIdx] ?? day) : day;
                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={isFull}
                          onClick={() => !isFull && toggleDay(day)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                            isFull
                              ? "border-border opacity-50 cursor-not-allowed"
                              : preferredDays.includes(day)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="font-semibold">{translatedDay}</span>
                          <span className={`text-xs ${isFull ? "text-destructive font-semibold" : preferredDays.includes(day) ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {isFull ? t("enrollNow.full") : time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {t("enrollNow.scheduleConfirmNote")}
              </p>

              <Button type="button" className="w-full" size="lg" disabled={!canProceedStep2} onClick={handleGoToStep3}>
                {t("enrollNow.next")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!canProceedStep2 && (
                <p className="text-xs text-destructive text-center">
                  {!selectedLevel
                    ? t("enrollNow.selectLevelError")
                    : preferredDays.length === 0
                    ? t("enrollNow.selectDayError")
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Pay & Enroll (Step 3 removed — redundant with Step 2) */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">{t("enrollNow.reviewPay")}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {selectedCountry}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auth Gate: if not logged in, show sign-in CTA */}
              {!userId ? (
                <div className="text-center space-y-4 py-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary border border-black/25 flex items-center justify-center">
                    <LogIn className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("auth.signInToContinue")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.bookingRequiresAccount")}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      saveDraft();
                      const returnUrl = buildReturnUrl(4);
                      nav(`/signup?redirect=${encodeURIComponent(returnUrl)}`);
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("auth.signInToContinue")}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Authenticated user info */}
                  <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary border border-black/25 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name || email}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </div>

              {/* Teacher card */}
              <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-4 py-3">
                <div className="relative flex-shrink-0">
                  <img src={rehamPhoto} alt="Reham 선생님" className="w-11 h-11 rounded-full object-cover object-top" />
                  <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">🇰🇷</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">Reham 선생님 <span className="text-xs font-normal text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1">Certified</span></p>
                  <p className="text-xs text-muted-foreground">5+ years · 300+ students · all levels</p>
                  <div className="flex gap-0.5 mt-0.5">{"⭐⭐⭐⭐⭐".split("").map((s,i)=><span key={i} className="text-xs">{s}</span>)}</div>
                </div>
              </div>

              {/* Price Summary */}
              {duration && originalPrice !== null && finalPrice !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {classType === "group" ? t("enrollNow.group") : t("enrollNow.private")} · {duration} {duration === 1 ? t("enrollNow.month") : t("enrollNow.months")} ({durationClasses[duration]} {t("enrollNow.classes")})
                    </span>
                    <span className={`font-bold text-foreground ${isFirstTime && !isEgypt ? "line-through text-muted-foreground" : ""}`}>
                      {isEgypt ? `${originalPrice.toLocaleString()} EGP` : `$${originalPrice}`}
                    </span>
                  </div>

                  {isFirstTime && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>{t("enrollNow.firstTimeDiscount")}</span>
                      <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {promoApplied && promoDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {promoApplied.code}</span>
                      <span className="font-bold">-{isEgypt ? `${promoDiscountAmount.toLocaleString()} EGP` : `$${promoDiscountAmount.toFixed(2)}`}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">{t("enrollNow.total")}</span>
                    <span className="font-bold text-lg text-foreground">{isEgypt ? `${finalPrice.toLocaleString()} EGP` : `$${finalPrice.toFixed(2)}`}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{durationClasses[duration]} {t("enrollNow.classesIncluded")}</span>
                    <span>{isEgypt ? `${Math.round(finalPrice / durationClasses[duration]).toLocaleString()} EGP${t("enrollNow.perClass")}` : `$${(finalPrice / durationClasses[duration]).toFixed(2)}${t("enrollNow.perClass")}`}</span>
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="space-y-1.5">
                {!promoApplied ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Promo code"
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={e => e.key === "Enter" && applyPromo()}
                        className="pl-9 uppercase placeholder:normal-case text-sm h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 shrink-0"
                      onClick={applyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                    >
                      {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {promoApplied.code} applied!
                        {promoApplied.discount_pct ? ` (${promoApplied.discount_pct}% off)` : promoApplied.discount_flat ? ` (${isEgypt ? `EGP ${promoApplied.discount_flat}` : `$${promoApplied.discount_flat}`} off)` : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => { setPromoApplied(null); setPromoInput(""); setPromoError(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-destructive">{promoError}</p>}
              </div>

              {/* Schedule Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">{t("enrollNow.schedulePreferencesSummary")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.level")}: {selectedLevel}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.days")}: {preferredDays.join(", ")}</p>
                <p className="text-xs text-muted-foreground">{t("enrollNow.timezone")}: {timezone}</p>
              </div>

              {/* Egypt payment method selector */}
              {isEgypt && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">طريقة الدفع / Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "vodafone_cash", label: "Vodafone Cash", icon: "📱" },
                      { value: "instapay",      label: "InstaPay",      icon: "💳" },
                      { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setEgyptPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                          egyptPaymentMethod === m.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <span className="text-xl">{m.icon}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {!egyptPaymentMethod && (
                    <p className="text-xs text-amber-600">Please select a payment method to continue</p>
                  )}
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!duration || loading || (isEgypt && !egyptPaymentMethod)}
                onClick={handlePay}
              >
                {loading ? (isEgypt ? t("enrollNow.creatingOrder") : t("enrollNow.redirectingPayment")) : isEgypt ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {t("enrollNow.confirmOrder")} ({finalPrice?.toLocaleString() ?? "—"} EGP)
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("enrollNow.payNow")} ${finalPrice?.toFixed(2) ?? "—"} {t("enrollNow.now")}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {isEgypt
                  ? t("enrollNow.redirectReceipt")
                  : t("enrollNow.securePayment")}
              </p>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { icon: "🔒", label: "Secure" },
                  { icon: "✅", label: "Verified Academy" },
                  { icon: "💬", label: "24h Support" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-[10px] text-muted-foreground font-medium text-center">{label}</span>
                  </div>
                ))}
              </div>

              {/* What happens next */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">What happens next?</p>
                {[
                  { step: "1", icon: "✅", title: "Payment confirmed", desc: "You get an instant email receipt." },
                  { step: "2", icon: "📅", title: "Schedule matched", desc: "We confirm your class slot within 24 h." },
                  { step: "3", icon: "🎉", title: "First class!", desc: "We send your meeting link — ready to learn!" },
                ].map(({ step: s, icon, title, desc }) => (
                  <div key={s} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary border border-black/25 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-foreground">{s}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{icon} {title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp fallback */}
              <p className="text-xs text-center text-muted-foreground pt-1">
                Need help enrolling?{" "}
                <a
                  href={WHATSAPP_BASE}
                  onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "enroll_help" }); }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 font-semibold hover:underline"
                >
                  💬 WhatsApp us
                </a>
              </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />

      {/* Sticky WhatsApp help pill — shown during checkout */}
      <a
        href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I have a question before enrolling in Klovers.")}`}
        onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I have a question before enrolling in Klovers.")}`, { cta_label: "enroll_questions_pill" }); }}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-colors"
        aria-label="Chat on WhatsApp"
      >
        💬 Questions?
      </a>
    </div>
  );
};

export default EnrollNowPage;
