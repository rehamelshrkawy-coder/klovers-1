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
 * A short, sensible list for the enrollment form's timezone picker, used when
 * `Intl.supportedValuesOf` is unavailable. It is ES2022 and missing from
 * Safari before 15.4, where calling it throws a TypeError — which took the
 * whole enrollment page down rather than degrading the one dropdown.
 */
const FALLBACK_TIMEZONES = [
  "Africa/Cairo", "Africa/Casablanca", "Africa/Tunis", "Africa/Algiers",
  "Africa/Tripoli", "Africa/Khartoum",
  "Asia/Amman", "Asia/Beirut", "Asia/Baghdad", "Asia/Damascus", "Asia/Aden",
  "Asia/Riyadh", "Asia/Dubai", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait",
  "Asia/Muscat",
  "Asia/Kuala_Lumpur", "Asia/Singapore", "Asia/Jakarta", "Asia/Bangkok",
  "Asia/Ho_Chi_Minh", "Asia/Manila", "Asia/Kolkata", "Asia/Karachi",
  "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai",
  "Europe/Istanbul", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "America/Mexico_City",
  "Australia/Sydney", "UTC",
];

/** Every IANA timezone the runtime knows, or a curated fallback. */
export function supportedTimezones(): string[] {
  try {
    const supported = (Intl as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof supported === "function") {
      const list = supported.call(Intl, "timeZone");
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch { /* fall through */ }

  // Make sure the visitor's own zone is selectable even if we didn't list it.
  const own = browserTimezone();
  return own && !FALLBACK_TIMEZONES.includes(own)
    ? [own, ...FALLBACK_TIMEZONES]
    : FALLBACK_TIMEZONES;
}
