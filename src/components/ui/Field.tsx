/**
 * ============================================================================
 * components/ui/Field.tsx — the shared form controls (label, input, select…)
 * ============================================================================
 *
 * The public pages have forms too: the hero search bar, the job filters, the
 * checkout card form. Without shared controls each form would invent its own
 * border colour and focus ring. These four tiny components keep every field
 * on the dark theme looking identical.
 *
 * They are stateless, so they work in server and client components alike.
 * ============================================================================
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared class recipe                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One string used by <Input>, <Select> and <Textarea> so the three controls
 * cannot drift apart. (Field.tsx is deliberately tiny — no variant system.)
 */
const controlClasses = [
  // Fill the row, comfortable height, rounded on the theme radius.
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white",
  // Placeholder / option text is muted so real values stand out.
  "placeholder:text-zinc-500",
  // Remove the browser's default outline and draw our own focus ring.
  "outline-none transition-colors",
  "focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/20",
  // Disabled fields should look inert.
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

/* -------------------------------------------------------------------------- */
/*  Label                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A small caption above a control. Using a real <label> (not a <div>) means
 * clicking the text focuses the field — better for accessibility and touch.
 */
export function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      // text-xs keeps forms compact; the muted colour keeps labels secondary.
      className={cn("mb-1.5 block text-xs font-medium text-zinc-400", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Input                                                                     */
/* -------------------------------------------------------------------------- */

/** A single-line text field (search bars, email, card number…). */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      // h-11 = a comfortable 44px touch target (Apple/Google guidelines).
      className={cn(controlClasses, "h-11", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                  */
/* -------------------------------------------------------------------------- */

/** A multi-line field (bios, cover letters, job descriptions). */
export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      // min-h gives a sensible starting box that still grows with content.
      className={cn(controlClasses, "min-h-28 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Select                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A native <select>. Native is intentional: it is keyboard accessible, works
 * on every mobile browser, and needs zero JavaScript — perfect for filters.
 */
export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        controlClasses,
        // h-11 matches Input; pr-8 leaves room for the dropdown arrow.
        "h-11 pr-8",
        // The popup itself is painted by the OS/browser; keep it dark.
        "[&>option]:bg-zinc-900 [&>option]:text-zinc-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field wrapper                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Optional convenience wrapper: label + control + optional hint/error.
 * Not every field needs it, but checkout rows benefit from consistent spacing.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string; // caption text
  htmlFor?: string; // id of the control this label belongs to
  hint?: string; // helper text under the control
  error?: string; // red error text (takes priority over hint)
  children: React.ReactNode; // the control itself
}) {
  return (
    <div>
      {/* Caption — clicking it focuses the control via htmlFor. */}
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {/* Error first: if something is wrong, that is the message to show. */}
      {error ? (
        <p className="mt-1.5 text-xs text-red-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
