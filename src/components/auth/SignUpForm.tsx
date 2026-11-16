"use client";

/**
 * ============================================================================
 * components/auth/SignUpForm.tsx — the create-account card
 * ============================================================================
 *
 * WHY IT EXISTS
 * "Get Started", "Create a free account" and the hero's "Post a Job" all lead
 * to /signup. The route did not exist, so this form (plus the page beside it)
 * makes those buttons real. It uses the backend's existing endpoint:
 *
 *      POST /api/auth/register { name, email, password, role }
 *        → { user } + session cookie (already signed in)
 *
 * ROLE CHOICE
 * The requirements doc only allows self-registration as a seeker or a
 * recruiter ("Post a Job" links with ?role=recruiter). Admin accounts are
 * created by the platform, so no third option is offered.
 *
 * WHY "use client"
 * The role tabs, the inputs and the submit request all need the browser. The
 * page wraps this in <Suspense> because it reads useSearchParams().
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch } from "@/lib/api-client";
import { setCurrentUser, type CurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

/** The two roles a visitor may create for themselves. */
type SignUpRole = "seeker" | "recruiter";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?role=recruiter (from "Post a Job") preselects the recruiter tab.
  const initialRole: SignUpRole =
    searchParams.get("role") === "recruiter" ? "recruiter" : "seeker";

  // ?next=/jobs/j_fe — optional destination after the account is created.
  const next = searchParams.get("next") ?? "/";

  // ---- form state ----
  const [role, setRole] = React.useState<SignUpRole>(initialRole);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /** Create the account and land the new user on the site, already signed in. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Cheap client-side check — the server validates again and is the authority.
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<{ user: CurrentUser }>("/api/auth/register", {
        method: "POST",
        body: { name, email, password, role },
      });

      // The register route logs the user in immediately (cookie included).
      setCurrentUser(data.user);

      router.replace(next);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create the account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      {/* ---- Title ---- */}
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Free forever. Upgrade only if you need more applications or job posts.
      </p>

      {/* ---- Role picker ---- */}
      <div className="mt-6">
        <span className="mb-1.5 block text-xs font-medium text-zinc-400">
          I am a…
        </span>
        <div
          role="tablist"
          aria-label="Account type"
          className="grid grid-cols-2 gap-2"
        >
          {(
            [
              {
                id: "seeker" as const,
                label: "Job seeker",
                hint: "Find and apply to roles",
                Icon: UserRound,
              },
              {
                id: "recruiter" as const,
                label: "Recruiter",
                hint: "Post jobs and hire",
                Icon: Briefcase,
              },
            ]
          ).map((tab) => {
            const selected = role === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setRole(tab.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-indigo-400/50 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                  <tab.Icon
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4",
                      selected ? "text-indigo-300" : "text-zinc-500"
                    )}
                  />
                  {tab.label}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {tab.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Name ---- */}
      <div className="mt-4">
        <Field label="Full name" htmlFor="signup-name">
          <Input
            id="signup-name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sam Seeker"
            required
          />
        </Field>
      </div>

      {/* ---- Email ---- */}
      <div className="mt-4">
        <Field label="Email" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
      </div>

      {/* ---- Password ---- */}
      <div className="mt-4">
        <Field
          label="Password"
          htmlFor="signup-password"
          hint="At least 8 characters."
        >
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
        </Field>
      </div>

      {/* ---- Server error ---- */}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {/* ---- Submit ---- */}
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
        {submitting ? "Creating account…" : "Get Started"}
      </Button>

      {/* ---- Link to sign in ---- */}
      <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href={`/signin${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-indigo-300 hover:text-indigo-200"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
