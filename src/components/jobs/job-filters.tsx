"use client";

/**
 * job-filters.tsx — the filter sidebar shared by the public /jobs page and
 * the seeker dashboard's Browse & Apply page.
 *
 * It's a controlled component: it owns NO state of its own. The parent page
 * passes the current `filters` object and receives every change through
 * `onChange(key, value)` — the hook (use-job-search.ts) then re-fetches.
 */

import { Input, Select } from "@/components/ui/form";
import { JOB_CATEGORIES } from "@/lib/plans";
import type { JobFilters } from "@/hooks/use-job-search";

interface JobFiltersSidebarProps {
  filters: JobFilters;
  onChange: (key: keyof JobFilters, value: string) => void;
  onReset: () => void;
}

/** The salary presets — "at least this much" ceilings on the max salary. */
const salaryOptions = [
  { value: "", label: "Any salary" },
  { value: "50000", label: "$50,000+" },
  { value: "80000", label: "$80,000+" },
  { value: "100000", label: "$100,000+" },
  { value: "150000", label: "$150,000+" },
];

export function JobFiltersSidebar({
  filters,
  onChange,
  onReset,
}: JobFiltersSidebarProps) {
  return (
    // Card-style panel; sticky keeps it visible while the results scroll
    // next to it on tall pages.
    <aside className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        {/* Reset = clear every filter at once */}
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Clear all
        </button>
      </div>

      {/* Keyword — mirrors the big search bar (kept in sync because both
          write to the same state object) */}
      <Input
        label="Keyword"
        placeholder="Title or company"
        value={filters.q}
        onChange={(e) => onChange("q", e.target.value)}
      />

      {/* Job type dropdown — the five types from the requirements */}
      <Select
        label="Job type"
        value={filters.type}
        onChange={(e) => onChange("type", e.target.value)}
        options={[
          { value: "", label: "Any type" },
          { value: "Full-time", label: "Full-time" },
          { value: "Part-time", label: "Part-time" },
          { value: "Remote", label: "Remote" },
          { value: "Contract", label: "Contract" },
          { value: "Internship", label: "Internship" },
        ]}
      />

      {/* Category dropdown */}
      <Select
        label="Category"
        value={filters.category}
        onChange={(e) => onChange("category", e.target.value)}
        options={[
          { value: "", label: "Any category" },
          ...JOB_CATEGORIES.map((c) => ({ value: c, label: c })),
        ]}
      />

      {/* Location — free text, matches "City, Country" substrings */}
      <Input
        label="Location"
        placeholder="e.g. Berlin"
        value={filters.location}
        onChange={(e) => onChange("location", e.target.value)}
      />

      {/* Salary floor — one of the presets, or "Any" */}
      <Select
        label="Salary range"
        value={filters.minSalary}
        onChange={(e) => onChange("minSalary", e.target.value)}
        options={salaryOptions}
      />

      <p className="text-xs text-muted-foreground">
        Results update automatically as you type.
      </p>
    </aside>
  );
}
