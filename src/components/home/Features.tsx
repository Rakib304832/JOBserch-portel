"use client";

/**
 * ============================================================================
 * components/home/Features.tsx — the eight-feature grid
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Figma "Frame 2147234483")
 *   Label   "Features job"
 *   Heading "Everything you need to succeed"
 *   Grid    8 items: Smart Search, Salary Insights, Top Companies, Saved Jobs,
 *           One-Click Apply, Resume Builder, Skill-Based Matching,
 *           Career Growth Resources — each with an icon + one-line description.
 *
 * WHY "use client"
 * The section uses Framer Motion (scroll-triggered fade-up + card hover lift),
 * and Framer Motion only runs in the browser — the same reason the project's
 * Framer Motion guide insists on "use client".
 *
 * WHERE THE COPY LIVES
 * `features` in lib/data.ts — this file only maps data → markup.
 * ============================================================================
 */

import { motion } from "framer-motion";
import {
  Banknote,
  Bookmark,
  Briefcase,
  FileText,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { features, type FeatureIcon } from "@/lib/data";

/**
 * Icon lookup table.
 * lib/data.ts stores short string keys ("search", "salary"…), so swapping an
 * icon is a one-line change here and the data file stays plain data.
 */
const ICONS: Record<FeatureIcon, typeof Search> = {
  search: Search, // Smart Search
  salary: Banknote, // Salary Insights
  companies: Briefcase, // Top Companies
  saved: Bookmark, // Saved Jobs
  apply: Sparkles, // One-Click Apply
  resume: FileText, // Resume Builder
  matching: Target, // Skill-Based Matching
  growth: TrendingUp, // Career Growth Resources
};

/**
 * Shared entrance animation (lifted from the project's Framer Motion guide):
 * start 30px lower and transparent, end in place and opaque, run once, and
 * only when 20% of the element is on screen.
 */
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: 0.6,
    // A gentle "ease out" curve; `as const` keeps it a 4-number tuple for TS.
    ease: [0.22, 1, 0.36, 1] as const,
  },
};

export function Features() {
  return (
    // Fade the whole section in slightly before the cards animate.
    <motion.section
      className="border-y border-white/5 bg-[#141519] py-20"
      aria-label="Platform features"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Heading ---- */}
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Features job</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything you need to succeed
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            From the first search to the signed offer — every step has a tool
            built for it.
          </p>
        </div>

        {/* ---- 8 cards: 1 col → 2 → 4 ---- */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            // Pick the icon component for this row.
            const Icon = ICONS[feature.icon];

            return (
              <motion.article
                key={feature.title}
                // Same entrance for every card (no artificial stagger: the
                // scroll trigger already makes them appear together).
                {...fadeInUp}
                // Hover: rise 4px, matching the guide's feature-card example.
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-indigo-400/40"
              >
                {/* Icon tile — the gradient square that anchors each card. */}
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/20 text-indigo-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>

                {/* Feature name */}
                <h3 className="mt-4 text-sm font-semibold text-white">
                  {feature.title}
                </h3>

                {/* One-line explanation */}
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
