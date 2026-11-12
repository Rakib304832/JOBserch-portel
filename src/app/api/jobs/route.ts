/**
 * GET /api/jobs — the job catalog with every filter the Browse Jobs page has.
 *
 * Query parameters (all optional, combined with AND):
 *   q          free-text keyword (matches title or company name)
 *   type       "Full-time" | "Part-time" | "Remote" | "Contract" | "Internship"
 *   category   "Engineering" | "Design" | …
 *   location   substring match on "City, Country"
 *   minSalary  jobs whose salaryMax ≥ this number
 *   featured   "true" → only home-page picks
 *   status     "active" (public) — dashboards omit it to see their own drafts
 *   companyId  jobs of one company (company profile page)
 *
 * The response enriches each job with its company, plus per-viewer flags
 * (saved / applied) when the viewer is a logged-in seeker — reading the
 * session cookie here also keeps the route runtime-dynamic, so newly posted
 * jobs always show up immediately.
 */

import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  findApplication,
  getCompany,
  isJobSaved,
  listJobs,
} from "@/lib/store";
import type { JobWithStatus } from "@/lib/api-types";

export async function GET(req: NextRequest) {
  // Read the session BEFORE parsing filters (also marks the route dynamic).
  const user = await getCurrentUser(req);

  // ---- turn ?a=b&c=d into a plain object ----
  const sp = req.nextUrl.searchParams;
  const opts = {
    q: sp.get("q") ?? undefined,
    type: sp.get("type") ?? undefined,
    category: sp.get("category") ?? undefined,
    location: sp.get("location") ?? undefined,
    // Number("") is 0, so guard empty strings before converting
    minSalary: sp.get("minSalary") ? Number(sp.get("minSalary")) : undefined,
    featured: sp.get("featured") === "true" ? true : undefined,
    status: sp.get("status") ?? "active", // public site only sees active jobs
    companyId: sp.get("companyId") ?? undefined,
  };

  // Enrich: attach company + personal flags for each matching job.
  const jobs = listJobs(opts).map((job) => {
    const company = getCompany(job.companyId);
    return {
      ...job,
      company,
      // Only meaningful for seekers; false for guests and recruiters.
      saved: user?.role === "seeker" ? isJobSaved(user.id, job.id) : false,
      applied:
        user?.role === "seeker"
          ? Boolean(findApplication(user.id, job.id))
          : false,
    };
  });

  return Response.json({ jobs });
}
