/**
 * ============================================================================
 * components/jobs/JobCard.tsx — one job, as a card
 * ============================================================================
 *
 * WHERE IT IS USED
 *   • Home page "Smart job discovery" grid (6 cards)
 *   • Browse Jobs results grid
 *   • Company profile "open roles" grid
 *
 * WHY ONE CARD FOR ALL THREE
 * The Figma cards share the same anatomy: logo, title, company, meta facts
 * (location / type / salary), tags and an Apply/View action. Writing it once
 * keeps the three pages consistent.
 *
 * This is a PRESENTATIONAL component — it receives data and renders it, with
 * no fetching or state, so it works inside any page (server or client).
 * ============================================================================
 */

/* eslint-disable @next/next/no-img-element */
// ↑ Company logos are arbitrary URLs from the database, so next/image would
//   require whitelisting every possible domain. A plain <img> is pragmatic.

import Link from "next/link";
import { Banknote, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { salaryRange } from "@/lib/format";
import type { Company, Job } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Props the card accepts. Only `job` is required. */
export interface JobCardProps {
  job: Job; // the job record (from /api/jobs)
  company?: Company; // its hiring company (joined by the API)
  /** Extra classes from the parent grid (e.g. h-full to stretch). */
  className?: string;
  /** Hide the description preview for dense layouts. */
  compact?: boolean;
  /** Parent-owned buttons (Save / Remove…). Falls back to "Apply Now". */
  actions?: React.ReactNode;
}

/**
 * Builds the "2-letter" fallback tile for a company without a logo.
 * A tiny helper keeps the JSX below readable.
 */
function initials(company?: Company): string {
  return company?.name
    ? company.name.slice(0, 2).toUpperCase()
    : "HQ"; // generic fallback for a missing company
}

export function JobCard({
  job,
  company,
  className,
  compact = false,
  actions,
}: JobCardProps) {
  return (
    // h-full + flex-col lets every card in a grid row match heights.
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5",
        // Hover lifts the border toward the brand accent — cheap, tasteful motion.
        "transition-colors hover:border-indigo-400/40 hover:bg-white/[0.05]",
        className
      )}
    >
      {/* ---- Row 1: logo · title · company ---- */}
      <div className="flex items-start gap-3">
        {/* Company logo, or an initials tile when it has none. */}
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            // White plate keeps dark/light logos legible on the dark card.
            className="h-10 w-10 rounded-lg border border-white/10 bg-white object-contain p-1"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-zinc-400">
            {initials(company)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {/* The title is the primary link into Job Details. */}
          <Link
            href={`/jobs/${job.id}`}
            className="line-clamp-1 font-semibold text-white transition-colors hover:text-indigo-300"
          >
            {job.title}
          </Link>
          <p className="mt-0.5 truncate text-sm text-zinc-400">
            {company?.name ?? "HireLoop partner"}
          </p>
        </div>
      </div>

      {/* ---- Row 2: description preview (first responsibility line) ---- */}
      {!compact && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {job.responsibilities.split("\n")[0]}
        </p>
      )}

      {/* ---- Row 3: meta facts — location, salary ---- */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
        {/* Location only when the job is not remote (remote has its own badge). */}
        {!job.isRemote && (
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {job.city}, {job.country}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Banknote aria-hidden="true" className="h-3.5 w-3.5" />
          {salaryRange(job.salaryMin, job.salaryMax, job.currency)}
        </span>
      </div>

      {/* ---- Row 4: tags ---- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {/* The contract type (Full-time, Contract, Remote…). */}
        <Badge tone="brand">{job.type}</Badge>

        {/*
         * "Remote" is itself one of the job types, so showing a second Remote
         * pill next to it would print the word twice (it did — this guard is
         * the fix). Only add the badge when the type is something else.
         */}
        {job.isRemote && job.type !== "Remote" && (
          <Badge tone="success">Remote</Badge>
        )}

        {/* Hand-picked listings get a "Hot Job" tag, matching the Figma card. */}
        {job.featured && <Badge tone="warning">Hot Job</Badge>}

        {/* Every public listing on HireLoop supports one-click apply. */}
        <Badge>Easy Apply</Badge>
      </div>

      {/* ---- Row 5: action ---- */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {/* Small deadline hint (absolute date keeps it unambiguous). */}
        <span className="text-xs text-zinc-500">
          Apply by{" "}
          {new Date(job.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>

        {/* Parent buttons win; otherwise a compact "Apply Now" link. */}
        {actions ?? (
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:from-indigo-400 hover:to-violet-400"
          >
            Apply Now
          </Link>
        )}
      </div>
    </article>
  );
}
