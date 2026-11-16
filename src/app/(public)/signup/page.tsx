/**
 * ============================================================================
 * app/(public)/signup/page.tsx — CREATE ACCOUNT (route "/signup")
 * ============================================================================
 *
 * Every "Get Started" / "Create a free account" button lands here, and the
 * hero's "Post a Job" arrives with ?role=recruiter so the recruiter tab is
 * preselected.
 *
 * Like /signin this is a server shell around a client form, wrapped in
 * <Suspense> because the form reads its query parameters with
 * useSearchParams().
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/SignUpForm";

/** Tab title + description; account creation should not be indexed. */
export const metadata: Metadata = {
  title: "Get Started",
  description: "Create a free HireLoop account as a job seeker or a recruiter.",
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return (
    <section
      className="relative overflow-hidden bg-background py-16 sm:py-24"
      aria-label="Create your account"
    >
      {/* Brand glow behind the card (decorative only). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] max-w-none -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-md px-4 sm:px-6">
        <Suspense
          // Slightly taller than sign-in (role picker + one more field).
          fallback={
            <div className="h-[620px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          }
        >
          <SignUpForm />
        </Suspense>
      </div>
    </section>
  );
}
