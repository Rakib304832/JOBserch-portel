/**
 * ============================================================================
 * store.ts — the app's "database" (an in-memory JavaScript store)
 * ============================================================================
 *
 * WHAT THIS IS
 * A real job portal would keep all data in MongoDB (or Postgres…) on a server
 * that runs 24/7. For this learning project we keep the same *architecture*
 * — API routes read and write through one data layer — but the data itself
 * lives in plain JavaScript arrays that were seeded by src/lib/seed.ts.
 *
 * WHY IT'S FINE FOR A DEMO
 * • No installation: no MongoDB, no Docker, no environment variables.
 * • The file is readable top-to-bottom, so a beginner can see *everything*
 *   the backend can do (search jobs, check plan limits, change statuses…).
 *
 * THE TRADE-OFF (know this!)
 * The arrays live in the server's memory. If you stop and restart
 * `npm run dev`, everything you created is gone and the seed data returns.
 * A production build would swap each helper below for one MongoDB query —
 * the function names and the rest of the app would not change at all.
 *
 * HOW THE REST OF THE APP USES IT
 *   Browser  ──fetch──▶  /api/… route handler  ──calls──▶  these helpers
 * The browser NEVER touches this file directly; only API routes do.
 * ============================================================================
 */

import type {
  Application,
  ApplicationStatus,
  Company,
  EmailLog,
  Job,
  JobStatus,
  Payment,
  SavedJob,
  User,
} from "./types";
import {
  seedApplications,
  seedCompanies,
  seedJobs,
  seedPayments,
  seedSavedJobs,
  seedUsers,
} from "./seed";

/* -------------------------------------------------------------------------- */
/*  THE DATA ITSELF                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The whole "database" in one object.
 * It is created when the server process starts and shared by every request,
 * because Node keeps module state alive between requests.
 */
export const db = {
  users: [...seedUsers],
  companies: [...seedCompanies],
  jobs: [...seedJobs],
  applications: [...seedApplications],
  savedJobs: [...seedSavedJobs],
  payments: [...seedPayments],
  emails: [] as EmailLog[], // pretend-outbox; starts empty
};

/** Fresh unique ids for records created at runtime (crypto = built into Node). */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Current time as an ISO string — the format every date field uses. */
export function nowIso(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/*  USERS                                                                     */
/* -------------------------------------------------------------------------- */

/** Find one user by id, or null. */
export function getUser(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

/** Find one user by (lower-cased) email — used by login and registration. */
export function getUserByEmail(email: string): User | undefined {
  return db.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
}

/** Add a user. The caller has already validated everything. */
export function createUser(user: User): User {
  db.users.push(user);
  return user;
}

/**
 * Change fields on a user. We merge, so callers only send what changed
 * (e.g. PATCH { name } leaves email and skills untouched).
 */
export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const user = getUser(id);
  if (!user) return undefined;
  Object.assign(user, patch);
  return user;
}

/**
 * List users for the Admin's "Manage Users" table.
 * Optional filters: search by email, filter by role.
 */
export function listUsers(opts: { email?: string; role?: string }): User[] {
  let out = db.users;
  if (opts.email) {
    const q = opts.email.toLowerCase();
    out = out.filter((u) => u.email.toLowerCase().includes(q));
  }
  if (opts.role === "seeker" || opts.role === "recruiter") {
    out = out.filter((u) => u.role === opts.role);
  }
  // newest first so the "Join Date" column reads naturally
  return [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* -------------------------------------------------------------------------- */
/*  COMPANIES                                                                 */
/* -------------------------------------------------------------------------- */

export function getCompany(id: string): Company | undefined {
  return db.companies.find((c) => c.id === id);
}

/** The company owned by a given recruiter (each recruiter manages at most one). */
export function getCompanyByRecruiter(recruiterId: string): Company | undefined {
  return db.companies.find((c) => c.recruiterId === recruiterId);
}

/**
 * List companies.
 * • status "approved" → for the public Companies page
 * • no status filter  → everything, for the Admin's Manage Companies table
 * • industry filter   → for the tab strip on the Companies page
 */
export function listCompanies(opts: {
  status?: string;
  industry?: string;
}): Company[] {
  let out = db.companies;
  if (opts.status) out = out.filter((c) => c.status === opts.status);
  if (opts.industry && opts.industry !== "All") {
    out = out.filter((c) => c.industry === opts.industry);
  }
  return [...out].sort((a, b) => a.name.localeCompare(b.name));
}

export function createCompany(company: Company): Company {
  db.companies.push(company);
  return company;
}

export function updateCompany(
  id: string,
  patch: Partial<Company>
): Company | undefined {
  const company = getCompany(id);
  if (!company) return undefined;
  Object.assign(company, patch);
  return company;
}

/* -------------------------------------------------------------------------- */
/*  JOBS                                                                      */
/* -------------------------------------------------------------------------- */

export function getJob(id: string): Job | undefined {
  return db.jobs.find((j) => j.id === id);
}

/**
 * List jobs with every filter the Browse-Jobs page offers, all optional:
 *   q         → keyword match on title / company name
 *   type      → "Full-time", "Remote"…
 *   category  → "Engineering"…
 *   location  → substring match on "City, Country"
 *   minSalary → jobs whose salaryMax is at least this (you'd earn ≥ X)
 *   status    → "active" for the public site, undefined for dashboards
 *   companyId → a recruiter's own jobs, or a company profile page
 *   featured  → home-page picks
 */
export function listJobs(opts: {
  q?: string;
  type?: string;
  category?: string;
  location?: string;
  minSalary?: number;
  status?: string;
  companyId?: string;
  featured?: boolean;
}): Job[] {
  let out = db.jobs;

  if (opts.status) out = out.filter((j) => j.status === opts.status);
  if (opts.companyId) out = out.filter((j) => j.companyId === opts.companyId);
  if (opts.featured !== undefined) {
    out = out.filter((j) => j.featured === opts.featured);
  }
  if (opts.type) out = out.filter((j) => j.type === opts.type);
  if (opts.category) out = out.filter((j) => j.category === opts.category);
  if (opts.minSalary !== undefined) {
    out = out.filter((j) => j.salaryMax >= opts.minSalary!);
  }
  if (opts.location) {
    const q = opts.location.toLowerCase();
    out = out.filter((j) =>
      `${j.city}, ${j.country}`.toLowerCase().includes(q)
    );
  }
  if (opts.q) {
    const q = opts.q.toLowerCase();
    out = out.filter((j) => {
      const company = getCompany(j.companyId);
      return (
        j.title.toLowerCase().includes(q) ||
        (company?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }

  // newest first — the newest posts show at the top everywhere
  return [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createJob(job: Job): Job {
  db.jobs.push(job);
  return job;
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const job = getJob(id);
  if (!job) return undefined;
  Object.assign(job, patch);
  return job;
}

export function deleteJob(id: string): boolean {
  const before = db.jobs.length;
  db.jobs = db.jobs.filter((j) => j.id !== id);
  return db.jobs.length < before; // true = something was actually removed
}

/** How many of a company's job posts are currently "active" (plan usage). */
export function countActiveJobs(companyId: string): number {
  return db.jobs.filter(
    (j) => j.companyId === companyId && j.status === "active"
  ).length;
}

/* -------------------------------------------------------------------------- */
/*  APPLICATIONS                                                              */
/* -------------------------------------------------------------------------- */

export function getApplication(id: string): Application | undefined {
  return db.applications.find((a) => a.id === id);
}

/** Has this seeker already applied to this job? (used by the Apply button) */
export function findApplication(seekerId: string, jobId: string) {
  return db.applications.find(
    (a) => a.seekerId === seekerId && a.jobId === jobId
  );
}

/**
 * List applications:
 * • seekerId  → "my applications" table
 * • jobIds    → all applicants for a recruiter's jobs (pass their job ids)
 * • jobId     → applicants for one specific job post
 */
export function listApplications(opts: {
  seekerId?: string;
  jobId?: string;
  jobIds?: string[];
}): Application[] {
  let out = db.applications;
  if (opts.seekerId) {
    out = out.filter((a) => a.seekerId === opts.seekerId);
  }
  if (opts.jobId) {
    out = out.filter((a) => a.jobId === opts.jobId);
  }
  if (opts.jobIds) {
    const set = new Set(opts.jobIds);
    out = out.filter((a) => set.has(a.jobId));
  }
  // newest first
  return [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** How many applications a seeker submitted in the current calendar month. */
export function countApplicationsThisMonth(seekerId: string): number {
  const now = new Date();
  return db.applications.filter((a) => {
    if (a.seekerId !== seekerId) return false;
    const d = new Date(a.createdAt);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;
}

/** Add an application. Plan-limit checks happen in the API route first. */
export function createApplication(app: Application): Application {
  db.applications.push(app);
  return app;
}

/**
 * Move an application along the pipeline (Under Review → Shortlisted …).
 * Also writes a pretend email to the applicant — the requirements say a
 * status change must notify them.
 */
export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Application | undefined {
  const app = getApplication(id);
  if (!app) return undefined;
  app.status = status;
  app.updatedAt = nowIso();

  // ---- the "email" the recruiter's action triggers ------------------------
  const job = getJob(app.jobId);
  const seeker = getUser(app.seekerId);
  if (job && seeker) {
    sendEmail(
      seeker.email,
      `Update on your application: ${job.title}`,
      `Hi ${seeker.name},\n\nThe status of your application for "${job.title}" at ${getCompany(job.companyId)?.name ?? "the company"} changed to: ${status.replace("_", " ")}.\n\n— HireLoop`
    );
  }
  return app;
}

/* -------------------------------------------------------------------------- */
/*  SAVED JOBS (bookmarks)                                                    */
/* -------------------------------------------------------------------------- */

export function listSavedJobs(seekerId: string): SavedJob[] {
  return db.savedJobs
    .filter((s) => s.seekerId === seekerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isJobSaved(seekerId: string, jobId: string): boolean {
  return db.savedJobs.some(
    (s) => s.seekerId === seekerId && s.jobId === jobId
  );
}

/** Bookmark a job (limit checks happen in the API route). */
export function saveJob(seekerId: string, jobId: string): SavedJob {
  const rec: SavedJob = {
    id: newId("sv"),
    seekerId,
    jobId,
    createdAt: nowIso(),
  };
  db.savedJobs.push(rec);
  return rec;
}

/** Un-bookmark. Returns true if a bookmark was actually removed. */
export function unsaveJob(seekerId: string, jobId: string): boolean {
  const before = db.savedJobs.length;
  db.savedJobs = db.savedJobs.filter(
    (s) => !(s.seekerId === seekerId && s.jobId === jobId)
  );
  return db.savedJobs.length < before;
}

/* -------------------------------------------------------------------------- */
/*  PAYMENTS                                                                  */
/* -------------------------------------------------------------------------- */

export function listPayments(opts: { userId?: string }): Payment[] {
  const out = opts.userId
    ? db.payments.filter((p) => p.userId === opts.userId)
    : db.payments;
  return [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addPayment(payment: Payment): Payment {
  db.payments.push(payment);
  return payment;
}

/* -------------------------------------------------------------------------- */
/*  EMAIL LOG (the pretend outbox)                                            */
/* -------------------------------------------------------------------------- */

/**
 * "Send" an email by writing it to the log. In production this function would
 * call a mail provider (Resend, SendGrid, SES); here it just records the
 * message and prints it to the server terminal so you can see it happen.
 */
export function sendEmail(to: string, subject: string, body: string): void {
  const email: EmailLog = {
    id: newId("mail"),
    to,
    subject,
    body,
    createdAt: nowIso(),
  };
  db.emails.push(email);
  // Visible in the terminal running `npm run dev` — nice for learning!
  console.info(`[email] to=${to} subject="${subject}"`);
}

/* -------------------------------------------------------------------------- */
/*  AGGREGATIONS — small "reports" used by the dashboards                     */
/* -------------------------------------------------------------------------- */

/** Count all users whose role matches, for the Admin stats row. */
export function countUsersByRole(role: string): number {
  return db.users.filter((u) => u.role === role).length;
}

/** Total money the platform has ever collected (Admin revenue stat). */
export function totalRevenue(): number {
  return db.payments.reduce((sum, p) => sum + p.amount, 0);
}

/** Money collected in the current calendar month (Admin "monthly revenue"). */
export function revenueThisMonth(): number {
  const now = new Date();
  return db.payments
    .filter((p) => {
      const d = new Date(p.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, p) => sum + p.amount, 0);
}

/** Number of jobs per category — the Admin home bar chart. */
export function jobsPerCategory(): { category: string; count: number }[] {
  const map = new Map<string, number>();
  for (const job of db.jobs) {
    map.set(job.category, (map.get(job.category) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * New user registrations per day for the last 30 days — the Admin home line
 * chart. Days with zero signups still appear (with count 0) so the line is
 * continuous instead of skipping.
 */
export function registrationsPerDay(): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const count = db.users.filter((u) => u.createdAt.slice(0, 10) === key).length;
    out.push({ day: key, count });
  }
  return out;
}

/** Application-status distribution for one seeker — the pie chart data. */
export function applicationStatusDistribution(seekerId: string) {
  const counts: Record<ApplicationStatus, number> = {
    applied: 0,
    under_review: 0,
    shortlisted: 0,
    rejected: 0,
    offered: 0,
  };
  for (const a of db.applications) {
    if (a.seekerId === seekerId) counts[a.status] += 1;
  }
  return counts;
}

/**
 * Applicant counts for each of a company's jobs over the last 30 days —
 * the recruiter home bar chart. Includes zero-applicant jobs so they show up.
 */
export function applicantsPerJob(companyId: string) {
  const jobs = db.jobs.filter((j) => j.companyId === companyId);
  return jobs.map((j) => ({
    job: j.title,
    applicants: db.applications.filter((a) => a.jobId === j.id).length,
  }));
}

/** Seeker-side count of how many jobs are currently saved (plan usage). */
export function countSavedJobs(seekerId: string): number {
  return db.savedJobs.filter((s) => s.seekerId === seekerId).length;
}
