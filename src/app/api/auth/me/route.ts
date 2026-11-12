/**
 * GET /api/auth/me — "who am I right now?"
 *
 * The browser calls this when the app boots (see providers.tsx). It reads the
 * session cookie; a valid one returns the user (minus the password), an
 * invalid/missing one returns 401 so the client shows the signed-out state.
 *
 * Note: reading `req.cookies` makes this route runtime-only (never baked into
 * the build) — exactly what an auth check needs.
 */

import { type NextRequest } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // Strip the password before answering (the browser never needs it).
  const { password: _pw, ...safeUser } = user;
  return Response.json({ user: safeUser });
}
