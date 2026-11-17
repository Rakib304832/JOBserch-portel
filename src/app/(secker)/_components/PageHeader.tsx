/**
 * ==================================================================
 *  PAGE HEADER — src/app/(secker)/_components/PageHeader.tsx
 * ==================================================================
 *  The title block at the top of every dashboard page:
 *
 *      My Applications
 *      Every role you have applied to, newest first.
 *                                       [ Browse more jobs ]
 *
 *  WHY A COMPONENT?
 *  Without it each page invents its own heading sizes and spacing, and
 *  the dashboard starts to look uneven. One component = one rhythm.
 * ==================================================================
 */

import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string; // tiny label above the title, e.g. "SEEKER DASHBOARD"
  title: string;
  description?: string;
  actions?: ReactNode; // buttons aligned to the right on desktop
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-violet">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
