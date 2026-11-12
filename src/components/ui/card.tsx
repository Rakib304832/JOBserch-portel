/**
 * card.tsx — the rounded panel that groups related content.
 *
 * Cards are the main building block of the visual design: job cards, company
 * cards, plan cards, stat cards… They all share the same surface:
 *   rounded corners + subtle border + slightly lighter background than the page.
 */

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      // Uses the theme tokens from globals.css (.dark section), so the whole
      // app can be re-skinned by editing variables in one place.
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

/** The padded inside of a card. Keeps spacing consistent across screens. */
export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}
