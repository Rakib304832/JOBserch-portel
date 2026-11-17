/**
 * ==================================================================
 *  STAT CARD — src/app/(secker)/_components/StatCard.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The number tiles at the top of the dashboard, for example:
 *
 *      ┌───────────────────────────┐
 *      │  APPLICATIONS THIS MONTH  │
 *      │  7          3 of 30 used  │
 *      └───────────────────────────┘
 *
 *  PROPS EXPLAINED
 *   label   — the small uppercase caption
 *   value   — the big number/text
 *   hint    — one line of context underneath
 *   icon    — a lucide icon component
 *   accent  — tailwind classes for the icon circle colour
 *   href    — optional; makes the whole card a link
 * ==================================================================
 */

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "border-brand-blue/30 bg-brand-blue/10 text-sky-300",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  accent?: string;
  href?: string;
}) {
  // The visual card is extracted so the link version and the plain
  // version render exactly the same pixels.
  const body = (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-line bg-panel/80 p-5 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>

        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${accent}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>

      <div>
        {/* The big number. `leading-none` keeps tall digits compact. */}
        <p className="text-3xl font-semibold leading-none tracking-tight text-white">
          {value}
        </p>

        {hint && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );

  // Only wrap in a Link when the caller asked for one.
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
