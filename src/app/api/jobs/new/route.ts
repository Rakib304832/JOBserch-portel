/**
 * POST /api/jobs — a recruiter creates a new job post.
 *
 * BUSINESS RULES ENFORCED HERE (this is why the check lives in the API and
 * not just in the UI — the UI can be bypassed, the API cannot):
 *   1. You must be logged in AS a recruiter.
 *   2. You must have a registered company (jobs belong to companies).
 *   3. Your company must be APPROVED by an admin before it can post.
 *   4. Your company's plan sets how many jobs can be ACTIVE at once:
 *      Free = 3, Growth = 10, Enterprise = 50. Drafts don't count; neither
 *      does closing a job to post another — the plan limit is about
 *      concurrent active posts.
 *
 * On success the job is saved with status "active" and becomes publicly
 * visible immediately.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/session";
import {
  countActiveJobs,
  createJob,
  getCompanyByRecruiter,
  newId,
  nowIso,
} from "@/lib/store";
import { getRecruiterPlan } from "@/lib/plans";
import type { Job, JobStatus, JobType } from "@/lib/types";

export async function POST(req: NextRequest) {
  // ---- Rule 1: must be a recruiter ----
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "recruiter") {
    return forbidden("Only recruiters can post jobs.");
  }

  // ---- Rule 2: must have a company ----
  const company = getCompanyByRecruiter(user.id);
  if (!company) {
    return forbidden("Register your company before posting a job.");
  }

  // ---- Rule 3: company must be approved ----
  if (company.status !== "approved") {
    return forbidden(
      "Your company must be approved by an admin before posting jobs."
    );
  }

  // ---- Parse the (big) form payload ----
  let body: Partial<Job>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  // ---- Validate the required fields one by one ----
  const required: [keyof Job, string][] = [
    ["title", "Job title"],
    ["category", "Job category"],
    ["type", "Job type"],
    ["city", "City"],
    ["country", "Country"],
    ["deadline", "Application deadline"],
    ["responsibilities", "Responsibilities"],
    ["requirements", "Requirements"],
  ];
  for (const [field, label] of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return badRequest(`${label} is required.`);
    }
  }
  if (
    typeof body.salaryMin !== "number" ||
    typeof body.salaryMax !== "number" ||
    body.salaryMin > body.salaryMax
  ) {
    return badRequest("Salary range must be two numbers, min ≤ max.");
  }

  // ---- Rule 4: plan limit on concurrent ACTIVE posts ----
  const plan = getRecruiterPlan(company.plan);
  const activeCount = countActiveJobs(company.id);
  if (plan.limit !== null && activeCount >= plan.limit) {
    return Response.json(
      {
        error: `Your ${plan.label} plan allows ${plan.limit} active job posts and you already have ${activeCount}. Close one or upgrade your plan.`,
        code: "PLAN_LIMIT",
      },
      { status: 402 } // 402 Payment Required — the status code for "pay us"
    );
  }

  // ---- Build and store the job ----
  const job: Job = {
    id: newId("j"),
    companyId: company.id,
    recruiterId: user.id,
    title: String(body.title).trim(),
    category: String(body.category),
    type: String(body.type) as JobType,
    salaryMin: body.salaryMin,
    salaryMax: body.salaryMax,
    currency: body.currency ?? "USD",
    city: String(body.city).trim(),
    country: String(body.country).trim(),
    isRemote: Boolean(body.isRemote),
    deadline: String(body.deadline),
    responsibilities: String(body.responsibilities),
    requirements: String(body.requirements),
    benefits: body.benefits ? String(body.benefits) : "",
    // The form's "status" select lets recruiters save a draft instead.
    status: (body.status as JobStatus) ?? "active",
    featured: false, // only an admin marks jobs featured
    createdAt: nowIso(),
  };
  createJob(job);

  return Response.json({ job }, { status: 201 });
}
