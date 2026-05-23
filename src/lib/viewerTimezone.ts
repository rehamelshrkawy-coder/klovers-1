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
