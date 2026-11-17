"use client";

/**
 * ==================================================================
 *  BROWSE & APPLY — src/app/(secker)/secker/jobs/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  The job feed INSIDE the dashboard. It does the same search the public
 *  /jobs page does, but it also knows about the logged-in seeker:
 *    · bookmarks are highlighted and toggleable
 *    · "Apply" opens a cover-letter dialog and posts the application
 *    · jobs already applied to are marked, so nobody applies twice
 *
 *  API CALLS
 *    GET    /api/jobs?q=&type=&location=&sort=&page=&limit=9
 *    GET    /api/saved                 (which jobs are bookmarked)
 *    GET    /api/applications/mine     (which jobs already have an application)
 *    POST   /api/saved                 { jobId }
 *    DELETE /api/saved/:jobId
 *    POST   /api/applications          { jobId, coverLetter }
 *
 *  FILTER BEHAVIOUR
 *  Typing in the search box updates `searchInput` immediately. A small
 *  timer (400 ms) copies it into `q`, and only `q` is in the fetch effect
 *  — so the API is called when the user pauses, not on every keystroke.
 * ==================================================================
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Funnel,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { api, errorMessage, toQuery } from "../../_lib/api";
import type {
  ApplicationsResponse,
  Job,
  JobsResponse,
  SavedResponse,
  SimpleResponse,
} from "../../_lib/types";
import { PageHeader } from "../../_components/PageHeader";
import { JobCard } from "../../_components/JobCard";
import { ApplyDialog } from "../../_components/ApplyDialog";
import { Notice, type NoticeTone } from "../../_components/Notice";
import { EmptyState } from "../../_components/EmptyState";

/** The job types the server's validator accepts. */
const JOB_TYPES = ["Full-time", "Part-time", "Remote", "Contract", "Internship"];

/** Sort options mapped to the server's `sort` query values. */
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "salaryDesc", label: "Salary: high to low" },
  { value: "salaryAsc", label: "Salary: low to high" },
];

/** Page size: 9 keeps a tidy 3×3 grid. */
const PAGE_SIZE = 9;

export default function BrowseJobsPage() {
  // ---------- Filters ----------
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState(""); // debounced search term
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // ---------- Feed ----------
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Seeker-specific overlays ----------
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Which job is currently saving/applying (disables that one card only).
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  // The job whose Apply dialog is open, if any.
  const [applyTarget, setApplyTarget] = useState<Job | null>(null);

  // The banner above the grid.
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);

  /**
   * Debounce: copy the search box into `q` 400 ms after typing stops.
   * Changing the term always returns to page 1, otherwise a search could
   * start on page 4 where there are no results.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /**
   * loadSeekerState — fetch bookmarked and applied job ids.
   * Reused after saving/removing so the button state stays truthful.
   */
  const loadSeekerState = useCallback(async () => {
    const [savedResult, appsResult] = await Promise.allSettled([
      api<SavedResponse>("/saved"),
      api<ApplicationsResponse>("/applications/mine"),
    ]);

    if (savedResult.status === "fulfilled") {
      setSavedIds(new Set(savedResult.value.savedJobs.map((job) => job._id)));
    }

    if (appsResult.status === "fulfilled") {
      setAppliedIds(
        new Set(appsResult.value.applications.map((application) => application.jobId))
      );
    }
  }, []);

  // Load bookmark/application state once.
  useEffect(() => {
    void loadSeekerState();
  }, [loadSeekerState]);

  /**
   * Fetch the feed whenever a filter changes.
   * The AbortController cancels the previous request when the user types
   * again quickly, so an older (slower) response cannot overwrite a newer
   * one.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const query = toQuery({
          q,
          type,
          location: location.trim(),
          sort,
          page,
          limit: PAGE_SIZE,
        });

        const data = await api<JobsResponse>(`/jobs${query}`, {
          signal: controller.signal,
        });

        setJobs(data.jobs);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        // Abort is not a real error — ignore it.
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setJobs([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();

    return () => controller.abort();
  }, [q, type, location, sort, page]);

  /** Save or un-save one job, then update the local set. */
  async function toggleSave(job: Job) {
    setBusyJobId(job._id);

    try {
      if (savedIds.has(job._id)) {
        await api<SimpleResponse>(`/saved/${job._id}`, { method: "DELETE" });

        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(job._id);
          return next;
        });

        setNotice({ tone: "info", text: `Removed "${job.title}" from saved jobs.` });
      } else {
        await api<SimpleResponse>("/saved", {
          method: "POST",
          body: { jobId: job._id },
        });

        setSavedIds((current) => new Set(current).add(job._id));
        setNotice({ tone: "success", text: `Saved "${job.title}" for later.` });
      }
    } catch (err) {
      // 402 means the Free plan's 10-bookmark cap is full.
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusyJobId(null);
    }
  }

  /** Send one application. Thrown errors are shown inside the dialog. */
  async function submitApplication(coverLetter: string) {
    if (!applyTarget) return;

    setBusyJobId(applyTarget._id);

    try {
      await api("/applications", {
        method: "POST",
        body: { jobId: applyTarget._id, coverLetter },
      });

      setAppliedIds((current) => new Set(current).add(applyTarget._id));

      // The application counter and saved-job count change, but those live
      // on other pages and are re-fetched when opened. Here we only confirm.
      setNotice({
        tone: "success",
        text: `Application sent for "${applyTarget.title}". Track it under Applications.`,
      });

      setApplyTarget(null);
    } finally {
      setBusyJobId(null);
    }
  }

  /** Reset every filter to its default. */
  function resetFilters() {
    setSearchInput("");
    setQ("");
    setType("");
    setLocation("");
    setSort("newest");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Find work"
        title="Browse jobs"
        description="Search the same live job feed as the public site — then save roles or apply without leaving the dashboard."
        actions={
          <>
            <Link
              href="/secker/saved-jobs"
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated"
            >
              Saved jobs
            </Link>

            <Link
              href="/secker/applications"
              className="rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              My applications
            </Link>
          </>
        }
      />

      {/* ================= Filter panel ================= */}
      <section className="rounded-2xl border border-line bg-panel/80 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-elevated px-3 focus-within:border-brand-violet">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search job title or description…"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none"
              aria-label="Search jobs"
            />
          </label>

          {/* Type */}
          <label className="flex items-center gap-2 rounded-xl border border-line bg-elevated px-3">
            <BriefcaseBusiness
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-transparent py-2.5 pr-2 text-sm text-white focus:outline-none"
              aria-label="Job type"
            >
              <option value="">All types</option>
              {JOB_TYPES.map((jobType) => (
                <option key={jobType} value={jobType}>
                  {jobType}
                </option>
              ))}
            </select>
          </label>

          {/* Location */}
          <label className="flex items-center gap-2 rounded-xl border border-line bg-elevated px-3">
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <input
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setPage(1);
              }}
              placeholder="City or country"
              className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none"
              aria-label="Filter by location"
            />
          </label>

          {/* Sort */}
          <label className="flex items-center gap-2 rounded-xl border border-line bg-elevated px-3">
            <SlidersHorizontal
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-transparent py-2.5 pr-2 text-sm text-white focus:outline-none"
              aria-label="Sort jobs"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Result count + reset */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Funnel className="size-3.5" />
            {loading ? "Searching…" : `${total} job${total === 1 ? "" : "s"} found`}
          </p>

          {(q || type || location || sort !== "newest") && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-violet transition-colors hover:text-white"
            >
              <RefreshCw className="size-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* ================= Feedback ================= */}
      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
          {notice.tone === "error" && (
            <>
              {" "}
              <Link href="/secker/billing" className="font-semibold underline">
                View plans
              </Link>
            </>
          )}
        </Notice>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {/* ================= Results ================= */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Six skeleton cards keep the page height stable while loading. */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[290px] animate-pulse rounded-2xl border border-line bg-panel/60"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No jobs match those filters"
          description="Try a shorter search term, pick a different job type, or clear the location."
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white hover:bg-elevated"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              saved={savedIds.has(job._id)}
              applied={appliedIds.has(job._id)}
              busy={busyJobId === job._id}
              onSave={() => void toggleSave(job)}
              onApply={() => setApplyTarget(job)}
            />
          ))}
        </div>
      )}

      {/* ================= Pagination ================= */}
      {!loading && jobs.length > 0 && pages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="size-4" />
            Previous
          </button>

          <p className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </p>

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pages, current + 1))}
            disabled={page >= pages}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* The modal is rendered only for the selected job. */}
      {applyTarget && (
        <ApplyDialog
          job={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmit={submitApplication}
        />
      )}

      {/* Small hint about where the numbers come from. */}
      {!loading && jobs.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <LoaderCircle className="size-3" />
          Live data from GET /api/jobs — no mock records.
        </p>
      )}
    </div>
  );
}
