"use client";

/**
 * ============================================================================
 * app/(public)/page.tsx — the HOME PAGE (route "/")
 * ============================================================================
 *
 * WHAT THIS FILE DOES
 * Nothing clever: it fetches two live feeds and stacks the six section
 * components in the order the DOCX/Figma landing page uses.
 *
 *      Hero → Stats → JobDiscovery → Features → Pricing → CtaSection
 *      (Footer comes from (public)/layout.tsx, not from here)
 *
 * WHY "use client"
 * The hero search and the live stats/jobs both need the browser: Hero holds
 * input state, and the data arrives from the API in an effect. Keeping the
 * page client-side also lets the sections receive the fetched props directly.
 *
 * WHY THE PAGE HOLDS NO MARKUP OF ITS OWN
 * Each section is its own file (components/home/*) so editing the pricing
 * cards cannot accidentally break the footer, and so each piece can be
 * previewed/understood on its own — exactly what the DOCX recommends.
 * ============================================================================
 */

import * as React from "react";

import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { JobDiscovery } from "@/components/home/JobDiscovery";
import { Features } from "@/components/home/Features";
import { Pricing } from "@/components/home/Pricing";
import { CtaSection } from "@/components/home/CtaSection";
import { apiFetch } from "@/lib/api-client";
import type { StatCard } from "@/lib/data";
import type { JobWithCompany } from "@/lib/api-types";

export default function HomePage() {
  /* ---------------------------------------------------------------------- */
  /*  State: three possible phases per feed — null (loading), data, error    */
  /* ---------------------------------------------------------------------- */
  const [stats, setStats] = React.useState<StatCard[] | null>(null);
  const [featured, setFeatured] = React.useState<JobWithCompany[] | null>(null);
  const [jobsError, setJobsError] = React.useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Load both feeds in parallel                                            */
  /* ---------------------------------------------------------------------- */
  React.useEffect(() => {
    // allSettled: a failing stats call must not blank out the job grid.
    void Promise.allSettled([
      // Live counts for the Stats strip (computed from the real store).
      apiFetch<{ stats: StatCard[] }>("/api/stats/public"),
      // Hand-picked jobs for the "Smart job discovery" section.
      apiFetch<{ jobs: JobWithCompany[] }>("/api/jobs?featured=true"),
    ]).then(([statsResult, jobsResult]) => {
      // Stats are optional — if they fail, Stats.tsx falls back to its defaults.
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.stats);
      }

      // Featured jobs get a visible error because the section would be empty.
      if (jobsResult.status === "fulfilled") {
        setFeatured(jobsResult.value.jobs);
      } else {
        setJobsError("Could not load featured jobs right now.");
      }
    });
  }, []); // [] = run once on mount, not on every render

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <>
      {/* 1. Opening block with headline, CTAs, search bar, trending chips. */}
      <Hero />

      {/* 2. "Assisting over 15,000 job seekers…" + the four live numbers. */}
      <Stats stats={stats ?? undefined} />

      {/* 3. Six hand-picked jobs + "View all job open". */}
      <JobDiscovery jobs={featured} error={jobsError} />

      {/* 4. The eight platform features (Framer Motion entrance). */}
      <Features />

      {/* 5. Monthly/Yearly pricing cards for seekers. */}
      <Pricing />

      {/* 6. Closing "Your next role is already looking for you" banner. */}
      <CtaSection />
    </>
  );
}
