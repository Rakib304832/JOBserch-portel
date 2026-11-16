"use client";

/**
 * ============================================================================
 * components/jobs/Pagination.tsx — page numbers under the job results
 * ============================================================================
 *
 * The Browse Jobs screenshot shows numbered pages at the bottom. The DOCX
 * flags pagination as a missing component, so this file fills that gap.
 *
 * It is presentational: the page owns `page` and passes `onPageChange`.
 * Pagination happens on the client because /api/jobs returns the full
 * filtered catalogue in one response — no need for extra requests.
 * ============================================================================
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props for the pagination control. */
export function Pagination({
  page, // current 1-based page
  totalPages, // total number of pages
  onPageChange, // called with the requested page
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  // Nothing to paginate → render nothing at all.
  if (totalPages <= 1) return null;

  // Build the list [1, 2, 3 … totalPages].
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Job results pages" className="mt-10 flex items-center justify-center gap-1.5">
      {/* ---- Previous ---- */}
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>

      {/* ---- Page numbers ---- */}
      {pages.map((number) => {
        const active = number === page;

        return (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            // aria-current="page" is the standard marker for the active page.
            aria-current={active ? "page" : undefined}
            className={cn(
              "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors",
              active
                ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                : "border-white/10 text-zinc-300 hover:bg-white/5"
            )}
          >
            {number}
          </button>
        );
      })}

      {/* ---- Next ---- */}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
