/**
 * /api/companies — the companies collection.
 *
 * GET   → public list of APPROVED companies (with open-job counts), or ALL
 *         companies when the caller is an admin (Manage Companies table).
 * POST  → a recruiter registers their company. It starts as "pending" and
 *         stays invisible on the public site until an admin approves it.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/session";
import {
  createCompany,
  getCompanyByRecruiter,
  listCompanies,
  listJobs,
  newId,
  nowIso,
} from "@/lib/store";
import { INDUSTRIES } from "@/lib/plans";

/* -------------------------------------------------------------------------- */
/*  GET — list                                                                */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req); // also marks the route runtime-dynamic
  const sp = req.nextUrl.searchParams;
  const industry = sp.get("industry") ?? undefined;

  // Admins may request everything (?all=true) for their moderation table.
  const wantsAll = sp.get("all") === "true" && user?.role === "admin";
  const companies = listCompanies({
    status: wantsAll ? undefined : "approved",
    industry,
  });

  // Attach "openJobs" = number of ACTIVE posts, shown on each card.
  const enriched = companies.map((company) => ({
    ...company,
    openJobs: listJobs({ companyId: company.id, status: "active" }).length,
  }));

  return Response.json({ companies: enriched });
}

/* -------------------------------------------------------------------------- */
/*  POST — register a company                                                 */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "recruiter") {
    return forbidden("Only recruiters can register a company.");
  }
  if (getCompanyByRecruiter(user.id)) {
    return forbidden("You already registered a company.");
  }

  let body: {
    name?: string;
    industry?: string;
    website?: string;
    location?: string;
    employeeCount?: string;
    logoUrl?: string;
    description?: string;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  // ---- Validation ----
  if (!body.name?.trim()) return badRequest("Company name is required.");
  if (!body.industry || !INDUSTRIES.includes(body.industry as (typeof INDUSTRIES)[number])) {
    return badRequest("Pick a valid industry.");
  }

  const company = {
    id: newId("c"),
    name: body.name.trim(),
    industry: body.industry,
    website: body.website?.trim() ?? "",
    location: body.location?.trim() ?? "",
    employeeCount: body.employeeCount ?? "1-10",
    logoUrl: body.logoUrl?.trim() ?? "",
    description: body.description?.trim() ?? "",
    recruiterId: user.id,
    recruiterEmail: user.email,
    status: "pending" as const, // ← awaits Admin approval before going public
    plan: "free" as const, // every new company starts on the Free plan
    createdAt: nowIso(),
  };
  createCompany(company);

  return Response.json({ company }, { status: 201 });
}
