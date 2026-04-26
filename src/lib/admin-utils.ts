/**
 * Shared admin utilities — replaces duplicated helpers across admin components.
 */

// ── Pagination ───────────────────────────────────────────────────────────────

/** Default page size for admin tables. Keeps row height × count ≈ one screen. */
export const ADMIN_PAGE_SIZE = 25;

// ── Business rule thresholds ─────────────────────────────────────────────────

/** Sessions remaining at or below this count triggers "at-risk" UI warning. */
export const AT_RISK_SESSION_THRESHOLD = 3;

/** sessions_remaining value at which a student is considered LOCKED (matches DB view logic). */
export const LOCKED_SESSION_THRESHOLD = -3;

/** Maximum unit price (per-session) an admin can set on an enrollment. */
export const MAX_UNIT_PRICE = 10_000;

/** Referral conversion bonus per enrolled friend (percentage). */
export const REFERRAL_CONVERSION_BONUS_PCT = 5;

/** Referral click-only bonus per visitor who didn't enroll (percentage). */
export const REFERRAL_CLICK_BONUS_PCT = 2;

/** Maximum referral bonus any single referrer can earn (percentage). */
export const REFERRAL_MAX_BONUS_PCT = 15;

// ── Time formatting ──────────────────────────────────────────────────────────

/** Convert "HH:MM" (24h) to "H:MM AM/PM". Replaces 6+ identical formatTime copies. */
export function formatTime(t: string): string {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return t || "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  const hour = parts.hour === "24" ? 0 : +parts.hour;
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hour, +parts.minute, +parts.second);
  return asUTC - date.getTime();
}

/**
 * Convert a recurring weekly slot from source timezone to target timezone.
 * Returns the localized weekday + 12h time string. Handles DST correctly
 * by resolving against the next upcoming occurrence.
 */
export function convertSlotToTimezone(
  dayOfWeek: number,
  timeHHMM: string,
  sourceTz: string,
  targetTz: string,
): { weekday: string; dayIndex: number; timeFormatted: string } {
  if (!timeHHMM || !/^\d{1,2}:\d{2}$/.test(timeHHMM) || !sourceTz || !targetTz) {
    return {
      weekday: WEEKDAY_LONG[dayOfWeek] || "",
      dayIndex: dayOfWeek,
      timeFormatted: formatTime(timeHHMM),
    };
  }
  const [h, m] = timeHHMM.split(":").map(Number);

  // Find next date (in source tz) matching dayOfWeek
  const now = new Date();
  const srcParts = new Intl.DateTimeFormat("en-US", {
    timeZone: sourceTz, weekday: "short",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDow = dowMap[srcParts.weekday] ?? 0;
  const delta = ((dayOfWeek - currentDow) + 7) % 7 || 7;
  const base = new Date(Date.UTC(+srcParts.year, +srcParts.month - 1, +srcParts.day));
  base.setUTCDate(base.getUTCDate() + delta);

  // Interpret (year,month,day,h,m) as wall-time in source tz → UTC instant
  const guess = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, m);
  const offset = tzOffsetMs(new Date(guess), sourceTz);
  const instant = new Date(guess - offset);

  const tgtParts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz, weekday: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(instant).reduce((a, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);

  const dayIndex = WEEKDAY_LONG.indexOf(tgtParts.weekday);
  const timeFormatted = `${tgtParts.hour}:${tgtParts.minute} ${tgtParts.dayPeriod}`;
  return { weekday: tgtParts.weekday, dayIndex, timeFormatted };
}

// ── Attendance status colors ─────────────────────────────────────────────────

/** Ring + background classes for attendance status badges. */
export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case "present": return "ring-green-500 bg-green-500/20";
    case "absent": return "ring-destructive bg-destructive/20";
    case "late": return "ring-yellow-500 bg-yellow-500/20";
    case "excused": return "ring-blue-500 bg-blue-500/20";
    default: return "ring-muted";
  }
}

// ── CSV export ───────────────────────────────────────────────────────────────

/** Download an array of row-objects as a CSV file. */
export function exportCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
): void {
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c ?? ""}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Currency formatting ──────────────────────────────────────────────────────

/** Formats an amount with its currency code using locale-aware number formatting. */
export function formatCurrency(amount: number, currency = "EGP"): string {
  return `${amount.toLocaleString()} ${currency}`;
}
