"use client";

/**
 * ============================================================================
 * components/companies/CompanyProfile.tsx — the body of /companies/:companyId
 * ============================================================================
 *
 * The route file app/(public)/companies/[companyId]/page.tsx is a server shell
 * that renders this component inside <Suspense>. This component reads
 * useParams(); Cache Components requires URL-reading client hooks to stream in
 * behind a Suspense boundary during prerendering.
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { JobCard } from "@/components/jobs/JobCard";
import { apiFetch } from "@/lib/api-client";
import type { Company, Job } from "@/lib/types";

/** Shape of the GET /api/companies/[companyId] answer. */
interface CompanyResponse {
  company: Company;
  jobs: Job[];
}

export function CompanyProfile() {
  // The [companyId] segment, e.g. "c_nimbus".
  const { companyId } = useParams<{ companyId: string }>();

  const [data, setData] = React.useState<CompanyResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    apiFetch<CompanyResponse>(`/api/companies/${companyId}`)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null); // clear any error from a previous company
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Could not load this company."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  /* ---------------------------------------------------------------------- */
  /*  Loading                                                               */
  /* ---------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Not found / rejected company                                          */
  /* ---------------------------------------------------------------------- */
  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-white">Company not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {error ?? "This company is not publicly visible."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/companies">Browse companies</Link>
        </Button>
      </div>
    );
  }

  const { company, jobs } = data;
  const initials = company.name.slice(0, 2).toUpperCase();

  return (
    <section className="bg-background py-10" aria-label={`${company.name} profile`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Back link ---- */}
        <Link
          href="/companies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          All companies
        </Link>

        {/* ---- Company header ---- */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-transparent p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            {/* Logo / initials plate */}
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt=""
                className="h-16 w-16 rounded-2xl border border-white/10 bg-white object-contain p-2"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-zinc-400">
                {initials}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {company.name}
              </h1>

              {/* Industry + facts */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <Badge tone="brand">{company.industry}</Badge>
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  {company.location || "Remote"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users aria-hidden="true" className="h-3.5 w-3.5" />
                  {company.employeeCount} employees
                </span>
              </div>
            </div>

            {/* Website */}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Visit website
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {/* About */}
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300">
            {company.description}
          </p>
        </div>

        {/* ---- Open roles ---- */}
        <div className="mt-12">
          <SectionLabel>Open roles</SectionLabel>
          <h2 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
            Jobs at {company.name}
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {jobs.length}
            </span>
          </h2>

          {/* Empty state */}
          {jobs.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-sm text-zinc-400">
              No open roles right now. Check back soon or{" "}
              <Link href="/jobs" className="text-indigo-300 hover:text-indigo-200">
                browse other companies
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                // The API returns bare jobs here, so pass the company we loaded.
                <JobCard key={job.id} job={job} company={company} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
