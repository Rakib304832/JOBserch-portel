"use client";

/**
 * (public)/page.tsx — the HOME PAGE (route "/").
 *
 * DATA FLOW (the one used by every page in this app):
 *   1. React mounts → shows the layout skeleton (loading state).
 *   2. useEffect calls the API: /api/stats/public and /api/jobs?featured=true.
 *   3. The route handler reads the in-memory store and answers with JSON.
 *   4. setState stores the answer → React re-renders with real content.
 *
 * SECTIONS (matching the requirements doc):
 *   • Hero with headline, subheadline, CTA buttons and LIVE stats  → <Hero/>
 *   • Featured Jobs (hand-picked listings, card format)            → grid below
 *   • Platform features (Smart Search, Salary Insights…)          → <FeaturesSection/>
 *   The Footer comes from (public)/layout.tsx — not repeated here.
 */

import { useEffect, useState } from "react";
import { Hero, type HeroStat } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features-section";
import { JobCard } from "@/components/jobs/job-card";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import type { Company, Job } from "@/lib/types";

/** Shape of one enriched job record returned by /api/jobs. */
interface JobWithCompany extends Job {
  company: Company; // joined company info (name, logo…) for the card
}

export default function Home() {
  /* ---------------- state: what the page currently shows ---------------- */
  const [stats, setStats] = useState<HeroStat[] | null>(null); // null = not loaded yet
  const [featured, setFeatured] = useState<JobWithCompany[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- data loading ---------------- */
  useEffect(() => {
    // Promise.all fires BOTH requests in parallel (faster than one-by-one)
    // and allSettled lets one failure not block the other.
    void Promise.allSettled([
      apiFetch<{ stats: HeroStat[] }>("/api/stats/public"),
      apiFetch<{ jobs: JobWithCompany[] }>("/api/jobs?featured=true"),
    ]).then(([statsRes, jobsRes]) => {
      if (statsRes.status === "fulfilled") setStats(statsRes.value.stats);
      if (jobsRes.status === "fulfilled") setFeatured(jobsRes.value.jobs);
      if (statsRes.status === "rejected" && jobsRes.status === "rejected") {
        setError("Could not load the home page data.");
      }
    });
  }, []); // [] = run once on mount, not on every re-render

  /* ---------------- render ---------------- */
  return (
    <>
      {/* Hero gets LIVE stats once they arrive (falls back to placeholders) */}
      <Hero stats={stats ?? undefined} />

      {/* ---- Featured Jobs section ---- */}
      <section className="bg-background py-20" aria-label="Featured jobs">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Featured jobs
              </h2>
              <p className="mt-2 text-base text-zinc-400">
                Hand-picked roles from companies hiring right now.
              </p>
            </div>
            {/* Secondary CTA to the full catalog */}
            <Button asChild variant="outline">
              <a
                href="/jobs"
                className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              >
                Browse all jobs →
              </a>
            </Button>
          </div>

          {/* While loading: six skeleton tiles keep the layout stable.
              On error: a friendly message instead of a broken page. */}
          {error && (
            <p className="mt-10 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {!error && !featured && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                // Skeleton = gray placeholder box that suggests content is coming
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl bg-white/5"
                />
              ))}
            </div>
          )}

          {featured && featured.length === 0 && (
            <p className="mt-10 text-sm text-zinc-400">
              No featured jobs right now — check back soon.
            </p>
          )}

          {featured && featured.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((job) => (
                <JobCard key={job.id} job={job} company={job.company} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Platform features (Framer Motion scroll animations) ---- */}
      <FeaturesSection />
    </>
  );
}
