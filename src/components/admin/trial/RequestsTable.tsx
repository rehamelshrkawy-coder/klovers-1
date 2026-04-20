import { useMemo, useState } from 'react';
import { AdminTrialBooking, TrialBookingStatus } from '@/types/trial-admin';

const STATUS_COLORS: Record<TrialBookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
};

const STATUS_OPTIONS: (TrialBookingStatus | 'all')[] = [
  'all',
  'pending',
  'confirmed',
  'cancelled',
  'no_show',
  'completed',
];

const BUCKET_OPTIONS = ['all', 'upcoming', 'past'] as const;
const SLOT_OPTIONS = ['all', 'active', 'retired'] as const;

export default function RequestsTable({ bookings }: { bookings: AdminTrialBooking[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(TrialBookingStatus | 'all')>('all');
  const [bucket, setBucket] = useState<(typeof BUCKET_OPTIONS)[number]>('all');
  const [slot, setSlot] = useState<(typeof SLOT_OPTIONS)[number]>('all');

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return bookings.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (bucket !== 'all' && b.time_bucket !== bucket) return false;
      if (slot === 'active' && !b.slot_exists) return false;
      if (slot === 'retired' && b.slot_exists) return false;
      if (!needle) return true;
      return (
        b.name?.toLowerCase().includes(needle) ||
        b.email?.toLowerCase().includes(needle) ||
        b.phone?.toLowerCase().includes(needle) ||
        b.level?.toLowerCase().includes(needle)
      );
    });
  }, [bookings, q, status, bucket, slot]);

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end gap-2 md:flex-nowrap md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Trial Requests</h2>
          <p className="text-xs text-muted-foreground">
            Searchable, filterable list of every trial booking (including ones
            on retired slots).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / phone"
            className="w-52 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TrialBookingStatus | 'all')}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label="Status filter"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as (typeof BUCKET_OPTIONS)[number])}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label="Date filter"
          >
            {BUCKET_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Date: {s}
              </option>
            ))}
          </select>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as (typeof SLOT_OPTIONS)[number])}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label="Slot filter"
          >
            {SLOT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                Slot: {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Student</th>
              <th className="px-3 py-2 text-left font-medium">Contact</th>
              <th className="px-3 py-2 text-left font-medium">Selected Slot</th>
              <th className="px-3 py-2 text-left font-medium">Slot State</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Phase</th>
              <th className="px-3 py-2 text-left font-medium">Requested</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2">
                  <div className="font-medium">{b.name}</div>
                  {b.level && (
                    <div className="text-xs text-muted-foreground">level: {b.level}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs">{b.email}</div>
                  {b.phone && <div className="text-xs text-muted-foreground">{b.phone}</div>}
                </td>
                <td className="px-3 py-2 font-mono">
                  {b.day_name}, {b.trial_date} · {b.start_time}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                      (b.slot_exists
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200')
                    }
                  >
                    {b.slot_exists ? `active (${b.slot_lifecycle ?? 'active'})` : 'retired'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ' +
                      STATUS_COLORS[b.status]
                    }
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {b.program_phase === 'pre_launch' ? 'pre-launch' : 'active program'}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {b.created_at ? b.created_at.replace('T', ' ').slice(0, 16) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No requests match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {bookings.length} records.
      </div>
    </section>
  );
}
