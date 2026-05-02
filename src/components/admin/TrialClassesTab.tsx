// Main entry-point for the Trial Classes tab inside the Admin Dashboard.
// Mount this as a tab alongside your other admin sections. Example:
//
//   <TabsList>
//     <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
//     <TabsTrigger value="trial">Trial Classes</TabsTrigger>
//     ...
//   </TabsList>
//   <TabsContent value="trial"><TrialClassesTab /></TabsContent>

import { useMemo, useState } from 'react';
import {
  useTrialBookings,
  useUpcomingTrialSlots,
  useTrialSuggestions,
  useTrialSettings,
  computeOverview,
  splitBookingsByBucket,
} from '@/hooks/useTrialAdmin';
import OverviewCards from './trial/OverviewCards';
import UpcomingSlots from './trial/UpcomingSlots';
import HistoricalBookings from './trial/HistoricalBookings';
import RequestsTable from './trial/RequestsTable';
import SuggestedSlots from './trial/SuggestedSlots';
import TrialSettingsPanel from './trial/TrialSettings';
import BroadcastTrackingTable from './trial/BroadcastTrackingTable';

type SubTab =
  | 'overview'
  | 'upcoming'
  | 'requests'
  | 'historical'
  | 'suggestions'
  | 'settings'
  | 'broadcasts';

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'upcoming', label: 'Upcoming Trial Slots' },
  { key: 'requests', label: 'Trial Requests / Bookings' },
  { key: 'historical', label: 'Previous Trial Classes' },
  { key: 'suggestions', label: 'Suggested New Slots' },
  { key: 'settings', label: 'Trial Settings' },
  { key: 'broadcasts', label: '📣 Broadcasts' },
];

export default function TrialClassesTab() {
  const [sub, setSub] = useState<SubTab>('overview');

  const bookingsQ = useTrialBookings();
  const slotsQ = useUpcomingTrialSlots();
  const sugQ = useTrialSuggestions();
  const settingsQ = useTrialSettings();

  const bookings = bookingsQ.data ?? [];
  const slots = slotsQ.data ?? [];
  const suggestions = sugQ.data ?? [];
  const settings = settingsQ.data ?? null;

  const overview = useMemo(
    () => computeOverview(bookings, slots, suggestions),
    [bookings, slots, suggestions]
  );

  const { historical } = useMemo(() => splitBookingsByBucket(bookings), [bookings]);

  const isLoading =
    bookingsQ.isLoading || slotsQ.isLoading || sugQ.isLoading || settingsQ.isLoading;
  const error =
    bookingsQ.error || slotsQ.error || sugQ.error || settingsQ.error;

  return (
    <section className="w-full space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trial Classes</h1>
          <p className="text-sm text-muted-foreground">
            Manage trial slots, bookings, and schedule recommendations.
          </p>
        </div>
        {!settings?.program_start_date && (
          <div className="rounded-md border border-amber-400/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Trial program official start date is not set yet.
          </div>
        )}
      </header>

      {/* Sub-tab navigation */}
      <nav
        aria-label="Trial classes sections"
        className="flex flex-wrap gap-1 overflow-x-auto border-b"
      >
        {SUBTABS.map((t) => {
          const active = sub === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSub(t.key)}
              className={
                'whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ' +
                (active
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground')
              }
              aria-current={active ? 'page' : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          Loading trial data…
        </div>
      ) : (
        <>
          {sub === 'overview' && (
            <div className="space-y-6">
              <OverviewCards metrics={overview} />
              <UpcomingSlots slots={slots} compact />
              <SuggestedSlots suggestions={suggestions} compact />
            </div>
          )}
          {sub === 'upcoming' && <UpcomingSlots slots={slots} />}
          {sub === 'requests' && <RequestsTable bookings={bookings} />}
          {sub === 'historical' && <HistoricalBookings bookings={historical} />}
          {sub === 'suggestions' && (
            <SuggestedSlots suggestions={suggestions} fullSlotsCount={overview.fullSlots} />
          )}
          {sub === 'settings' && <TrialSettingsPanel settings={settings} />}
          {sub === 'broadcasts' && <BroadcastTrackingTable />}
        </>
      )}
    </section>
  );
}
