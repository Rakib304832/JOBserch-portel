/**
 * ============================================================================
 * components/ui/Badge.tsx — small status/tag pills
 * ============================================================================
 *
 * Used for job attributes on cards (Full-time, Remote, Easy Apply), for the
 * "Verified Employer" mark on Job Details, and for statuses elsewhere.
 * Stateless, so it works on the server.
 * ============================================================================
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/** The visual meanings a badge can carry. */
export type BadgeTone =
  | "default" // neutral glass pill
  | "brand" // indigo — "Hot Job", featured
  | "success" // green — approved, verified
  | "warning" // amber — pending, closing soon
  | "danger" // red — rejected, closed
  | "outline"; // hairline border only

/** One class string per tone, so every screen shows the same colour. */
const toneClasses: Record<BadgeTone, string> = {
  default: "border-white/10 bg-white/5 text-zinc-300",
  brand: "border-indigo-400/30 bg-indigo-500/10 text-indigo-300",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-400/30 bg-red-500/10 text-red-300",
  outline: "border-white/15 bg-transparent text-zinc-400",
};

/** Props: children text + optional tone + extra classes. */
export function Badge({
  children,
  tone = "default", // neutral unless the caller says otherwise
  className,
}: {
  children: React.ReactNode; // the short label inside the pill
  tone?: BadgeTone; // colour meaning
  className?: string; // spacing overrides (e.g. mt-2)
}) {
  return (
    <span
      className={cn(
        // Pill basics: hairline border, rounded, small caps-ish type.
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        // Tone colour last so it is not overwritten by the base classes.
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
