"use client";

/**
 * ============================================================================
 * components/jobs/JobFilters.tsx — the Browse Jobs filter sidebar
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Browse Jobs screenshot)
 *   Filters · Job Type (Full-time, Contract, Freelance…) · Location ·
 *   Salary range · Category. The DOCX notes no filter component exists in the
 *   proposed structure, so this file is the suggested `JobFilters` component.
 *
 * HOW IT WORKS
 * It is a CONTROLLED component: the page owns the filter object, this sidebar
 * only renders it and calls `onChange` with the field that changed. That keeps
 * the "build a query string + fetch" logic in one place (the page).
 * ============================================================================
 */

import { SlidersHorizontal } from "lucide-react";

import { Input, Label, Select } from "@/components/ui/Field";
import { JOB_TYPES } from "@/lib/data";
import { JOB_CATEGORIES } from "@/lib/plans";
import { cn } from "@/lib/utils";

/** The complete filter state for the Browse Jobs page. */
export interface JobFilterValue {
  q: string; // keyword (title/company) — edited in the big search bar
  types: string[]; // selected job types (multi-select)
  location: string; // free-text city/country
  minSalary: number; // 0 = no minimum
  category: string; // "" = all categories
}

/** A blank filter set — used for the first render and the Reset button. */
export const EMPTY_JOB_FILTERS: JobFilterValue = {
  q: "",
  types: [],
  location: "",
  minSalary: 0,
  category: "",
};

/** Props for the sidebar. */
export interface JobFiltersProps {
  value: JobFilterValue;
  /** Called with only the changed fields; the page merges them. */
  onChange: (patch: Partial<JobFilterValue>) => void;
  /** Clears every filter. */
  onReset: () => void;
  /** Optional counts per job type, computed from the current result set. */
  typeCounts?: Record<string, number>;
}

export function JobFilters({ value, onChange, onReset, typeCounts }: JobFiltersProps) {
  /** Add/remove a job type from the selected list. */
  function toggleType(type: string) {
    const selected = value.types.includes(type);
    onChange({
      // Filter out the type when unchecking, append it when checking.
      types: selected
        ? value.types.filter((item) => item !== type)
        : [...value.types, type],
    });
  }

  // True when at least one filter is active (drives the Reset button style).
  const hasFilters =
    value.q !== "" ||
    value.types.length > 0 ||
    value.location !== "" ||
    value.minSalary > 0 ||
    value.category !== "";

  return (
    // Sticky from md up, where the rail becomes a column beside the results.
    <aside className="md:sticky md:top-20 md:self-start" aria-label="Job filters">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-indigo-300" />
            Filters
          </h2>
          {/* Reset is only offered when it would do something. */}
          <button
            type="button"
            onClick={onReset}
            disabled={!hasFilters}
            className={cn(
              "text-xs font-medium transition-colors",
              hasFilters
                ? "text-indigo-300 hover:text-indigo-200"
                : "cursor-not-allowed text-zinc-600"
            )}
          >
            Clear all
          </button>
        </div>

        {/* ---- Job Type (checkboxes, multi-select) ---- */}
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Job Type
          </h3>
          <ul className="mt-3 space-y-2">
            {JOB_TYPES.map((type) => {
              const checked = value.types.includes(type);

              return (
                <li key={type}>
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-300">
                    <span className="flex items-center gap-2">
                      {/* accent-indigo-500 tints the native checkbox. */}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleType(type)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
                      />
                      {type}
                    </span>
                    {/* Live count for this type (optional prop). */}
                    {typeCounts?.[type] !== undefined && (
                      <span className="text-xs text-zinc-500">{typeCounts[type]}</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---- Category ---- */}
        <div className="mt-6">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            id="filter-category"
            value={value.category}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {/* Categories come from lib/plans.ts (shared with the post-job form). */}
            {JOB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>

        {/* ---- Location ---- */}
        <div className="mt-6">
          <Label htmlFor="filter-location">Location</Label>
          <Input
            id="filter-location"
            value={value.location}
            onChange={(event) => onChange({ location: event.target.value })}
            placeholder="City or country"
          />
        </div>

        {/* ---- Minimum salary ---- */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-salary" className="mb-0">
              Minimum salary
            </Label>
            {/* Live value readout, formatted with thousands separators. */}
            <span className="text-xs font-medium text-indigo-300">
              {value.minSalary > 0 ? `$${value.minSalary.toLocaleString()}` : "Any"}
            </span>
          </div>
          {/* A range input is the cheapest accessible salary slider. */}
          <input
            id="filter-salary"
            type="range"
            min={0}
            max={200000}
            step={5000}
            value={value.minSalary}
            onChange={(event) => onChange({ minSalary: Number(event.target.value) })}
            className="mt-3 w-full accent-indigo-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>$0</span>
            <span>$200k+</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
