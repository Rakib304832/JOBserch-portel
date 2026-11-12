"use client";

/**
 * modal.tsx — the pop-up window (dialog) used for:
 *   • the "confirm application" box on Browse & Apply
 *   • plan upgrade confirmation
 *   • delete confirmations
 *
 * HOW IT WORKS
 * A fixed overlay covers the whole screen (semi-transparent black), and the
 * dialog card sits centered on top of it with a higher z-index. Clicking the
 * backdrop or pressing Escape closes it — both are standard dialog behavior.
 */

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

interface ModalProps {
  open: boolean; // show or hide
  onClose: () => void; // called when it should go away
  title: string;
  description?: string; // optional smaller line under the title
  children: React.ReactNode; // the body of the dialog
  className?: string; // width tweaks per usage
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  // Close on the Escape key. useEffect attaches a listener while open and
  // cleans it up when closed (or when the component unmounts).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null; // hidden entirely when closed

  return (
    // Backdrop: covers the viewport, dims the page, and closes on click.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      {/*
        stopPropagation: a click inside the card should NOT count as a click
        on the backdrop — otherwise the dialog would close when users try to
        interact with the form inside it.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl",
          "max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        {/* Header: title + description + the X button */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
