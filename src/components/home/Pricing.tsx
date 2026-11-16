"use client";

/**
 * ============================================================================
 * components/home/Pricing.tsx — the landing page pricing section
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Figma "Pricing")
 *   Label    "Pricing"
 *   Heading  "Pay for the leverage, not the listings"
 *   Toggle   Monthly / Yearly (Yearly carries a "25% off" badge)
 *   Cards    three plans, middle one highlighted, each with "Choose This Plan"
 *
 * A NOTE ON THE NUMBERS
 * The Figma copy says Starter $0 / Growth $17 / Premium $99, while the
 * requirements doc says Free $0 / Pro $19 / Premium $39 for seekers. The
 * project's single source of truth is lib/plans.ts (which follows the
 * requirements doc), so the cards show Free / Pro / Premium with those
 * prices. The yearly prices are derived at 25% off (see lib/data.ts) because
 * the Figma file has no yearly values.
 *
 * WHY "use client"
 * The toggle needs state and the cards animate with Framer Motion.
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { priceFor, seekerPlans } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Same entrance recipe used by the Features grid. */
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function Pricing() {
  // true = yearly pricing is selected. Monthly is the default.
  const [yearly, setYearly] = React.useState(false);

  return (
    <section className="bg-background py-20" aria-label="Pricing plans">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Heading ---- */}
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pay for the leverage, not the listings
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Start free. Upgrade when you want more applications, deeper
            insights and priority support.
          </p>
        </div>

        {/* ---- Monthly / Yearly toggle ---- */}
        <div
          // role="group" groups the two buttons for assistive tech.
          role="group"
          aria-label="Billing period"
          className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
        >
          {/* Monthly */}
          <button
            type="button"
            onClick={() => setYearly(false)}
            // aria-pressed tells screen readers which option is active.
            aria-pressed={!yearly}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              !yearly ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
            )}
          >
            Monthly
          </button>

          {/* Yearly + discount badge */}
          <button
            type="button"
            onClick={() => setYearly(true)}
            aria-pressed={yearly}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              yearly ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
            )}
          >
            Yearly
            {/* The small "-25%" pill the Figma design shows. */}
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              -25%
            </span>
          </button>
        </div>

        {/* ---- Plan cards ---- */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {seekerPlans.map((plan, index) => {
            // The middle plan (Pro) is the highlighted one in the design.
            const highlighted = index === 1;
            // Monthly-friendly price for the selected billing period.
            const price = priceFor(plan, yearly);

            return (
              <motion.article
                key={plan.id}
                {...fadeInUp}
                // Slight delay per card so they cascade left → right.
                transition={{ ...fadeInUp.transition, delay: index * 0.08 }}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-6",
                  highlighted
                    ? // Highlight: a brand-tinted surface + glow.
                      "border-indigo-400/50 bg-gradient-to-b from-indigo-500/15 to-violet-500/5 shadow-xl shadow-indigo-500/10"
                    : "border-white/10 bg-white/[0.03]"
                )}
              >
                {/* "Most popular" ribbon on the highlighted card. */}
                {highlighted && (
                  <span className="absolute right-5 top-5 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                    Most popular
                  </span>
                )}

                {/* Plan name + tagline */}
                <h3 className="text-lg font-semibold text-white">{plan.label}</h3>
                <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>

                {/* Price — the big number the visitor scans first. */}
                <p className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">
                    ${price}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {/* Free is $0 forever; paid plans are "/month". */}
                    {plan.price === 0 ? "/forever" : "/month"}
                  </span>
                </p>

                {/* Small print explaining the yearly math. */}
                <p className="mt-1 text-xs text-zinc-500">
                  {yearly && plan.price > 0
                    ? `Billed yearly ($${price * 12}) — 25% off`
                    : plan.price === 0
                      ? "No card required"
                      : "Billed monthly, cancel anytime"}
                </p>

                {/* Feature bullets */}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                      {/* Check mark in a small tinted circle. */}
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                        <Check aria-hidden="true" className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA → checkout with the chosen plan in the query string. */}
                <Button
                  asChild
                  className="mt-7 w-full"
                  variant={highlighted ? "primary" : "outline"}
                >
                  <Link href={`/checkout?plan=${plan.id}&audience=seeker`}>
                    Choose This Plan
                  </Link>
                </Button>
              </motion.article>
            );
          })}
        </div>

        {/* ---- Link to the full two-audience pricing page ---- */}
        <p className="mt-8 text-center text-sm text-zinc-400">
          Hiring instead?{" "}
          <Link href="/pricing" className="font-medium text-indigo-300 hover:text-indigo-200">
            See recruiter plans →
          </Link>
        </p>
      </div>
    </section>
  );
}
