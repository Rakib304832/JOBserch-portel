"use client";

/**
 * ==================================================================
 *  JOB CARD — src/app/(secker)/_components/JobCard.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  One job, drawn as a card. It is reused by three dashboard pages:
 *    - Browse & Apply  (save + apply buttons)
 *    - Saved Jobs      (remove + apply buttons)
 *    - Dashboard home  (compact "recommended" cards)
 *
 *  WHY PROPS INSTEAD OF FETCHING INSIDE THE CARD?
 *  A card should only know how to DRAW a job. The page that owns the list
 *  knows which jobs are saved, which are already applied to, and what to
 *  do when a button is clicked. Keeping the network out of the card makes
 *  it reusable and easy to reason about.
 *
 *  IMPORTANT PROPS
 *   job       — the job document from the API
 *   saved     — highlights the bookmark button
 *   applied   — disables Apply and shows "Applied"
 *   onSave    — omit it to hide the bookmark button
 *   onRemove  — shows "Remove" (used on the Saved Jobs page)
 *   busy      — disables the action buttons while a request runs
 *   savedAt   — optional footnote, e.g. "Saved 3 days ago"
 * ==================================================================
 */

import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Building,
  Check,
  Clock,
  LoaderCircle,
  MapPin,
  Send,
  Trash,
} from "lucide-react";
import { daysUntil, formatSalary, isDeadlinePassed, jobLocation, relativeTime } from "../_lib/format";
import type { Job } from "../_lib/types";

export function JobCard({
  job,
  saved = false,
  applied = false,
  busy = false,
  savedAt,
  onSave,
  onApply,
  onRemove,
}: {
  job: Job;
  saved?: boolean;
  applied?: boolean;
  busy?: boolean;
  savedAt?: string;
  onSave?: () => void;
  onApply?: () => void;
  onRemove?: () => void;
}) {
  // The deadline closes a job for new applications even before a recruiter
  // flips its status, so the button must respect it.
  const closed = isDeadlinePassed(job.deadline);
  const daysLeft = daysUntil(job.deadline);

  // The company logo may be missing; then we draw the first letter instead.
  const logoLetter = job.company?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <article className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-panel/80 p-5 transition-colors hover:border-white/20">
      {/* ---------- Top row: company + bookmark ---------- */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {job.company?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- logos come from arbitrary external URLs
            <img
              src={job.company.logo}
              alt={`${job.company.name} logo`}
              className="size-11 shrink-0 rounded-xl border border-line object-cover"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated text-sm font-semibold text-white">
              {logoLetter}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {job.company?.name ?? "Unknown company"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {job.company?.industry ?? job.category}
            </p>
          </div>
        </div>

        {/* Bookmark toggle. `onSave` missing = card is read-only. */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved jobs" : "Save this job"}
            className={`rounded-xl border p-2 transition-colors disabled:opacity-50 ${
              saved
                ? "border-brand-violet/40 bg-brand-violet/15 text-brand-violet"
                : "border-line bg-elevated text-muted-foreground hover:text-white"
            }`}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : saved ? (
              <BookmarkCheck className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </button>
        )}
      </div>

      {/* ---------- Job title + facts ---------- */}
      <div className="flex-1">
        <Link
          href={`/secker/jobs/${job._id}`}
          className="line-clamp-2 text-base font-semibold leading-snug text-white transition-colors hover:text-brand-violet"
        >
          {job.title}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {jobLocation(job)}
          </span>

          <span className="inline-flex items-center gap-1">
            <Building className="size-3.5" />
            {job.type}
          </span>

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {relativeTime(job.postedAt)}
          </span>
        </div>

        <p className="mt-3 text-sm font-medium text-emerald-300">{formatSalary(job)}</p>

        {/* Deadline line: amber when close, rose when gone. */}
        <p
          className={`mt-1 text-xs ${
            closed
              ? "text-rose-300"
              : daysLeft <= 7
                ? "text-amber-300"
                : "text-muted-foreground"
          }`}
        >
          {closed
            ? "Applications closed"
            : daysLeft <= 0
              ? "Apply today"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to apply`}
        </p>

        {savedAt && (
          <p className="mt-1 text-xs text-muted-foreground">Saved {relativeTime(savedAt)}</p>
        )}
      </div>

      {/* ---------- Actions ---------- */}
      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Link
          href={`/secker/jobs/${job._id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-elevated"
        >
          Details
          <ArrowUpRight className="size-3.5" />
        </Link>

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
          >
            <Trash className="size-3.5" />
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={!onApply || applied || closed || busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-3 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {busy ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : applied ? (
              <Check className="size-3.5" />
            ) : (
              <Send className="size-3.5" />
            )}
            {applied ? "Applied" : closed ? "Closed" : "Apply"}
          </button>
        )}
      </div>
    </article>
  );
}
