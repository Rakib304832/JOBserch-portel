/**
 * empty-state.tsx — the friendly "nothing here yet" panel.
 *
 * Every list screen can be empty: no saved jobs, no applications, no
 * applicants. Showing a blank table looks broken; this component explains
 * what the list is for and offers the obvious next step (a button).
 */

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode; // a lucide icon, e.g. <BookmarkIcon />
  title: string; // "No saved jobs yet"
  description?: string; // one sentence of guidance
  action?: React.ReactNode; // optional button/Link
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        // Circled icon gives the empty state some personality
        // instead of a bare wall of text.
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
