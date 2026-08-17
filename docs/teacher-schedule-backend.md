# Teacher schedule — hand-entered empty & busy slots

Backend for a dated teacher calendar the admin fills in by hand: every block is
either **empty** (teacher is free) or **busy** (teacher is taken). Added by
`supabase/migrations/20260817130000_teacher_scheduled_slots.sql`.

## Why a new table

`teacher_availability` (the existing table behind `TeacherAvailabilityManager`)
is a *recurring weekly* boolean grid — `day_of_week` + `start_time` +
`is_available`. It has no concrete date, no end time, and no way to say "this
particular Tuesday 18:00 is taken". `teacher_schedule_slots` adds that. Nothing
in `teacher_availability` was changed, so `scheduleAutomation.ts`,
`scheduleSlotEngine.ts`, and the existing manager keep working as-is.

## `public.teacher_schedule_slots`

| Column | Notes |
|---|---|
| `teacher_id` | `auth.users.id`. Defaults to the caller in every RPC. |
| `slot_date`, `start_time`, `end_time` | Wall-clock in `timezone`, **not** UTC. `end_time > start_time`, so a block cannot cross midnight — enter two. |
| `timezone` | IANA name, default `Asia/Kuala_Lumpur`. Must be the same across all of one teacher's blocks on a given date. |
| `status` | `empty` or `busy`. |
| `label`, `notes` | Private. Never returned by `get_teacher_open_slots()`. |
| `student_id` | Optional, for a busy block. Forced to `NULL` on `empty` blocks. |
| `source` | `manual` (the normal case) or `system`, reserved for a future booking integration. |

Guarantees enforced in the database, not in application code:

- **No double-booking.** A GiST exclusion constraint (`teacher_id WITH =`,
  wall-clock `tsrange WITH &&`) rejects any block overlapping an existing one
  for the same teacher, whatever its status. Back-to-back blocks (one ends
  exactly where the next starts) are fine — the range is `[)`.
- **No mixed timezones on one day.** The overlap guard compares wall-clock
  times, so a second timezone on the same date could hide a real overlap. A
  trigger rejects it.
- **No student on an empty block**, and no unknown timezone strings.

## RLS

- Admins (`has_role(auth.uid(), 'admin')`) manage every teacher's schedule; a
  teacher manages their own.
- A student can `SELECT` only the busy blocks where `student_id = auth.uid()`.
- **No `anon` access at all** — the table and the admin RPCs are revoked from
  `anon`, undoing Supabase's blanket default grants. Public reads go through
  `get_teacher_open_slots()`.

## RPCs

```ts
// One block. Pass p_end_time, or leave it out and give a duration.
await supabase.rpc('fn_add_teacher_slot', {
  p_slot_date: '2026-09-01', p_start_time: '18:00', p_duration_minutes: 60,
});
await supabase.rpc('fn_add_teacher_slot', {
  p_slot_date: '2026-09-01', p_start_time: '19:00', p_end_time: '20:30',
  p_status: 'busy', p_label: 'Korean 1 – Ahmed', p_student_id: studentUserId,
});

// A weekday x start-time grid across a date range. Overlaps are skipped and
// counted; pass p_skip_conflicts: false to make a clash an error instead.
// Returns { candidates, inserted, skipped, ... }.
await supabase.rpc('fn_add_teacher_slots_bulk', {
  p_from: '2026-09-07', p_to: '2026-09-30',
  p_weekdays: [1, 3],                    // 0 = Sunday .. 6 = Saturday
  p_start_times: ['18:00', '19:00'],
  p_duration_minutes: 60,
});

// Flip empty <-> busy. label/notes/student_id are overwritten with whatever is
// passed, so omitting them clears them.
await supabase.rpc('fn_set_teacher_slot_status', {
  p_slot_id: id, p_status: 'busy', p_label: 'Doctor',
});

// Move or resize. NULL/omitted arguments leave that field alone.
await supabase.rpc('fn_update_teacher_slot', {
  p_slot_id: id, p_start_time: '17:00', p_end_time: '17:45',
});

await supabase.rpc('fn_delete_teacher_slot', { p_slot_id: id });
await supabase.rpc('fn_clear_teacher_slots', {
  p_from: '2026-09-01', p_to: '2026-09-30', p_status: 'empty',  // status optional
});

// Admin read — defaults to the caller and the next 30 days. Includes label,
// notes, student_name, duration_minutes, starts_at/ends_at, is_past.
await supabase.rpc('get_teacher_schedule', { p_from: '2026-09-01', p_to: '2026-09-30' });

// Public read — upcoming empty blocks only, no private columns. Callable by anon.
await supabase.rpc('get_teacher_open_slots', { p_from: '2026-09-01', p_to: '2026-10-31' });
```

`v_teacher_schedule_admin` is the same shape as `get_teacher_schedule` if you
prefer to query the view directly (`security_invoker = on`, so RLS applies).

## Errors worth handling in the UI

| SQLSTATE | Meaning |
|---|---|
| `23P01` | Overlaps a block already on the schedule. |
| `23514` | End before start, student on an empty block, or a second timezone on that day. |
| `22023` | Bad argument — unknown timezone, weekday outside 0–6, non-positive duration, reversed date range, or a start time that would run past midnight. |
| `42501` | Not allowed to edit that teacher's schedule. |
| `P0002` | Slot not found, or not the caller's to edit. |

## Not included

No admin UI yet, and `src/integrations/supabase/types.ts` is generated from the
live database — regenerate it (`supabase gen types`) after this migration
deploys so the new table and RPCs are typed for the frontend.
