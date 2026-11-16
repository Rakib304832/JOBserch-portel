/**
 * ============================================================================
 * components/ui/SectionLabel.tsx — the tiny pill above every section heading
 * ============================================================================
 *
 * The Figma sections all open with a small label ("Smart job discovery",
 * "Features job", "Pricing") before the big heading. It is purely visual, so
 * this component is a <span> and works on the server (no state, no events).
 * ============================================================================
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/** Props: the label text (children) plus optional extra classes. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode; // the words inside the pill
  className?: string; // spacing tweaks from the parent section
}) {
  return (
    <span
      className={cn(
        // Pill shape + subtle glassy background on the dark page.
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1",
        // Small, spaced, uppercase type so it reads as a label, not a heading.
        "text-xs font-medium uppercase tracking-[0.18em] text-indigo-300",
        className
      )}
    >
      {/* A small glowing dot — the detail that makes the label feel intentional. */}
      <span
        aria-hidden="true" // decorative only; screen readers skip it
        className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
      />
      {children}
    </span>
  );
}
