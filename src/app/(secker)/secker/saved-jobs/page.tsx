"use client";

/**
 * ==================================================================
 *  SAVED JOBS — src/app/(secker)/secker/saved-jobs/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  "Save for later" bookmarks. Every card here is a job the seeker
 *  bookmarked, newest first, with two actions:
 *
 *      Remove  -> DELETE /api/saved/:jobId
 *      Apply   -> POST   /api/applications { jobId, coverLetter }
 *
 *  API CALLS
 *    GET    /api/saved                 full job documents + savedAt
 *    GET    /api/applications/mine     so "Applied" cards are marked
 *    DELETE /api/saved/:jobId
 *    POST   /api/applications
 *
 *  WHY THE FULL JOB IS RETURNED BY THE SERVER
 *  A bookmark only stores ids. The saved controller joins each bookmark to
 *  its job document, so this page can render the same JobCard as the
 *  browse page without extra requests.
 * ==================================================================
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  LoaderCircle,
  Search,
} from "lucide-react";
import { api, errorMessage } from "../../_lib/api";
import type {
  ApplicationsResponse,
  Job,
  SavedResponse,
  SimpleResponse,
} from "../../_lib/types";
import { PageHeader } from "../../_components/PageHeader";
import { JobCard } from "../../_components/JobCard";
import { ApplyDialog } from "../../_components/ApplyDialog";
import { Notice, type NoticeTone } from "../../_components/Notice";
import { EmptyState } from "../../_components/EmptyState";

export default function SavedJobsPage() {
  // The bookmarked jobs, already containing full job details.
  const [jobs, setJobs] = useState<Job[]>([]);

  // Ids of jobs the seeker already applied to.
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Loading / error for the list itself.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The job currently being removed or applied to.
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  // Apply modal target.
  const [applyTarget, setApplyTarget] = useState<Job | null>(null);

  // Feedback banner.
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);

  /** Fetch the bookmarks + the applied-job ids together. */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [savedResult, appsResult] = await Promise.allSettled([
      api<SavedResponse>("/saved"),
      api<ApplicationsResponse>("/applications/mine"),
    ]);

    if (savedResult.status === "fulfilled") {
      setJobs(savedResult.value.savedJobs);
    } else {
      setError(errorMessage(savedResult.reason));
    }

    if (appsResult.status === "fulfilled") {
      setAppliedIds(
        new Set(appsResult.value.applications.map((application) => application.jobId))
      );
    }

    setLoading(false);
  }, []);

  // Load once on mount.
  useEffect(() => {
    void load();
  }, [load]);

  /**
   * remove — un-bookmark a job.
   * We remove the card locally instead of re-fetching the whole list:
   * the server already confirmed the delete with a 200.
   */
  async function remove(job: Job) {
    setBusyJobId(job._id);

    try {
      await api<SimpleResponse>(`/saved/${job._id}`, { method: "DELETE" });

      setJobs((current) => current.filter((item) => item._id !== job._id));
      setNotice({ tone: "info", text: `Removed "${job.title}" from saved jobs.` });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusyJobId(null);
    }
  }

  /** Apply from a saved card (same endpoint as the browse page). */
  async function submitApplication(coverLetter: string) {
    if (!applyTarget) return;

    setBusyJobId(applyTarget._id);

    try {
      await api("/applications", {
        method: "POST",
        body: { jobId: applyTarget._id, coverLetter },
      });

      setAppliedIds((current) => new Set(current).add(applyTarget._id));
      setNotice({
        tone: "success",
        text: `Application sent for "${applyTarget.title}".`,
      });

      setApplyTarget(null);
    } finally {
      setBusyJobId(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="size-6 animate-spin text-brand-violet" />
        <p className="text-sm text-muted-foreground">Loading saved jobs…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bookmarks"
        title="Saved jobs"
        description="Roles you bookmarked. Apply when you are ready, or remove the ones that are no longer a fit."
        actions={
          <>
            <Link
              href="/secker/jobs"
              className="rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Find more jobs
            </Link>
          </>
        }
      />

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel/80 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl border border-brand-violet/30 bg-brand-violet/10 text-brand-violet">
          <BookmarkCheck className="size-4" aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-semibold text-white">
            {jobs.length} saved job{jobs.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">
            {appliedIds.size > 0
              ? `${jobs.filter((job) => appliedIds.has(job._id)).length} of them already applied to`
              : "Nothing applied to yet"}
          </p>
        </div>

        <span className="ml-auto text-xs text-muted-foreground">
          Free plan saves up to 10 jobs
        </span>
      </div>

      {/* Feedback */}
      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {error && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Notice>
      )}

      {/* List */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          description="Tap the bookmark icon on any job card and it will appear here, ready when you are."
          action={
            <Link
              href="/secker/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Search className="size-4" />
              Browse jobs
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              saved
              savedAt={job.savedAt}
              applied={appliedIds.has(job._id)}
              busy={busyJobId === job._id}
              onRemove={() => void remove(job)}
              onApply={() => setApplyTarget(job)}
            />
          ))}
        </div>
      )}

      {/* Apply modal */}
      {applyTarget && (
        <ApplyDialog
          job={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmit={submitApplication}
        />
      )}
    </div>
  );
}
