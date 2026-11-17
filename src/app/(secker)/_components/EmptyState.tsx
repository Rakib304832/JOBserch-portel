/**
 * ==================================================================
 *  EMPTY STATE — src/app/(secker)/_components/EmptyState.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The friendly box shown when a list has nothing in it, for example:
 *    - no saved jobs yet
 *    - no applications yet
 *    - no payments yet
 *
 *  WHY A COMPONENT?
 *  A blank page looks broken. Every empty list should explain WHAT is
 *  missing and WHAT to do next, and that guidance should look the same
 *  on every page. Writing it once guarantees consistency.
 * ==================================================================
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon; // any lucide icon component, e.g. Bookmark
  title: string; // short headline
  description: string; // one sentence explaining the situation
  action?: ReactNode; // optional button/link
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-14 text-center">
      {/* A soft circle behind the icon so the empty area still has a focus. */}
      <span className="flex size-14 items-center justify-center rounded-full border border-line bg-elevated text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
