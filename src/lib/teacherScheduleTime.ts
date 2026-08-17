/**
 * Pure date/time helpers for the dated teacher schedule.
 *
 * Deliberately free of any Supabase import so they stay unit-testable — the
 * client throws at module load when env vars are absent, which a test runner
 * has no reason to provide.
 *
 * Schedule blocks are wall-clock values (a date plus a local time in the
 * teacher's timezone), never instants, so everything here works on the local
 * calendar. In particular `toDateKey` must not go through toISOString(), which
 * would shift late-evening dates by a day for any timezone east of UTC.
 */

/** YYYY-MM-DD for a Date, using its local calendar day rather than UTC. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** A new Date `n` days after `d`. Does not mutate `d`. */
export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Sunday of the week containing `d`, matching the 0=Sun day_of_week convention. */
export function startOfWeek(d: Date): Date {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  return addDays(start, -start.getDay());
}

/** "18:00:00" or "18:00" -> "6:00 PM" */
export function formatTime(hhmmss: string): string {
  const [hStr, mStr] = hhmmss.split(":");
  const h = Number(hStr);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/** Accepts "9:00" or "09:00" and normalizes to "09:00"; null when unparseable. */
export function normalizeTime(input: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
