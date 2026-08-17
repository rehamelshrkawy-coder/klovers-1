/**
 * Typed access to the dated teacher schedule (`teacher_schedule_slots`).
 *
 * Every block is wall-clock in its own `timezone` column, which defaults to
 * ADMIN_TIMEZONE — the timezone the teacher works in — so times entered in the
 * admin UI are stored verbatim. That is deliberately unlike the older
 * `teacher_availability` table, whose rows are stored in Cairo time and have to
 * be converted on the way in and out (see TeacherAvailabilityManager).
 *
 * `src/integrations/supabase/types.ts` is generated from the live database and
 * has not been regenerated since this table shipped, so the RPC surface is
 * reached through one narrow cast here rather than `as any` at every call site.
 * Regenerate the types and this shim can go.
 */
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_TIMEZONE } from "@/constants/scheduling";

// Pure date/time helpers live in a sibling module so they can be unit-tested
// without this file's Supabase import, which throws when env vars are absent.
export {
  addDays, formatTime, normalizeTime, startOfWeek, toDateKey,
} from "@/lib/teacherScheduleTime";

export type SlotStatus = "empty" | "busy";

/** One row of `get_teacher_schedule` — the admin view, including private fields. */
export interface TeacherScheduleSlot {
  id: string;
  teacher_id: string;
  /** YYYY-MM-DD */
  slot_date: string;
  /** 0 = Sunday .. 6 = Saturday */
  day_of_week: number;
  /** HH:MM:SS, wall-clock in `timezone` */
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  is_past: boolean;
  status: SlotStatus;
  label: string | null;
  notes: string | null;
  student_id: string | null;
  student_name: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface BulkFillResult {
  teacher_id: string;
  candidates: number;
  inserted: number;
  skipped: number;
  status: SlotStatus;
  from: string;
  to: string;
}

interface RpcError {
  message: string;
  code?: string;
}

type RpcCall = (
  name: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: RpcError | null }>;

const rpc = supabase.rpc as unknown as RpcCall;

/**
 * The database raises readable messages with meaningful SQLSTATEs; surface the
 * message as-is rather than a generic "something went wrong", since the useful
 * part ("19:30 overlaps a slot that is already on the schedule") is in there.
 */
function unwrap<T>(data: unknown, error: RpcError | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getTeacherSchedule(
  from: string,
  to: string,
  teacherId?: string,
): Promise<TeacherScheduleSlot[]> {
  const { data, error } = await rpc("get_teacher_schedule", {
    p_from: from,
    p_to: to,
    p_teacher_id: teacherId ?? null,
  });
  return unwrap<TeacherScheduleSlot[]>(data, error) ?? [];
}

export async function addSlot(input: {
  date: string;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number;
  status?: SlotStatus;
  label?: string | null;
  notes?: string | null;
  studentId?: string | null;
}): Promise<void> {
  const { data, error } = await rpc("fn_add_teacher_slot", {
    p_slot_date: input.date,
    p_start_time: input.startTime,
    p_end_time: input.endTime ?? null,
    p_duration_minutes: input.durationMinutes ?? 60,
    p_status: input.status ?? "empty",
    p_label: input.label ?? null,
    p_notes: input.notes ?? null,
    p_student_id: input.studentId ?? null,
    p_timezone: ADMIN_TIMEZONE,
  });
  unwrap<unknown>(data, error);
}

export async function addSlotsBulk(input: {
  from: string;
  to: string;
  /** 0 = Sunday .. 6 = Saturday */
  weekdays: number[];
  startTimes: string[];
  durationMinutes?: number;
  status?: SlotStatus;
  label?: string | null;
}): Promise<BulkFillResult> {
  const { data, error } = await rpc("fn_add_teacher_slots_bulk", {
    p_from: input.from,
    p_to: input.to,
    p_weekdays: input.weekdays,
    p_start_times: input.startTimes,
    p_duration_minutes: input.durationMinutes ?? 60,
    p_status: input.status ?? "empty",
    p_label: input.label ?? null,
    p_skip_conflicts: true,
    p_timezone: ADMIN_TIMEZONE,
  });
  return unwrap<BulkFillResult>(data, error);
}

export async function setSlotStatus(
  slotId: string,
  status: SlotStatus,
  label?: string | null,
  notes?: string | null,
): Promise<void> {
  const { data, error } = await rpc("fn_set_teacher_slot_status", {
    p_slot_id: slotId,
    p_status: status,
    p_label: label ?? null,
    p_notes: notes ?? null,
  });
  unwrap<unknown>(data, error);
}

export async function deleteSlot(slotId: string): Promise<void> {
  const { data, error } = await rpc("fn_delete_teacher_slot", { p_slot_id: slotId });
  unwrap<unknown>(data, error);
}

export async function clearSlots(
  from: string,
  to: string,
  status?: SlotStatus | null,
): Promise<number> {
  const { data, error } = await rpc("fn_clear_teacher_slots", {
    p_from: from,
    p_to: to,
    p_status: status ?? null,
  });
  return unwrap<number>(data, error) ?? 0;
}

