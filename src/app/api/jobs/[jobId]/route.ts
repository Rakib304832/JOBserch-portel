/**
 * /api/jobs/[jobId] — one specific job.
 *
 * GET    → the job + its company + similar jobs (same category)
 *          Public: only "active" jobs resolve. Recruiters/admins may also
 *          view their own closed/draft posts.
 * PATCH  → edit fields, or flip status (close / reopen / draft).
 *          Only the recruiter who owns the job (or an admin) may do this.
 * DELETE → remove the job entirely. Owner or admin only.
 *
 * The [jobId] in the folder name is a URL parameter: for the URL
 * /api/jobs/j_fe, jobId = "j_fe". Next hands it to us inside ctx.params —
 * as a Promise, so it must be awaited.
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
  deleteJob,
  getCompany,
  getJob,
  listJobs,
  updateJob,
} from "@/lib/store";
import type { JobStatus } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  GET — job details page data                                               */
/* -------------------------------------------------------------------------- */

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/jobs/[jobId]">
) {
  const { jobId } = await ctx.params;

  const job = getJob(jobId);
  if (!job) return notFound("Job not found.");

  // ---- Visibility rules: guests/seekers only see ACTIVE jobs ----
  const user = await getCurrentUser(req);
  const canSeeAll =
    user?.role === "admin" ||
    (user?.role === "recruiter" && user.id === job.recruiterId);
  if (job.status !== "active" && !canSeeAll) {
    return notFound("Job not found."); // closed/draft jobs look "gone" publicly
  }

  // ---- Similar jobs: same category, active, not this one, up to 3 ----
  const similar = listJobs({ category: job.category, status: "active" })
    .filter((j) => j.id !== job.id)
    .slice(0, 3)
    .map((j) => ({ ...j, company: getCompany(j.companyId) }));

  return Response.json({
    job: { ...job, company: getCompany(job.companyId) },
    similar,
  });
}

/* -------------------------------------------------------------------------- */
/*  PATCH — edit or change status                                             */
/* -------------------------------------------------------------------------- */

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/jobs/[jobId]">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { jobId } = await ctx.params;

  const job = getJob(jobId);
  if (!job) return notFound("Job not found.");

  // ---- Ownership check ----
  const isOwner = user.role === "recruiter" && user.id === job.recruiterId;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    return forbidden("You can only manage your own job posts.");
  }

  let body: Partial<{
    status: JobStatus;
    title: string;
    category: string;
    type: string;
    salaryMin: number;
    salaryMax: number;
    currency: string;
    city: string;
    country: string;
    isRemote: boolean;
    deadline: string;
    responsibilities: string;
    requirements: string;
    benefits: string;
  }>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  // Only a whitelist of fields may change, and status must be a known value.
  const patch: Parameters<typeof updateJob>[1] = {};
  if (body.status) {
    if (!["active", "closed", "draft"].includes(body.status)) {
      return badRequest("Status must be active, closed or draft.");
    }
    patch.status = body.status;
  }
  // Copy any other provided fields across (partial update semantics).
  for (const key of [
    "title",
    "category",
    "type",
    "salaryMin",
    "salaryMax",
    "currency",
    "city",
    "country",
    "isRemote",
    "deadline",
    "responsibilities",
    "requirements",
    "benefits",
  ] as const) {
    if (body[key] !== undefined) {
      // TypeScript narrowing: the patch object accepts these keys by design.
      (patch as Record<string, unknown>)[key] = body[key];
    }
  }

  const updated = updateJob(jobId, patch);
  return Response.json({ job: updated });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — remove the post                                                  */
/* -------------------------------------------------------------------------- */

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/jobs/[jobId]">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { jobId } = await ctx.params;

  const job = getJob(jobId);
  if (!job) return notFound("Job not found.");

  const isOwner = user.role === "recruiter" && user.id === job.recruiterId;
  if (!isOwner && user.role !== "admin") {
    return forbidden("You can only delete your own job posts.");
  }

  deleteJob(jobId);
  return Response.json({ ok: true });
}
