"use client";

/**
 * ==================================================================
 *  DASHBOARD OVERVIEW — src/app/(secker)/secker/dashbord/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  The first screen a logged-in seeker sees. It answers three questions
 *  at a glance:
 *
 *    1. How is my job hunt going?   -> counter cards + pipeline bars
 *    2. How much plan quota is left? -> usage card
 *    3. What should I do next?       -> profile strength + fresh jobs
 *
 *  API CALLS (all through the Next.js proxy described in _lib/api.ts)
 *    GET /api/stats/seeker   -> counters + the 5 newest activity items
 *    GET /api/jobs?limit=3   -> three newest jobs as recommendations
 *
 *  The page fetches on the client (inside useEffect) because the data
 *  depends on the login cookie. Next.js 16 also forbids starting requests
 *  during render, so an effect is the correct place.
 * ==================================================================
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  Building,
  ChartColumn,
  CircleCheckBig,
  CreditCard,
  FileText,
  LoaderCircle,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { api, errorMessage } from "../../_lib/api";
import type {
  ActivityItem,
  Application,
  ApplicationsResponse,
  JobsResponse,
  Job,
  SeekerStats,
  StatsResponse,
} from "../../_lib/types";
import {
  APPLICATION_STATUS_META,
  APPLICATION_STATUS_ORDER,
  formatSalary,
  initials,
  jobLocation,
  planUsageLabel,
  profileCompleteness,
  relativeTime,
  usagePercent,
} from "../../_lib/format";
import { useSeekerUser } from "../../_lib/user-context";
import { PageHeader } from "../../_components/PageHeader";
import { StatCard } from "../../_components/StatCard";
import { Notice } from "../../_components/Notice";

/** Icons for the activity feed, keyed by the notification `type`. */
const ACTIVITY_ICONS = {
  application: FileText,
  payment: CreditCard,
  company: Building,
  account: UserRound,
} as const;

export default function SeekerDashboardPage() {
  // The live user from the layout (name, avatar, plan, profile fields).
  const { user } = useSeekerUser();

  // ---------- State: one slice per API response ----------
  const [stats, setStats] = useState<SeekerStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommended, setRecommended] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Load everything once when the page opens ----------
  useEffect(() => {
    // `cancelled` prevents a state update if the user leaves mid-request.
    let cancelled = false;

    async function load() {
      // Promise.allSettled lets the calls fail independently: if the job
      // feed is down we still show the application counters.
      const [statsResult, jobsResult, appsResult] = await Promise.allSettled([
        api<StatsResponse>("/stats/seeker"),
        api<JobsResponse>("/jobs?limit=3&sort=newest"),
        api<ApplicationsResponse>("/applications/mine"),
      ]);

      if (cancelled) return;

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.stats);
        setActivity(statsResult.value.activity);
      } else {
        setError(errorMessage(statsResult.reason));
      }

      if (jobsResult.status === "fulfilled") {
        setRecommended(jobsResult.value.jobs);
      }

      if (appsResult.status === "fulfilled") {
        setApplications(appsResult.value.applications);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // First name for the greeting ("Welcome back, Rakib").
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  // Profile completeness drives the "next best action" card.
  const profile = profileCompleteness(user);

  /**
   * The pipeline numbers, counted from the actual application rows.
   * Using /api/applications/mine (instead of subtracting from the stats
   * bundle) lets "Applied" and "Under Review" appear as separate stages,
   * which is exactly how the requirements describe the pipeline.
   */
  const pipeline = APPLICATION_STATUS_ORDER.map((status) => ({
    status,
    value: applications.filter((application) => application.status === status).length,
  }));

  /** Largest value, used to scale the bars (never divide by zero). */
  const pipelineMax = Math.max(1, ...pipeline.map((row) => row.value));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="size-6 animate-spin text-brand-violet" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ================= Greeting ================= */}
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Here is what happened with your applications and saved roles."
        actions={
          <>
            <Link
              href="/secker/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_#5a6bff] transition-transform hover:-translate-y-0.5"
            >
              Browse jobs
              <ArrowUpRight className="size-4" />
            </Link>

            <Link
              href="/secker/settings"
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated"
            >
              Edit profile
            </Link>
          </>
        }
      />

      {/* ================= Error / quota banners ================= */}
      {error && <Notice tone="error">{error}</Notice>}

      {stats?.limitReached && (
        <Notice tone="info">
          You have used all {stats.planLimit} applications included in the{" "}
          {stats.planLabel} plan this month.{" "}
          <Link href="/secker/billing" className="font-semibold underline">
            Upgrade your plan
          </Link>{" "}
          to keep applying.
        </Notice>
      )}

      {/* ================= Counter cards ================= */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications this month"
          value={stats?.applicationsUsed ?? 0}
          hint={stats ? planUsageLabel(stats) : undefined}
          icon={FileText}
          href="/secker/applications"
        />

        <StatCard
          label="Saved jobs"
          value={stats?.savedJobs ?? 0}
          hint="Roles waiting for your review"
          icon={Bookmark}
          accent="border-brand-violet/30 bg-brand-violet/10 text-violet-300"
          href="/secker/saved-jobs"
        />

        <StatCard
          label="Shortlisted"
          value={stats?.shortlisted ?? 0}
          hint="Recruiters want to talk to you"
          icon={TrendingUp}
          accent="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          href="/secker/applications"
        />

        <StatCard
          label="Offers"
          value={stats?.offered ?? 0}
          hint="Congratulations are in order"
          icon={CircleCheckBig}
          accent="border-amber-500/30 bg-amber-500/10 text-amber-300"
          href="/secker/applications"
        />
      </section>

      {/* ================= Plan usage + pipeline ================= */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* ---------- Plan usage ---------- */}
        <div className="rounded-2xl border border-line bg-panel/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Plan usage
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {stats?.planLabel ?? "Free"} plan
              </h2>
            </div>

            <span className="flex size-9 items-center justify-center rounded-xl border border-brand-orange/30 bg-brand-orange/10 text-brand-orange">
              <Wallet className="size-4" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-white">
                {stats?.applicationsUsed ?? 0}{" "}
                <span className="text-muted-foreground">
                  / {stats?.planLimit === null ? "∞" : (stats?.planLimit ?? 3)}
                </span>
              </span>

              <span className="text-xs text-muted-foreground">
                {stats?.planLimit === null
                  ? "Unlimited"
                  : stats
                    ? `${usagePercent(stats)}% used`
                    : "—"}
              </span>
            </div>

            {/* The bar. Width is inline because the value comes from the API. */}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full ${
                  stats?.limitReached
                    ? "bg-gradient-to-r from-rose-500 to-orange-500"
                    : "bg-gradient-to-r from-[#4d6bff] to-[#7c5cff]"
                }`}
                style={{ width: `${stats ? usagePercent(stats) : 0}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Quota resets on the 1st of every month. Your plan controls how many
              applications you can send.
            </p>

            <Link
              href="/secker/billing"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
            >
              View plans & billing
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* ---------- Application pipeline ---------- */}
        <div className="rounded-2xl border border-line bg-panel/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Application pipeline
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {stats?.applicationsTotal ?? 0} total applications
              </h2>
            </div>

            <span className="flex size-9 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-sky-300">
              <ChartColumn className="size-4" aria-hidden="true" />
            </span>
          </div>

          <ul className="mt-5 space-y-3">
            {pipeline.map((row) => {
              const meta = APPLICATION_STATUS_META[row.status];

              return (
                <li
                  key={row.status}
                  className="grid grid-cols-[92px_1fr_28px] items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground">{meta.label}</span>

                  <span className="h-2 overflow-hidden rounded-full bg-elevated">
                    <span
                      className={`block h-full rounded-full ${meta.dot}`}
                      style={{ width: `${Math.round((row.value / pipelineMax) * 100)}%` }}
                    />
                  </span>

                  <span className="text-right text-xs font-medium text-white">
                    {row.value}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            href="/secker/applications"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
          >
            Open all applications
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ================= Profile strength + activity ================= */}
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* ---------- Profile strength ---------- */}
        <div className="rounded-2xl border border-line bg-panel/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Profile strength
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {profile.percent}% complete
              </h2>
            </div>

            <span className="flex size-11 items-center justify-center rounded-full border border-line bg-elevated text-sm font-semibold text-white">
              {initials(user.name)}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
              style={{ width: `${profile.percent}%` }}
            />
          </div>

          {profile.missing.length > 0 ? (
            <>
              <p className="mt-4 text-xs text-muted-foreground">
                Add these to stand out to recruiters:
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {profile.missing.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-elevated px-2.5 py-1 text-[11px] capitalize text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
              <CircleCheckBig className="size-4" />
              Your profile is complete — nice work.
            </p>
          )}

          <Link
            href="/secker/settings"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
          >
            Update profile
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* ---------- Recent activity ---------- */}
        <div className="rounded-2xl border border-line bg-panel/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Recent activity
            </p>

            <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>

          {activity.length === 0 ? (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Nothing yet. Apply to a job and status updates will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.map((item) => {
                const Icon =
                  ACTIVITY_ICONS[item.type as keyof typeof ACTIVITY_ICONS] ?? Bell;

                return (
                  <li key={item._id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-white">{item.text}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {relativeTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ================= Recommended jobs ================= */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Fresh on HireLoop
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">Newest jobs for you</h2>
          </div>

          <Link
            href="/secker/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
          >
            See all jobs
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {recommended.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-panel/40 px-5 py-8 text-center text-sm text-muted-foreground">
            The job feed is empty right now. Check back soon.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommended.map((job) => (
              // The dashboard preview is read-only: saving/applying happens
              // on the Browse Jobs page, which owns those actions.
              <div key={job._id} className="rounded-2xl border border-line bg-panel/80 p-5">
                <div className="flex items-center gap-3">
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

                  <p className="truncate text-sm text-muted-foreground">
                    {job.company?.name}
                  </p>
                </div>

                <Link
                  href={`/secker/jobs/${job._id}`}
                  className="mt-3 line-clamp-2 block text-base font-semibold text-white transition-colors hover:text-brand-violet"
                >
                  {job.title}
                </Link>

                <p className="mt-1 text-xs text-muted-foreground">
                  {jobLocation(job)} · {job.type}
                </p>

                <p className="mt-3 text-sm font-medium text-emerald-300">
                  {formatSalary(job)}
                </p>

                <Link
                  href={`/secker/jobs/${job._id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet transition-colors hover:text-white"
                >
                  View job
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer hint that ties the page together. */}
      <p className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
        <Sparkles className="size-3.5 text-brand-orange" />
        Numbers update every time you open this page.
      </p>
    </div>
  );
}
