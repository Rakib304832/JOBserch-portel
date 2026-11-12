/**
 * GET /api/stats/[scope] — the three dashboard "home page" data bundles.
 *
 * scope = "seeker"    → stats row, pie-chart distribution, recent activity
 * scope = "recruiter" → stats row, company card, applicants-per-job chart,
 *                       recent applications feed
 * scope = "admin"     → stats row, jobs-per-category chart, registrations
 *                       line chart, recent payments feed
 *
 * One dynamic segment keeps the three dashboards' data needs in one file
 * while enforcing the matching role for each.
 */

import { type NextRequest } from "next/server";
import {
  forbidden,
  getCurrentUser,
  notFound,
  unauthorized,
} from "@/lib/session";
import {
  applicantsPerJob,
  applicationStatusDistribution,
  countApplicationsThisMonth,
  countSavedJobs,
  getCompanyByRecruiter,
  getJob,
  getUser,
  jobsPerCategory,
  listApplications,
  listCompanies,
  listJobs,
  listPayments,
  registrationsPerDay,
  countUsersByRole,
  totalRevenue,
  revenueThisMonth,
} from "@/lib/store";
import { APPLICATION_STATUS_LABELS } from "@/lib/format";
import type {
  ActivityItem,
  AdminStats,
  RecruiterStats,
  SeekerStats,
  StatTile,
} from "@/lib/api-types";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/stats/[scope]">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { scope } = await ctx.params;

  if (scope === "seeker") return seekerBundle(user.id);
  if (scope === "recruiter") return recruiterBundle(user);
  if (scope === "admin") return adminBundle(user);
  return notFound("Unknown stats scope.");
}

/* -------------------------------------------------------------------------- */
/*  SEEKER                                                                    */
/* -------------------------------------------------------------------------- */

async function seekerBundle(seekerId: string) {
  const myApps = listApplications({ seekerId });

  // ---- Big number tiles (the "Stats Row") ----
  const stats: StatTile[] = [
    { label: "Saved Jobs", value: countSavedJobs(seekerId) },
    { label: "Applications Submitted", value: myApps.length },
    {
      // "Interviews Scheduled" is modeled as the "shortlisted" status
      label: "Interviews Scheduled",
      value: myApps.filter((a) => a.status === "shortlisted").length,
    },
    {
      label: "Offers Received",
      value: myApps.filter((a) => a.status === "offered").length,
      hint: `${countApplicationsThisMonth(seekerId)} applied this month`,
    },
  ];

  // ---- Pie chart data: how many applications sit in each status ----
  const dist = applicationStatusDistribution(seekerId);
  const distribution = Object.entries(dist)
    .map(([status, count]) => ({
      status,
      label: APPLICATION_STATUS_LABELS[status as keyof typeof dist],
      count,
    }))
    .filter((row) => row.count > 0); // hide empty slices

  // ---- Recent activity: latest status changes, newest first ----
  const activity: ActivityItem[] = myApps.slice(0, 6).map((app) => {
    const job = getJob(app.jobId);
    return {
      id: app.id,
      text: `${job?.title ?? "a job"} — ${APPLICATION_STATUS_LABELS[app.status]}`,
      at: app.updatedAt,
    };
  });

  const body: SeekerStats = { stats, distribution, activity };
  return Response.json(body);
}

/* -------------------------------------------------------------------------- */
/*  RECRUITER                                                                 */
/* -------------------------------------------------------------------------- */

async function recruiterBundle(user: NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>) {
  const company = getCompanyByRecruiter(user.id);
  if (!company) {
    // No company yet → the dashboard shows the "Register Company" prompt;
    // we still answer 200 with empty data rather than an error.
    const body: RecruiterStats = {
      stats: [],
      company: null,
      applicantsPerJob: [],
      recentApplications: [],
    };
    return Response.json(body);
  }

  const myJobs = listJobs({ companyId: company.id });

  // ---- Stats row: Total Job Posts / Total Applicants / Active / Closed ----
  const myJobIds = myJobs.map((j) => j.id);
  const apps = listApplications({ jobIds: myJobIds });
  const stats: StatTile[] = [
    { label: "Total Job Posts", value: myJobs.length },
    { label: "Total Applicants", value: apps.length },
    {
      label: "Active Jobs",
      value: myJobs.filter((j) => j.status === "active").length,
    },
    {
      label: "Jobs Closed",
      value: myJobs.filter((j) => j.status === "closed").length,
    },
  ];

  // ---- Recent applications feed across all of the company's posts ----
  const recentApplications: ActivityItem[] = apps.slice(0, 6).map((app) => {
    const job = getJob(app.jobId);
    const seeker = getUser(app.seekerId);
    return {
      id: app.id,
      text: `${seeker?.name ?? "Someone"} applied to ${job?.title ?? "a job"}`,
      at: app.createdAt,
    };
  });

  const body: RecruiterStats = {
    stats,
    company,
    applicantsPerJob: applicantsPerJob(company.id),
    recentApplications,
  };
  return Response.json(body);
}

/* -------------------------------------------------------------------------- */
/*  ADMIN                                                                     */
/* -------------------------------------------------------------------------- */

async function adminBundle(user: NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>) {
  if (user.role !== "admin") return forbidden("Admins only.");

  // ---- Stats row ----
  const stats: StatTile[] = [
    {
      label: "Total Users",
      value: countUsersByRole("seeker") + countUsersByRole("recruiter"),
    },
    { label: "Total Recruiters", value: countUsersByRole("recruiter") },
    { label: "Total Companies", value: listCompanies({}).length },
    { label: "Total Jobs Posted", value: listJobs({}).length },
    {
      label: "Platform Revenue",
      value: `$${totalRevenue().toLocaleString()}`,
      hint: `$${revenueThisMonth().toLocaleString()} this month`,
    },
  ];

  // ---- Recent payments feed (newest five transactions) ----
  const recentPayments = listPayments({})
    .slice(0, 5)
    .map((p) => ({ ...p, userName: getUser(p.userId)?.name ?? "Unknown" }));

  const body: AdminStats = {
    stats,
    jobsPerCategory: jobsPerCategory(),
    registrationsPerDay: registrationsPerDay(),
    recentPayments,
  };
  return Response.json(body);
}
