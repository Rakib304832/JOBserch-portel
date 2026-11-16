"use client";

/**
 * ============================================================================
 * components/jobs/JobsBrowse.tsx — the interactive body of /jobs
 * ============================================================================
 *
 * The page file (app/(public)/jobs/page.tsx) only renders a Suspense shell
 * around this component, because this file reads `useSearchParams()` (the hero
 * search bar sends ?q=…&location=… here) and useSearchParams requires a
 * Suspense boundary during prerendering.
 *
 * HOW THE DATA FLOWS
 *   filters change
 *     → debounce 300 ms (typing should not fire a request per keystroke)
 *     → GET /api/jobs?q=…&category=…&location=…&minSalary=…
 *     → keep the response in state
 *     → apply multi-select type filter + sorting + pagination on the client
 *
 * WHY MULTI-SELECT TYPES ARE FILTERED HERE
 * The API accepts one `type` per request. Fetching the (already small)
 * filtered catalogue once and checking `job.type` against the selected list
 * keeps the checkbox UI instant and avoids request-per-checkbox.
 * ============================================================================
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Search } from "lucide-react";

import { Input, Select } from "@/components/ui/Field";
import { JobCard } from "@/components/jobs/JobCard";
import {
  EMPTY_JOB_FILTERS,
  JobFilters,
  type JobFilterValue,
} from "@/components/jobs/JobFilters";
import { Pagination } from "@/components/jobs/Pagination";
import { apiFetch } from "@/lib/api-client";
import { JOBS_PER_PAGE, JOB_SORT_OPTIONS } from "@/lib/data";
import type { JobWithCompany } from "@/lib/api-types";

/** The API answers with { jobs: JobWithCompany[] }. */
interface JobsResponse {
  jobs: JobWithCompany[];
}

export function JobsBrowse() {
  // Read the hero's pre-applied search once, for the first render.
  const searchParams = useSearchParams();

  // ---- the complete filter state ----
  const [filters, setFilters] = React.useState<JobFilterValue>(() => ({
    ...EMPTY_JOB_FILTERS,
    // The hero may have sent these two.
    q: searchParams.get("q") ?? "",
    location: searchParams.get("location") ?? "",
  }));

  // ---- results and request status ----
  const [jobs, setJobs] = React.useState<JobWithCompany[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ---- view controls ----
  const [page, setPage] = React.useState(1); // 1-based page number
  const [sort, setSort] = React.useState<"recent" | "salary">("recent");

  /**
   * Merge a partial change into the filters and jump back to page 1
   * (staying on page 4 of a new result set would usually be empty).
   */
  function setFilter(patch: Partial<JobFilterValue>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  /** Clear every filter. */
  function resetFilters() {
    setFilters(EMPTY_JOB_FILTERS);
    setPage(1);
  }

  /* ------------------------------------------------------------------------ */
  /*  Fetch whenever the filters change (debounced)                           */
  /* ------------------------------------------------------------------------ */
  React.useEffect(() => {
    // Prevents a slow older response from overwriting a newer one.
    let cancelled = false;

    const timer = setTimeout(async () => {
      // Skeleton on, then request. (State updates are legal here because this
      // runs in an async callback, not synchronously during the effect.)
      setLoading(true);
      // Only send the params that are actually set.
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.category) params.set("category", filters.category);
      if (filters.location) params.set("location", filters.location);
      if (filters.minSalary > 0) params.set("minSalary", String(filters.minSalary));

      try {
        const data = await apiFetch<JobsResponse>(
          `/api/jobs${params.size ? `?${params.toString()}` : ""}`
        );

        // Ignore a response that arrived after the filters moved on.
        if (cancelled) return;

        setJobs(data.jobs);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Could not load jobs.");
      } finally {
        // Only the newest request may clear the loading flag.
        if (!cancelled) setLoading(false);
      }
    }, 300); // 300 ms debounce

    return () => {
      cancelled = true; // mark this run as stale
      clearTimeout(timer); // cancel the pending request
    };
  }, [filters]);

  /* ------------------------------------------------------------------------ */
  /*  Derived lists (no extra state → they cannot drift out of sync)          */
  /* ------------------------------------------------------------------------ */

  // 1) Apply the multi-select job types.
  const typeFiltered = React.useMemo(() => {
    if (!jobs) return [];
    if (filters.types.length === 0) return jobs;
    return jobs.filter((job) => filters.types.includes(job.type));
  }, [jobs, filters.types]);

  // 2) Sort them (newest first, or biggest salary first).
  const sorted = React.useMemo(() => {
    const copy = [...typeFiltered];
    if (sort === "salary") {
      copy.sort((a, b) => b.salaryMax - a.salaryMax);
    } else {
      copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return copy;
  }, [typeFiltered, sort]);

  // 3) Page slice for the grid.
  const totalPages = Math.max(1, Math.ceil(sorted.length / JOBS_PER_PAGE));
  // A filter can shrink the result set while the visitor is on page 4. Clamp
  // the page for RENDERING instead of writing state from an effect (which
  // React flags as a cascading render); `page` corrects itself on the next
  // click because Pagination receives `currentPage`.
  const currentPage = Math.min(page, totalPages);
  const pageJobs = sorted.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  // 4) Counts beside each job-type checkbox (from the unfiltered result set).
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of jobs ?? []) {
      counts[job.type] = (counts[job.type] ?? 0) + 1;
    }
    return counts;
  }, [jobs]);

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */
  return (
    <section className="bg-background py-10" aria-label="Browse jobs">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Page heading ---- */}
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Browse jobs
        </h1>
        <p className="mt-2 text-base text-zinc-400">
          {/* The screenshot's "Found 1,248 Professional Jobs" line. */}
          {jobs ? `Found ${sorted.length} professional jobs` : "Searching…"}
        </p>

        {/* ---- Keyword search bar (top of the results column) ---- */}
        <div className="relative mt-6">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          />
          <Input
            aria-label="Search jobs by keyword"
            placeholder="Search by job title or company name…"
            value={filters.q}
            onChange={(event) => setFilter({ q: event.target.value })}
            className="h-12 pl-12 text-base"
          />
        </div>

        {/* ---- Sidebar + results ---- */}
        {/*
         * Breakpoints, in order:
         *   base (<768px)  → one column: filters stack ABOVE the results
         *   md  (≥768px)   → narrow filter rail + results side by side
         *   lg  (≥1024px)  → the rail widens to its designed 280px
         * Without the md step a 768–1023px tablet wastes the whole width on a
         * single column, which is what the first build did.
         */}
        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          <JobFilters
            value={filters}
            onChange={setFilter}
            onReset={resetFilters}
            typeCounts={typeCounts}
          />

          <div>
            {/* ---- Result toolbar: count + sort ---- */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                {filters.location ? `Location: ${filters.location}` : "All locations"}
              </p>

              <label className="flex items-center gap-2 text-xs text-zinc-400">
                Sort by
                <Select
                  aria-label="Sort jobs"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as "recent" | "salary");
                    setPage(1);
                  }}
                  className="h-9 w-auto py-0 text-xs"
                >
                  {JOB_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {/* ---- Error ---- */}
            {error && (
              <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {/* ---- Loading skeletons ---- */}
            {loading && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-56 animate-pulse rounded-2xl bg-white/5"
                  />
                ))}
              </div>
            )}

            {/* ---- Empty result ---- */}
            {!loading && !error && pageJobs.length === 0 && (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
                <p className="text-sm font-medium text-white">No jobs match your filters</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Try removing a filter or searching for something broader.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:from-indigo-400 hover:to-violet-400"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* ---- Cards ---- */}
            {!loading && pageJobs.length > 0 && (
              <>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {pageJobs.map((job) => (
                    <JobCard key={job.id} job={job} company={job.company} />
                  ))}
                </div>

                {/* ---- Pages ---- */}
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(next) => {
                    setPage(next);
                    // Scroll back to the top of the results, not the page top.
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
