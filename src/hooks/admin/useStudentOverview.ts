import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OverviewRow } from "@/types/admin";
export { buildOverviewByEmail } from "@/lib/overview-utils";

const PAGE_SIZE = 500;

/**
 * Fetches the admin_student_overview view using cursor-based pagination.
 * Fetches in batches of 500, accumulating all pages until exhausted.
 * This removes the previous hard 2000-row ceiling and scales to any dataset size.
 */
async function fetchAllOverviewRows(): Promise<OverviewRow[]> {
  const allRows: OverviewRow[] = [];
  let cursor: string | null = null;

  while (true) {
    let query = supabase
      .from("admin_student_overview")
      .select("*")
      .order("joined_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt("joined_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as OverviewRow[]));

    if (data.length < PAGE_SIZE) break;
    cursor = data[data.length - 1].joined_at as string;
  }

  return allRows;
}

export function useStudentOverview() {
  return useQuery({
    queryKey: ["admin", "student-overview"],
    queryFn: fetchAllOverviewRows,
    staleTime: 2 * 60 * 1000,
  });
}

