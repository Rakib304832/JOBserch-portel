"use client";

/**
 * ==================================================================
 *  AUTH PANEL — src/app/(secker)/_components/AuthPanel.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The sign-in / create-account card shown INSIDE the private folder
 *  whenever `/api/me` answers 401 (no valid cookie). The layout uses it as
 *  the "front door" of the dashboard, so nobody sees applicant data
 *  without logging in.
 *
 *  ENDPOINTS USED (the ones the Express server exposes)
 *    POST /api/auth/login     { email, password }        -> { ok, user }
 *    POST /api/auth/register  { name, email, password,
 *                               role: "seeker" }         -> { ok, user }
 *
 *  Both endpoints set the httpOnly `token` cookie through the proxy, so
 *  after `onSuccess(user)` the layout can render the dashboard right away.
 *
 *  WHY "seeker" IS HARD-CODED ON REGISTER:
 *  This is the Seeker dashboard. Letting someone create a Recruiter here
 *  would drop them into pages that call seeker-only endpoints (saved jobs,
 *  seeker stats) and produce 403 errors. Recruiter sign-up belongs to the
 *  recruiter experience.
 * ==================================================================
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api, errorMessage } from "../_lib/api";
import type { AuthResponse, Me } from "../_lib/types";

export function AuthPanel({
  onSuccess,
}: {
  onSuccess: (user: Me) => void;
}) {
  // Which half of the card is visible: login form or register form.
  const [mode, setMode] = useState<"login" | "register">("login");

  // Controlled inputs. One object keeps the JSX short.
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /** One change handler for all three fields (name attribute drives it). */
  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  /** Submit whichever form is open. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data =
        mode === "login"
          ? await api<AuthResponse>("/auth/login", {
              method: "POST",
              body: {
                email: form.email.trim(),
                password: form.password,
              },
            })
          : await api<AuthResponse>("/auth/register", {
              method: "POST",
              body: {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                // Seeker dashboard -> always create a seeker account.
                role: "seeker",
              },
            });

      // The cookie is now set; hand the user to the layout.
      onSuccess(data.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /** Flip between login/register and clear any leftover error. */
  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      {/*
        Decorative gradient blobs. `pointer-events-none` makes sure they
        never block a click, and `aria-hidden` hides them from screen
        readers (they carry no information).
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 size-[420px] rounded-full bg-brand-blue/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 size-[380px] rounded-full bg-brand-orange/20 blur-[120px]"
      />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-panel/80 shadow-2xl lg:grid-cols-[1fr_1.05fr]">
        {/* ---------- Left: brand / reassurance ---------- */}
        <div className="hidden flex-col justify-between gap-10 border-r border-line bg-gradient-to-br from-[#141425] to-[#0d0d13] p-8 lg:flex">
          <Link href="/" className="flex items-center gap-1" aria-label="HireLoop home">
            <span className="text-2xl font-semibold tracking-tight text-brand-blue">hire</span>
            <svg viewBox="0 0 54 30" className="h-7 w-[54px]" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="27" height="20" rx="10" stroke="#f97316" strokeWidth="4.5" />
              <rect x="25" y="5" width="27" height="20" rx="10" stroke="#3b82f6" strokeWidth="4.5" />
            </svg>
            <span className="text-2xl font-semibold tracking-tight text-brand-orange">p</span>
          </Link>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-violet">
              Seeker dashboard
            </p>

            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white">
              Your job hunt,
              <br />
              in one place.
            </h1>

            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Track every application and its status",
                "Save jobs and apply in a couple of clicks",
                "See when your plan quota is running low",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Demo login: <span className="text-white">seeker@demo.com</span> ·{" "}
            <span className="text-white">demo1234</span>
          </p>
        </div>

        {/* ---------- Right: the actual form ---------- */}
        <div className="p-6 sm:p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-white lg:hidden"
          >
            <ArrowLeft className="size-3.5" />
            Back to HireLoop
          </Link>

          {/* Tabs: Sign in / Create account */}
          <div className="mt-6 flex rounded-xl border border-line bg-elevated p-1 lg:mt-0">
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => switchMode(value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === value
                    ? "bg-panel text-white shadow-sm"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {value === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h2 className="mt-6 text-xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Start your job hunt"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to open your saved jobs and applications."
              : "Create a free seeker account — no card required."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Full name</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-elevated px-3 focus-within:border-brand-violet">
                  <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    name="name"
                    aria-label="Full name"
                    value={form.name}
                    onChange={updateField}
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="name"
                    placeholder="Rakib Hasan"
                    className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-elevated px-3 focus-within:border-brand-violet">
                <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  name="email"
                  aria-label="Email address"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-elevated px-3 focus-within:border-brand-violet">
                <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  name="password"
                  aria-label="Password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  required
                  // The server requires at least 8 characters on register.
                  minLength={mode === "register" ? 8 : 1}
                  maxLength={72}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_28px_-8px_#5a6bff] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in to dashboard" : "Create free account"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo hint on small screens where the left column is hidden. */}
          <p className="mt-5 text-center text-xs text-muted-foreground lg:hidden">
            Demo: seeker@demo.com / demo1234
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <BriefcaseBusiness className="size-3.5" />
            Your account is protected by an httpOnly session cookie.
          </p>
        </div>
      </div>
    </div>
  );
}
