/**
 * ============================================================================
 * components/home/Stats.tsx — the "Assisting over 15,000 job seekers" strip
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR
 * A heading plus four number cards:
 *   Active Jobs · Companies · Job Seekers · Satisfaction Rate
 *
 * WHERE THE NUMBERS COME FROM
 * The home page fetches /api/stats/public (the backend computes them from the
 * real store) and passes them in. `fallbackStats` from lib/data.ts shows when
 * the request is still in flight or unavailable.
 *
 * WHY IT IS A SERVER COMPONENT
 * It only formats props — no state, no events — so it ships no JavaScript.
 * ============================================================================
 */

import { fallbackStats, type StatCard } from "@/lib/data";

/** Props: live stats from the API (optional). */
export function Stats({ stats }: { stats?: StatCard[] }) {
  // Use the API numbers when they arrived, otherwise the marketing defaults.
  const cards = stats?.length ? stats : fallbackStats;

  return (
    // pt/pb spacing separates this strip from the hero above and jobs below.
    <section className="border-b border-white/5 bg-background py-16" aria-label="HireLoop by the numbers">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.6fr] lg:grid-cols-[1.1fr_1.9fr]">
          {/* ---- Left: the claim ---- */}
          <h2 className="max-w-md text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
            Assisting over 15,000 job seekers find their dream positions.
          </h2>

          {/* ---- Right: four cards (2×2 on mobile, 4 across on md+) ---- */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((stat) => (
              <div
                key={stat.label}
                // A subtle glass card so the numbers feel tangible.
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center"
              >
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
