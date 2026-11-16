/**
 * ============================================================================
 * app/(public)/checkout/page.tsx — CHECKOUT (route "/checkout")
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Checkout — Stripe Payment)
 *   Plan summary · currency picker · email · card form · Pay button ·
 *   "Powered by Stripe" trust line.
 *
 * This server file is the shell: heading + Suspense + the client form.
 * CheckoutForm reads ?plan=…&audience=… from the URL, which is why it needs a
 * Suspense boundary (Next can then prerender the shell before params resolve).
 *
 * SERVER-SIDE NOTE
 * The real Stripe session/webhook belongs to the backend. This page calls the
 * backend's existing demo endpoint (POST /api/payments) — see
 * components/checkout/CheckoutForm.tsx.
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

/** Tab title: "Checkout · HireLoop". */
export const metadata: Metadata = {
  title: "Checkout",
  description: "Upgrade your HireLoop plan securely.",
  // Checkout should never be indexed by search engines.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="bg-background py-12" aria-label="Checkout">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ---- Heading ---- */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Complete your upgrade
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            One payment. Cancel or switch plans whenever you like — every paid
            plan includes a 14-day money-back guarantee.
          </p>
        </div>

        {/* ---- The form is client-side; show a matching skeleton first ---- */}
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="h-[560px] animate-pulse rounded-2xl bg-white/5" />
                <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
              </div>
            }
          >
            <CheckoutForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
