"use client";

/**
 * ============================================================================
 * components/jobs/JobDetails.tsx — the body of JOB DETAILS (/jobs/:jobId)
 * ============================================================================
 *
 * The route file app/(public)/jobs/[jobId]/page.tsx is a server shell that
 * renders this component inside <Suspense>. That split is required because
 * this component reads useParams(); with Cache Components a client hook that
 * reads URL data must stream in behind a Suspense boundary.
 *
 * WHAT THE DOCX ASKS FOR (Job Details screenshot)
 *   Title · company card (logo, name, location) · salary range · job type
 *   badge · full description · responsibilities · requirements · benefits ·
 *   Apply button (requires login) · similar jobs at the bottom.
 *
 * WHY "use client"
 * The page reads the [jobId] URL segment, fetches /api/jobs/:jobId in an
 * effect, and handles the Apply action — all browser concerns. useParams()
 * gives the segment without needing an async server render.
 *
 * APPLY FLOW
 *   guest        → /signin?next=/jobs/:id   (login required, per the spec)
 *   seeker       → POST /api/applications   (server enforces plan limits)
 *   other roles  → an explanatory message (recruiters don't apply)
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { JobCard } from "@/components/jobs/JobCard";
import { apiFetch } from "@/lib/api-client";
import { lines, relativeDate, salaryRange } from "@/lib/format";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { JobWithCompany } from "@/lib/api-types";

/** Shape of the GET /api/jobs/[jobId] answer. */
interface JobDetailsResponse {
  job: JobWithCompany;
  similar: JobWithCompany[];
}

export function JobDetails() {
  // [jobId] from the URL, e.g. "j_fe".
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  // ---- the job + its suggestions ----
  const [data, setData] = React.useState<JobDetailsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ---- apply flow ----
  const { user, loading: userLoading } = useCurrentUser();
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [applyError, setApplyError] = React.useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Fetch the job                                                          */
  /* ---------------------------------------------------------------------- */
  React.useEffect(() => {
    let cancelled = false;

    apiFetch<JobDetailsResponse>(`/api/jobs/${jobId}`)
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null); // clear any error from a previous id
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Could not load this job."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true; // ignore a response after leaving the page
    };
  }, [jobId]);

  /* ---------------------------------------------------------------------- */
  /*  Apply                                                                  */
  /* ---------------------------------------------------------------------- */
  async function handleApply() {
    // Guests are sent to sign in and returned to this job afterwards.
    if (!user) {
      router.push(`/signin?next=/jobs/${jobId}`);
      return;
    }

    // Recruiters/admins do not apply to jobs.
    if (user.role !== "seeker") {
      setApplyError("Only job-seeker accounts can apply to a role.");
      return;
    }

    setApplying(true);
    setApplyError(null);

    try {
      // The server checks the monthly application allowance and replies 402
      // when the Free plan's 3 applications are used up.
      await apiFetch("/api/applications", {
        method: "POST",
        body: { jobId, coverLetter: "" },
      });
      setApplied(true);
    } catch (caught) {
      setApplyError(
        caught instanceof Error ? caught.message : "Could not submit your application."
      );
    } finally {
      setApplying(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Loading / error shells                                                */
  /* ---------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white/5" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-80 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-60 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  // A 404 here means the job was closed/deleted or the id is wrong.
  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-5xl" aria-hidden="true">
          🔍
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          This job is no longer available
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {error ?? "The listing may have been closed by the employer."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/jobs">Browse all jobs</Link>
        </Button>
      </div>
    );
  }

  const { job, similar } = data;
  const company = job.company;

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <section className="bg-background py-10" aria-label={`${job.title} at ${company.name}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ---- Back link ---- */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to all jobs
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ================================================================ */}
          {/*  Left column: the posting                                        */}
          {/* ================================================================ */}
          <div className="space-y-6">
            {/* ---- Header card ---- */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              {/* Company row */}
              <div className="flex items-center gap-3">
                {/* Company logo / initials fallback */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logoUrl || "/logo.png"}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-white/10 bg-white object-contain p-1"
                />
                <div>
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  <p className="flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin aria-hidden="true" className="h-3 w-3" />
                    {company.location || "Remote"}
                  </p>
                </div>
              </div>

              {/* Job title */}
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {job.title}
              </h1>

              {/* Badges: type, remote, verified employer */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{job.type}</Badge>
                {job.isRemote && <Badge tone="success">Remote</Badge>}
                <Badge tone="success">
                  <ShieldCheck aria-hidden="true" className="h-3 w-3" />
                  Verified Employer
                </Badge>
                <Badge>{job.category}</Badge>
              </div>

              {/* The four key facts, matching the screenshot's fields. */}
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-zinc-500">Salary range</dt>
                  <dd className="mt-1 flex items-center gap-1 font-medium text-white">
                    <Banknote aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                    {salaryRange(job.salaryMin, job.salaryMax, job.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Location</dt>
                  <dd className="mt-1 font-medium text-white">
                    {job.isRemote ? "Remote" : `${job.city}, ${job.country}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Job type</dt>
                  <dd className="mt-1 font-medium text-white">{job.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Posted</dt>
                  <dd className="mt-1 flex items-center gap-1 font-medium text-white">
                    <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400" />
                    {relativeDate(job.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* ---- About the role (a one-paragraph summary) ---- */}
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-base font-semibold text-white">About the role</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {company.name} is hiring a {job.title} for its {job.category} team.
                {" "}
                {job.isRemote
                  ? "This role is fully remote."
                  : `The role is based in ${job.city}, ${job.country}.`}{" "}
                Read the responsibilities and requirements below, then apply with
                your HireLoop profile.
              </p>

              {/* ---- Responsibilities ---- */}
              <h3 className="mt-6 text-sm font-semibold text-white">Responsibilities</h3>
              <ul className="mt-3 space-y-2">
                {lines(job.responsibilities).map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-400">
                    {/* Brand bullet */}
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* ---- Requirements ---- */}
              <h3 className="mt-6 text-sm font-semibold text-white">Requirements</h3>
              <ul className="mt-3 space-y-2">
                {lines(job.requirements).map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-400">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* ---- Benefits (optional column in the database) ---- */}
              {job.benefits && (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-white">Benefits</h3>
                  <ul className="mt-3 space-y-2">
                    {lines(job.benefits).map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-zinc-400">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>

          {/* ================================================================ */}
          {/*  Right column: apply + company                                   */}
          {/* ================================================================ */}
          <aside className="space-y-6">
            {/* ---- Apply card ---- */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
              <p className="text-xs text-zinc-500">Salary range</p>
              <p className="text-xl font-semibold text-white">
                {salaryRange(job.salaryMin, job.salaryMax, job.currency)}
              </p>

              <p className="mt-4 text-xs text-zinc-500">Application deadline</p>
              <p className="text-sm font-medium text-white">
                {new Date(job.deadline).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {/* Apply / applied / error states */}
              {applied ? (
                // Success state replaces the button so double-clicks are impossible.
                <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Application sent — track it in your dashboard.
                </div>
              ) : (
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  onClick={handleApply}
                  // Wait for the auth check so we don't push a signed-in user to /signin.
                  disabled={applying || userLoading}
                >
                  {applying ? "Applying…" : "Apply Now"}
                </Button>
              )}

              {/* Submit error (plan limit, network…) */}
              {applyError && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {applyError}{" "}
                  {/* A plan-limit error is fixed on the pricing page. */}
                  {/plan|limit|upgrade/i.test(applyError) && (
                    <Link href="/pricing" className="font-semibold underline">
                      See plans
                    </Link>
                  )}
                </p>
              )}

              {/* Guest hint under the button. */}
              {!userLoading && !user && (
                <p className="mt-3 text-center text-xs text-zinc-500">
                  You&apos;ll be asked to sign in first.
                </p>
              )}
            </div>

            {/* ---- Company card ---- */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold text-white">Company overview</h2>

              <div className="mt-4 flex items-center gap-3">
                {/* Logo / initials */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logoUrl || "/logo.png"}
                  alt=""
                  className="h-10 w-10 rounded-lg border border-white/10 bg-white object-contain p-1"
                />
                <div>
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  <p className="text-xs text-zinc-400">{company.industry}</p>
                </div>
              </div>

              <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-zinc-400">
                {company.description}
              </p>

              {/* Size / industry / location */}
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Company size</dt>
                  <dd className="flex items-center gap-1 text-zinc-300">
                    <Users aria-hidden="true" className="h-3.5 w-3.5" />
                    {company.employeeCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Industry</dt>
                  <dd className="text-zinc-300">{company.industry}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">Location</dt>
                  <dd className="text-right text-zinc-300">{company.location}</dd>
                </div>
              </dl>

              {/* Visit website — only if the company provided one. */}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  // rel prevents the new tab from touching window.opener.
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/5"
                >
                  Visit Website
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </aside>
        </div>

        {/* ================================================================ */}
        {/*  Similar jobs                                                    */}
        {/* ================================================================ */}
        {similar.length > 0 && (
          <div className="mt-16">
            <SectionLabel>More like this</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Similar jobs you might like
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <JobCard key={item.id} job={item} company={item.company} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
