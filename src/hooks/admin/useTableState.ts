import { useEffect, useMemo, useState } from "react";

export interface UseTableStateOptions<T> {
  /** Raw rows — the hook filters + paginates them. */
  rows: T[];
  /** Fields whose string values are searched (case-insensitive, trimmed). */
  searchFields: (keyof T | ((row: T) => string | null | undefined))[];
  /** Rows per page. Default: 25. */
  pageSize?: number;
  /** Debounce for search input, in ms. Default: 250. */
  searchDebounceMs?: number;
  /** Extra dependency that, when changed, resets page to 0 (e.g. a filter). */
  resetPageOn?: unknown;
}

export interface UseTableStateResult<T> {
  search: string;
  setSearch: (v: string) => void;
  /** Debounced value actually used for filtering. */
  debouncedSearch: string;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  filtered: T[];
  paged: T[];
  totalPages: number;
  total: number;
}

/**
 * Debounced search + paginated slicing for admin tables.
 * Replaces the ad-hoc pattern of `useState("")` + manual filter + manual
 * `Math.ceil(filtered.length / PAGE_SIZE)` spread across each tab.
 */
export function useTableState<T>({
  rows,
  searchFields,
  pageSize = 25,
  searchDebounceMs = 250,
  resetPageOn,
}: UseTableStateOptions<T>): UseTableStateResult<T> {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), searchDebounceMs);
    return () => window.clearTimeout(t);
  }, [search, searchDebounceMs]);

  // Reset to first page whenever the search or external filter changes.
  useEffect(() => { setPage(0); }, [debouncedSearch, resetPageOn]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return rows;
    return rows.filter(row =>
      searchFields.some(field => {
        const raw = typeof field === "function" ? field(row) : (row[field] as unknown);
        if (raw == null) return false;
        return String(raw).toLowerCase().includes(debouncedSearch);
      })
    );
  }, [rows, debouncedSearch, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [filtered, safePage, pageSize]
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    page: safePage,
    setPage,
    pageSize,
    filtered,
    paged,
    totalPages,
    total: filtered.length,
  };
}
