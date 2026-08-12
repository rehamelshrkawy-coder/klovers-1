import { useEffect, useState } from 'react';
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
import { Plus, Loader2, Pencil } from 'lucide-react';
import { useUpdateTrialSlot } from '@/hooks/useTrialAdmin';
import { TrialSlotRow } from '@/types/trial-admin';

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
  minToRun: string; // empty string = "use global default"
  timezone: string;
  classLanguage: 'arabic' | 'english';
  sessionPeriod: 'morning' | 'evening' | 'daytime';
  meetingUrl: string;
};

const defaultForm = (): Form => ({
  trialDate: '',
  startTime: '17:30',
  durationMin: 30,
  capacity: 15,
  minToRun: '',
  timezone: 'Asia/Ho_Chi_Minh',
  classLanguage: 'arabic',
  sessionPeriod: 'morning',
  meetingUrl: '',
});

const formFromSlot = (s: TrialSlotRow): Form => ({
  trialDate: s.trial_date ?? '',
  startTime: s.start_time,
  durationMin: s.duration_min,
  capacity: s.capacity,
  minToRun: s.min_to_run != null ? String(s.min_to_run) : '',
  timezone: s.timezone,
  classLanguage: s.class_language ?? 'arabic',
  sessionPeriod: s.session_period ?? 'morning',
  meetingUrl: s.meeting_url ?? '',
});

/**
 * Admin dialog to create a one-off dated trial class, or (when `editingSlot`
 * is supplied) edit an existing one. Fixed date — no recurrence; recurrence
 * is handled separately by advance_trial_slots() rolling trial_date forward.
 */
export default function AddTrialClassDialog({
  editingSlot,
  onDoneEditing,
}: {
  editingSlot?: TrialSlotRow | null;
  onDoneEditing?: () => void;
}) {
  const isEditMode = !!editingSlot;
  const [open, setOpen] = useState(isEditMode);
  const [form, setForm] = useState<Form>(() => (editingSlot ? formFromSlot(editingSlot) : defaultForm()));
  const qc = useQueryClient();
  const updateSlot = useUpdateTrialSlot();

  useEffect(() => {
    if (editingSlot) {
      setForm(formFromSlot(editingSlot));
      setOpen(true);
    }
  }, [editingSlot]);

  const dayOfWeekFromDate = (iso: string): number => {
    if (!iso) return 0;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  const close = () => {
    setOpen(false);
    if (isEditMode) onDoneEditing?.();
  };

  const validate = (f: Form) => {
    if (!f.trialDate) throw new Error('Pick a date');
    if (!isEditMode && f.trialDate < todayIso) throw new Error('Date must be today or later');
    if (!/^\d{2}:\d{2}$/.test(f.startTime)) throw new Error('Use HH:MM time');
    if (f.durationMin <= 0) throw new Error('Duration must be > 0');
    if (f.capacity <= 0) throw new Error('Capacity must be > 0');
    if (f.minToRun && Number(f.minToRun) <= 0) throw new Error('Minimum to run must be > 0');
  };

  const createSlot = useMutation({
    mutationFn: async (f: Form) => {
      validate(f);
      const { data, error } = await supabase
        .from('trial_slots')
        .insert({
          day_of_week: dayOfWeekFromDate(f.trialDate),
          start_time: f.startTime,
          duration_min: f.durationMin,
          timezone: f.timezone,
          capacity: f.capacity,
          min_to_run: f.minToRun ? Number(f.minToRun) : null,
          class_language: f.classLanguage,
          session_period: f.sessionPeriod,
          is_active: true,
          lifecycle: 'active',
          trial_date: f.trialDate,
          meeting_url: f.meetingUrl.trim() || null,
        })
        .select('id, trial_date, start_time, day_of_week')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      toast({ title: 'Trial class added', description: `${row.trial_date} · ${row.start_time}` });
      qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
      qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
      qc.invalidateQueries({ queryKey: KEYS.suggestions });
      setForm(defaultForm());
      setOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: 'Could not add trial class', description: e.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    try {
      validate(form);
    } catch (e) {
      toast({ title: 'Invalid form', description: (e as Error).message, variant: 'destructive' });
      return;
    }
    if (isEditMode && editingSlot) {
      updateSlot.mutate(
        {
          slotId: editingSlot.id,
          trialDate: form.trialDate,
          startTime: form.startTime,
          durationMin: form.durationMin,
          capacity: form.capacity,
          minToRun: form.minToRun ? Number(form.minToRun) : null,
          classLanguage: form.classLanguage,
          sessionPeriod: form.sessionPeriod,
          timezone: form.timezone,
          meetingUrl: form.meetingUrl.trim() || null,
        },
        {
          onSuccess: () => {
            toast({ title: 'Trial class updated' });
            close();
          },
          onError: (e: Error) => toast({ title: 'Could not update trial class', description: e.message, variant: 'destructive' }),
        }
      );
    } else {
      createSlot.mutate(form);
    }
  };

  const isPending = isEditMode ? updateSlot.isPending : createSlot.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else setOpen(true); }}>
      {!isEditMode && (
        <Button type="button" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add trial class
        </Button>
      )}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit trial class' : 'Add a one-off trial class'}</DialogTitle>
          <DialogDescription>
            Fixed date — no recurrence. Students will see this in the booking page and admins in the upcoming slots table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="trial-date">Date</Label>
            <Input
              id="trial-date"
              type="date"
              min={isEditMode ? undefined : todayIso}
              value={form.trialDate}
              onChange={(e) => setForm({ ...form, trialDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trial-time">Start time (24h)</Label>
              <Input
                id="trial-time"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
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
                onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trial-language">Language</Label>
              <select
                id="trial-language"
                value={form.classLanguage}
                onChange={(e) => setForm({ ...form, classLanguage: e.target.value as Form['classLanguage'] })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="arabic">Arabic</option>
                <option value="english">English</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trial-period">Time of day</Label>
              <select
                id="trial-period"
                value={form.sessionPeriod}
                onChange={(e) => setForm({ ...form, sessionPeriod: e.target.value as Form['sessionPeriod'] })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="morning">Morning</option>
                <option value="daytime">Daytime</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trial-capacity">Max capacity</Label>
              <Input
                id="trial-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trial-min-to-run">Min. to run</Label>
              <Input
                id="trial-min-to-run"
                type="number"
                min={1}
                placeholder="Uses global default"
                value={form.minToRun}
                onChange={(e) => setForm({ ...form, minToRun: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trial-tz">Timezone</Label>
            <Input
              id="trial-tz"
              type="text"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="Asia/Ho_Chi_Minh"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trial-meeting-url">Meet / Zoom Link (optional)</Label>
            <Input
              id="trial-meeting-url"
              type="url"
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
            <p className="text-xs text-muted-foreground">
              Shown as a "Join the Class" button in the booking confirmation email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending || !form.trialDate} className="gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {!isPending && isEditMode && <Pencil className="h-3.5 w-3.5" />}
            {isEditMode ? 'Save changes' : 'Add trial class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
