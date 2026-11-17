/**
 * ==================================================================
 *  NOTICE — src/app/(secker)/_components/Notice.tsx
 * ==================================================================
 *  A small inline message box used for feedback:
 *    - green  "Application sent!"
 *    - red    "Your Free plan allows 3 applications per month…"
 *    - blue   neutral hints
 *
 *  WHY NOT A TOAST LIBRARY?
 *  A toast needs a provider, portals and animation code. For a dashboard
 *  whose actions are all forms, an inline box next to the form is simpler,
 *  accessible, and it stays on screen until the user reads it.
 * ==================================================================
 */

import { CircleCheck, CircleX, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** The three message flavours. */
export type NoticeTone = "success" | "error" | "info";

/** Colours + icon per tone, kept together so they cannot drift apart. */
const TONE_STYLES: Record<
  NoticeTone,
  { box: string; icon: typeof CircleCheck }
> = {
  success: {
    box: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    icon: CircleCheck,
  },
  error: {
    box: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    icon: CircleX,
  },
  info: {
    box: "border-brand-blue/30 bg-brand-blue/10 text-sky-200",
    icon: Sparkles,
  },
};

/**
 * Notice — render one message.
 * `children` is the text; `onClose` is optional (pass it when the message
 * is dismissible).
 */
export function Notice({
  tone = "info",
  children,
  onClose,
}: {
  tone?: NoticeTone;
  children: ReactNode;
  onClose?: () => void;
}) {
  const style = TONE_STYLES[tone];
  const Icon = style.icon;

  return (
    <div
      // `role="status"` lets screen readers announce the message politely.
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${style.box}`}
    >
      {/* The icon is decorative; the text carries the meaning. */}
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

      <p className="flex-1 leading-relaxed">{children}</p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          ✕
        </button>
      )}
    </div>
  );
}
