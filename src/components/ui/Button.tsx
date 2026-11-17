/**
 * ============================================================================
 * components/ui/Button.tsx — the one button used across the public site
 * ============================================================================
 *
 * WHY A SHARED BUTTON
 * The Figma file uses the same button in a handful of looks: the indigo→violet
 * gradient (primary), a white/dark solid (secondary), a thin outlined ghost,
 * and a text-only link. Writing those Tailwind strings in every section would
 * drift over time; this file defines them once.
 *
 * WHY `asChild`
 * Most CTAs are navigations, not actions — they must render an <a>/<Link>.
 * `asChild` lets us keep the button styling while the child (a Link) provides
 * the actual element, so we never nest a <button> inside an <a>.
 *
 * This is a plain (shared) component: it has no state, so it works in both
 * server and client components.
 * ============================================================================
 */

import * as React from "react";
// cva = "class variance authority": turns variant/size props into class names.
import { cva, type VariantProps } from "class-variance-authority";
// Slot renders the single child element instead of a wrapper <button>.
import { Slot } from "radix-ui";

// cn() merges Tailwind classes and lets a caller override ours last.
import { cn } from "@/lib/utils";

/**
 * The class recipe for every button on the site.
 * `base` holds what never changes; each variant/size adds its own classes.
 */
const buttonVariants = cva(
  // ---- base: layout, typography, focus ring, disabled state ----
  [
    "inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-lg text-sm font-medium whitespace-nowrap",
    "transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // The Figma primary CTA: the indigo→violet gradient + soft glow.
        primary:
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400",
        // Solid light button — used on the dark CTA banner for contrast.
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-white",
        // Transparent with a hairline border — the "lower priority" twin.
        outline:
          "border border-white/15 bg-transparent text-zinc-100 hover:bg-white/5 hover:text-white",
        // No chrome until hover — for icon buttons and quiet actions.
        ghost:
          "text-zinc-300 hover:bg-white/5 hover:text-white",
        // Inline text action, e.g. "View all job open →".
        link:
          "text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline",
      },
      size: {
        sm: "h-9 px-4", // compact rows / filters
        md: "h-11 px-5", // default
        lg: "h-12 px-6 text-base", // hero + pricing CTAs
        icon: "h-10 w-10", // square icon-only buttons
      },
    },
    // These apply when a caller omits the prop.
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/** Props = every normal <button> prop + our style props + asChild. */
export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button> (e.g. a Next <Link>). */
  asChild?: boolean;
}

/**
 * The Button component itself.
 * It just forwards props and applies the class recipe — no behaviour.
 */
export function Button({
  className, // caller overrides come last so they win
  variant, // "primary" | "secondary" | "outline" | "ghost" | "link"
  size, // "sm" | "md" | "lg" | "icon"
  asChild = false, // default to a real <button>
  ...props // everything else passes through (onClick, type, disabled…)
}: ButtonProps) {
  // Pick the element: Slot.Root (clone the child) or a native button.
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      // data-* attributes make the variant visible in devtools/tests.
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      // Merge the recipe's classes with the caller's overrides.
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/**
 * Exported so non-button elements (e.g. a plain <Link> in the footer) can
 * borrow the exact same look without adding a component.
 */
export { buttonVariants };
