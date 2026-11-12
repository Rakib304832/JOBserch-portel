/**
 * GET /api/stats/public — the "Live stats" strip on the home page hero.
 *
 * Numbers are computed from the store right now, so they update as soon as
 * data changes (new company approved → the Companies count moves up).
 * "Satisfaction Rate" is a marketing constant (there is no survey system).
 */

import { type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { countUsersByRole, listCompanies, listJobs } from "@/lib/store";
import type { PublicStats } from "@/lib/api-types";

export async function GET(req: NextRequest) {
  // Reading the session (even though the result is unused) touches the
  // request object, which tells Next.js this route must be evaluated at
  // REQUEST time — otherwise it would be prerendered once at build time and
  // the "live" stats would freeze.
  await getCurrentUser(req);

  const stats: PublicStats["stats"] = [
    {
      value: `${listJobs({ status: "active" }).length.toLocaleString()}+`,
      label: "Active Jobs",
    },
    {
      value: `${listCompanies({ status: "approved" }).length.toLocaleString()}+`,
      label: "Companies",
    },
    {
      value: `${countUsersByRole("seeker").toLocaleString()}+`,
      label: "Job Seekers",
    },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return Response.json({ stats });
}
