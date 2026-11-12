"use client";

/**
 * FeaturesSection.jsx → FeaturesSection.tsx
 * The "Platform features" strip on the home page: four cards that highlight
 * what makes HireLoop useful (Smart Search, Salary Insights, Top Companies,
 * Saved Jobs).
 *
 * ANIMATIONS (Framer Motion — see hireloop-resources/Framer-Motion-guide.md)
 *   • The whole grid fades up when scrolled into view, one card after
 *     another (staggerChildren).
 *   • Hovering a card lifts it 4px with a springy feel (whileHover).
 *   • `viewport={{ once: true }}` makes each animation play exactly once,
 *     so scrolling back up doesn't replay everything.
 */

import { motion } from "framer-motion";
import {
  BookmarkIcon,
  SearchIcon,
  ChartNoAxesCombinedIcon,
  Building2Icon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: SearchIcon,
    title: "Smart Search",
    description:
      "Filter thousands of listings by keyword, location, salary, category and job type in one pass.",
  },
  {
    icon: ChartNoAxesCombinedIcon,
    title: "Salary Insights",
    description:
      "Every job shows its real salary range up front — no more guessing or awkward negotiations.",
  },
  {
    icon: Building2Icon,
    title: "Top Companies",
    description:
      "Explore verified company profiles with industry, size, and all of their open roles in one place.",
  },
  {
    icon: BookmarkIcon,
    title: "Saved Jobs",
    description:
      "Bookmark interesting roles with one click and apply to them when you're ready.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Animation presets                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Reusable "fade in from below" recipe. Spreading it with {...fadeInUp}
 * applies initial / whileInView / viewport / transition in one go.
 */
const fadeInUp = {
  initial: { opacity: 0, y: 30 }, // start invisible, pushed 30px down
  whileInView: { opacity: 1, y: 0 }, // settle to normal once 20% is visible
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

/**
 * Parent recipe: children animate ONE AFTER ANOTHER.
 * staggerChildren = 0.08 → each card starts 0.08s after the previous one;
 * delayChildren = 0.1 → the first card waits 0.1s after the parent appears.
 */
const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function FeaturesSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-background py-20"
      aria-label="Platform features"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Section heading (also fades up) ---- */}
        <motion.h2
          {...fadeInUp}
          className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Everything you need to succeed
        </motion.h2>
        <motion.p
          {...fadeInUp}
          className="mx-auto mt-3 max-w-xl text-center text-base text-zinc-400"
        >
          HireLoop packs the whole job-hunting toolkit into one platform.
        </motion.p>

        {/* ---- Cards grid: the stagger container ---- */}
        <motion.div
          {...staggerContainer}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              // Each card is a stagger CHILD — it inherits the parent's
              // whileInView timing and just defines its own "from" state.
              <motion.div
                key={feature.title}
                {...fadeInUp}
                whileHover={{ y: -4 }} // lift on hover...
                transition={{
                  type: "spring", // ...with a bouncy spring
                  stiffness: 300, // higher = snappier
                  damping: 20, // higher = less wobble
                }}
                className="flex flex-col rounded-2xl border border-white/10 bg-[#17181c] p-6"
              >
                {/* Icon in a rounded gradient tile — echoes the CTA gradient */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
