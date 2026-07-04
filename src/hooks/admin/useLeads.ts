import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lead, OverviewRow } from "@/types/admin";

interface UseLeadsOptions {
  /** Overview rows used to auto-derive lead status (enrolled/contacted). */
  overviewByEmail?: Record<string, OverviewRow>;
}

/**
 * Fetches CRM leads with optional status enrichment from the student overview.
 * The enrichment is a pure transform — no extra network call.
 */
export function useLeads({ overviewByEmail }: UseLeadsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, phone, status, source, created_at, notes, country")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
    staleTime: 2 * 60 * 1000,
    select: (leads) => {
      if (!overviewByEmail) return leads;
      return leads.map((lead) => {
        const ov = overviewByEmail[lead.email?.toLowerCase()];
        if (!ov) return lead;
        let autoStatus = lead.status;
        if (["ACTIVE", "COMPLETED", "LOCKED"].includes(String(ov.derived_status))) {
          autoStatus = "enrolled";
        } else if (ov.enrollment_id) {
          autoStatus = "contacted";
        }
        return { ...lead, status: autoStatus };
      });
    },
  });
}
