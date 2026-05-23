import { useState } from 'react';
import { AdminTrialSlotOccurrence } from '@/types/trial-admin';
import { convertDateTimeToTimezone } from '@/lib/admin-utils';
import { getAdminTimezone } from '@/lib/viewerTimezone';
import { useUpdateSlotMeetingUrl } from '@/hooks/useTrialAdmin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X } from 'lucide-react';
import AddTrialClassDialog from './AddTrialClassDialog';

function StatusBadge({ slot }: { slot: AdminTrialSlotOccurrence }) {
  if (slot.is_full) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200">
        Full
      </span>
    );
  }
  if (slot.booked_count === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        Open
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-200">
      {slot.seats_left} seat{slot.seats_left === 1 ? '' : 's'} left
    </span>
  );
}

function MeetingUrlCell({ slot }: { slot: AdminTrialSlotOccurrence }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const update = useUpdateSlotMeetingUrl();

  const save = () => {
    update.mutate(
      { slotId: slot.slot_id, meetingUrl: draft.trim() || null },
      { onSuccess: () => setEditing(false) }
    );
  };

  if (editing) {
    return (
      <div className="flex gap-1.5 items-center">
        <Input
          className="h-7 text-xs w-48"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="https://meet.google.com/..."
          autoFocus
        />
        <button
          onClick={save}
          disabled={update.isPending}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          title="Save"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-muted text-muted-foreground"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {slot.meeting_url ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/40 dark:text-green-200">
          <Check className="h-3 w-3" /> Link set
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No link</span>
      )}
      <button
        onClick={() => { setDraft(slot.meeting_url ?? ''); setEditing(true); }}
        className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Edit link"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function UpcomingSlots({
  slots,
  compact = false,
}: {
  slots: AdminTrialSlotOccurrence[];
  compact?: boolean;
}) {
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Upcoming Trial Slots</h2>
          <p className="text-xs text-muted-foreground">
            Fixed-date classes. Past dates auto-disappear; nothing auto-generates.
          </p>
        </div>
        <AddTrialClassDialog />
      </header>

      {slots.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          No upcoming trial slots configured.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Day</th>
                <th className="px-3 py-2 text-left font-medium">Start</th>
                <th className="px-3 py-2 text-left font-medium">Duration</th>
                <th className="px-3 py-2 text-right font-medium">Capacity</th>
                <th className="px-3 py-2 text-right font-medium">Booked</th>
                <th className="px-3 py-2 text-right font-medium">Seats left</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Class Link</th>
              </tr>
            </thead>
            <tbody>
              {(compact ? slots.slice(0, 6) : slots).map((s) => {
                const adminTz = getAdminTimezone();
                const lcl = convertDateTimeToTimezone(s.occurrence_date, s.start_time, s.timezone, adminTz);
                return (
                <tr
                  key={`${s.slot_id}-${s.occurrence_date}`}
                  className="border-t hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {lcl.dateStr}
                    <div className="text-[10px] text-muted-foreground">({s.occurrence_date} src)</div>
                  </td>
                  <td className="px-3 py-2">{lcl.weekday || s.day_name}</td>
                  <td className="px-3 py-2 font-mono">
                    {lcl.timeFormatted} <span className="text-muted-foreground">({adminTz})</span>
                    <div className="text-[10px] text-muted-foreground">{s.start_time} {s.timezone}</div>
                  </td>
                  <td className="px-3 py-2">{s.duration_min} min</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.capacity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.booked_count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.seats_left}</td>
                  <td className="px-3 py-2">
                    <StatusBadge slot={s} />
                  </td>
                  <td className="px-3 py-2">
                    <MeetingUrlCell slot={s} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
