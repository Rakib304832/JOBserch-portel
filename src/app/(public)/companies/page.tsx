"use client";

/**
 * ============================================================================
 * app/(public)/companies/page.tsx — COMPANIES (route "/companies")
 * ============================================================================
 *
 * WHAT THE REQUIREMENTS ASK FOR
 *   A card grid of every registered AND APPROVED company, industry filter
 *   tabs, and a card per company showing logo, name, industry, location,
 *   employee count and number of open jobs.
 *
 * DATA
 *   GET /api/companies[?industry=…] → { companies: (Company & { openJobs })[] }
 * The backend already hides pending/rejected companies from this public list,
 * so this page never has to worry about moderation state.
 *
 * WHY "use client"
 * The industry tab is state and each change triggers a fetch.
 * ============================================================================
 */

import * as React from "react";
import { Building2 } from "lucide-react";

import { IndustryTabs } from "@/components/companies/IndustryTabs";
import { CompanyCard, type CompanyWithJobs } from "@/components/companies/CompanyCard";
import { apiFetch } from "@/lib/api-client";

export default function CompaniesPage() {
  // "All" means no ?industry= filter.
  const [industry, setIndustry] = React.useState("All");

  // null = not loaded yet, [] = loaded but empty.
  const [companies, setCompanies] = React.useState<CompanyWithJobs[] | null>(null);
  // Which industry the current `companies` list belongs to. Comparing it to
  // `industry` gives us "loading" WITHOUT setting state at the top of an effect.
  const [loadedIndustry, setLoadedIndustry] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // True while the tab the visitor picked has not answered yet.
  const loading = loadedIndustry !== industry;

  /* ---------------------------------------------------------------------- */
  /*  Refetch when the selected industry changes                            */
  /* ---------------------------------------------------------------------- */
  React.useEffect(() => {
    let cancelled = false;

    const query =
      industry === "All" ? "" : `?industry=${encodeURIComponent(industry)}`;

    apiFetch<{ companies: CompanyWithJobs[] }>(`/api/companies${query}`)
      .then((data) => {
        if (!cancelled) {
          setCompanies(data.companies);
          setError(null);
          setLoadedIndustry(industry); // marks this tab as answered
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Could not load companies."
          );
          setLoadedIndustry(industry); // stop the skeleton, show the error
        }
      });

    return () => {
      cancelled = true;
    };
  }, [industry]);

  return (
    <section className="bg-background py-12" aria-label="Companies hiring on HireLoop">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Heading ---- */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Companies hiring now
          </h1>
          <p className="mt-2 text-base text-zinc-400">
            Every employer here is verified by HireLoop. Open a company to see
            its profile and current roles.
          </p>
        </div>

        {/* ---- Industry tabs ---- */}
        <div className="mt-6">
          <IndustryTabs active={industry} onChange={setIndustry} />
        </div>

        {/* ---- Count line ---- */}
        <p className="mt-5 flex items-center gap-1.5 text-xs text-zinc-500">
          <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
          {!loading && companies
            ? `${companies.length} ${companies.length === 1 ? "company" : "companies"}${industry === "All" ? "" : ` in ${industry}`}`
            : "Loading companies…"}
        </p>

        {/* ---- Error ---- */}
        {!loading && error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {/* ---- Loading skeletons ---- */}
        {loading && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!loading && !error && companies && companies.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">
              No approved companies in this industry yet
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Try the All tab, or check back soon.
            </p>
          </div>
        )}

        {/* ---- Cards ---- */}
        {!loading && !error && companies && companies.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
