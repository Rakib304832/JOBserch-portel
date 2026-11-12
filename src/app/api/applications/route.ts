/**
 * /api/applications — job applications.
 *
 * GET   → the logged-in SEEKER's applications (each with its job + company),
 *         powering the "My Applications" table.
 * POST  → a seeker applies to a job: { jobId, coverLetter }.
 *
 * PLAN ENFORCEMENT (the interesting part)
 * The seeker's plan sets a monthly application allowance:
 *   Free = 3 / month, Pro = 30 / month, Premium = unlimited.
 * Before creating anything we count THIS MONTH's applications and refuse
 * politely (402 + upsell message) when the allowance is used up.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  notFound,
  unauthorized,
} from "@/lib/session";
import {
  countApplicationsThisMonth,
  createApplication,
  findApplication,
  getJob,
  getCompany,
  listApplications,
  newId,
  nowIso,
  sendEmail,
} from "@/lib/store";
import { getSeekerPlan } from "@/lib/plans";
import type { ApplicationWithJob } from "@/lib/api-types";

/* -------------------------------------------------------------------------- */
/*  GET — my applications                                                     */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "seeker") {
    return forbidden("Only seekers have an applications list.");
  }

  // Enrich each application with the job it points to (the table needs the
  // title, company, salary…). Job may be undefined if it was deleted — the
  // UI renders a graceful "job removed" row in that case.
  const applications: ApplicationWithJob[] = listApplications({
    seekerId: user.id,
  }).map((app) => ({
    ...app,
    job: getJob(app.jobId)!,
    company: getCompany(getJob(app.jobId)?.companyId ?? "")!,
  }));

  return Response.json({ applications });
}

/* -------------------------------------------------------------------------- */
/*  POST — apply                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "seeker") {
    return forbidden("Only seekers can apply to jobs.");
  }

  let body: { jobId?: string; coverLetter?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  const job = body.jobId ? getJob(body.jobId) : undefined;
  if (!job) return notFound("Job not found.");
  if (job.status !== "active") {
    return badRequest("This job is no longer accepting applications.");
  }
  if (findApplication(user.id, job.id)) {
    return badRequest("You already applied to this job.");
  }

  // ---- Plan limit: how many applications does this month allow? ----
  const plan = getSeekerPlan(user.plan);
  const used = countApplicationsThisMonth(user.id);
  if (plan.limit !== null && used >= plan.limit) {
    return Response.json(
      {
        error: `Your ${plan.label} plan allows ${plan.limit} applications per month and you have used ${used}. Upgrade for more.`,
        code: "PLAN_LIMIT",
      },
      { status: 402 }
    );
  }

  // ---- Save the application ----
  const app = {
    id: newId("a"),
    jobId: job.id,
    seekerId: user.id,
    coverLetter: body.coverLetter?.trim() ?? "",
    status: "applied" as const, // the pipeline always starts here
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  createApplication(app);

  // ---- Notify the recruiter ("email alerts" from the Free plan pitch) ----
  const company = getCompany(job.companyId);
  sendEmail(
    company?.recruiterEmail ?? "recruiter@demo.com",
    `New application for ${job.title}`,
    `${user.name} (${user.email}) applied to "${job.title}".\nCover letter: ${app.coverLetter || "(none)"}`
  );

  return Response.json({ application: app }, { status: 201 });
}
