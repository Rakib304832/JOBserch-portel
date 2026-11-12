/**
 * /api/admin/users — the Admin's "Manage Users" screen.
 *
 * GET   → all users, filterable by email (?email=…) and role (?role=…).
 * PATCH → moderation actions, one per request:
 *           { userId, action: "make_recruiter" }  convert a Seeker → Recruiter
 *           { userId, action: "make_seeker" }     convert a Recruiter → Seeker
 *           { userId, action: "suspend" }         freeze the account (no login)
 *           { userId, action: "activate" }        unfreeze it
 *         The UI shows a confirmation dialog BEFORE calling these, since the
 *         spec requires one for the destructive/irreversible role changes.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  notFound,
  unauthorized,
} from "@/lib/session";
import { getUser, listUsers, updateUser } from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden("Admins only.");

  const users = listUsers({
    email: req.nextUrl.searchParams.get("email") ?? undefined,
    role: req.nextUrl.searchParams.get("role") ?? undefined,
  });

  // Strip passwords before sending ANY list to the browser.
  const safe = users.map(({ password: _pw, ...rest }) => rest);
  return Response.json({ users: safe });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser(req);
  if (!admin) return unauthorized();
  if (admin.role !== "admin") return forbidden("Admins only.");

  let body: { userId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  const target = body.userId ? getUser(body.userId) : undefined;
  if (!target) return notFound("User not found.");

  switch (body.action) {
    case "make_recruiter":
      if (target.role !== "seeker") {
        return badRequest("Only seekers can be converted to recruiters.");
      }
      updateUser(target.id, { role: "recruiter" });
      break;

    case "make_seeker":
      if (target.role !== "recruiter") {
        return badRequest("Only recruiters can be converted to seekers.");
      }
      updateUser(target.id, { role: "seeker" });
      break;

    case "suspend":
      if (target.role === "admin") {
        return badRequest("You cannot suspend another admin.");
      }
      updateUser(target.id, { suspended: true });
      break;

    case "activate":
      updateUser(target.id, { suspended: false });
      break;

    default:
      return badRequest("Unknown action.");
  }

  const { password: _pw, ...safe } = updateUser(target.id, {})!;
  return Response.json({ user: safe });
}
