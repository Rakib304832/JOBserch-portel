/**
 * /api/saved-jobs — the seeker's bookmarks.
 *
 * GET    → the saved list (each row: bookmark + job + company)
 * POST   → bookmark a job: { jobId }. Enforces the plan's saved-jobs cap
 *          (Free = 10, Pro/Premium = unlimited).
 * DELETE → remove a bookmark: { jobId }.
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
  countSavedJobs,
  getCompany,
  getJob,
  isJobSaved,
  listSavedJobs,
  saveJob,
  unsaveJob,
} from "@/lib/store";
import { getSeekerPlan } from "@/lib/plans";
import type { SavedJobWithDetails } from "@/lib/api-types";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "seeker") {
    return forbidden("Only seekers have saved jobs.");
  }

  // Enrich with job + company so the table can render everything in one pass.
  const saved: SavedJobWithDetails[] = listSavedJobs(user.id)
    .map((sv) => ({
      ...sv,
      job: getJob(sv.jobId)!,
      company: getCompany(getJob(sv.jobId)?.companyId ?? "")!,
    }))
    // A job may have been deleted after saving — drop dead rows so the
    // table never shows a broken entry.
    .filter((sv) => Boolean(sv.job));

  return Response.json({ saved });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "seeker") {
    return forbidden("Only seekers can save jobs.");
  }

  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }
  const job = body.jobId ? getJob(body.jobId) : undefined;
  if (!job) return notFound("Job not found.");

  if (isJobSaved(user.id, job.id)) {
    return badRequest("This job is already saved.");
  }

  // ---- Plan cap: Free plan may keep up to 10 bookmarks ----
  const plan = getSeekerPlan(user.plan);
  const used = countSavedJobs(user.id);
  if (plan.id === "free" && used >= 10) {
    return Response.json(
      {
        error: "The Free plan keeps up to 10 saved jobs. Upgrade for unlimited.",
        code: "PLAN_LIMIT",
      },
      { status: 402 }
    );
  }

  saveJob(user.id, job.id);
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }
  if (!body.jobId) return badRequest("jobId is required.");

  const removed = unsaveJob(user.id, body.jobId);
  if (!removed) return notFound("This job was not in your saved list.");
  return Response.json({ ok: true });
}
