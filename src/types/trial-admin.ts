// Types for the Admin Dashboard "Trial Classes" tab.
// Mirrors the Postgres views/RPCs added by the migrations under
// supabase/migrations/2026042*_trial_admin_*.sql.

export type TrialSlotLifecycle = 'active' | 'archived' | 'retired';

export type TrialBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export type TrialProgramPhase = 'pre_launch' | 'active_program';
export type TrialTimeBucket = 'past' | 'upcoming';

// v_trial_bookings_admin
export interface AdminTrialBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  level: string | null;
  goal: string | null;
  day_of_week: number; // 0-6, 0 = Sunday
  day_name: string;
  trial_date: string; // ISO date
  start_time: string; // "HH:MM"
  status: TrialBookingStatus;
  confirmed_at: string | null;
  created_at: string | null;
  user_id: string | null;
  timezone: string | null;
  confirmation_email_failed_at: string | null;

  // joined slot metadata (null if slot no longer exists)
  slot_id: string | null;
  slot_lifecycle: TrialSlotLifecycle | null;
  slot_is_active: boolean | null;
  slot_capacity: number | null;
  slot_duration_min: number | null;
  slot_exists: boolean;

  // derived
  time_bucket: TrialTimeBucket;
  program_phase: TrialProgramPhase;

  // email tracking
  email_sent_at: string | null;
  email_opened_at: string | null;
  attendance_response: 'yes' | 'no' | null;
  attendance_responded_at: string | null;
}

// v_trial_slots_admin — one row per (slot, upcoming occurrence)
export interface AdminTrialSlotOccurrence {
  slot_id: string;
  day_of_week: number;
  day_name: string;
  occurrence_date: string;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  booked_count: number;
  seats_left: number;
  is_full: boolean;
  lifecycle: TrialSlotLifecycle;
}

// fn_suggest_trial_slots
export interface TrialSlotSuggestion {
  day_of_week: number;
  day_name: string;
  start_time: string;
  duration_min: number;
  timezone: string;
  source: string;
  score: number;
  reasons: string[];
  is_reasonable_hour: boolean;
  has_historical_demand: boolean;
  would_replace_full_slot: boolean;
}

// trial_settings
export interface TrialSettings {
  id: number;
  program_start_date: string | null;
  default_duration_min: number;
  suggestion_weeks: number;
  updated_at: string;
}

// Raw trial_slots row (for the Trial Settings list view)
export interface TrialSlotRow {
  id: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  is_active: boolean;
  lifecycle: TrialSlotLifecycle;
  archived_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function formatDay(dow: number): string {
  return DAY_NAMES[dow] ?? String(dow);
}
