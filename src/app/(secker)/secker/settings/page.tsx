"use client";

/**
 * ==================================================================
 *  SETTINGS — src/app/(secker)/secker/settings/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  Everything about the seeker's own account:
 *
 *   1. Profile form   — name, headline, bio, skills, photo URL
 *   2. Resume         — upload a PDF, store its URL on the profile
 *   3. Password       — current + new password (bcrypt checked on server)
 *   4. Account summary— email, role, plan, join date, status
 *
 *  API CALLS
 *    GET   /api/me                  (already loaded by the layout)
 *    PATCH /api/me                  profile / password / resume URL
 *    POST  /api/upload?folder=resumes   multipart form, field name "file"
 *
 *  TWO SMALL BUT IMPORTANT DETAILS
 *   · The upload endpoint returns a RELATIVE url ("/uploads/resumes/x.pdf").
 *     The PATCH validator only accepts a full URL, so we resolve it against
 *     `window.location.origin` before saving. The Next.js rewrite then
 *     serves that path from the API server.
 *   · After a successful PATCH we call `refresh()` from the layout context,
 *     so the sidebar name and avatar update without a page reload.
 * ==================================================================
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CircleCheck,
  FileText,
  FileUp,
  KeyRound,
  LoaderCircle,
  Mail,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api, apiUpload, errorMessage } from "../../_lib/api";
import type { Me, MeResponse, UploadResponse } from "../../_lib/types";
import { formatDate, initials } from "../../_lib/format";
import { useSeekerUser } from "../../_lib/user-context";
import { PageHeader } from "../../_components/PageHeader";
import { Notice, type NoticeTone } from "../../_components/Notice";

/** The shape of the profile form fields (skills stay a comma string here). */
type ProfileForm = {
  name: string;
  headline: string;
  bio: string;
  skills: string; // "React, TypeScript" — split on save
  photo: string;
  resumeUrl: string;
};

/** Turn the user object into form values. */
function toForm(user: Me): ProfileForm {
  return {
    name: user.name,
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    skills: (user.skills ?? []).join(", "),
    photo: user.photo ?? "",
    resumeUrl: user.resumeUrl ?? "",
  };
}

export default function SettingsPage() {
  // The live user from the layout (updated by refresh()).
  const { user, refresh } = useSeekerUser();

  // ---------- Profile form ----------
  const [form, setForm] = useState<ProfileForm>(() => toForm(user));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);

  // ---------- Resume upload ----------
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- Password form ----------
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    tone: NoticeTone;
    text: string;
  } | null>(null);

  /**
   * Keep the form in sync with the context user.
   * This matters after `refresh()`: the server may normalize a value
   * (trim spaces, reject a duplicate) and the inputs should show the truth.
   */
  useEffect(() => {
    setForm(toForm(user));
  }, [user]);

  /** One handler for every profile input. */
  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  /* ------------------------------------------------------------------ */
  /*  Save profile                                                       */
  /* ------------------------------------------------------------------ */

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileNotice(null);

    // Cheap local validation; the server repeats it with zod anyway.
    if (form.name.trim().length < 2) {
      setProfileNotice({ tone: "error", text: "Name must be at least 2 characters." });
      return;
    }

    setSavingProfile(true);

    try {
      await api<MeResponse>("/me", {
        method: "PATCH",
        body: {
          name: form.name.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          // "React, SQL" -> ["React", "SQL"] (the server also accepts text,
          // but sending an array keeps the intent explicit).
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          photo: form.photo.trim(),
          resumeUrl: form.resumeUrl.trim(),
        },
      });

      // Re-read /api/me so the sidebar and the form show server truth.
      await refresh();

      setProfileNotice({ tone: "success", text: "Profile saved." });
    } catch (err) {
      setProfileNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setSavingProfile(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Resume upload                                                      */
  /* ------------------------------------------------------------------ */

  async function uploadResume(file: File) {
    setProfileNotice(null);

    // The server only accepts application/pdf in the "resumes" folder.
    if (file.type !== "application/pdf") {
      setProfileNotice({ tone: "error", text: "Please choose a PDF file." });
      return;
    }

    setUploading(true);

    try {
      const body = new FormData();
      // The multer middleware on the server expects the field name "file".
      body.append("file", file);

      const uploaded = await apiUpload<UploadResponse>("/upload?folder=resumes", body);

      // "/uploads/…" -> "http://localhost:3000/uploads/…" so the PATCH
      // validator (z.url()) accepts it. The rewrite serves it from :5000.
      const absoluteUrl = new URL(uploaded.url, window.location.origin).toString();

      // Save the new URL on the user document straight away.
      await api<MeResponse>("/me", {
        method: "PATCH",
        body: { resumeUrl: absoluteUrl },
      });

      setForm((current) => ({ ...current, resumeUrl: absoluteUrl }));
      await refresh();

      setProfileNotice({ tone: "success", text: "Resume uploaded and attached to your profile." });
    } catch (err) {
      setProfileNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setUploading(false);

      // Reset the input so choosing the same file again still fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Change password                                                    */
  /* ------------------------------------------------------------------ */

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordNotice(null);

    if (passwords.newPassword.length < 8) {
      setPasswordNotice({
        tone: "error",
        text: "The new password needs at least 8 characters.",
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordNotice({ tone: "error", text: "The two new passwords do not match." });
      return;
    }

    setSavingPassword(true);

    try {
      await api<MeResponse>("/me", {
        method: "PATCH",
        body: {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
      });

      // Clear the fields so the password does not linger on screen.
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordNotice({ tone: "success", text: "Password updated." });
    } catch (err) {
      setPasswordNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Keep your profile sharp — recruiters see this information next to your applications."
        actions={
          <Link
            href="/secker/billing"
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated"
          >
            Manage plan
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* ============================================================ */}
        {/*  Left column: forms                                          */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* ---------- Profile ---------- */}
          <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your headline and skills appear on the profile recruiters review.
                </p>
              </div>

              <span className="flex size-9 items-center justify-center rounded-xl border border-brand-violet/30 bg-brand-violet/10 text-violet-300">
                <Camera className="size-4" aria-hidden="true" />
              </span>
            </div>

            {profileNotice && (
              <div className="mt-4">
                <Notice tone={profileNotice.tone} onClose={() => setProfileNotice(null)}>
                  {profileNotice.text}
                </Notice>
              </div>
            )}

            <form onSubmit={saveProfile} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Full name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    minLength={2}
                    maxLength={60}
                    className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white focus:border-brand-violet focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">
                    Headline <span className="opacity-60">(max 80)</span>
                  </span>
                  <input
                    name="headline"
                    value={form.headline}
                    onChange={updateField}
                    maxLength={80}
                    placeholder="Frontend developer · React & TypeScript"
                    className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  About you <span className="opacity-60">(max 1000)</span>
                </span>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={updateField}
                  rows={4}
                  maxLength={1000}
                  placeholder="A short paragraph about your experience and what you are looking for."
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Skills <span className="opacity-60">(comma separated, max 30)</span>
                </span>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={updateField}
                  placeholder="React, TypeScript, Node.js, MongoDB"
                  className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
                />
              </label>

              {/* Live preview of the parsed chips. */}
              {form.skills.trim() !== "" && (
                <div className="flex flex-wrap gap-2">
                  {form.skills
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                    .slice(0, 30)
                    .map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-line bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                </div>
              )}

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Profile photo URL
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  {form.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary external image URL
                    <img
                      src={form.photo}
                      alt=""
                      className="size-10 shrink-0 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4d6bff] to-[#7c5cff] text-xs font-semibold text-white">
                      {initials(form.name || user.name)}
                    </span>
                  )}

                  <input
                    name="photo"
                    value={form.photo}
                    onChange={updateField}
                    placeholder="https://example.com/avatar.png"
                    className="w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
                  />
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setForm(toForm(user))}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          {/* ---------- Resume ---------- */}
          <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Resume</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a PDF (max 5 MB). It is stored by the API and linked to your profile.
                </p>
              </div>

              <span className="flex size-9 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-sky-300">
                <FileText className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-line bg-elevated/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-panel text-muted-foreground">
                  <FileUp className="size-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  {form.resumeUrl ? (
                    <>
                      <p className="text-sm font-medium text-white">Resume attached</p>
                      <a
                        href={form.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-[260px] truncate text-xs text-brand-violet hover:underline"
                      >
                        {form.resumeUrl}
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white">No resume yet</p>
                      <p className="text-xs text-muted-foreground">
                        PDF only · up to 5 MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Hidden real input + a styled label/button. */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadResume(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-brand-violet/50 disabled:opacity-60"
              >
                {uploading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploading ? "Uploading…" : form.resumeUrl ? "Replace resume" : "Upload PDF"}
              </button>
            </div>

            {/* Manual URL field for people hosting a CV elsewhere. */}
            <label className="mt-4 block">
              <span className="text-xs font-medium text-muted-foreground">
                Or paste a resume URL
              </span>
              <input
                name="resumeUrl"
                value={form.resumeUrl}
                onChange={updateField}
                placeholder="https://example.com/my-cv.pdf"
                className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
              />
            </label>
          </section>

          {/* ---------- Password ---------- */}
          <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change the password used for email sign-in.
                </p>
              </div>

              <span className="flex size-9 items-center justify-center rounded-xl border border-line bg-elevated text-muted-foreground">
                <KeyRound className="size-4" aria-hidden="true" />
              </span>
            </div>

            {passwordNotice && (
              <div className="mt-4">
                <Notice
                  tone={passwordNotice.tone}
                  onClose={() => setPasswordNotice(null)}
                >
                  {passwordNotice.text}
                </Notice>
              </div>
            )}

            <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Current password
                </span>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  required
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white focus:border-brand-violet focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">New password</span>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white focus:border-brand-violet focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Confirm new password
                </span>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2.5 text-sm text-white focus:border-brand-violet focus:outline-none"
                />
              </label>

              <div className="flex justify-end sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-xl border border-line bg-elevated px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-brand-violet/50 disabled:opacity-60"
                >
                  {savingPassword ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  {savingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* ============================================================ */}
        {/*  Right column: account summary                               */}
        {/* ============================================================ */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-panel/80 p-5">
            <div className="flex flex-col items-center text-center">
              {user.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar URL
                <img
                  src={user.photo}
                  alt={user.name}
                  className="size-20 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4d6bff] to-[#7c5cff] text-2xl font-semibold text-white">
                  {initials(user.name)}
                </span>
              )}

              <h2 className="mt-3 text-lg font-semibold text-white">{user.name}</h2>

              {user.headline && (
                <p className="mt-1 text-sm text-muted-foreground">{user.headline}</p>
              )}

              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-violet/40 bg-brand-violet/15 px-3 py-1 text-xs font-semibold capitalize text-violet-200">
                <BadgeCheck className="size-3.5" />
                {user.plan} plan
              </span>
            </div>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" /> Email
                </dt>
                <dd className="truncate text-white">{user.email}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="size-3.5" /> Role
                </dt>
                <dd className="capitalize text-white">{user.role}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Joined
                </dt>
                <dd className="text-white">{formatDate(user.createdAt)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <CircleCheck className="size-3.5" /> Status
                </dt>
                <dd className="capitalize text-emerald-300">{user.status}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="size-3.5" /> Sign-in
                </dt>
                <dd className="capitalize text-white">{user.provider ?? "local"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-gradient-to-br from-[#15152a] to-[#101016] p-5">
            <p className="text-sm font-semibold text-white">Profile tips</p>

            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Use a headline that names your strongest skill.</li>
              <li>List 5–10 skills — enough to match searches, not a wall of tags.</li>
              <li>Keep the bio to two or three sentences about impact.</li>
            </ul>

            <Link
              href="/secker/billing"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet hover:text-white"
            >
              Review your plan
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
