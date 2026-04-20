import { TrialOverviewMetrics } from '@/hooks/useTrialAdmin';

const CARDS: {
  key: keyof TrialOverviewMetrics;
  label: string;
  hint?: string;
}[] = [
  { key: 'totalRequests', label: 'Total Trial Requests' },
  { key: 'upcomingActiveSlots', label: 'Active Upcoming Slots' },
  { key: 'fullSlots', label: 'Full Slots', hint: 'Slots at capacity' },
  { key: 'historicalRecords', label: 'Historical Records' },
  { key: 'waitingStudents', label: 'Waiting Students', hint: 'Pending on active slots' },
  { key: 'suggestedSlotsCount', label: 'Suggested New Slots' },
];

export default function OverviewCards({ metrics }: { metrics: TrialOverviewMetrics }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="rounded-lg border bg-card p-4 shadow-sm"
          role="group"
          aria-label={c.label}
        >
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {metrics[c.key]}
          </div>
          {c.hint && (
            <div className="mt-1 text-[11px] text-muted-foreground">{c.hint}</div>
          )}
        </div>
      ))}
    </section>
  );
}
