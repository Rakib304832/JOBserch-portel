"use client";

/**
 * ============================================================================
 * components/companies/IndustryTabs.tsx — industry filter tabs
 * ============================================================================
 *
 * The Companies page groups employers by industry (All, AI, Fintech, Developer
 * Tools, E-Commerce…). The list comes from lib/plans.ts (`INDUSTRIES`), which
 * the API also validates against — so a tab can never request an industry the
 * backend does not know.
 *
 * The page owns the selected value; this component only reports clicks.
 * ============================================================================
 */

import { INDUSTRIES } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function IndustryTabs({
  active, // currently selected industry ("All" for none)
  onChange, // called with the clicked industry
}: {
  active: string;
  onChange: (industry: string) => void;
}) {
  return (
    // overflow-x-auto keeps the tabs usable on narrow screens instead of
    // wrapping into four lines. -mx-1/p-1 stops focus rings being clipped.
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Filter companies by industry"
    >
      {INDUSTRIES.map((industry) => {
        const selected = active === industry;

        return (
          <button
            key={industry}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(industry)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            )}
          >
            {industry}
          </button>
        );
      })}
    </div>
  );
}
