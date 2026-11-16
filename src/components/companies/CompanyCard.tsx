/**
 * ============================================================================
 * components/companies/CompanyCard.tsx — one company in the /companies grid
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Companies page)
 *   logo/avatar · name · industry · location · employee count · open jobs
 *   The whole card links to that company's profile page.
 *
 * The API (/api/companies) already joins `openJobs` (number of active posts)
 * onto every company, so this card only formats what it receives.
 * ============================================================================
 */

/* eslint-disable @next/next/no-img-element */
// Logos are arbitrary uploaded URLs → plain <img> avoids next/image domains.

import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import type { Company } from "@/lib/types";

/** A company row exactly as /api/companies returns it. */
export interface CompanyWithJobs extends Company {
  openJobs: number; // active job posts (computed by the API)
}

export function CompanyCard({ company }: { company: CompanyWithJobs }) {
  // Initials fallback when the company has no logo uploaded.
  const initials = company.name.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/companies/${company.id}`}
      // Card-wide link: the whole tile is clickable, which is the pattern the
      // design uses. Hover lifts the border and reveals the arrow.
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-indigo-400/40 hover:bg-white/[0.05]"
    >
      {/* ---- Logo + name + industry ---- */}
      <div className="flex items-start gap-3">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="h-12 w-12 rounded-xl border border-white/10 bg-white object-contain p-1"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-zinc-400">
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-semibold text-white transition-colors group-hover:text-indigo-300">
            {company.name}
          </h3>
          {/* Industry as a small brand pill. */}
          <Badge tone="brand" className="mt-1.5">
            {company.industry}
          </Badge>
        </div>
      </div>

      {/* ---- Short description ---- */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
        {company.description}
      </p>

      {/* ---- Facts: location + employee count ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
          {company.location || "Remote"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users aria-hidden="true" className="h-3.5 w-3.5" />
          {company.employeeCount} employees
        </span>
      </div>

      {/* ---- Footer: open jobs + arrow ---- */}
      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs font-medium text-zinc-300">
          {/* Pluralise correctly: 1 job / 2 jobs. */}
          {company.openJobs} open {company.openJobs === 1 ? "job" : "jobs"}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-300"
        />
      </div>
    </Link>
  );
}
