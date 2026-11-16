/**
 * ============================================================================
 * components/home/CtaSection.tsx — the closing banner ("Your next role…")
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Figma "Group 2")
 *   Heading   "Your next role is already looking for you"
 *   Subtitle  "Build a profile in three minutes. The matches start arriving
 *              tomorrow morning."
 *   Buttons   "Create a free account" · "View pricing"
 *
 * The copy is static, so — as the DOCX suggests — this section does not need
 * data or the lib/data.ts file. It is a Server Component.
 * ============================================================================
 */

import Link from "next/link";

import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="bg-background py-20" aria-label="Create your account">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* The banner card: a gradient wash over the dark surface. */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-violet-600/15 to-transparent px-6 py-14 text-center sm:px-12">
          {/* Soft glow blob, decorative. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl"
          />

          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next role is already looking for you
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Build a profile in three minutes. The matches start arriving
              tomorrow morning.
            </p>

            {/* Two actions: sign up (primary) or explore plans (secondary). */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/signup">Create a free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
