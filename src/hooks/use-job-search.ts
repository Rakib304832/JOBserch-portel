"use client";

/**
 * use-job-search.ts — the shared "search + filter jobs" logic.
 *
 * Both job-browsing screens (the public /jobs page AND the seeker
 * dashboard's Browse & Apply) need exactly the same machinery:
 *   • keep the current filter values in state
 *   • turn them into a query string
 *   • call GET /api/jobs whenever a filter changes
 *   • expose { jobs, loading, error } for rendering
 *
 * Extracting it into a HOOK means both pages share one implementation.
 * A custom hook is just a function whose name starts with "use" that can
 * call other hooks (useState, useEffect…) — React allows that only inside
 * components or other hooks.
 */

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { JobWithStatus } from "@/lib/api-types";

/** The four filters + the keyword search, as one flat object. */
export interface JobFilters {
  q: string; // keyword
  type: string; // "" = any
  category: string; // "" = any
  location: string; // "" = any
  minSalary: string; // "" = any; otherwise a number as a string
}

const EMPTY: JobFilters = { q: "", type: "", category: "", location: "", minSalary: "" };

export function useJobSearch(initial?: Partial<JobFilters>) {
  const [filters, setFilters] = useState<JobFilters>({ ...EMPTY, ...initial });
  const [jobs, setJobs] = useState<JobWithStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Update ONE filter key without touching the others. */
  const setFilter = useCallback((key: keyof JobFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Reset everything back to "show me all jobs". */
  const reset = useCallback(() => setFilters({ ...EMPTY }), []);

  /**
   * Fetch jobs for the CURRENT filters.
   * useCallback keeps the function stable between renders so the effect
   * below doesn't re-run for the wrong reasons.
   */
  const search = useCallback(async (current: JobFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Build "?q=react&type=Remote…" — skipping empty filters keeps the
      // URL tidy and the API fast.
      const params = new URLSearchParams();
      if (current.q) params.set("q", current.q);
      if (current.type) params.set("type", current.type);
      if (current.category) params.set("category", current.category);
      if (current.location) params.set("location", current.location);
      if (current.minSalary) params.set("minSalary", current.minSalary);

      const res = await apiFetch<{ jobs: JobWithStatus[] }>(
        `/api/jobs?${params.toString()}`
      );
      setJobs(res.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-run the search whenever any filter value changes.
  // JSON.stringify gives a cheap "did the object really change?" comparison.
  useEffect(() => {
    void search(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { filters, setFilter, reset, jobs, loading, error };
}
