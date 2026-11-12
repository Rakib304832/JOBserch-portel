/**
 * POST /api/auth/logout — end the session.
 *
 * "Deleting" a cookie means overwriting it with an expired value: the
 * browser immediately throws it away. We also set maxAge to 0 so it doesn't
 * linger. The client clears its local user state afterwards (providers.tsx).
 */

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expire immediately
  });
  return res;
}
