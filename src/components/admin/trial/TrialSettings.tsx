import { useState } from 'react';
import {
  TrialSettings as TrialSettingsT,
} from '@/types/trial-admin';
import {
  useSetProgramStartDate,
  useAllTrialSlots,
  useRetireTrialSlot,
} from '@/hooks/useTrialAdmin';

export default function TrialSettingsPanel({
  settings,
}: {
  settings: TrialSettingsT | null;
}) {
  const [date, setDate] = useState(settings?.program_start_date ?? '');
  const saveDate = useSetProgramStartDate();
  const allSlotsQ = useAllTrialSlots();
  const retire = useRetireTrialSlot();

  async function handleSave() {
    await saveDate.mutateAsync(date || null);
  }

  const slots = allSlotsQ.data ?? [];

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

      {/* Slot lifecycle manager */}
      <article className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold">Trial Slot Lifecycle</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Archive or retire a slot to stop accepting new bookings without
          deleting its historical records. Historical bookings continue to show
          in <em>Previous Trial Classes</em>.
        </p>
        <div className="mt-3 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Day</th>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Capacity</th>
                <th className="px-3 py-2 text-left font-medium">Lifecycle</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No trial slots configured.
                  </td>
                </tr>
              )}
              {slots.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][s.day_of_week]}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {s.start_time} · {s.duration_min}m · {s.timezone}
                  </td>
                  <td className="px-3 py-2">{s.capacity}</td>
                  <td className="px-3 py-2">
                    <LifecycleBadge value={s.lifecycle} />
                  </td>
                  <td className="px-3 py-2 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
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
