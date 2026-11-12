/**
 * PATCH /api/profile — the logged-in user edits their own profile.
 *
 * Handles everything the three Settings pages need:
 *   name, email, avatar URL, headline, bio, skills, resume URL
 *   and password change (requires the CURRENT password to confirm).
 *
 * Every field is optional: send only what changed. The email must stay
 * unique across the platform, so a change is checked first.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  getCurrentUser,
  unauthorized,
} from "@/lib/session";
import { getUserByEmail, updateUser } from "@/lib/store";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  let body: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
    skills?: string[];
    resumeUrl?: string;
    // password change trio
    currentPassword?: string;
    newPassword?: string;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  const patch: Record<string, unknown> = {};

  /* ---- Simple text fields — copy across if present ---- */
  if (body.name !== undefined) {
    if (!body.name.trim()) return badRequest("Name cannot be empty.");
    patch.name = body.name.trim();
  }
  if (body.avatarUrl !== undefined) patch.avatarUrl = body.avatarUrl.trim();
  if (body.headline !== undefined) patch.headline = body.headline.trim();
  if (body.bio !== undefined) patch.bio = body.bio.trim();
  if (body.resumeUrl !== undefined) patch.resumeUrl = body.resumeUrl.trim();
  if (body.skills !== undefined) {
    // Accept an array OR a comma-separated string (the form uses the string)
    // and normalize to a trimmed, de-duplicated list.
    const raw = Array.isArray(body.skills)
      ? body.skills
      : String(body.skills).split(",");
    patch.skills = [
      ...new Set(raw.map((s) => s.trim()).filter(Boolean)),
    ];
  }

  /* ---- Email change (must remain unique) ---- */
  if (body.email !== undefined && body.email.trim() !== user.email) {
    const email = body.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest("That does not look like a valid email address.");
    }
    if (getUserByEmail(email)) {
      return badRequest("That email is already used by another account.");
    }
    patch.email = email;
  }

  /* ---- Password change (confirm with the current password) ---- */
  if (body.newPassword !== undefined) {
    if (!body.currentPassword || body.currentPassword !== user.password) {
      // In production this compare runs against a HASH (bcrypt.compare).
      return badRequest("Your current password is incorrect.");
    }
    if (body.newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters.");
    }
    patch.password = body.newPassword;
  }

  const updated = updateUser(user.id, patch);
  const { password: _pw, ...safeUser } = updated!;
  return Response.json({ user: safeUser });
}
