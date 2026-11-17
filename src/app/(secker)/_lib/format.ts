/**
 * ==================================================================
 *  FORMATTERS — src/app/(secker)/_lib/format.ts
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  Small, reusable helpers that turn raw server values into the text a
 *  human wants to read:
 *
 *    "2026-11-10T09:00:00.000Z"  ->  "5 days ago"
 *    55000, 85000, "USD"         ->  "$55k – $85k / yr"
 *    "underReview"               ->  "Under Review" + badge colours
 *
 *  WHY NOT INLINE THEM IN EACH PAGE?
 *  The same "2 days ago" label appears on the dashboard, the applications
 *  table, saved jobs and billing. One helper = one place to fix a bug.
 * ==================================================================
 */

import type { ApplicationStatus, Job, SeekerPlanId, SeekerStats } from "./types";

/* ------------------------------------------------------------------ */
/*  Dates                                                              */
/* ------------------------------------------------------------------ */

/**
 * relativeTime — "just now", "5 minutes ago", "3 days ago", "2 months ago".
 * Falls back to a readable date after a year, because "14 months ago" is
 * harder to read than "Feb 2025".
 */
export function relativeTime(value?: string | null): string {
  if (!value) return "—";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  // A clock difference of a few seconds can make `seconds` negative;
  // treating anything in the past minute as "just now" hides that noise.
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  return formatDate(value);
}

/**
 * formatDate — a stable, readable date such as "Jan 31, 2027".
 *
 * WHY timeZone: "UTC"?
 * The browser and the build machine may sit in different timezones. Pinning
 * UTC means the same ISO date always prints the same day, so the server
 * rendered HTML and the browser cannot disagree.
 */
export function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "Jan 31, 2027" without the year — used for compact card labels. */
export function formatShortDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** True when the deadline has already passed (new applications blocked). */
export function isDeadlinePassed(value?: string | null): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time < Date.now();
}

/** Whole days left until the deadline (negative = already passed). */
export function daysUntil(value?: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Money                                                              */
/* ------------------------------------------------------------------ */

/** Currency symbols for the four currencies the server accepts. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BDT: "৳",
};

/**
 * compactNumber — 55000 becomes "55k", 1500000 becomes "1.5M".
 * Job salaries are usually round numbers, so this keeps cards tidy.
 */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

/** "$55k – $85k / yr" for a job's salary range. */
export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "currency">): string {
  const symbol = CURRENCY_SYMBOLS[job.currency] ?? "";
  return `${symbol}${compactNumber(job.salaryMin)} – ${symbol}${compactNumber(
    job.salaryMax
  )} / yr`;
}

/** "$19.00" — used by the billing history table. */
export function formatMoney(amount: number, currency = "USD"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";

  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ------------------------------------------------------------------ */
/*  Labels & badge colours                                            */
/* ------------------------------------------------------------------ */

/** What each application status should look like in the UI. */
export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; badge: string; dot: string }
> = {
  applied: {
    label: "Applied",
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
  },
  underReview: {
    label: "Under Review",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  shortlisted: {
    label: "Shortlisted",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    dot: "bg-violet-400",
  },
  offered: {
    label: "Offered",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

/** The order statuses appear in filters and summary bars. */
export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "underReview",
  "shortlisted",
  "offered",
  "rejected",
];

/**
 * seekerPlanMeta — display data for the three seeker plans.
 * The LIMITS are copies of the server's src/utils/plans.js; the server is
 * still the authority (it rejects extra applications), this is only what
 * we draw on the billing page.
 */
export const SEEKER_PLAN_META: Record<
  SeekerPlanId,
  { label: string; price: number; limit: number | null; tagline: string; perks: string[] }
> = {
  free: {
    label: "Free",
    price: 0,
    limit: 3,
    tagline: "Start applying today",
    perks: [
      "3 applications per month",
      "Save up to 10 jobs",
      "Job search & filters",
    ],
  },
  pro: {
    label: "Pro",
    price: 19,
    limit: 30,
    tagline: "For an active job hunt",
    perks: [
      "30 applications per month",
      "Unlimited saved jobs",
      "Priority application tracking",
    ],
  },
  premium: {
    label: "Premium",
    price: 39,
    limit: null,
    tagline: "Apply without limits",
    perks: [
      "Unlimited applications",
      "Unlimited saved jobs",
      "Early access to new roles",
    ],
  },
};

/** "3 of 30" or "7 of ∞" — the plan usage label. */
export function planUsageLabel(stats: SeekerStats): string {
  return `${stats.applicationsUsed} of ${
    stats.planLimit === null ? "∞" : stats.planLimit
  } applications`;
}

/**
 * usagePercent — how full the plan progress bar should be.
 * Unlimited plans return 12 so the bar is visible but clearly not "full".
 */
export function usagePercent(stats: SeekerStats): number {
  if (stats.planLimit === null) return 12;
  if (stats.planLimit <= 0) return 0;
  return Math.min(100, Math.round((stats.applicationsUsed / stats.planLimit) * 100));
}

/* ------------------------------------------------------------------ */
/*  User helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * initials — "Rakib Hasan" becomes "RH" for the avatar circle.
 * Used when the user has no photo URL.
 */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Dhaka, Bangladesh" from the job's location object, or "Remote". */
export function jobLocation(job: Pick<Job, "location" | "remote">): string {
  if (job.remote) return "Remote";

  return [job.location?.city, job.location?.country].filter(Boolean).join(", ") || "—";
}

/**
 * profileCompleteness — the percentage used by the dashboard's
 * "profile strength" card. Five simple, visible checkpoints keep the
 * calculation explainable to the user.
 */
export function profileCompleteness(user: {
  headline: string;
  bio: string;
  skills: string[];
  resumeUrl: string | null;
  photo: string | null;
}): { percent: number; missing: string[] } {
  const checks = [
    { label: "headline", done: Boolean(user.headline?.trim()) },
    { label: "bio", done: Boolean(user.bio?.trim()) },
    { label: "skills", done: user.skills.length > 0 },
    { label: "resume", done: Boolean(user.resumeUrl) },
    { label: "photo", done: Boolean(user.photo) },
  ];

  const done = checks.filter((check) => check.done).length;
  const missing = checks.filter((check) => !check.done).map((check) => check.label);

  return {
    percent: Math.round((done / checks.length) * 100),
    missing,
  };
}
