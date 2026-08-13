import { useState } from 'react';
import {
  TrialSettings as TrialSettingsT,
  TrialSlotRow,
} from '@/types/trial-admin';
import {
  useSetProgramStartDate,
  useAllTrialSlots,
  useRetireTrialSlot,
  useUpdateTrialSettings,
} from '@/hooks/useTrialAdmin';
import { convertSlotToTimezone } from '@/lib/admin-utils';
import { getAdminTimezone } from '@/lib/viewerTimezone';
import { Pencil } from 'lucide-react';
import AddTrialClassDialog from './AddTrialClassDialog';

export default function TrialSettingsPanel({
  settings,
}: {
  settings: TrialSettingsT | null;
}) {
  const [date, setDate] = useState(settings?.program_start_date ?? '');
  const [minGroupSize, setMinGroupSize] = useState(String(settings?.min_group_size ?? 3));
  const [windowStart, setWindowStart] = useState(settings?.window_start_day != null ? String(settings.window_start_day) : '');
  const [windowEnd, setWindowEnd] = useState(settings?.window_end_day != null ? String(settings.window_end_day) : '');
  const saveDate = useSetProgramStartDate();
  const saveSettings = useUpdateTrialSettings();
  const allSlotsQ = useAllTrialSlots();
  const retire = useRetireTrialSlot();
  const [editingSlot, setEditingSlot] = useState<TrialSlotRow | null>(null);

  async function handleSave() {
    await saveDate.mutateAsync(date || null);
  }

  async function handleSaveGroupSettings() {
    await saveSettings.mutateAsync({
      minGroupSize: Number(minGroupSize) || 3,
      windowStartDay: windowStart ? Number(windowStart) : null,
      windowEndDay: windowEnd ? Number(windowEnd) : null,
    });
  }

  const slots = allSlotsQ.data ?? [];
  const sortedSlots = [...slots].sort((a, b) => {
    const da = a.trial_date ?? '';
    const db = b.trial_date ?? '';
    if (da !== db) return da.localeCompare(db);
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <section className="space-y-6">
      {/* Program start date */}
      <article className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold">Trial Program Start Date</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Before this date, trial booking records are treated as{' '}
          <em>pre-launch</em> historical data — the system will not mark them as
          attended or completed. On or after this date, records become part of
          the live program.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date ?? ''}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saveDate.isPending}
            className="rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saveDate.isPending ? 'Saving…' : 'Save'}
          </button>
          {settings?.program_start_date ? (
            <span className="text-xs text-muted-foreground">
              Currently set to <strong>{settings.program_start_date}</strong>.
            </span>
          ) : (
            <span className="text-xs text-amber-700">Not set yet.</span>
          )}
        </div>
      </article>

      {/* Group size + monthly window */}
      <article className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold">Group Size &amp; Monthly Window</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum students needed for a trial group to run (below this, affected
          bookings are automatically flagged for rollover to next month instead
          of being marked no-show). The day-of-month window is optional — leave
          both blank to allow trial dates on any day of the month.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground" htmlFor="min-group-size">Min. group size</label>
            <input
              id="min-group-size"
              type="number"
              min={1}
              value={minGroupSize}
              onChange={(e) => setMinGroupSize(e.target.value)}
              className="w-28 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground" htmlFor="window-start">Window start day</label>
            <input
              id="window-start"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 1"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="w-28 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground" htmlFor="window-end">Window end day</label>
            <input
              id="window-end"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 7"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="w-28 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveGroupSettings}
            disabled={saveSettings.isPending}
            className="rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saveSettings.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </article>

      {/* Defaults (read-only preview) */}
      <article className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold">Defaults</h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Default duration</dt>
            <dd className="font-mono">{settings?.default_duration_min ?? 30} min</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Upcoming window</dt>
            <dd className="font-mono">{settings?.suggestion_weeks ?? 4} week(s)</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last updated</dt>
            <dd className="font-mono">
              {settings?.updated_at?.replace('T', ' ').slice(0, 16) ?? '—'}
            </dd>
          </div>
        </dl>
      </article>

      {/* Trial schedule editor */}
      <article className="rounded-md border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Trial Schedule</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Every trial session, editable — date, time, language, capacity, minimum
              to run, and open/close. Nothing here is hard-coded; changes take effect
              on the public booking page immediately.
            </p>
          </div>
          <AddTrialClassDialog />
        </div>
        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Day</th>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Language</th>
                <th className="px-3 py-2 text-left font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">Capacity</th>
                <th className="px-3 py-2 text-right font-medium">Min. to run</th>
                <th className="px-3 py-2 text-left font-medium">Lifecycle</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSlots.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                    No trial slots configured.
                  </td>
                </tr>
              )}
              {sortedSlots.map((s) => {
                const adminTz = getAdminTimezone();
                const lcl = convertSlotToTimezone(s.day_of_week, s.start_time, s.timezone, adminTz);
                return (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{s.trial_date ?? '—'}</td>
                  <td className="px-3 py-2">{lcl.weekday}</td>
                  <td className="px-3 py-2 font-mono">
                    {lcl.timeFormatted} · {s.duration_min}m · {adminTz}
                    <div className="text-[10px] text-muted-foreground">src: {s.start_time} {s.timezone}</div>
                  </td>
                  <td className="px-3 py-2 capitalize">{s.class_language ?? '—'}</td>
                  <td className="px-3 py-2 capitalize">{s.session_period ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{s.capacity}</td>
                  <td className="px-3 py-2 text-right">{s.min_to_run ?? <span className="text-muted-foreground">default</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <LifecycleBadge value={s.lifecycle} />
                      <select
                        defaultValue={s.lifecycle}
                        onChange={(e) =>
                          retire.mutate({ slotId: s.id, lifecycle: e.target.value as 'active' | 'archived' | 'retired' })
                        }
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                        aria-label={`Change lifecycle for slot ${s.id}`}
                      >
                        <option value="active">active</option>
                        <option value="archived">archive</option>
                        <option value="retired">retire</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setEditingSlot(s)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit slot"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {editingSlot && (
        <AddTrialClassDialog editingSlot={editingSlot} onDoneEditing={() => setEditingSlot(null)} />
      )}
    </section>
  );
}

function LifecycleBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
    retired: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  };
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
        (map[value] ?? map.archived)
      }
    >
      {value}
    </span>
  );
}
