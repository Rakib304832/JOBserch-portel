/**
 * ============================================================================
 * types.ts — the "data dictionary" of HireLoop
 * ============================================================================
 *
 * What is this file?
 *
 * Every piece of information the app stores (a user, a job, an application…)
 * has a fixed shape. TypeScript lets us write that shape down once, and then
 * the whole codebase can rely on it. Think of this file as the app's
 * dictionary: whenever a file says `Job`, TypeScript looks up the definition
 * here and makes sure nothing ever breaks that shape.
 *
 * Non-technical summary of the main "tables":
 *   User        → anyone with an account (seeker / recruiter / admin)
 *   Company     → a recruiter's registered business (needs Admin approval)
 *   Job         → one job post created by a recruiter
 *   Application → "seeker X applied to job Y with this cover letter"
 *   SavedJob    → a bookmark a seeker put on a job
 *   Payment     → a record of one subscription purchase
 *   EmailLog    → pretend "emails" the app sends (so we can demo without a
 *                 real mail server)
 * ============================================================================
 */

/** The three roles a user can have. The whole app is organized around these. */
export type UserRole = "seeker" | "recruiter" | "admin";

/**
 * A registered person on HireLoop.
 *
 * Demo note: `passwordHash` stores a plain demo password. A real app would
 * store a salted hash (never the raw password) — see README "Security".
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — real apps hash passwords (bcrypt/argon2)
  role: UserRole;
  avatarUrl: string; // link to a profile photo (can be empty)
  suspended: boolean; // Admin can freeze an account; suspended = cannot log in
  createdAt: string; // ISO date string, e.g. "2026-11-01T10:00:00.000Z"
  // ---- extra profile fields used by the Seeker settings page ----
  headline?: string; // short tagline under the name, e.g. "Frontend developer"
  bio?: string; // longer free-text "about me"
  skills?: string[]; // e.g. ["React", "Figma", "SQL"]
  resumeUrl?: string; // link to the uploaded CV (PDF)
  // ---- subscription fields (what plan is this person on?) ----
  plan: SeekerPlanId; // seekers have their own plan ladder
}

/**
 * A company registered by a recruiter. It starts as "pending" and only
 * becomes publicly visible after an Admin approves it.
 */
export interface Company {
  id: string;
  name: string;
  industry: string; // e.g. "AI", "Fintech", "E-Commerce"
  website: string;
  location: string; // e.g. "Dhaka, Bangladesh"
  employeeCount: string; // range label, e.g. "11-50"
  logoUrl: string;
  description: string;
  recruiterId: string; // which user owns/manages this company
  recruiterEmail: string; // copied for convenience in Admin tables
  status: CompanyStatus;
  plan: RecruiterPlanId; // the company's plan controls how many jobs it may run
  createdAt: string;
}

export type CompanyStatus = "pending" | "approved" | "rejected";

/**
 * One job post. Written by the recruiter, shown to everyone while "active".
 */
export interface Job {
  id: string;
  companyId: string; // which company is hiring
  recruiterId: string; // who created it (for permission checks)
  title: string; // e.g. "Senior Frontend Engineer"
  category: string; // e.g. "Engineering", "Design", "Data"
  type: JobType; // Full-time / Part-time / Remote / Contract / Internship
  salaryMin: number; // lowest offered salary
  salaryMax: number; // highest offered salary
  currency: string; // "USD", "EUR"…
  city: string;
  country: string;
  isRemote: boolean; // "Remote" toggle on the post-job form
  deadline: string; // last day to apply (ISO date)
  responsibilities: string; // free text, one item per line
  requirements: string; // free text, one item per line
  benefits: string; // optional free text
  status: JobStatus; // active = publicly visible; closed = hidden; draft = WIP
  featured: boolean; // hand-picked jobs shown on the home page
  createdAt: string;
}

export type JobType =
  | "Full-time"
  | "Part-time"
  | "Remote"
  | "Contract"
  | "Internship";

export type JobStatus = "active" | "closed" | "draft";

/**
 * "Seeker X applied to job Y". Its status walks the pipeline:
 * applied → under_review → shortlisted → offered  (or rejected at any step).
 */
export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  coverLetter: string; // short message written when applying
  status: ApplicationStatus;
  createdAt: string; // when the application was submitted
  updatedAt: string; // last status change (drives the seeker activity feed)
}

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "offered";

/** A seeker's bookmark on a job (shown on the Saved Jobs page). */
export interface SavedJob {
  id: string;
  seekerId: string;
  jobId: string;
  createdAt: string;
}

/** One subscription charge. Shown in billing pages and the Admin panel. */
export interface Payment {
  id: string;
  userId: string; // who paid
  userEmail: string; // copied for Admin tables
  audience: "seeker" | "recruiter"; // which price table the plan belongs to
  plan: string; // "pro", "premium", "growth", "enterprise"…
  planLabel: string; // human name, e.g. "Pro"
  amount: number; // in whole dollars
  currency: string;
  transactionId: string; // fake Stripe-style id: "ch_demo_…"
  status: "paid"; // refunds are out of demo scope
  createdAt: string;
}

/**
 * Pretend emails. Whenever the app "sends an email" (e.g. an application
 * status change) we write a row here instead of calling a real mail server,
 * so the demo works offline. A real app would use Resend / SendGrid / SES.
 */
export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: string;
}

/** Seeker plan ids (the Pricing page's left table). */
export type SeekerPlanId = "free" | "pro" | "premium";
/** Recruiter plan ids (the Pricing page's right table). */
export type RecruiterPlanId = "free" | "growth" | "enterprise";
