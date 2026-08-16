/**
 * Viewer-timezone helpers.
 *
 * All trial-class times are anchored to `Asia/Kuala_Lumpur` (MYT, UTC+8),
 * the teacher's local timezone. When rendering, we localize to the visitor's
 * timezone detected from the browser — no country label is ever shown publicly.
 *
 *   - Students: their own timezone (profile → localStorage → browser → MYT fallback)
 *   - Admin/teacher: Asia/Kuala_Lumpur by default, overridable via profile or browser
 */

import { ADMIN_TIMEZONE as ADMIN_TZ_FALLBACK } from "@/constants/scheduling";

const USER_TZ_LS_KEY = "klovers_user_timezone";

function browserTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || null;
  } catch { return null; }
}

/** Student viewer timezone. Reads localStorage first (cheap), then browser. */
export function getUserTimezone(): string {
  try {
    const fromLs = typeof window !== "undefined" ? window.localStorage.getItem(USER_TZ_LS_KEY) : null;
    if (fromLs) return fromLs;
  } catch { /* ignore */ }
  return browserTimezone() || "Asia/Kuala_Lumpur";
}

/** Persist the user's chosen timezone so later renders pick it up without a DB round-trip. */
export function setUserTimezone(tz: string): void {
  try { window.localStorage.setItem(USER_TZ_LS_KEY, tz); } catch { /* ignore */ }
}

const ADMIN_TZ_LS_KEY = "klovers_admin_timezone";

/**
 * Admin/teacher viewer timezone.
 * Default: Asia/Kuala_Lumpur (current teacher is Malaysia-based).
 * Overridable via localStorage so a future admin can change it without a code push.
 */
export function getAdminTimezone(): string {
  try {
    const override = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TZ_LS_KEY) : null;
    if (override) return override;
  } catch { /* ignore */ }
  return ADMIN_TZ_FALLBACK;
}

export function setAdminTimezone(tz: string): void {
  try { window.localStorage.setItem(ADMIN_TZ_LS_KEY, tz); } catch { /* ignore */ }
}

/**
 * Timezones to offer in a picker.
 *
 * `Intl.supportedValuesOf` is ES2022 and is missing from Safari below 15.4 and
 * from every pre-2022 Android WebView — where calling it throws a TypeError.
 * Two pickers called it bare (one silencing the type error with an `any` cast),
 * so on those browsers the enrolment and reschedule pages crashed outright
 * rather than degrading. On a 3G Egyptian audience that is not a hypothetical
 * device profile.
 *
 * Falls back to the zones this site's markets actually live in, plus the
 * visitor's own detected zone so their correct answer is always selectable.
 */
const FALLBACK_TIME_ZONES = [
  // North Africa & Levant
  "Africa/Cairo", "Africa/Casablanca", "Africa/Tunis", "Africa/Algiers",
  "Africa/Tripoli", "Africa/Khartoum", "Asia/Amman", "Asia/Beirut",
  "Asia/Baghdad", "Asia/Damascus",
  // Gulf
  "Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Bahrain", "Asia/Muscat",
  "Asia/Kuwait", "Asia/Aden",
  // Asia-Pacific
  "Asia/Kuala_Lumpur", "Asia/Singapore", "Asia/Jakarta", "Asia/Bangkok",
  "Asia/Ho_Chi_Minh", "Asia/Manila", "Asia/Kolkata", "Asia/Karachi",
  "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
  // Europe & Americas
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Istanbul",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "America/Mexico_City",
  "America/Bogota", "America/Argentina/Buenos_Aires",
  "UTC",
];

export function supportedTimeZones(): string[] {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supported === "function") {
    try {
      const zones = supported.call(Intl, "timeZone");
      if (Array.isArray(zones) && zones.length > 0) return zones;
    } catch { /* fall through to the curated list */ }
  }
  const detected = browserTimezone();
  const zones = new Set(FALLBACK_TIME_ZONES);
  if (detected) zones.add(detected);
  return [...zones].sort();
}
