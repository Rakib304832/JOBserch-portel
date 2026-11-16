"use client";

/**
 * ============================================================================
 * components/pricing/PricingTabs.tsx — the /pricing page's plan switcher
 * ============================================================================
 *
 * WHAT THE DOCX / REQUIREMENTS ASK FOR
 *   A toggle between "For Job Seekers" and "For Recruiters", each showing its
 *   own three tiers, plus the FAQ accordion below (cancellation, refunds,
 *   payment methods, plan switching).
 *
 * WHY TWO AUDIENCES
 * Seekers pay for applications; recruiters pay for active job posts. The two
 * price ladders live in lib/plans.ts and are re-exported by lib/data.ts, so
 * this component only decides which ladder to show.
 *
 * WHY "use client"
 * The audience tab, the billing-period toggle and the FAQ all need state.
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { faqs, priceFor, recruiterPlans, seekerPlans } from "@/lib/data";
import { cn } from "@/lib/utils";

/** The two price ladders the requirements doc defines. */
type Audience = "seeker" | "recruiter";

export function PricingTabs() {
  // Which audience's plans are on screen.
  const [audience, setAudience] = React.useState<Audience>("seeker");

  // Monthly vs yearly pricing.
  const [yearly, setYearly] = React.useState(false);

  // Pick the ladder for the current tab.
  const plans = audience === "seeker" ? seekerPlans : recruiterPlans;

  return (
    <div>
      {/* ---------------- Audience tabs ---------------- */}
      <div
        role="tablist"
        aria-label="Choose which plans to view"
        className="mx-auto flex w-fit rounded-full border border-white/10 bg-white/5 p-1"
      >
        {(
          [
            { id: "seeker", label: "For Job Seekers" },
            { id: "recruiter", label: "For Recruiters" },
          ] as const
        ).map((tab) => {
          const selected = audience === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setAudience(tab.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm",
                selected ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- Billing period toggle ---------------- */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
        <button
          type="button"
          onClick={() => setYearly(false)}
          aria-pressed={!yearly}
          className={cn("font-medium", !yearly ? "text-white" : "hover:text-zinc-200")}
        >
          Monthly
        </button>
        {/* A real switch would need a label; this small toggle stays simple. */}
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Bill yearly (25% off)"
          onClick={() => setYearly((value) => !value)}
          className={cn(
            "relative h-5 w-9 rounded-full border transition-colors",
            yearly ? "border-indigo-400/50 bg-indigo-500/60" : "border-white/15 bg-white/10"
          )}
        >
          {/* Sliding knob */}
          <span
            className={cn(
              "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform",
              yearly ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          aria-pressed={yearly}
          className={cn(
            "flex items-center gap-1.5 font-medium",
            yearly ? "text-white" : "hover:text-zinc-200"
          )}
        >
          Yearly
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            -25%
          </span>
        </button>
      </div>

      {/* ---------------- Plan cards ---------------- */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan, index) => {
          // Highlight the middle plan, same as the landing section.
          const highlighted = index === 1;
          const price = priceFor(plan, yearly);

          return (
            <article
              key={`${audience}-${plan.id}`}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border p-6",
                highlighted
                  ? "border-indigo-400/50 bg-gradient-to-b from-indigo-500/15 to-violet-500/5 shadow-xl shadow-indigo-500/10"
                  : "border-white/10 bg-white/[0.03]"
              )}
            >
              {highlighted && (
                <span className="absolute right-5 top-5 rounded-full bg-indigo-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                  Most popular
                </span>
              )}

              {/* Name + one-line pitch */}
              <h2 className="text-lg font-semibold text-white">{plan.label}</h2>
              <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>

              {/* Price */}
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-white">
                  ${price}
                </span>
                <span className="text-sm text-zinc-400">
                  {plan.price === 0 ? "/forever" : "/month"}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {yearly && plan.price > 0
                  ? `Billed yearly ($${price * 12}) — 25% off`
                  : plan.price === 0
                    ? "No card required"
                    : "Billed monthly, cancel anytime"}
              </p>

              {/* What you get */}
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                      <Check aria-hidden="true" className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Checkout carries the plan and the audience for the summary. */}
              <Button
                asChild
                className="mt-7 w-full"
                variant={highlighted ? "primary" : "outline"}
              >
                <Link href={`/checkout?plan=${plan.id}&audience=${audience}`}>
                  Choose This Plan
                </Link>
              </Button>
            </article>
          );
        })}
      </div>

      {/* ---------------- Small print ---------------- */}
      <p className="mt-8 text-center text-xs text-zinc-500">
        Payments are processed securely by Stripe. Every paid plan includes a
        14-day money-back guarantee.
      </p>

      {/* ---------------- FAQ ---------------- */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-white">
          Questions, answered
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Everything about billing, canceling and switching plans.
        </p>
        <div className="mt-6">
          {/* The FAQ copy lives in lib/data.ts (`faqs`). */}
          <Accordion items={faqs} />
        </div>
      </div>
    </div>
  );
}
