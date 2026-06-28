import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BroadcastSend {
  id: string;
  email: string;
  name: string | null;
  source: string;
  campaign: string;
  sent_at: string;
  email_opened_at: string | null;
  attendance_response: string | null;
  attendance_responded_at: string | null;
}

function useBroadcastSends() {
  return useQuery<BroadcastSend[]>({
    queryKey: ['trial_invite_sends'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_invite_sends')
        .select('*')
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

const CAMPAIGN_LABELS: Record<string, string> = {
  trial_invite_may2026: 'Booking Invite (May 2026)',
  class_broadcast_sun_may3_2026: 'Broadcast — Sun May 3',
};

export default function BroadcastTrackingTable() {
  const { data: sends = [], isLoading, error } = useBroadcastSends();
  const [q, setQ] = useState('');
  const [campaign, setCampaign] = useState('all');
  const [rsvp, setRsvp] = useState<'all' | 'yes' | 'no' | 'none'>('all');

  const campaigns = useMemo(() => {
    const keys = [...new Set(sends.map((s) => s.campaign))];
    return keys;
  }, [sends]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return sends.filter((s) => {
      if (campaign !== 'all' && s.campaign !== campaign) return false;
      if (rsvp === 'yes' && s.attendance_response !== 'yes') return false;
      if (rsvp === 'no' && s.attendance_response !== 'no') return false;
      if (rsvp === 'none' && s.attendance_response !== null) return false;
      if (!needle) return true;
      return (
        s.email?.toLowerCase().includes(needle) ||
        s.name?.toLowerCase().includes(needle)
      );
    });
  }, [sends, q, campaign, rsvp]);

  // Stats for current campaign filter
  const stats = useMemo(() => {
    const pool = campaign === 'all' ? sends : sends.filter((s) => s.campaign === campaign);
    return {
      total: pool.length,
      opened: pool.filter((s) => s.email_opened_at).length,
      yes: pool.filter((s) => s.attendance_response === 'yes').length,
      no: pool.filter((s) => s.attendance_response === 'no').length,
    };
  }, [sends, campaign]);

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading broadcast data…</div>;
  if (error) return <div className="p-4 text-sm text-destructive">{(error as Error).message}</div>;

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Broadcast Emails</h2>
          <p className="text-xs text-muted-foreground">
            Track open rates and attendance confirmations for mass invite emails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email"
            className="w-48 rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label="Campaign filter"
          >
            <option value="all">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>{CAMPAIGN_LABELS[c] ?? c}</option>
            ))}
          </select>
          <select
            value={rsvp}
            onChange={(e) => setRsvp(e.target.value as typeof rsvp)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            aria-label="RSVP filter"
          >
            <option value="all">All RSVPs</option>
            <option value="yes">✅ Confirmed yes</option>
            <option value="no">❌ Declined</option>
            <option value="none">— No response</option>
          </select>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Sent', value: stats.total, color: 'text-foreground' },
          { label: 'Opened', value: `${stats.opened} (${stats.total ? Math.round((stats.opened / stats.total) * 100) : 0}%)`, color: 'text-blue-500' },
          { label: '✅ Attending', value: stats.yes, color: 'text-green-600' },
          { label: '❌ Declined', value: stats.no, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-md border bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Source</th>
              <th className="px-3 py-2 text-left font-medium">Campaign</th>
              <th className="px-3 py-2 text-center font-medium">📧 Sent</th>
              <th className="px-3 py-2 text-center font-medium">👁 Opened</th>
              <th className="px-3 py-2 text-center font-medium">✅ RSVP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{s.name || '—'}</td>
                <td className="px-3 py-2 text-xs">{s.email}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                    {s.source}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {CAMPAIGN_LABELS[s.campaign] ?? s.campaign}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {s.sent_at
                    ? <span title={s.sent_at} className="text-green-600 font-medium">✓</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {s.email_opened_at
                    ? <span title={s.email_opened_at} className="text-blue-500 font-medium">✓</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  {s.attendance_response === 'yes' && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200">
                      ✅ Yes
                    </span>
                  )}
                  {s.attendance_response === 'no' && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200">
                      ❌ No
                    </span>
                  )}
                  {!s.attendance_response && (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {sends.length} records. Refreshes every 30s.
      </p>
    </section>
  );
}
