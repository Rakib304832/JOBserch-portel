/**
 * ==================================================================
 *  TYPES — src/app/(secker)/_lib/types.ts
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  TypeScript "shapes" for every object the Express API sends back.
 *  TypeScript is JavaScript + types: the types disappear when the code
 *  runs, but while writing code the editor can now warn us, for example,
 *  if we type `job.salaryMin` as a string or misspell `job.title`.
 *
 *  WHY KEEP THEM IN THE PRIVATE FOLDER?
 *  These types describe the Seeker dashboard only. Putting them under
 *  `_lib` (the underscore tells Next.js "this is not a route") keeps the
 *  dashboard self-contained, so the public pages are untouched.
 *
 *  The shapes below come directly from the server controllers:
 *   - src/utils/publicUser.js        -> Me
 *   - src/controllers/job.controller -> Job
 *   - src/controllers/application…   -> Application
 *   - src/controllers/payment…       -> Payment
 *   - src/controllers/stats…         -> SeekerStats / Notification
 * ==================================================================
 */

/** The three account types the server understands. */
export type Role = "seeker" | "recruiter" | "admin";

/** Seeker subscription tiers (limits live on the server, not here). */
export type SeekerPlanId = "free" | "pro" | "premium";

/**
 * The logged-in user, as returned by `GET /api/me`.
 * Every field except `id/name/email/role` has a sensible default on the
 * server, so the dashboard can treat them as always present.
 */
export type Me = {
  id: string;
  name: string;
  email: string;
  role: Role; // "seeker" for this dashboard
  provider?: string; // "local" (email+password) or "google"
  photo: string | null; // avatar URL
  status: string; // "active" | "suspended"
  createdAt: string | null; // join date (ISO string)
  plan: SeekerPlanId; // free | pro | premium
  headline: string; // short tagline under the name
  bio: string; // "about me" paragraph
  skills: string[]; // e.g. ["React", "TypeScript"]
  resumeUrl: string | null; // uploaded CV link
};

/** The company snapshot the server stores inside every job document. */
export type JobCompany = {
  name: string;
  industry?: string;
  logo?: string;
  location?: string;
};

/**
 * One job post, as returned by `GET /api/jobs` and `GET /api/jobs/:jobId`.
 * MongoDB sends `_id` as a string once the document becomes JSON.
 */
export type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: string; // Full-time | Part-time | Remote | Contract | Internship
  salaryMin: number;
  salaryMax: number;
  currency: string; // USD | EUR | GBP | BDT
  location: { city?: string; country?: string };
  remote: boolean;
  deadline: string; // ISO date; new applications are blocked after it
  postedAt: string; // ISO date
  status: string; // active | closed | draft
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  applicantsCount?: number;
  company: JobCompany;

  // Extra fields added by GET /api/saved (not stored on the job itself):
  savedId?: string;
  savedAt?: string;
};

/** The response wrapper of the job feed. */
export type JobsResponse = {
  ok: true;
  jobs: Job[];
  total: number;
  page: number;
  pages: number;
};

/**
 * The response of `GET /api/jobs/:jobId` — one job plus up to four
 * "similar" jobs from the same category (see job.controller.js → get).
 */
export type JobResponse = {
  ok: true;
  job: Job;
  similar: Job[];
};

/** The pipeline stages from the requirements. Stored in camelCase. */
export type ApplicationStatus =
  | "applied"
  | "underReview"
  | "shortlisted"
  | "offered"
  | "rejected";

/**
 * One row of "My Applications" (`GET /api/applications/mine`).
 * `jobTitle` / `companyName` are copies the server saved at apply time,
 * so the table can render without a second request per row.
 */
export type Application = {
  _id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId?: string | null;
  seekerId: string;
  seekerEmail?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string; // when the seeker applied
  updatedAt: string; // last status change
};

/** The counters behind the dashboard cards (`GET /api/stats/seeker`). */
export type SeekerStats = {
  plan: SeekerPlanId;
  planLabel: string; // "Free" | "Pro" | "Premium"
  planLimit: number | null; // null = unlimited applications
  applicationsUsed: number; // sent this calendar month
  applicationsTotal: number; // all time
  savedJobs: number;
  shortlisted: number;
  offered: number;
  rejected: number;
  limitReached: boolean; // true when this month's quota is used up
};

/** One item of the Recent Activity feed (a notification document). */
export type ActivityItem = {
  _id: string;
  type: string; // application | payment | company | account
  text: string;
  read: boolean;
  createdAt: string;
};

/** A receipt row from `GET /api/payments/history`. */
export type Payment = {
  _id: string;
  plan: string;
  planLabel: string;
  amount: number; // USD (0 for the Free tier)
  currency: string; // "USD"
  status: string; // "succeeded" in the demo flow
  provider: string; // "demo" (real flow: "stripe")
  providerRef: string; // fake receipt reference in the demo
  createdAt: string;
};

/**
 * Generic API envelopes.
 * Every server response starts with `ok: true`; errors use `ok: false`
 * plus a human-readable `message` (see middlewares/errorHandler.js).
 */
export type MeResponse = { ok: true; user: Me };
export type AuthResponse = { ok: true; user: Me };
export type SavedResponse = { ok: true; savedJobs: Job[] };
export type ApplicationsResponse = { ok: true; applications: Application[] };
export type StatsResponse = {
  ok: true;
  stats: SeekerStats;
  activity: ActivityItem[];
};
export type PaymentsResponse = { ok: true; payments: Payment[] };
export type CheckoutResponse = {
  ok: true;
  payment: Payment;
  plan: SeekerPlanId;
  audience: "seeker" | "recruiter";
  wasAlreadyOn: SeekerPlanId | null;
};
export type UploadResponse = { ok: true; url: string };
export type SimpleResponse = { ok: true; message?: string };
