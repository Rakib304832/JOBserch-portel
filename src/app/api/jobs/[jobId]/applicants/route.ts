/**
 * GET /api/jobs/[jobId]/applicants — everyone who applied to one job.
 *
 * Access: the recruiter who owns the job, or an admin. Everyone else gets 403.
 * This backs the recruiter's "View Applicants" screen.
 */

import { type NextRequest } from "next/server";
import {
  forbidden,
  getCurrentUser,
  notFound,
  unauthorized,
} from "@/lib/session";
import { getJob, listApplications, getUser } from "@/lib/store";
import type { ApplicantRow } from "@/lib/api-types";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/jobs/[jobId]/applicants">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { jobId } = await ctx.params;

  const job = getJob(jobId);
  if (!job) return notFound("Job not found.");

  // ---- Only the job's owner (or an admin) may see its applicants ----
  if (user.role !== "admin" && !(user.role === "recruiter" && user.id === job.recruiterId)) {
    return forbidden("Only the job's recruiter (or an admin) can view applicants.");
  }

  // Enrich each application with the seeker's public info for the table.
  const applicants: ApplicantRow[] = listApplications({ jobId }).map((app) => {
    const seeker = getUser(app.seekerId);
    return {
      ...app,
      seeker: {
        id: app.seekerId,
        name: seeker?.name ?? "Unknown",
        email: seeker?.email ?? "",
        avatarUrl: seeker?.avatarUrl ?? "",
        headline: seeker?.headline,
        resumeUrl: seeker?.resumeUrl,
      },
    };
  });

  return Response.json({ job, applicants });
}
