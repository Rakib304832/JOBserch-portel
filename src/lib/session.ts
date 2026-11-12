/**
 * ============================================================================
 * session.ts — "who is logged in?" (cookie-based demo authentication)
 * ============================================================================
 *
 * HOW LOGIN WORKS ON THE WEB (the 60-second version)
 * 1. You submit your email + password on /signin.
 * 2. The server checks them. If they match, it creates a small "ticket"
 *    that says "this browser belongs to user X" and sets it as a COOKIE —
 *    a tiny piece of text the browser stores and automatically sends back
 *    with every future request.
 * 3. The ticket is marked httpOnly, which means JavaScript in the browser
 *    can never read it — only the server can. That's the standard defense
 *    against XSS token theft.
 *
 * THE TICKET'S FORMAT ("signed token")
 *      base64(payload) . HMAC-SHA256(payload, secret)
 *   payload = { uid, exp }  (who + expiry timestamp)
 *   The second part is a cryptographic signature computed with a secret
 *   known only to the server. If anyone edits the payload, the signature no
 *   longer matches and the server rejects it. The payload is only base64
 *   (readable), never trusted on its own — the signature is what proves it.
 *
 * WHERE REAL APPS DIFFER
 * Production apps typically use battle-tested libraries (better-auth, Auth.js,
 * Clerk…) and a real database for users. The *flow* is exactly the same as
 * here; only the storage and crypto details are industrialized. See README →
 * "How login works in this demo".
 * ============================================================================
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { User } from "./types";
import { getUser } from "./store";

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

/** The cookie's name. It only needs to be unique inside your domain. */
export const SESSION_COOKIE = "hireloop_session";

/** 30 days in seconds — after that the browser drops the cookie (auto-logout). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * The signing secret. Read from an environment variable when available so
 * every developer/deployment can have their own. Falls back to a fixed
 * demo value so the project runs with zero setup.
 */
const SECRET =
  process.env.SESSION_SECRET ?? "hireloop-demo-secret-do-not-use-in-production";

/* -------------------------------------------------------------------------- */
/*  Creating and reading tickets                                              */
/* -------------------------------------------------------------------------- */

interface SessionPayload {
  uid: string; // user id
  exp: number; // expiry as a Unix timestamp (seconds)
}

/** Compute the HMAC signature of a base64 payload with our secret. */
function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

/**
 * Build a full ticket string for a user id.
 * Used by /api/auth/login and /api/auth/register right after successful
 * credential checks.
 */
export function createSessionToken(uid: string): string {
  const payload: SessionPayload = {
    uid,
    // `exp` = now + 30 days (in seconds). Date.now() is ms, hence the /1000.
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a ticket and return the user id inside it — or null if anything is
 * wrong (malformed, signature mismatch, expired). Never throws.
 */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null; // no signature part at all

  const [payloadB64, signature] = [
    token.slice(0, dot),
    token.slice(dot + 1),
  ];

  // Recompute the expected signature and compare in constant time
  // (timingSafeEqual prevents "timing attacks" that read bytes one by one).
  const expected = sign(payloadB64);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as SessionPayload;
    if (!payload.uid) return null;
    if (payload.exp * 1000 < Date.now()) return null; // expired → logged out
    return payload.uid;
  } catch {
    return null; // garbage payload → not logged in
  }
}

/* -------------------------------------------------------------------------- */
/*  Reading the logged-in user inside an API route                            */
/* -------------------------------------------------------------------------- */

/**
 * The one-liner every protected route starts with:
 *
 *     const user = await getCurrentUser(req);
 *     if (!user) return unauthorized();
 *
 * It reads the cookie from the incoming request, verifies the signature,
 * loads the user record, and — importantly — refuses suspended accounts,
 * so an Admin suspension takes effect immediately.
 *
 * NOTE: because this reads `req.cookies` (a *request* property), Next.js
 * marks every route that calls it as "runtime" — it never gets baked into
 * the build. That is exactly what we want for personalized data.
 */
export async function getCurrentUser(req: NextRequest): Promise<User | null> {
  const uid = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = getUser(uid);
  if (!user || user.suspended) return null;
  return user;
}

/* -------------------------------------------------------------------------- */
/*  Ready-made JSON error responses                                           */
/* -------------------------------------------------------------------------- */

/** 401 = "not logged in" (or "wrong credentials" when a message is given). */
export function unauthorized(msg = "You must be logged in.") {
  return Response.json({ error: msg }, { status: 401 });
}

/** 403 = "logged in, but not allowed" (wrong role, not the owner…). */
export function forbidden(msg = "You do not have access to this.") {
  return Response.json({ error: msg }, { status: 403 });
}

/** 404 = "that thing does not exist". */
export function notFound(msg = "Not found.") {
  return Response.json({ error: msg }, { status: 404 });
}

/** 400 = "your input is wrong" (missing fields, bad email…). */
export function badRequest(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}
