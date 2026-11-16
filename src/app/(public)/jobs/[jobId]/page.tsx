/**
 * ============================================================================
 * app/(public)/jobs/[jobId]/page.tsx — JOB DETAILS route (server shell)
 * ============================================================================
 *
 * The actual page body is components/jobs/JobDetails.tsx, because it reads the
 * [jobId] segment with useParams(). With Cache Components, a client hook that
 * reads URL data must be wrapped in <Suspense>, otherwise the route cannot be
 * prerendered — that is the only reason this extra file exists.
 *
 * URL: /jobs/:jobId   (e.g. /jobs/j_fe)
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { JobDetails } from "@/components/jobs/JobDetails";

/** Generic tab title; the job title itself arrives from the API. */
export const metadata: Metadata = {
  title: "Job Details",
  description:
    "Read the full role description, requirements and benefits, then apply with your HireLoop profile.",
};

export default function JobDetailsRoute() {
  return (
    // Fallback mirrors the real two-column layout to avoid a jump.
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/5" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-60 animate-pulse rounded-2xl bg-white/5" />
          </div>
        </div>
      }
    >
      <JobDetails />
    </Suspense>
  );
}
