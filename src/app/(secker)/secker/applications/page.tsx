"use client";

/**
 * ==================================================================
 *  MY APPLICATIONS — src/app/(secker)/secker/applications/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  Every application the seeker has sent, newest first, with its current
 *  pipeline stage:
 *
 *      Applied -> Under Review -> Shortlisted -> Offered / Rejected
 *
 *  API CALL
 *    GET /api/applications/mine
 *  Response rows already include `jobTitle` and `companyName` (copied by
 *  the server at apply time), so the table needs no extra lookups.
 *
 *  FEATURES FROM THE REQUIREMENTS
 *    · table columns: Job Title, Company, Date Applied, Status
 *    · relative dates ("5 days ago")
 *    · View Details button that opens the real job listing
 *    · summary cards (total, shortlisted, offers, offer rate)
 *    · status tabs + text search, both computed in the browser because the
 *      endpoint returns the seeker's complete list (max 100 rows)
 * ==================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleCheckBig,
  CircleX,
  ClipboardList,
  FileText,
  Inbox,
  LoaderCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { api, errorMessage } from "../../_lib/api";
import type { Application, ApplicationStatus, ApplicationsResponse } from "../../_lib/types";
import {
  APPLICATION_STATUS_META,
  APPLICATION_STATUS_ORDER,
  formatDate,
  relativeTime,
} from "../../_lib/format";
import { PageHeader } from "../../_components/PageHeader";
import { StatCard } from "../../_components/StatCard";
import { StatusBadge } from "../../_components/StatusBadge";
import { Notice } from "../../_components/Notice";
import { EmptyState } from "../../_components/EmptyState";

/** "all" plus every real status, used by the filter tabs. */
type FilterValue = "all" | ApplicationStatus;

export default function ApplicationsPage() {
  // The complete list from the API.
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI filters (no network call — the full list is already in memory).
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  /** Load the list once. */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await api<ApplicationsResponse>("/applications/mine");
        if (!cancelled) setApplications(data.applications);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Derived numbers (computed from the loaded list)                    */
  /* ------------------------------------------------------------------ */

  const total = applications.length;
  const shortlisted = applications.filter((app) => app.status === "shortlisted").length;
  const offered = applications.filter((app) => app.status === "offered").length;
  const rejected = applications.filter((app) => app.status === "rejected").length;

  // Offer rate = offers ÷ applications. Guard against division by zero.
  const offerRate = total === 0 ? 0 : Math.round((offered / total) * 100);

  /** How many rows each tab would show. */
  function countFor(status: FilterValue): number {
    if (status === "all") return total;
    return applications.filter((app) => app.status === status).length;
  }

  // Apply both filters. Search is case-insensitive and covers company too.
  const visible = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      app.jobTitle.toLowerCase().includes(term) ||
      app.companyName.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  /* ------------------------------------------------------------------ */
  /*  Loading                                                            */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="size-6 animate-spin text-brand-violet" />
        <p className="text-sm text-muted-foreground">Loading your applications…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="My applications"
        description="Every role you have applied to, with the latest status from the recruiter."
        actions={
          <Link
            href="/secker/jobs"
            className="rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Apply to more jobs
          </Link>
        }
      />

      {/* ================= Summary cards ================= */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applied"
          value={total}
          hint="All time"
          icon={ClipboardList}
        />

        <StatCard
          label="Shortlisted"
          value={shortlisted}
          hint="Recruiters moved you forward"
          icon={TrendingUp}
          accent="border-brand-violet/30 bg-brand-violet/10 text-violet-300"
        />

        <StatCard
          label="Offers"
          value={offered}
          hint="Roles you have been offered"
          icon={CircleCheckBig}
          accent="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        />

        <StatCard
          label="Offer rate"
          value={`${offerRate}%`}
          hint={rejected > 0 ? `${rejected} rejected so far` : "Keep going"}
          icon={CircleX}
          accent="border-amber-500/30 bg-amber-500/10 text-amber-300"
        />
      </section>

      {error && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}
        </Notice>
      )}

      {/* ================= Filters ================= */}
      {total > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...APPLICATION_STATUS_ORDER] as FilterValue[]).map((status) => {
              const label = status === "all" ? "All" : APPLICATION_STATUS_META[status].label;
              const isActive = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-white/20 bg-elevated text-white"
                      : "border-line text-muted-foreground hover:text-white"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {countFor(status)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Text search */}
          <label className="flex items-center gap-2 rounded-xl border border-line bg-elevated px-3 focus-within:border-brand-violet">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search job or company…"
              className="w-full bg-transparent py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none lg:w-64"
              aria-label="Search applications"
            />
          </label>
        </section>
      )}

      {/* ================= Table / empty ================= */}
      {total === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No applications yet"
          description="When you apply to a job it shows up here with a status you can follow."
          action={
            <Link
              href="/secker/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <FileText className="size-4" />
              Find your first job
            </Link>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No applications match this view"
          description="Try another status tab or clear the search box."
          action={
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white hover:bg-elevated"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel/80">
          {/* Horizontal scroll keeps the table readable on phones. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Job title</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Date applied</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((application) => (
                  <tr
                    key={application._id}
                    className="border-b border-line/70 last:border-0 hover:bg-elevated/40"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/secker/jobs/${application.jobId}`}
                        className="font-medium text-white transition-colors hover:text-brand-violet"
                      >
                        {application.jobTitle}
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {application.companyName}
                    </td>

                    <td className="px-5 py-4">
                      {/* Relative for humans, full date in the tooltip. */}
                      <span className="text-white" title={formatDate(application.createdAt)}>
                        {relativeTime(application.createdAt)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatDate(application.createdAt)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={application.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/secker/jobs/${application.jobId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-elevated"
                      >
                        View details
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer showing how many rows are visible. */}
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {visible.length} of {total} application{total === 1 ? "" : "s"}
            </span>
            <span>Statuses update when a recruiter reviews your application.</span>
          </div>
        </div>
      )}
    </div>
  );
}
