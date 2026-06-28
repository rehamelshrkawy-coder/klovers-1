import { supabase } from "@/integrations/supabase/client";

export interface ChecklistItem {
  key: string;
  label: string;
  status: "PASS" | "WARN" | "BLOCKER" | "INFO";
  details: string;
  priority: "BLOCKER" | "WARN" | "INFO";
  action?: string;
}

export type OverallState = "SUCCESS" | "NEEDS_REVIEW" | "BLOCKED";

export interface EnrollmentChecklist {
  enrollment_id: string;
  user_id: string;
  student_name: string;
  email: string;
  level: string;
  plan_type: string;
  created_at: string;
  payment_status: string;
  approval_status: string;
  admin_notes: string;
  items: ChecklistItem[];
  overall_state: OverallState;
  blockers_count: number;
  warnings_count: number;
}

export async function fetchEnrollmentChecklists(): Promise<EnrollmentChecklist[]> {
  // Single batch fetch — no N+1
  const [enrollRes, profilesRes, prefsRes, slotsRes, emailsRes, batchRes] = await Promise.all([
    supabase.from("enrollments").select("id, user_id, plan_type, duration, sessions_remaining, sessions_total, amount, currency, status, payment_status, payment_method, payment_provider, payment_date, receipt_url, approval_status, created_at, preferred_days, preferred_time, timezone, level, package_id, admin_notes").order("created_at", { ascending: false }),
    // course_level_key is the source of truth for course logic. level is
    // retained only for display as the learner's free-form self-assessment.
    supabase.from("profiles").select("user_id, name, email, country, course_level_key, level, avatar_url, created_at"),
    supabase.from("student_slot_preferences").select("enrollment_id, slot_id, preferred_day, preferred_time"),
    supabase.from("matching_slots").select("id, day_of_week, time_slot, teacher_id, is_available"),
    supabase.from("email_sends").select("user_id, status, sent_at"),
    supabase.from("batch_members").select("enrollment_id, user_id, batch_id, member_status"),
  ]);

  const enrollments = enrollRes.data || [];
  const profiles = profilesRes.data || [];
  const prefs: any[] = prefsRes.data || [];
  const slots: any[] = slotsRes.data || [];
  const emails = emailsRes.data || [];
  const batches = batchRes.data || [];

  // Lookup maps
  const profileByUser = new Map(profiles.map(p => [p.user_id, p]));
  const emailDupes = new Map<string, number>();
  profiles.forEach(p => emailDupes.set(p.email, (emailDupes.get(p.email) || 0) + 1));

  const slotMap = new Map(slots.map((s: any) => [s.id, s]));

  const prefsByEnroll = new Map<string, any[]>();
  prefs.forEach((p: any) => {
    const arr = prefsByEnroll.get(p.enrollment_id) || [];
    arr.push(p);
    prefsByEnroll.set(p.enrollment_id, arr);
  });

  const sentEmailsByUser = new Map<string, string>();
  emails.forEach(e => {
    if (e.status === "sent" && e.sent_at) {
      const existing = sentEmailsByUser.get(e.user_id);
      if (!existing || e.sent_at > existing) sentEmailsByUser.set(e.user_id, e.sent_at);
    }
  });

  const batchByEnroll = new Map(batches.map(b => [b.enrollment_id, b]));

  // Enrollments per user for duplicate check
  const paidByUser = new Map<string, number>();
  enrollments.forEach(e => {
    if (e.payment_status === "PAID" && e.approval_status === "APPROVED") {
      paidByUser.set(e.user_id, (paidByUser.get(e.user_id) || 0) + 1);
    }
  });

  return enrollments.map(e => {
    const profile = profileByUser.get(e.user_id);
    const items: ChecklistItem[] = [];

    // ── 1. Identity & Contact ──
    const email = profile?.email || "";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    items.push({
      key: "email_valid", label: "Email present & valid format",
      status: email && emailOk ? "PASS" : "BLOCKER",
      details: !email ? "No email" : !emailOk ? `Invalid: ${email}` : email,
      priority: "BLOCKER",
    });

    items.push({
      key: "profile_exists", label: "Profile record exists",
      status: profile ? "PASS" : "BLOCKER",
      details: profile ? `Created ${new Date(profile.created_at).toLocaleDateString()}` : "Missing profile row",
      priority: "BLOCKER",
    });

    const dupeCount = email ? (emailDupes.get(email) || 0) : 0;
    items.push({
      key: "no_duplicate_profiles", label: "No duplicate profiles (email)",
      status: dupeCount <= 1 ? "PASS" : "BLOCKER",
      details: dupeCount > 1 ? `${dupeCount} profiles share ${email}` : "Unique",
      priority: "BLOCKER",
    });

    // ── 2. Payment & Conversion ──
    const isPaid = e.payment_status === "PAID" && e.approval_status === "APPROVED";
    items.push({
      key: "payment_approved", label: "Payment approved & paid",
      status: isPaid ? "PASS" : "BLOCKER",
      details: `Payment: ${e.payment_status} · Approval: ${e.approval_status}`,
      priority: "BLOCKER", action: isPaid ? undefined : "approve_payment",
    });

    items.push({
      key: "payment_method", label: "Payment method recorded",
      status: e.payment_method || e.payment_provider ? "PASS" : "WARN",
      details: e.payment_method || e.payment_provider || "Not recorded",
      priority: "WARN",
    });

    const isManual = e.payment_provider === "manual" || e.payment_provider === "egypt_manual";
    const hasReceipt = !!(e.receipt_url && e.receipt_url.trim());
    if (isManual) {
      items.push({
        key: "receipt_uploaded", label: "Receipt uploaded (manual payment)",
        status: hasReceipt ? "PASS" : "BLOCKER",
        details: hasReceipt ? "On file" : "Missing receipt for manual payment",
        priority: "BLOCKER",
      });
    }

    const userPaidCount = paidByUser.get(e.user_id) || 0;
    if (userPaidCount > 1) {
      items.push({
        key: "duplicate_payments", label: "Duplicate paid enrollments",
        status: "WARN",
        details: `${userPaidCount} paid enrollments for this user`,
        priority: "WARN",
      });
    }

    items.push({
      key: "payment_date", label: "Payment date present",
      status: e.payment_date ? "PASS" : "WARN",
      details: e.payment_date || "Not recorded",
      priority: "WARN",
    });

    const lastEmail = sentEmailsByUser.get(e.user_id);
    items.push({
      key: "confirmation_email", label: "Confirmation email sent",
      status: lastEmail ? "PASS" : "WARN",
      details: lastEmail ? `Last: ${new Date(lastEmail).toLocaleDateString()}` : "No emails sent",
      priority: "WARN", action: lastEmail ? undefined : "send_email",
    });

    // ── 3. Preferences & Scheduling ──
    const enrollPrefs = prefsByEnroll.get(e.id) || [];
    const hasDays = e.preferred_days && e.preferred_days.length > 0;

    items.push({
      key: "preference_exists", label: "Schedule preference row exists",
      status: enrollPrefs.length > 0 || hasDays ? "PASS" : "BLOCKER",
      details: enrollPrefs.length > 0 ? "Preference record found" : hasDays ? "Days on enrollment" : "No preferences",
      priority: "BLOCKER", action: "update_preferences",
    });

    items.push({
      key: "preferred_days", label: "Preferred days selected",
      status: hasDays ? "PASS" : "BLOCKER",
      details: hasDays ? (e.preferred_days as string[]).join(", ") : "None selected",
      priority: "BLOCKER", action: "update_preferences",
    });

    items.push({
      key: "timezone", label: "Timezone set",
      status: e.timezone ? "PASS" : "WARN",
      details: e.timezone || "Defaults to Africa/Cairo",
      priority: "WARN", action: "fix_timezone",
    });

    if (enrollPrefs.length > 1) {
      items.push({
        key: "duplicate_prefs", label: "Duplicate slot preference rows",
        status: "BLOCKER",
        details: `${enrollPrefs.length} rows for enrollment ${e.id.slice(0, 8)}`,
        priority: "BLOCKER",
      });
    }

    // ── 4. Matching Integrity ──
    const assignedPref = enrollPrefs.find((p: any) => p.assigned_slot_id);
    const slotId = assignedPref?.assigned_slot_id;
    const slot = slotId ? slotMap.get(slotId) : null;

    items.push({
      key: "slot_assigned", label: "Slot assigned",
      status: slotId ? "PASS" : isPaid ? "BLOCKER" : "INFO",
      details: slot ? `${slot.day} ${slot.time} (${slot.course_level})` : "No slot",
      priority: isPaid ? "BLOCKER" : "INFO", action: "assign_slot",
    });

    if (slot) {
      items.push({
        key: "slot_capacity", label: "Slot within capacity",
        status: slot.current_count <= slot.max_students ? "PASS" : "BLOCKER",
        details: `${slot.current_count}/${slot.max_students}`,
        priority: "BLOCKER",
      });

      const dayMatch = (e.preferred_days || []).includes(slot.day);
      items.push({
        key: "day_match", label: "Day preference matches slot",
        status: dayMatch ? "PASS" : "WARN",
        details: dayMatch ? `${slot.day} ✓` : `Slot ${slot.day} ∉ [${(e.preferred_days || []).join(", ")}]`,
        priority: "WARN",
      });

      // Level-match check compares canonical keys → use course_level_key.
      const pLevel = (profile as any)?.course_level_key || profile?.level || "";
      if (pLevel) {
        items.push({
          key: "level_match", label: "Level matches slot",
          status: slot.course_level === pLevel ? "PASS" : "WARN",
          details: `Student: ${pLevel}, Slot: ${slot.course_level}`,
          priority: "WARN",
        });
      }
    }

    // ── 5. Class Readiness ──
    const batch = batchByEnroll.get(e.id);
    if (e.plan_type === "group") {
      items.push({
        key: "group_assigned", label: "Group / batch assigned",
        status: batch ? "PASS" : "WARN",
        details: batch ? `Status: ${batch.member_status}` : "Not in any group",
        priority: "WARN",
      });
    }

    // ── Compute totals ──
    const blockers_count = items.filter(i => i.status === "BLOCKER").length;
    const warnings_count = items.filter(i => i.status === "WARN").length;
    const overall_state: OverallState =
      blockers_count > 0 ? "BLOCKED" : warnings_count > 0 ? "NEEDS_REVIEW" : "SUCCESS";

    return {
      enrollment_id: e.id,
      user_id: e.user_id,
      student_name: profile?.name || "Unknown",
      email: profile?.email || "",
      level: profile?.level || "",
      plan_type: e.plan_type,
      created_at: e.created_at,
      payment_status: e.payment_status,
      approval_status: e.approval_status,
      admin_notes: (e as any).admin_notes || "",
      items,
      overall_state,
      blockers_count,
      warnings_count,
    };
  });
}
