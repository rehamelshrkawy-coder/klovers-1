// Single React Query hook bundle that powers the Trial Classes admin tab.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AdminTrialBooking,
  AdminTrialSlotOccurrence,
  TrialSettings,
  TrialSlotRow,
  TrialSlotSuggestion,
} from '@/types/trial-admin';

const KEYS = {
  bookings: ['trial-admin', 'bookings'] as const,
  upcomingSlots: ['trial-admin', 'upcoming-slots'] as const,
  slotsRaw: ['trial-admin', 'slots-raw'] as const,
  suggestions: ['trial-admin', 'suggestions'] as const,
  settings: ['trial-admin', 'settings'] as const,
};

const isMissingAuditColumn = (error: { code?: string; message?: string } | null) =>
  error?.code === '42703' || /changed_at|cancelled_at|cancel_reason/i.test(error?.message || '');

// --- Queries ---------------------------------------------------------------

export function useTrialBookings() {
  return useQuery<AdminTrialBooking[]>({
    queryKey: KEYS.bookings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_trial_bookings_admin')
        .select('*')
        .order('trial_date', { ascending: false })
        .order('start_time', { ascending: true });
      if (error) throw error;
      const bookings = (data ?? []) as AdminTrialBooking[];
      const ids = bookings.map((b) => b.id);
      if (ids.length === 0) return bookings;

      const { data: auditRows, error: auditError } = await supabase
        .from('trial_bookings')
        .select('id, changed_at, cancelled_at, cancel_reason')
        .in('id', ids);
      if (auditError) {
        if (!isMissingAuditColumn(auditError)) throw auditError;
        return bookings.map((booking) => ({
          ...booking,
          changed_at: booking.changed_at ?? null,
          cancelled_at: booking.cancelled_at ?? null,
          cancel_reason: booking.cancel_reason ?? null,
        }));
      }

      const auditById = new Map(
        ((auditRows ?? []) as Pick<AdminTrialBooking, 'id' | 'changed_at' | 'cancelled_at' | 'cancel_reason'>[])
          .map((row) => [row.id, row])
      );

      return bookings.map((booking) => ({
        ...booking,
        changed_at: auditById.get(booking.id)?.changed_at ?? booking.changed_at ?? null,
        cancelled_at: auditById.get(booking.id)?.cancelled_at ?? booking.cancelled_at ?? null,
        cancel_reason: auditById.get(booking.id)?.cancel_reason ?? booking.cancel_reason ?? null,
      }));
    },
  });
}

export function useUpcomingTrialSlots() {
  return useQuery<AdminTrialSlotOccurrence[]>({
    queryKey: KEYS.upcomingSlots,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_trial_slots_admin')
        .select('*')
        .order('occurrence_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AdminTrialSlotOccurrence[];
    },
  });
}

export function useAllTrialSlots() {
  return useQuery<TrialSlotRow[]>({
    queryKey: KEYS.slotsRaw,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_slots')
        .select('*')
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return (data ?? []) as unknown as TrialSlotRow[];
    },
  });
}

export function useTrialSuggestions() {
  return useQuery<TrialSlotSuggestion[]>({
    queryKey: KEYS.suggestions,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_suggest_trial_slots');
      if (error) throw error;
      return (data as TrialSlotSuggestion[]) ?? [];
    },
  });
}

export function useTrialSettings() {
  return useQuery<TrialSettings | null>({
    queryKey: KEYS.settings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// --- Mutations -------------------------------------------------------------

export function useSetProgramStartDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string | null) => {
      const { data, error } = await supabase.rpc(
        'fn_set_trial_program_start_date',
        { p_date: date }
      );
      if (error) throw error;
      return data as TrialSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.settings });
      qc.invalidateQueries({ queryKey: KEYS.bookings });
    },
  });
}

export function useRetireTrialSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      slotId: string;
      lifecycle: 'active' | 'archived' | 'retired';
    }) => {
      const { data, error } = await supabase.rpc('fn_retire_trial_slot', {
        p_slot_id: args.slotId,
        p_new_lifecycle: args.lifecycle,
      });
      if (error) throw error;
      return data as TrialSlotRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
      qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
      qc.invalidateQueries({ queryKey: KEYS.suggestions });
    },
  });
}

export function useCreateTrialSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      day_of_week: number;
      start_time: string;
      duration_min?: number;
      capacity?: number;
      timezone?: string;
    }) => {
      const { data, error } = await supabase.rpc('fn_create_trial_slot', {
        p_day_of_week: args.day_of_week,
        p_start_time: args.start_time,
        p_duration_min: args.duration_min ?? null,
        p_capacity: args.capacity ?? 8,
        p_timezone: args.timezone ?? 'Africa/Cairo',
      });
      if (error) throw error;
      return data as TrialSlotRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
      qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
      qc.invalidateQueries({ queryKey: KEYS.suggestions });
    },
  });
}

export function useUpdateSlotMeetingUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slotId, meetingUrl }: { slotId: string; meetingUrl: string | null }) => {
      const { error } = await supabase
        .from('trial_slots')
        .update({ meeting_url: meetingUrl })
        .eq('id', slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
      qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
    },
  });
}

// --- Client-side derivations ----------------------------------------------

export function splitBookingsByBucket(bookings: AdminTrialBooking[]) {
  const upcoming: AdminTrialBooking[] = [];
  const historical: AdminTrialBooking[] = [];
  for (const b of bookings) {
    if (b.time_bucket === 'upcoming' && b.slot_exists) upcoming.push(b);
    else historical.push(b);
  }
  return { upcoming, historical };
}

export interface TrialOverviewMetrics {
  totalRequests: number;
  upcomingActiveSlots: number;
  fullSlots: number;
  historicalRecords: number;
  waitingStudents: number;
  suggestedSlotsCount: number;
}

export function computeOverview(
  bookings: AdminTrialBooking[],
  slots: AdminTrialSlotOccurrence[],
  suggestions: TrialSlotSuggestion[]
): TrialOverviewMetrics {
  const upcomingSlotIds = new Set(slots.map((s) => s.slot_id));
  const fullSlots = slots.filter((s) => s.is_full).length;
  const historicalRecords = bookings.filter(
    (b) => b.time_bucket === 'past' || !b.slot_exists
  ).length;
  const waitingStudents = bookings.filter(
    (b) => b.status === 'pending' && b.time_bucket === 'upcoming' && b.slot_exists
  ).length;
  return {
    totalRequests: bookings.length,
    upcomingActiveSlots: upcomingSlotIds.size,
    fullSlots,
    historicalRecords,
    waitingStudents,
    suggestedSlotsCount: suggestions.length,
  };
}
