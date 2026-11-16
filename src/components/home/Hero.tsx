"use client";

/**
 * ============================================================================
 * components/home/Hero.tsx — the landing page's opening block
 * ============================================================================
 *
 * CONTENT (from the DOCX / Figma "Frame 2147234456")
 *   • Badge        "50,000+ new jobs this month"
 *   • Headline     "Find Your Dream Job Today"
 *   • Subheadline  "HireLoop connects top talent with world-class companies…"
 *   • CTAs         "Search Jobs" (goes to /jobs) · "Post a Job"
 *   • Search bar   job title/skill/company + location/remote + submit
 *   • Chips        "Trending Position" → Product Designer, AI Engineering, …
 *
 * WHY "use client"
 * The two search inputs hold state and the submit handler navigates with the
 * typed values, so this section must run in the browser.
 *
 * The big planet image behind the copy is purely decorative (aria-hidden).
 * ============================================================================
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { trendingTags } from "@/lib/data";

export function Hero() {
  // Router lets the search form push a /jobs URL with query parameters.
  const router = useRouter();

  // ---- controlled search fields ----
  const [keyword, setKeyword] = React.useState(""); // "Job title, skill or company"
  const [location, setLocation] = React.useState(""); // "Location or Remote"

  /**
   * Submit the search.
   * We build the query string by hand (instead of always sending empty keys)
   * so /jobs receives only the filters the visitor actually typed.
   */
  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    // Stop the browser's default full-page form submission.
    event.preventDefault();

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim()); // keyword filter
    if (location.trim()) params.set("location", location.trim()); // location filter

    // Send the visitor to Browse Jobs with the filters pre-applied.
    router.push(params.size ? `/jobs?${params.toString()}` : "/jobs");
  }

  /** Chips behave like a one-click search for their keyword. */
  function searchTag(tag: string) {
    router.push(`/jobs?q=${encodeURIComponent(tag)}`);
  }

  return (
    // relative + overflow-hidden anchor and clip the decorative globe.
    <section
      className="relative overflow-hidden bg-[#17181c] text-zinc-100"
      aria-label="Find your next role"
    >
      {/* ---- Decorative aurora glow (pure CSS, no image download) ---- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[520px] w-[860px] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(224,0,204,0.22),transparent_75%),radial-gradient(closest-side,rgba(99,91,255,0.35),transparent_80%)] blur-[80px]"
      />

      {/* ---- Decorative planet at the bottom edge ---- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <Image
          src="/globe.png"
          alt=""
          aria-hidden="true"
          width={1440}
          height={1882}
          // max-w-none keeps the designed scale instead of shrinking to fit.
          className="w-[900px] max-w-none opacity-80 sm:w-[1200px] lg:w-[1400px]"
        />
      </div>

      {/* ---- Foreground content ---- */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-32 pt-20 text-center sm:px-6 sm:pt-24 lg:pt-28">
        {/* Badge above the headline */}
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
          {/* Small green dot = "live" signal */}
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          50,000+ new jobs this month
        </p>

        {/* Headline */}
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find Your Dream Job Today
        </h1>

        {/* Subheadline — muted so the headline keeps priority */}
        <p className="mt-5 max-w-2xl text-base text-zinc-400 sm:text-lg">
          HireLoop connects top talent with world-class companies. Browse
          thousands of curated opportunities and land your next role — faster.
        </p>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search Jobs scrolls the visitor to the catalogue. */}
          <Button asChild size="lg" variant="primary">
            <Link href="/jobs">Search Jobs</Link>
          </Button>

          {/* Post a Job is for employers → account creation for now. */}
          <Button asChild size="lg" variant="outline">
            <Link href="/signup?role=recruiter">Post a Job</Link>
          </Button>
        </div>

        {/* ---- Search bar ---- */}
        <form
          onSubmit={handleSearch}
          // role="search" marks this as the site search landmark.
          role="search"
          className="mt-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#101114]/80 p-2 shadow-2xl shadow-black/40 backdrop-blur sm:flex sm:items-center sm:gap-2"
        >
          {/* Field 1: keyword. Label is visually hidden but announced. */}
          <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-left sm:py-1">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="sr-only">Job title, skill or company</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Job title, skill or company"
              // bg-transparent keeps the input invisible inside the card.
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>

          {/* Hairline divider between the two fields (desktop only). */}
          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

          {/* Field 2: location. */}
          <label className="flex flex-1 items-center rounded-xl px-3 py-2.5 text-left sm:py-1">
            <span className="sr-only">Location or Remote</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location or Remote"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </label>

          {/* Submit — a square gradient button with the search glyph. */}
          <Button type="submit" size="icon" variant="primary" aria-label="Search jobs" className="h-11 w-full sm:w-12">
            <Search />
          </Button>
        </form>

        {/* ---- Trending chips ---- */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="mr-1">Trending Position</span>
          {trendingTags.map((tag) => (
            <button
              key={tag}
              type="button"
              // Clicking runs a keyword search for that chip.
              onClick={() => searchTag(tag)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
