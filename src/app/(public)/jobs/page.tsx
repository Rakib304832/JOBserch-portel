"use client";

/**
 * (public)/jobs/page.tsx — the public BROWSE JOBS page (route "/jobs").
 *
 * LAYOUT
 *   [ filter sidebar ]  [ search bar
 *                          result count
 *                          job cards grid ]
 * On mobile the sidebar stacks ABOVE the results (single column), so nothing
 * is hidden on small screens.
 *
 * All filtering happens through the shared useJobSearch hook — see
 * src/hooks/use-job-search.ts for how state turns into an API call.
 */

import { JobCard } from "@/components/jobs/job-card";
import { JobFiltersSidebar } from "@/components/jobs/job-filters";
import { useJobSearch } from "@/hooks/use-job-search";
import { Input } from "@/components/ui/form";
import { SearchIcon } from "lucide-react";

export default function BrowseJobsPage() {
  // One hook = all state + fetching for this page.
  const { filters, setFilter, reset, jobs, loading, error } = useJobSearch();

  return (
    // The section gets top/bottom padding; the dark page background comes
    // from the theme tokens set on <body>.
    <section className="bg-background py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page heading */}
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Browse jobs
        </h1>
        <p className="mt-2 text-base text-zinc-400">
          {jobs ? `${jobs.length} open roles found` : "Searching…"}
        </p>

        {/* Two-column layout: sidebar (fixed width) + results (fluid) */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <JobFiltersSidebar
            filters={filters}
            onChange={setFilter}
            onReset={reset}
          />

          <div>
            {/* ---- Big search bar (also writes to the shared filter state) ---- */}
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <Input
                aria-label="Search jobs by keyword"
                placeholder="Search by job title or company name…"
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </div>

            {/* ---- Result states ---- */}
            {error && (
              <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {/* Skeleton grid while the API call is in flight */}
            {loading && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            )}

            {/* Empty result set — guide the user to loosen the filters */}
            {!loading && !error && jobs && jobs.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                <p className="text-sm font-medium text-foreground">
                  No jobs match your filters
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try removing a filter or searching for something broader.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:from-indigo-400 hover:to-violet-400"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Job cards */}
            {!loading && jobs && jobs.length > 0 && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} company={job.company} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
