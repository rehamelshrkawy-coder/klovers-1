import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

const KEYS = {
  upcomingSlots: ['trial-admin', 'upcoming-slots'] as const,
  slotsRaw: ['trial-admin', 'slots-raw'] as const,
  suggestions: ['trial-admin', 'suggestions'] as const,
};

type Form = {
  trialDate: string;
  startTime: string;
  durationMin: number;
  capacity: number;
  timezone: string;
};

const defaultForm = (): Form => ({
  trialDate: '',
  startTime: '17:30',
  durationMin: 30,
  capacity: 15,
  timezone: 'Africa/Cairo',
});

/**
 * Admin-only dialog to insert a one-off fixed-date trial class.
 * No projection / no recurrence â exactly one slot is created with the
 * supplied trial_date. Show only future dates.
 */
export default function AddTrialClassDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(defaultForm);
  const qc = useQueryClient();

  const dayOfWeekFromDate = (iso: string): number => {
    if (!iso) return 0;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  const createSlot = useMutation({
    mutationFn: async (f: Form) => {
      if (!f.trialDate) throw new Error('Pick a date');
      if (f.trialDate < todayIso) throw new Error('Date must be today or later');
      if (!/^\d{2}:\d{2}$/.test(f.startTime)) throw new Error('Use HH:MM time');
      if (f.durationMin <= 0) throw new Error('Duration must be > 0');
      if (f.capacity <= 0) throw new Error('Capacity must be > 0');

      const { data, error } = await supabase
        .from('trial_slots')
        .insert({
          day_of_week: dayOfWeekFromDate(f.trialDate),
          start_time: f.startTime,
          duration_min: f.durationMin,
          timezone: f.timezone,
          capacity: f.capacity,
          is_active: true,
          lifecycle: 'active',
          trial_date: f.trialDate,
        })
        .select('id, trial_date, start_time, day_of_week')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      toast({
        title: 'Trial class added',
        description: `${row.trial_date} Â· ${row.start_time}`,
      });
      qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
      qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
      qc.invalidateQueries({ queryKey: KEYS.suggestions });
      setForm(defaultForm());
      setOpen(false);
    },
    onError: (e: Error) => {
      toast({
        title: 'Could not add trial class',
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add trial class
      </Button>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a one-off trial class</DialogTitle>
          <DialogDescription>
            Fixed date â no recurrence. Students will see this date in the
            booking page and admins in the upcoming slots table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="trial-date">Date</Label>
            <Input
              id="trial-date"
              type="date"
              min={todayIso}
              value={form.trialDate}
              onChange={(e) =>
                setForm({ ...form, trialDate: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trial-time">Start time (24h)</Label>
              <Input
                id="trial-time"
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trial-duration">Duration (min)</Label>
              <Input
                id="trial-duration"
                type="number"
                min={5}
                step={5}
                value={form.durationMin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMin: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trial-capacity">Capacity</Label>
              <Input
                id="trial-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trial-tz">Timezone</Label>
              <Input
                id="trial-tz"
                type="text"
                value={form.timezone}
                onChange={(e) =>
                  setForm({ ...form, timezone: e.target.value })
                }
                placeholder="Africa/Cairo"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createSlot.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => createSlot.mutate(form)}
            disabled={createSlot.isPending || !form.trialDate}
            className="gap-1.5"
          >
            {createSlot.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Add trial class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
