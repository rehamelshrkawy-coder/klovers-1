import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enrollment } from "@/types/admin";
import type { ProfileEntry } from "./useProfiles";

interface UseEnrollmentsOptions {
  /** Profile map for enriching enrollments with name/email/level. */
  profileMap?: Record<string, ProfileEntry>;
}

/**
 * Fetches enrollments with optional profile enrichment.
 */
export function useEnrollments({ profileMap }: UseEnrollmentsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          "id, user_id, plan_type, duration, classes_included, amount, unit_price, tx_ref, receipt_url, status, payment_status, approval_status, payment_provider, admin_review_required, sessions_remaining, created_at, currency, due_at, payment_date, payment_method, preferred_days, preferred_day, preferred_time, timezone, level, package_id, enrollment_status, sessions_total, negative_since, matched_at, approval_email_sent_at, payment_email_sent_at, class_link_sent_at, first_class_date, forming_escalation_sent_at, rejection_followup_sent_at, pre_class_reminder_sent_at, class_feedback_sent_at"
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
    staleTime: 2 * 60 * 1000,
    select: (enrollments) => {
      if (!profileMap) return enrollments;
      return enrollments.map((e) => ({
        ...e,
        profiles: profileMap[e.user_id]
          ? { name: profileMap[e.user_id].name, email: profileMap[e.user_id].email, level: profileMap[e.user_id].level ?? undefined }
          : e.profiles,
      }));
    },
  });
}
