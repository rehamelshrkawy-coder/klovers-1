import { useMemo, useState } from 'react';
import { AdminTrialBooking, TrialBookingStatus } from '@/types/trial-admin';

// Previous Trial Classes — shows ALL records whose date has passed OR whose
// slot has been retired. We intentionally label these as "Historical Trial
// Booking Records" rather than "Completed Trials" because trial classes
// haven't officially started yet (see trial_settings.program_start_date).

const STATUS_COLORS: Record<TrialBookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
};

export default function HistoricalBookings({
  bookings,
}: {
  bookings: AdminTrialBooking[];
}) {
  const [q, setQ] = useState('');

  // Group by (trial_date, start_time) so each historical slot-instance is one card
  const grouped = useMemo(() => {
    const map = new Map<string, AdminTrialBooking[]>();
    for (const b of bookings) {
      const key = `${b.trial_date}__${b.start_time}`;
      (map.get(key) ?? map.set(key, []).get(key)!).push(b);
    }
    const sorted = Array.from(map.entries()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
    return sorted;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!q.trim()) return grouped;
    const needle = q.toLowerCase();
    return grouped.filter(([, rows]) =>
      rows.some(
        (r) =>
          r.name?.toLowerCase().includes(needle) ||
          r.email?.toLowerCase().includes(needle) ||
          r.status?.toLowerCase().includes(needle)
      )
    );
  }, [q, grouped]);

  return (
    <section className="space-y-3">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historical Trial Booking Records</h2>
          <p className="text-xs text-muted-foreground">
            Past dates + bookings on retired slots. We do <strong>not</strong> mark
            these as attended or completed — trial classes have not officially
            started yet.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, status…"
          className="w-full max-w-xs rounded-md border bg-background px-3 py-1.5 text-sm"
          aria-label="Search historical bookings"
        />
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          No historical trial records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(([key, rows]) => {
            const first = rows[0];
            const slotExists = rows.some((r) => r.slot_exists);
            const lifecycle = first.slot_lifecycle ?? (slotExists ? 'active' : 'retired');
            return (
              <article key={key} className="rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-semibold">
                      {first.day_name} · {first.trial_date}
                    </span>
                    <span className="font-mono text-sm">
                      {first.start_time}{' '}
                      {first.slot_duration_min ? `(${first.slot_duration_min} min)` : ''}
                    </span>
                    <SlotLifecycleBadge lifecycle={lifecycle} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} booking{rows.length === 1 ? '' : 's'}
                  </span>
                </div>

                <ul className="mt-3 divide-y">
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.email}</span>
                      </div>
                      <span
                        className={
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                          STATUS_COLORS[r.status]
                        }
                      >
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SlotLifecycleBadge({ lifecycle }: { lifecycle: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
    retired: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  };
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
        (map[lifecycle] ?? map.retired)
      }
      title={`Slot lifecycle: ${lifecycle}`}
    >
      slot: {lifecycle}
    </span>
  );
}
