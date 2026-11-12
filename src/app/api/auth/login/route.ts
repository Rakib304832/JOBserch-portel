/**
 * POST /api/auth/login — sign in with email + password.
 *
 * FLOW
 * 1. The browser posts { email, password } as JSON.
 * 2. We look up the user by email (case-insensitive).
 * 3. We compare passwords (demo: plain strings; production: bcrypt.compare).
 * 4. Suspended accounts are refused with a clear message.
 * 5. On success we set the signed session cookie (httpOnly) and return the
 *    user WITHOUT the password field.
 */

import { NextResponse, type NextRequest } from "next/server";
import { badRequest, unauthorized } from "@/lib/session";
import { getUserByEmail } from "@/lib/store";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";

export async function POST(req: NextRequest) {
  // ---- 1. Parse the JSON body (wrapped so garbage input can't crash us) ----
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body with email and password.");
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return badRequest("Email and password are both required.");
  }

  // ---- 2/3. Find the user and check the password ----
  const found = getUserByEmail(email);
  if (!found || found.password !== password) {
    // Deliberately vague message: we never reveal WHICH half was wrong —
    // that detail helps attackers who are guessing passwords.
    return unauthorized("Invalid email or password.");
  }

  // ---- 4. Suspended accounts cannot log in ----
  if (found.suspended) {
    return unauthorized("This account has been suspended by an admin.");
  }

  // ---- 5. Build the response: user JSON + session cookie ----
  // Destructuring with a rename is the cleanest way to REMOVE a field:
  // `password: _pw` captures the password into a variable we ignore.
  const { password: _pw, ...safeUser } = found;

  const res = NextResponse.json({ user: safeUser });
  // NextResponse.cookies.set is the typed helper for "Set-Cookie".
  //   httpOnly    → JavaScript in the browser can never read the cookie
  //   sameSite    → not attached to cross-site requests (CSRF protection)
  //   maxAge      → the session lives 30 days, then auto-expires
  res.cookies.set(SESSION_COOKIE, createSessionToken(found.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/", // valid for the whole site
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
