/**
 * badge.tsx — the small colored "pill" used to show a status
 * (Active, Pending, Under Review, Approved…).
 *
 * Used everywhere data has a state, so all screens agree on the colors:
 *   green → good news, amber → waiting, red → bad, blue → just started.
 */

import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASSES } from "@/lib/format";

interface BadgeProps extends React.ComponentProps<"span"> {
  /**
   * Optional machine status (e.g. "approved", "under_review").
   * When given, the color is looked up from the shared STATUS_BADGE_CLASSES
   * table in format.ts — one source of truth for "which status is which color".
   */
  status?: string;
}

export function Badge({ className, status, children, ...props }: BadgeProps) {
  return (
    <span
      // Inline-flex keeps the pill hugging its text; rounded-full makes it a pill.
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        // Default look when no status mapping applies:
        "border-white/10 bg-white/5 text-zinc-300",
        // Status-driven colors override the default (listed later wins in Tailwind's CSS order).
        status ? STATUS_BADGE_CLASSES[status] : undefined,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
