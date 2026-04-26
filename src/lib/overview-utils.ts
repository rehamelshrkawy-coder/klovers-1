/**
 * Pure utility functions for admin_student_overview data.
 * No React, no Supabase — safe to import in unit tests.
 */
import type { OverviewRow } from "@/types/admin";

/** Build a lookup map from email (lowercase) → OverviewRow. */
export function buildOverviewByEmail(rows: OverviewRow[]): Record<string, OverviewRow> {
  const map: Record<string, OverviewRow> = {};
  for (const r of rows) {
    if (r.email) map[r.email.toLowerCase()] = r;
  }
  return map;
}
