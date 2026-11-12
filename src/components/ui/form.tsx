/**
 * form.tsx — the four tiny building blocks every form is made of:
 *
 *   <Field label>        → wraps an input with its label + helper text
 *   <Input />            → one-line text box
 *   <Textarea />         → multi-line text box
 *   <Select options>     → dropdown (uses the browser's native <select>,
 *                          which is accessible and mobile-friendly for free)
 *
 * They are "controlled components": the value lives in React state on the
 * page, and onChange writes it back. Example:
 *
 *   const [title, setTitle] = useState("");
 *   <Input label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
 */

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Input — one-line text                                                     */
/* -------------------------------------------------------------------------- */

interface InputProps extends React.ComponentProps<"input"> {
  label?: string; // shown above the box
  hint?: string; // small helper text under the box
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  // If the caller didn't pass an id, generate one from the label so the
  // <label htmlFor> correctly points at this exact input (accessibility).
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
          // Red border when the page marks this field invalid
          "aria-[invalid=true]:border-destructive",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Textarea — multi-line text                                                */
/* -------------------------------------------------------------------------- */

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  hint?: string;
}

export function Textarea({
  label,
  hint,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Select — dropdown                                                         */
/* -------------------------------------------------------------------------- */

interface SelectProps extends React.ComponentProps<"select"> {
  label?: string;
  /** The list of choices; a value may differ from its label. */
  options: { value: string; label: string }[];
  /** Optional first row like "Select a category". */
  placeholder?: string;
}

export function Select({
  label,
  options,
  placeholder,
  className,
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      {/* The native <select> already gives us keyboard navigation and a
          mobile picker; we only restyle it. appearance-none removes the OS
          arrow so our own chevron can be layered on the right. */}
      <div className="relative">
        <select
          id={inputId}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground",
            "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
            className
          )}
          {...props}
        >
          {placeholder && (
            // Disabled + hidden value → it can't be "selected" as a real choice.
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron drawn with an inline SVG so no icon library is needed here. */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field — a labeled area for custom controls (like the role picker)         */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-sm font-medium text-zinc-300">{label}</span>}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
