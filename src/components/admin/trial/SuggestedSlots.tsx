import { useState } from 'react';
import { TrialSlotSuggestion } from '@/types/trial-admin';
import { useCreateTrialSlot } from '@/hooks/useTrialAdmin';

export default function SuggestedSlots({
  suggestions,
  compact = false,
  fullSlotsCount = 0,
}: {
  suggestions: TrialSlotSuggestion[];
  compact?: boolean;
  fullSlotsCount?: number;
}) {
  const createSlot = useCreateTrialSlot();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const show = compact ? suggestions.slice(0, 3) : suggestions;

  async function handleCreate(s: TrialSlotSuggestion) {
    const key = `${s.day_of_week}-${s.start_time}`;
    setPendingKey(key);
    try {
      await createSlot.mutateAsync({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        duration_min: s.duration_min,
        capacity: 8,
        timezone: s.timezone,
      });
    } catch (err) {
      alert(
        `Could not create slot: ${(err as Error).message}\n\n` +
          'The most common reason is that a fresh conflict appeared between ' +
          'suggestion time and class creation time. Refresh and try again.'
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold">Suggested New Slots</h2>
          <p className="text-xs text-muted-foreground">
            Generated from your teacher availability, excluding any time that
            clashes with an active group class, matching slot, or other trial slot.
          </p>
        </div>
        {fullSlotsCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {fullSlotsCount} slot{fullSlotsCount === 1 ? '' : 's'} currently full
          </span>
        )}
      </header>

      {show.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          No non-clashing candidates found. Either all teacher-availability windows
          are already opened as trial slots, or they overlap with existing
          classes. Add a new availability window to unlock suggestions.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {show.map((s) => {
            const key = `${s.day_of_week}-${s.start_time}`;
            const pending = pendingKey === key;
            const tone =
              s.score >= 140
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                : s.score >= 110
                ? 'border-blue-200 bg-blue-50/60 dark:bg-blue-950/20'
                : 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20';
            return (
              <article
                key={key}
                className={`flex flex-col rounded-lg border p-4 shadow-sm ${tone}`}
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-base font-semibold">
                    {s.day_name} · {s.start_time}
                  </div>
                  <span
                    className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium tabular-nums dark:bg-white/10"
                    title="Suggestion score (higher is better)"
                  >
                    score {s.score}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.duration_min} min · {s.timezone}
                </div>

                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm">
                  {s.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {s.is_reasonable_hour ? (
                    <Tag tone="green">student-friendly hour</Tag>
                  ) : (
                    <Tag tone="amber">late-night</Tag>
                  )}
                  {s.has_historical_demand && <Tag tone="blue">has past demand</Tag>}
                  {s.would_replace_full_slot && <Tag tone="red">overflow helper</Tag>}
                </div>

                <button
                  type="button"
                  onClick={() => handleCreate(s)}
                  disabled={pending}
                  className="mt-4 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {pending ? 'Creating…' : 'Open this slot'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: 'green' | 'amber' | 'blue' | 'red' }) {
  const map = {
    green: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
    amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}
