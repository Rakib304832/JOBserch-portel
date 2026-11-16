/**
 * ============================================================================
 * app/(public)/signin/page.tsx — SIGN IN (route "/signin")
 * ============================================================================
 *
 * The destination for every "Sign In" link in the navbar and for guests who
 * press Apply on a job. It is a server shell: the form itself is a client
 * component because it posts credentials and updates the auth store.
 *
 * WHY <Suspense>
 * SignInForm reads the ?next= query parameter with useSearchParams(). Next.js
 * needs that hook inside a Suspense boundary so the static shell can be
 * prerendered before the URL is known.
 *
 * The (public) layout supplies the Navbar and Footer around this page.
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

/** Tab title + description; private forms should not be indexed. */
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your HireLoop account.",
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <section
      className="relative overflow-hidden bg-background py-16 sm:py-24"
      aria-label="Sign in"
    >
      {/* Soft brand glow behind the card (decorative only). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] max-w-none -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-md px-4 sm:px-6">
        <Suspense
          // Roughly the card's height, so the footer does not jump on load.
          fallback={
            <div className="h-[460px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </section>
  );
}
