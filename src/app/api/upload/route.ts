/**
 * POST /api/upload — save an uploaded file and return its public URL.
 *
 * Used for:
 *   • the seeker's resume (PDF) on the Settings page
 *   • the recruiter's company logo on the My Company form
 *   • avatar photos (any role)
 *
 * HOW IT WORKS
 * The browser sends a FormData (multipart) request with a `file` field.
 * Node writes the bytes into `public/uploads/<folder>/…`, and everything
 * under /public is served as a static file — so the returned URL can be
 * stored on the user/company record and rendered anywhere.
 *
 * PRODUCTION NOTE (see README): a deployed app usually stores uploads in an
 * object store (S3, Cloudinary, UploadThing) because serverless filesystems
 * are read-only. The call-site interface would stay identical.
 */

import { type NextRequest } from "next/server";
import { badRequest, getCurrentUser, unauthorized } from "@/lib/session";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Which file types each folder accepts. */
const ALLOWED: Record<string, RegExp> = {
  resumes: /\.(pdf)$/i, // CVs must be PDFs (per the requirements)
  logos: /\.(png|jpe?g|webp|svg)$/i,
  avatars: /\.(png|jpe?g|webp|gif)$/i,
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // ---- Parse the multipart form ----
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected a multipart form with a 'file' field.");
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "misc");

  if (!(file instanceof File)) {
    return badRequest("No file was sent.");
  }
  const allowed = ALLOWED[folder];
  if (!allowed) {
    return badRequest("folder must be one of: resumes, logos, avatars.");
  }
  if (!allowed.test(file.name)) {
    return badRequest(`Files in "${folder}" must match ${allowed}.`);
  }
  // 5 MB cap keeps the demo folder sane.
  if (file.size > 5 * 1024 * 1024) {
    return badRequest("File is larger than 5 MB.");
  }

  // ---- Build a collision-proof file name: <timestamp>-<safe-name> ----
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;

  // Where the file lands on disk: <project>/public/uploads/<folder>/<name>
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true }); // create folders if missing
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  // The URL the browser can use from now on.
  const url = `/uploads/${folder}/${fileName}`;
  return Response.json({ url }, { status: 201 });
}
