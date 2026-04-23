/**
 * Canonical admin type definitions.
 *
 * These replace the duplicated interfaces that were scattered across
 * AdminDashboard.tsx, SalesAnalytics.tsx, StudentManager.tsx,
 * StudentHealthPanel.tsx, and GroupAttendanceManager.tsx.
 */

// ── CRM ──────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  email: string;
  country: string;
  level: string;
  goal: string;
  status: string;
  created_at: string;
  plan_type: string;
  duration: string;
  schedule: string;
  timezone: string;
  source: string;
  user_id: string | null;
}

// ── Enrollments ──────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  user_id: string;
  plan_type: string;
  duration: number;
  classes_included: number;
  amount: number;
  unit_price: number;
  tx_ref: string;
  receipt_url: string;
  status: string;
  payment_status: string;
  approval_status: string;
  payment_provider: string | null;
  admin_review_required: boolean;
  sessions_remaining: number;
  created_at: string;
  profiles?: { name: string; email: string; level?: string } | null;
  currency?: string;
  due_at?: string | null;
  payment_date?: string | null;
  payment_method?: string | null;
  preferred_days?: string[] | null;
  preferred_day?: string | null;
  preferred_time?: string | null;
  timezone?: string | null;
  level?: string | null;
  package_id?: string | null;
  enrollment_status?: string;
  sessions_total?: number;
  negative_since?: string | null;
  matched_at?: string | null;
  approval_email_sent_at?: string | null;
  payment_email_sent_at?: string | null;
}

// ── Student overview ─────────────────────────────────────────────────────────

/** Row returned by the `admin_student_overview` DB view (used in the main dashboard). */
export interface OverviewRow {
  user_id: string;
  name: string;
  email: string;
  country: string;
  level: string;
  joined_at: string;
  enrollment_id: string | null;
  payment_status: string | null;
  approval_status: string | null;
  payment_method: string | null;
  payment_provider: string | null;
  sessions_total: number;
  sessions_remaining: number;
  enrollment_created_at: string | null;
  plan_type: string | null;
  duration: number | null;
  amount: number | null;
  currency: string | null;
  derived_status: string;
  source_label: string;
  unit_price: number | null;
  negative_sessions: number;
  amount_due: number;
  remaining_balance: number;
  [key: string]: unknown;
}

/** Row returned by `admin_student_status_overview` (used in StudentManager). */
export interface StatusOverviewRow {
  user_id: string;
  name: string;
  email: string;
  country: string;
  level: string;
  profile_level: string;
  profile_created_at: string;
  active_enrollment_id: string | null;
  enrollment_created_at: string | null;
  payment_status: string | null;
  approval_status: string | null;
  enrollment_status: string | null;
  slot_id: string | null;
  matched_at: string | null;
  plan_type: string | null;
  duration: number | null;
  amount: number | null;
  currency: string | null;
  classes_included: number | null;
  sessions_remaining: number | null;
  sessions_total: number | null;
  unit_price: number | null;
  package_id: string | null;
  computed_status: string;
}

// ── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceReq {
  id: string;
  user_id: string;
  request_date: string;
  status: string;
  created_at: string;
  profiles?: { name: string; email: string; credits: number } | null;
}

export interface AttendanceRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  source: string;
  admin_approved: boolean;
  student_name?: string;
  student_email?: string;
  student_avatar?: string;
}

// ── Groups ───────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  schedule_day?: string | null;
  schedule_time?: string | null;
  schedule_timezone?: string | null;
  level?: string | null;
  capacity?: number | null;
  course_type?: string | null;
}

export interface PkgGroup {
  id: string;
  package_id: string;
  name: string;
  capacity: number;
  active_count?: number;
  waitlist_count?: number;
}

export interface GroupMember {
  student_id: string;
  full_name: string;
  email: string;
  group_name: string | null;
}

// ── Misc ─────────────────────────────────────────────────────────────────────

export interface LegacyStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  course_type: string;
  package_name: string;
  total_classes: number;
  used_classes: number;
  remaining_classes: number;
  total_paid: number;
  price_per_class: number;
  payment_status: string;
  notes: string;
  created_at: string;
  group_name: string;
}

export interface StudentPackage {
  id: string;
  student_id: string;
  package_name: string;
  total_classes: number;
  used_classes: number;
  total_paid: number;
  price_per_class: number;
  payment_status: string;
  is_active: boolean;
  notes: string;
  created_at: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  created_at: string;
}
