/**
 * job-card.tsx — the reusable card that represents ONE job.
 *
 * You'll see it in five places: the home page's "Featured Jobs", the public
 * Browse Jobs page, the seeker dashboard's Browse & Apply, the Saved Jobs
 * table (compact mode) and the admin's job list.
 *
 * DESIGN CHOICE
 * The card itself is PRESENTATIONAL (no "use client", no fetching): it only
 * formats and displays data it receives. Anything interactive (Save/Apply
 * buttons) is passed in by the parent through `actions` — a slot pattern that
 * lets server pages and client pages reuse the same card.
 */

/* eslint-disable @next/next/no-img-element */
// ↑ next/image would require whitelisting every possible logo domain in
//   next.config.ts; logos here are arbitrary URLs, so plain <img> is pragmatic.

import Link from "next/link";
import {
  BanknoteIcon,
  BookmarkIcon,
  CalendarIcon,
  MapPinIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { relativeDate, salaryRange } from "@/lib/format";
import type { Company, Job } from "@/lib/types";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  /** The hiring company — used for its name (and optional logo) on the card. */
  company?: Company;
  /** "Saved" heart/bookmark indicator (shown on seeker dashboard lists). */
  saved?: boolean;
  /** Interactive buttons rendered by the parent (Save, Apply, Remove…). */
  actions?: React.ReactNode;
  /** Compact removes the description block for dense table-like layouts. */
  compact?: boolean;
  className?: string;
}

export function JobCard({
  job,
  company,
  saved,
  actions,
  compact,
  className,
}: JobCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card p-5",
        "transition-colors hover:border-indigo-500/40",
        className
      )}
    >
      {/* ---- Row 1: company logo + job title + company name (as a link) ---- */}
      <div className="flex items-start gap-3">
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="h-10 w-10 rounded-lg border border-border bg-white object-contain p-1"
          />
        ) : (
          // Placeholder tile when the company has no logo uploaded yet
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-400">
            {company?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="line-clamp-1 font-semibold text-foreground transition-colors hover:text-indigo-300"
            >
              {job.title}
            </Link>
            {saved && (
              <BookmarkIcon
                className="h-4 w-4 shrink-0 fill-indigo-400 text-indigo-400"
                aria-label="Saved"
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {company?.name ?? "Unknown company"}
          </p>
        </div>
      </div>

      {/* ---- Row 2: the meta facts (location · type · salary) ---- */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {/* MapPin only when it's NOT a remote job; remote gets its own badge */}
        {!job.isRemote && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {job.city}, {job.country}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <BanknoteIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {salaryRange(job.salaryMin, job.salaryMax, job.currency)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Posted {relativeDate(job.createdAt)}
        </span>
      </div>

      {/* ---- Row 3: badges — job type, remote flag, category, saved state ---- */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge>{job.type}</Badge>
        {job.isRemote && <Badge>Remote</Badge>}
        <Badge>{job.category}</Badge>
      </div>

      {/* ---- Row 4 (optional): responsibilities preview ---- */}
      {!compact && job.responsibilities && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {job.responsibilities.split("\n")[0]}
        </p>
      )}

      {/* ---- Row 5: footer with deadline + parent-provided buttons ---- */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          Apply by{" "}
          <span className="text-zinc-300">
            {new Date(job.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </span>
        {/* Slot: the page decides which buttons belong here */}
        {actions ?? (
          <Link
            href={`/jobs/${job.id}`}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:from-indigo-400 hover:to-violet-400"
          >
            View Job
          </Link>
        )}
      </div>
    </div>
  );
}
