"use client";

/**
 * ============================================================================
 * components/auth/SignInForm.tsx — the sign-in card
 * ============================================================================
 *
 * WHY IT EXISTS
 * The public navbar links to /signin, and Job Details sends guests here before
 * they can apply. The page had no implementation, so every one of those links
 * ended in a 404. This form closes that loop using the backend's existing
 * endpoint — no auth logic lives in the public UI:
 *
 *      POST /api/auth/login { email, password } → { user } + session cookie
 *
 * WHAT HAPPENS ON SUCCESS
 *   1. setCurrentUser(user) updates the shared auth store, so the navbar
 *      switches from "Sign In / Get Started" to "Dashboard + avatar" without
 *      a reload.
 *   2. router.replace(next || "/") lands the visitor on the page they came
 *      from (e.g. /jobs/j_fe after pressing Apply).
 *
 * WHY "use client"
 * Inputs hold state and the submit handler talks to the API in the browser.
 * The page wraps this in <Suspense> because it reads useSearchParams().
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch } from "@/lib/api-client";
import { setCurrentUser, type CurrentUser } from "@/hooks/use-current-user";

export function SignInForm() {
  const router = useRouter();
  // ?next=/jobs/j_fe — where to go after a successful sign-in.
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  // ---- form state ----
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /** Submit the credentials to the backend and react to its answer. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Stop the browser from doing a full-page form post.
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<{ user: CurrentUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // Update the navbar (and anything else watching auth) immediately.
      setCurrentUser(data.user);

      // replace (not push) so Back does not return to the sign-in form.
      router.replace(next);
      // Ask the server components to re-render with the new session cookie.
      router.refresh();
    } catch (caught) {
      // apiFetch throws with the API's message, e.g. "Invalid email or password."
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  /** One click fills the demo seeker account (handy for reviewing the site). */
  function useDemoAccount() {
    setEmail("seeker@demo.com");
    setPassword("demo1234");
    setError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      {/* ---- Title ---- */}
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
        <LogIn aria-hidden="true" className="h-5 w-5 text-indigo-300" />
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Sign in to apply to jobs, save roles and manage your plan.
      </p>

      {/* ---- Email ---- */}
      <div className="mt-6">
        <Field label="Email" htmlFor="signin-email">
          <Input
            id="signin-email"
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
        <Field label="Password" htmlFor="signin-password">
          <Input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
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
        {submitting ? "Signing in…" : "Sign In"}
      </Button>

      {/* ---- Demo shortcut ---- */}
      <p className="mt-4 text-center text-xs text-zinc-500">
        Just exploring?{" "}
        <button
          type="button"
          onClick={useDemoAccount}
          className="font-medium text-indigo-300 underline-offset-2 hover:underline"
        >
          Use the demo seeker account
        </button>
      </p>

      {/* ---- Link to register ---- */}
      <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-zinc-400">
        New to HireLoop?{" "}
        <Link
          href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-indigo-300 hover:text-indigo-200"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
