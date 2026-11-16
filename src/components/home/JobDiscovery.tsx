/**
 * ============================================================================
 * components/home/JobDiscovery.tsx — the "Smart job discovery" section
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR
 *   Label     "Smart job discovery"
 *   Heading   "The roles you'd never find by searching"
 *   Content   six JobCards (2 rows × 3) + "View all job open" button
 *
 * DATA
 * The home page fetches /api/jobs?featured=true and passes the rows in. If the
 * request is still running we paint skeleton tiles; if there are no featured
 * jobs we show a calm empty message instead of an empty grid.
 * ============================================================================
 */

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { JobCard } from "@/components/jobs/JobCard";
import type { JobWithCompany } from "@/lib/api-types";

/** Props: the featured jobs (null = loading) + an optional error message. */
export function JobDiscovery({
  jobs,
  error,
}: {
  jobs: JobWithCompany[] | null; // null while the API call is in flight
  error?: string | null; // shown if the request failed
}) {
  return (
    <section className="bg-background py-20" aria-label="Smart job discovery">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Heading row ---- */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Smart job discovery</SectionLabel>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              The roles you&apos;d never find by searching
            </h2>
          </div>
          {/* Secondary CTA to the full catalogue. */}
          <Button asChild variant="outline" size="md">
            <Link href="/jobs">View all job open →</Link>
          </Button>
        </div>

        {/* ---- Error state ---- */}
        {error && (
          <p className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {/* ---- Loading: six skeleton tiles keep the grid from jumping ---- */}
        {!error && !jobs && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                // animate-pulse = the standard "content is coming" shimmer.
                className="h-56 animate-pulse rounded-2xl bg-white/5"
              />
            ))}
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!error && jobs && jobs.length === 0 && (
          <p className="mt-10 text-sm text-zinc-400">
            No featured roles right now — browse the full catalogue instead.
          </p>
        )}

        {/* ---- Jobs: first six (the Figma grid is 3 × 2) ---- */}
        {jobs && jobs.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 6).map((job) => (
              <JobCard key={job.id} job={job} company={job.company} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
