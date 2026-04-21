/**
 * Shared admin utilities — replaces duplicated helpers across admin components.
 */

// ── Pagination ───────────────────────────────────────────────────────────────

/** Default page size for admin tables. Keeps row height × count ≈ one screen. */
export const ADMIN_PAGE_SIZE = 25;

// ── Time formatting ──────────────────────────────────────────────────────────

/** Convert "HH:MM" (24h) to "H:MM AM/PM". Replaces 6+ identical formatTime copies. */
export function formatTime(t: string): string {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return t || "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
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

export function formatCurrency(amount: number, currency = "EGP"): string {
  return `${amount.toLocaleString()} ${currency}`;
}
