/**
 * ============================================================================
 * app/(public)/jobs/page.tsx — BROWSE JOBS (route "/jobs")
 * ============================================================================
 *
 * WHY THIS FILE IS ALMOST EMPTY
 * The interactive part (search, filters, sorting, pagination) lives in
 * components/jobs/JobsBrowse.tsx. This page only supplies:
 *   • a Suspense boundary — JobsBrowse reads useSearchParams(), which must be
 *     suspended so the static shell can be sent before the params resolve;
 *   • page-level metadata (the tab title).
 *
 * The (public)/layout.tsx around it adds the Navbar and Footer.
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { JobsBrowse } from "@/components/jobs/JobsBrowse";

/** Browser-tab title: "Browse Jobs · HireLoop" (template lives in app/layout). */
export const metadata: Metadata = {
  title: "Browse Jobs",
  description:
    "Search thousands of curated roles by keyword, job type, location, salary and category.",
};

export default function BrowseJobsPage() {
  return (
    // The fallback mirrors the real layout (heading + two-column grid) so the
    // page does not jump when the client component takes over.
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-4 h-4 w-40 animate-pulse rounded bg-white/5" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <JobsBrowse />
    </Suspense>
  );
}
