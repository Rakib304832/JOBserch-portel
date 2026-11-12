/**
 * PATCH /api/applications/[applicationId] — a recruiter moves an application
 * along the hiring pipeline.
 *
 * Allowed transitions (per the requirements' status flow):
 *   Applied → Under Review → Shortlisted → Offered  (or → Rejected anytime)
 * The UI's dropdown offers exactly these five values; the API accepts any of
 * them but ONLY from the job's owner or an admin.
 *
 * Changing the status automatically "emails" the applicant — implemented in
 * store.updateApplicationStatus (it writes to the pretend outbox and prints
 * to the server terminal).
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  notFound,
  unauthorized,
} from "@/lib/session";
import { getJob, getApplication, updateApplicationStatus } from "@/lib/store";
import { APPLICATION_STATUSES } from "@/lib/plans";
import type { ApplicationStatus } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/applications/[applicationId]">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { applicationId } = await ctx.params;

  const app = getApplication(applicationId);
  if (!app) return notFound("Application not found.");

  // ---- Ownership: the recruiter who posted the job (or an admin) ----
  const job = getJob(app.jobId);
  const isOwner =
    user.role === "recruiter" && job?.recruiterId === user.id;
  if (!isOwner && user.role !== "admin") {
    return forbidden("Only the job's recruiter (or an admin) can review applications.");
  }

  // ---- Validate the new status ----
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }
  const status = body.status;
  if (
    !status ||
    !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])
  ) {
    return badRequest(
      `Status must be one of: ${APPLICATION_STATUSES.join(", ")}.`
    );
  }

  const updated = updateApplicationStatus(
    applicationId,
    status as ApplicationStatus
  );
  return Response.json({ application: updated });
}
