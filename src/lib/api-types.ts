/**
 * ============================================================================
 * api-types.ts — the contracts between the API routes and the pages
 * ============================================================================
 *
 * When a route handler answers, its JSON has a shape. When a page consumes
 * that JSON, it needs to know the shape to render correctly. This file is the
 * shared agreement between the two sides — change it here, and TypeScript
 * points out every place that must follow.
 * ============================================================================
 */

import type {
  Application,
  Company,
  Job,
  Payment,
  SavedJob,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Jobs                                                                      */
/* -------------------------------------------------------------------------- */

/** A job enriched with its company — what /api/jobs returns per row. */
export interface JobWithCompany extends Job {
  company: Company;
}

/** A job enriched with "has this user saved/applied already?" flags. */
export interface JobWithStatus extends JobWithCompany {
  saved: boolean; // bookmarked by the current seeker?
  applied: boolean; // applied by the current seeker?
}

/* -------------------------------------------------------------------------- */
/*  Applications                                                              */
/* -------------------------------------------------------------------------- */

/** Seeker's "My Applications" row: the application + the job it targets. */
export interface ApplicationWithJob extends Application {
  job: Job;
  company: Company;
}

/** Recruiter's "View Applicants" row: the application + who sent it. */
export interface ApplicantRow extends Application {
  seeker: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    headline?: string;
    resumeUrl?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  Saved jobs                                                                */
/* -------------------------------------------------------------------------- */

/** "Saved Jobs" table row: bookmark + the job + the company. */
export interface SavedJobWithDetails extends SavedJob {
  job: Job;
  company: Company;
}

/* -------------------------------------------------------------------------- */
/*  Dashboards                                                                */
/* -------------------------------------------------------------------------- */

/** One big-number tile on a dashboard ("Saved Jobs: 3"). */
export interface StatTile {
  label: string;
  value: string | number;
  /** Optional sub-text, e.g. "2 this month". */
  hint?: string;
}

/** Recent-activity rows (notification-style lists on the home dashboards). */
export interface ActivityItem {
  id: string;
  /** What happened, already phrased for a human. */
  text: string;
  /** ISO time — the UI renders it relative ("2 days ago"). */
  at: string;
}

/** /api/stats/seeker response. */
export interface SeekerStats {
  stats: StatTile[];
  distribution: { status: string; label: string; count: number }[];
  activity: ActivityItem[];
}

/** /api/stats/recruiter response. */
export interface RecruiterStats {
  stats: StatTile[];
  company: Company | null;
  applicantsPerJob: { job: string; applicants: number }[];
  recentApplications: ActivityItem[];
}

/** /api/stats/admin response. */
export interface AdminStats {
  stats: StatTile[];
  jobsPerCategory: { category: string; count: number }[];
  registrationsPerDay: { day: string; count: number }[];
  recentPayments: (Payment & { userName: string })[];
}

/** /api/stats/public response (home page hero strip). */
export interface PublicStats {
  stats: { value: string; label: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Payments & billing                                                        */
/* -------------------------------------------------------------------------- */

/** /api/payments GET response (role-aware). */
export interface PaymentsResponse {
  payments: Payment[];
  /** For the billing header: what plan am I on, and how much of it is used? */
  plan: {
    audience: "seeker" | "recruiter";
    id: string; // "free" | "pro"…
    label: string; // "Free" | "Pro"…
    limit: number | null; // null = unlimited
    used: number; // applications this month OR active job posts
  } | null;
}
