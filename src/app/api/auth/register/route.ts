/**
 * POST /api/auth/register — create a new Seeker or Recruiter account.
 *
 * RULES
 * • Only "seeker" and "recruiter" can self-register — "admin" accounts are
 *   created by the platform (or a seed), never by public sign-up.
 * • Emails are unique: registering twice with the same address is refused.
 * • Password needs at least 8 characters (a minimal demo policy).
 * • New seekers start on the "free" plan; new recruiters have no company
 *   yet — they register one from their dashboard afterwards.
 *
 * On success the user is logged in immediately (cookie set), which is why
 * the signup page can redirect straight to the dashboard.
 */

import { NextResponse, type NextRequest } from "next/server";
import { badRequest } from "@/lib/session";
import { createUser, getUserByEmail, newId, nowIso } from "@/lib/store";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";
import type { UserRole } from "@/lib/types";

export async function POST(req: NextRequest) {
  // ---- 1. Read + validate the form data ----
  let body: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const role = body.role ?? "seeker";

  if (!name || !email || !password) {
    return badRequest("Name, email and password are all required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // A pragmatic "does it look like an email?" check — full RFC validation
    // is overkill for a demo.
    return badRequest("That does not look like a valid email address.");
  }
  if (password.length < 8) {
    return badRequest("Password must be at least 8 characters long.");
  }
  if (role !== "seeker" && role !== "recruiter") {
    return badRequest("Role must be either seeker or recruiter.");
  }
  if (getUserByEmail(email)) {
    // 400 with a friendly message; the UI shows it under the form.
    return badRequest("An account with this email already exists.");
  }

  // ---- 2. Create the user record ----
  const user = {
    id: newId("u"),
    name,
    email,
    password, // demo only — real apps store a salted bcrypt/argon2 hash
    role: role as UserRole,
    avatarUrl: "",
    suspended: false,
    createdAt: nowIso(),
    plan: "free" as const, // every new account starts on the free tier
  };
  createUser(user);

  // ---- 3. Log them in immediately + return the safe copy ----
  const { password: _pw, ...safeUser } = user;
  const res = NextResponse.json({ user: safeUser }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
