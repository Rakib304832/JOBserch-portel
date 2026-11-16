/**
 * ============================================================================
 * app/(public)/pricing/page.tsx — PRICING (route "/pricing")
 * ============================================================================
 *
 * The requirements doc lists Pricing as a public page with two audiences
 * (Job Seekers / Recruiters), three tiers each, and an FAQ. Everything
 * interactive lives in components/pricing/PricingTabs.tsx; this file is the
 * server-rendered heading + metadata around it.
 * ============================================================================
 */

import type { Metadata } from "next";

import { PricingTabs } from "@/components/pricing/PricingTabs";

/** Tab title + search/social description. */
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare HireLoop plans for job seekers and recruiters. Start free, upgrade for more applications or active job posts.",
};

export default function PricingPage() {
  return (
    <section className="bg-background py-16" aria-label="Pricing plans">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Intro ---- */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pay for the leverage, not the listings
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Two price ladders, because seekers and recruiters buy different
            things: more applications, or more active job posts.
          </p>
        </div>

        {/* ---- Tabs + cards + FAQ ---- */}
        <div className="mt-10">
          <PricingTabs />
        </div>
      </div>
    </section>
  );
}
