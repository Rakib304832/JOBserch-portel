/**
 * /api/companies/[companyId] — one company.
 *
 * GET    → the company + its ACTIVE job posts (company profile page).
 * PATCH  → two very different uses, decided by role:
 *            • the owning recruiter edits company details (name, logo…)
 *            • an ADMIN sets { status: "approved" | "rejected" } — the
 *              moderation action from the Manage Companies table.
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
  getCompany,
  listJobs,
  sendEmail,
  updateCompany,
} from "@/lib/store";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/companies/[companyId]">
) {
  const { companyId } = await ctx.params;
  const company = getCompany(companyId);
  if (!company) return notFound("Company not found.");

  const user = await getCurrentUser(req); // also keeps the route dynamic

  // Non-approved companies are only visible to their recruiter + admins —
  // a "pending" or "rejected" company must not leak onto the public site.
  const isOwner = user?.role === "recruiter" && user.id === company.recruiterId;
  if (company.status !== "approved" && !isOwner && user?.role !== "admin") {
    return notFound("Company not found.");
  }

  const jobs = listJobs({ companyId, status: "active" });
  return Response.json({ company, jobs });
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/companies/[companyId]">
) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const { companyId } = await ctx.params;

  const company = getCompany(companyId);
  if (!company) return notFound("Company not found.");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  /* ------------------------------------------------------------------ */
  /*  CASE A — the ADMIN approves / rejects the company                  */
  /* ------------------------------------------------------------------ */
  if (body.status) {
    if (user.role !== "admin") {
      return forbidden("Only admins can change a company's status.");
    }
    const status = body.status;
    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return badRequest("Status must be approved, rejected or pending.");
    }
    updateCompany(companyId, { status });

    // Notify the recruiter who registered it — a nice touch, and the spec
    // likes email notifications. In production this is a real email.
    if (status !== company.status) {
      sendEmail(
        company.recruiterEmail,
        `Your company "${company.name}" was ${status}`,
        status === "approved"
          ? "Congratulations! Your company is now publicly visible on HireLoop and you can post jobs."
          : "Your company registration was reviewed and not approved. You may update its details and resubmit."
      );
    }
    return Response.json({ company: updateCompany(companyId, {}) });
  }

  /* ------------------------------------------------------------------ */
  /*  CASE B — the owning recruiter edits company details                */
  /* ------------------------------------------------------------------ */
  const isOwner = user.role === "recruiter" && user.id === company.recruiterId;
  if (!isOwner && user.role !== "admin") {
    return forbidden("You can only edit your own company.");
  }

  // Whitelist the editable fields.
  const patch: Record<string, string> = {};
  for (const key of [
    "name",
    "industry",
    "website",
    "location",
    "employeeCount",
    "logoUrl", // company logo (an image URL or an uploaded file path)
    "description",
  ]) {
    if (typeof body[key] === "string") patch[key] = body[key] as string;
  }
  // If an approved company edits its details, it stays approved — but in a
  // stricter platform you might flip it back to "pending" for re-review.
  const updated = updateCompany(companyId, patch);
  return Response.json({ company: updated });
}
