"use client";

/**
 * ==================================================================
 *  JOB DETAILS VIEW — src/app/(secker)/_components/JobDetailsView.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The full "one job" screen inside the dashboard. The JobCard only shows a
 *  summary; this page shows everything a seeker needs before applying:
 *
 *      · company + role header, salary, location, deadline
 *      · the long description, responsibilities, requirements, benefits
 *      · the same Save / Apply actions as the card
 *      · the company snapshot and a few similar roles
 *
 *  API CALLS
 *    GET    /api/jobs/:jobId          the job + up to 4 similar jobs
 *    GET    /api/saved               is this job bookmarked?
 *    GET    /api/applications/mine   have I already applied?
 *    POST   /api/saved               bookmark
 *    DELETE /api/saved/:jobId        remove the bookmark
 *    POST   /api/applications        send the application
 *
 *  WHY A PROP INSTEAD OF useParams()?
 *  The route file `secker/jobs/[jobId]/page.tsx` is a Server Component that
 *  awaits the URL segment and passes the plain string down. This keeps the
 *  client component free of URL hooks (and of the Suspense requirement that
 *  comes with them in Next.js 16).
 * ==================================================================
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  LoaderCircle,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import { api, errorMessage } from "../_lib/api";
import type {
  ApplicationsResponse,
  Job,
  JobResponse,
  SavedResponse,
  SimpleResponse,
} from "../_lib/types";
import {
  daysUntil,
  formatDate,
  formatSalary,
  isDeadlinePassed,
  jobLocation,
  relativeTime,
} from "../_lib/format";
import { Notice, type NoticeTone } from "./Notice";
import { ApplyDialog } from "./ApplyDialog";

/**
 * A helper for the three bullet lists (responsibilities / requirements /
 * benefits). Each is optional in the API, so the section is skipped when the
 * recruiter did not fill it in.
 */
function BulletSection({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: "blue" | "violet" | "emerald";
}) {
  // No items -> render nothing at all (no empty card with a lonely heading).
  if (!items || items.length === 0) return null;

  const dot =
    tone === "blue"
      ? "bg-sky-400"
      : tone === "violet"
        ? "bg-violet-400"
        : "bg-emerald-400";

  return (
    <section className="rounded-2xl border border-line bg-panel/80 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </h2>

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
            {/* A tiny coloured dot is enough of a bullet and stays aligned
                with the first line of text. */}
            <span
              className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`}
              aria-hidden="true"
            />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function JobDetailsView({ jobId }: { jobId: string }) {
  // ---------- Remote data ----------
  const [job, setJob] = useState<Job | null>(null);
  const [similar, setSimilar] = useState<Job[]>([]);

  // ---------- This seeker's relationship with the job ----------
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  // ---------- UI state ----------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(
    null
  );

  /**
   * load — fetch the job and the seeker's own state in parallel.
   * The three calls are independent, so a failing /api/saved must not stop
   * the job itself from rendering.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [jobResult, savedResult, appsResult] = await Promise.allSettled([
      api<JobResponse>(`/jobs/${jobId}`),
      api<SavedResponse>("/saved"),
      api<ApplicationsResponse>("/applications/mine"),
    ]);

    if (jobResult.status === "fulfilled") {
      setJob(jobResult.value.job);
      setSimilar(jobResult.value.similar ?? []);
    } else {
      setError(errorMessage(jobResult.reason));
    }

    if (savedResult.status === "fulfilled") {
      setSaved(
        savedResult.value.savedJobs.some((savedJob) => savedJob._id === jobId)
      );
    }

    if (appsResult.status === "fulfilled") {
      setApplied(
        appsResult.value.applications.some(
          (application) => application.jobId === jobId
        )
      );
    }

    setLoading(false);
  }, [jobId]);

  // Reload whenever the URL parameter changes (user opens another job).
  useEffect(() => {
    void load();
  }, [load]);

  /**
   * toggleSave — bookmark or un-bookmark this job.
   * The button flips only after the server confirms, so it can never show
   * "Saved" for a request that actually failed (for example the Free plan's
   * 10-bookmark cap).
   */
  async function toggleSave() {
    if (!job) return;

    setBusy(true);
    setNotice(null);

    try {
      if (saved) {
        await api<SimpleResponse>(`/saved/${job._id}`, { method: "DELETE" });
        setSaved(false);
        setNotice({ tone: "info", text: "Removed from saved jobs." });
      } else {
        await api<SimpleResponse>("/saved", {
          method: "POST",
          body: { jobId: job._id },
        });
        setSaved(true);
        setNotice({ tone: "success", text: "Saved for later." });
      }
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  /** submitApplication — the ApplyDialog hands us the cover letter. */
  async function submitApplication(coverLetter: string) {
    if (!job) return;

    setBusy(true);

    try {
      await api("/applications", {
        method: "POST",
        body: { jobId: job._id, coverLetter },
      });

      setApplied(true);
      setApplyOpen(false);
      setNotice({
        tone: "success",
        text: `Application sent. Track "${job.title}" under Applications.`,
      });
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Loading                                                           */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="size-6 animate-spin text-brand-violet" />
        <p className="text-sm text-muted-foreground">Loading this job…</p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Not found / network error                                         */
  /* ------------------------------------------------------------------ */

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link
          href="/secker/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to Browse jobs
        </Link>

        <Notice tone="error">
          {error || "This job could not be loaded."}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Retry
          </button>
        </Notice>

        <div className="rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            The role may have been closed or deleted by the recruiter. Browse the
            live feed for other openings.
          </p>

          <Link
            href="/secker/jobs"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    );
  }

  // A passed deadline closes the job even if the status is still "active".
  const closed = isDeadlinePassed(job.deadline);
  const daysLeft = daysUntil(job.deadline);

  return (
    <div className="space-y-6">
      {/* ================= Breadcrumb ================= */}
      <Link
        href="/secker/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Browse jobs
      </Link>

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {/* ================= Header card ================= */}
      <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {job.company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logos come from arbitrary external URLs
              <img
                src={job.company.logo}
                alt={`${job.company.name} logo`}
                className="size-14 shrink-0 rounded-2xl border border-line object-cover"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-elevated text-lg font-semibold text-white">
                {job.company?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}

            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
                {job.title}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {job.company?.name ?? "Unknown company"}
                {job.company?.industry ? ` · ${job.company.industry}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {jobLocation(job)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-3.5" />
                  {job.type}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  Posted {relativeTime(job.postedAt)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {job.applicantsCount ?? 0} applicant
                  {(job.applicantsCount ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* ---------- Salary + actions ---------- */}
          <div className="sm:text-right">
            <p className="text-lg font-semibold text-emerald-300">
              {formatSalary(job)}
            </p>

            <p
              className={`mt-1 text-xs ${
                closed
                  ? "text-rose-300"
                  : daysLeft <= 7
                    ? "text-amber-300"
                    : "text-muted-foreground"
              }`}
            >
              {closed
                ? "Applications closed"
                : `Closes ${formatDate(job.deadline)} · ${daysLeft} day${
                    daysLeft === 1 ? "" : "s"
                  } left`}
            </p>

            <div className="mt-4 flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => void toggleSave()}
                disabled={busy}
                aria-pressed={saved}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                  saved
                    ? "border-brand-violet/40 bg-brand-violet/15 text-brand-violet"
                    : "border-line bg-elevated text-muted-foreground hover:text-white"
                }`}
              >
                {saved ? (
                  <BookmarkCheck className="size-3.5" />
                ) : (
                  <Bookmark className="size-3.5" />
                )}
                {saved ? "Saved" : "Save job"}
              </button>

              <button
                type="button"
                onClick={() => setApplyOpen(true)}
                disabled={applied || closed || busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {applied ? <Check className="size-3.5" /> : <Send className="size-3.5" />}
                {applied ? "Applied" : closed ? "Closed" : "Apply now"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Body ================= */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* ---------- Left: the description ---------- */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              About the role
            </h2>

            {/* `whitespace-pre-line` keeps the recruiter's paragraphs: the
                API stores the description as one string with newlines. */}
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/85">
              {job.description}
            </p>
          </section>

          <BulletSection
            title="Responsibilities"
            items={job.responsibilities}
            tone="blue"
          />

          <BulletSection title="Requirements" items={job.requirements} tone="violet" />

          <BulletSection title="Benefits" items={job.benefits} tone="emerald" />
        </div>

        {/* ---------- Right: facts, company, similar jobs ---------- */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-panel/80 p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Job facts
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="text-white">{job.category || "—"}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Job type</dt>
                <dd className="text-white">{job.type}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right text-white">{jobLocation(job)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Posted
                </dt>
                <dd className="text-white">{formatDate(job.postedAt)}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd className={closed ? "text-rose-300" : "text-white"}>
                  {formatDate(job.deadline)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-panel/80 p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Company
            </h2>

            <div className="mt-4 flex items-center gap-3">
              {job.company?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- external logo URL
                <img
                  src={job.company.logo}
                  alt={`${job.company.name} logo`}
                  className="size-10 rounded-xl border border-line object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-sm font-semibold text-white">
                  {job.company?.name?.[0] ?? "?"}
                </span>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {job.company?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {job.company?.location ?? job.company?.industry ?? "—"}
                </p>
              </div>
            </div>

            <Link
              href="/companies"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
            >
              See company profiles
              <ArrowUpRight className="size-3.5" />
            </Link>
          </section>

          {/* ---------- Similar jobs ---------- */}
          {similar.length > 0 && (
            <section className="rounded-2xl border border-line bg-panel/80 p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Similar roles
              </h2>

              <ul className="mt-4 space-y-3">
                {similar.map((item) => (
                  <li key={item._id}>
                    <Link
                      href={`/secker/jobs/${item._id}`}
                      className="block rounded-xl border border-line bg-elevated/60 p-3 transition-colors hover:border-white/20"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.company?.name} · {jobLocation(item)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-300">
                        {formatSalary(item)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* ---------- Apply modal ---------- */}
      {applyOpen && (
        <ApplyDialog
          job={job}
          onClose={() => setApplyOpen(false)}
          onSubmit={submitApplication}
        />
      )}

      {/* A small reassurance line, matching the rest of the dashboard. */}
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <CircleCheck className="size-3.5 text-emerald-400" />
        Live job data from GET /api/jobs/{job._id.slice(-6)}
      </p>
    </div>
  );
}
