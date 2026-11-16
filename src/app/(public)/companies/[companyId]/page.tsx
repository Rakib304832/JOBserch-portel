/**
 * ============================================================================
 * app/(public)/companies/[companyId]/page.tsx — COMPANY PROFILE route (shell)
 * ============================================================================
 *
 * Reached by clicking a CompanyCard. The body lives in
 * components/companies/CompanyProfile.tsx because it reads the [companyId]
 * segment with useParams(), which must sit inside <Suspense> under Cache
 * Components.
 *
 * URL: /companies/:companyId   (e.g. /companies/c_nimbus)
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { CompanyProfile } from "@/components/companies/CompanyProfile";

/** Generic tab title; the company name arrives from the API. */
export const metadata: Metadata = {
  title: "Company Profile",
  description:
    "Learn about the company and browse every role it currently has open on HireLoop.",
};

export default function CompanyProfileRoute() {
  return (
    // Same skeleton rhythm as the loaded profile.
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      }
    >
      <CompanyProfile />
    </Suspense>
  );
}
