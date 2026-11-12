/**
 * ============================================================================
 * format.ts — tiny helpers that turn raw data into human-friendly text
 * ============================================================================
 *
 * These are pure functions: data goes in, a pretty string comes out.
 * Examples:
 *   "2026-11-01T09:00:00Z" → "5 days ago"      (relative date)
 *   "2026-11-01T09:00:00Z" → "Nov 1, 2026"     (absolute date)
 *   900 → 1900 → "$900 – $1,900"               (salary range)
 * ============================================================================
 */

import { format, formatDistanceToNowStrict } from "date-fns";

/**
 * "5 days ago" — used on My Applications, Manage Jobs, payments, etc.
 * The requirements say dates should read like this, not like "2026-11-07".
 */
export function relativeDate(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

/** "Nov 1, 2026" — used next to relative dates in the Admin payments table. */
export function absoluteDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

/** Both together: "May 10, 2026 · 9 days ago" (Admin payments table). */
export function bothDates(iso: string): string {
  return `${absoluteDate(iso)} · ${relativeDate(iso)}`;
}

/** "$900 – $1,900" — handles the "same number" and "0" cases gracefully. */
export function salaryRange(
  min: number,
  max: number,
  currency = "USD"
): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    BDT: "৳",
  };
  const s = symbols[currency] ?? `${currency} `;
  if (min === max) return `${s}${min.toLocaleString()}`;
  return `${s}${min.toLocaleString()} – ${s}${max.toLocaleString()}`;
}

/** Plain "$19", "$0" — used on the Pricing page. */
export function money(amount: number, currency = "USD"): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return `${symbols[currency] ?? currency + " "}${amount.toLocaleString()}`;
}

/**
 * Turn a multi-line textarea value ("Line one\nLine two") into an array of
 * non-empty lines. Used to render responsibilities/requirements bullet lists.
 */
export function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/*  Human-readable names for machine statuses                                  */
/* -------------------------------------------------------------------------- */

import type {
  ApplicationStatus,
  CompanyStatus,
  JobStatus,
  UserRole,
} from "./types";

/** Status value → what a person actually reads. */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  offered: "Offered",
};

/** Company moderation state → readable badge text. */
export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Job visibility state → readable badge text. */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active",
  closed: "Closed",
  draft: "Draft",
};

/** Role value → readable text with a capital letter. */
export const ROLE_LABELS: Record<UserRole, string> = {
  seeker: "Seeker",
  recruiter: "Recruiter",
  admin: "Admin",
};

/**
 * Badge colors, keyed by status, so every screen shows the same color for the
 * same meaning (green = good, amber = waiting, red = bad, blue = done).
 * Each entry is a tailwind class string applied to the <Badge> component.
 */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  applied: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  under_review: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  shortlisted: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  rejected: "bg-red-500/10 text-red-300 border-red-500/30",
  offered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  closed: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  draft: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

/** Map the two "waiting for next step" states onto the required wording. */
export function interviewishLabel(status: ApplicationStatus): string {
  // The Seeker home stats row wants "Interviews Scheduled" — HireLoop models
  // that as "shortlisted" (shortlisted candidates are the interview pipeline),
  // so we translate when showing it in that stats card.
  return status === "shortlisted" ? "Interviews Scheduled" : APPLICATION_STATUS_LABELS[status];
}
