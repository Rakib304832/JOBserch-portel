/**
 * GET /api/stats/public — the "Live stats" strip on the home page hero.
 *
 * Numbers are computed from the store right now, so they update as soon as
 * data changes (new company approved → the Companies count moves up).
 * "Satisfaction Rate" is a marketing constant (there is no survey system).
 */

import { type NextRequest } from "next/server";
import { countUsersByRole, listCompanies, listJobs } from "@/lib/store";
import type { PublicStats } from "@/lib/api-types";

export async function GET(_req: NextRequest) {
  void _req; // no session needed; param kept for a consistent handler shape

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
