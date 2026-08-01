/**
 * Timezone for 1-on-1 private lesson scheduling only. Trial classes are NOT
 * driven by this file — each `trial_slots` row carries its own `timezone`
 * column (see supabase/migrations for the current trial schedule), since
 * trial cohorts have moved timezones independently of private lessons before.
 */
export const TIMEZONE = "Asia/Kuala_Lumpur";
/** Timezone the admin/teacher operates in — used to localize admin dashboard displays. */
export const ADMIN_TIMEZONE = "Asia/Kuala_Lumpur";
export const PRIVATE_TIME_OPTIONS = ["10:00", "18:00"];
/**
 * Day-of-week convention used across scheduling: index 0 = Sunday, matching
 * both this array's order and the `day_of_week` integer columns in the DB
 * (trial_slots, trial_bookings, schedule_packages, etc — 0=Sun..6=Sat).
 */
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
