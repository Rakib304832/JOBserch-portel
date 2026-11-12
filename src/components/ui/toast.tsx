"use client";

/**
 * toast.tsx — the little notification that slides in (bottom-right corner)
 * after an action: "Application submitted", "Plan activated", "Removed"…
 *
 * PATTERN USED (React Context)
 * A provider wraps the whole app (see providers.tsx). Any component anywhere
 * can call:
 *
 *      const { toast } = useToast();
 *      toast("Application submitted!", "success");
 *
 * without prop-drilling a callback through the component tree.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number; // unique per toast, for React keys and removal
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Show a toast. Auto-disappears after 4 seconds. */
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*  Colors per variant                                                        */
/* -------------------------------------------------------------------------- */

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  // emerald left border + tinted background for good news
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/40 bg-red-500/10 text-red-200",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
};

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // The list of toasts currently on screen (usually 0 or 1).
  const [items, setItems] = useState<ToastItem[]>([]);

  // useCallback keeps ONE stable function identity across renders, which
  // prevents unnecessary re-renders of every context consumer.
  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = Date.now() + Math.random(); // unique enough for a demo
      setItems((prev) => [...prev, { id, message, variant }]);
      // Schedule removal. setTimeout is the classic "do this later" tool.
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* The stack of visible toasts, fixed to the bottom-right corner.
          aria-live tells screen readers to announce these when they appear. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in",
              VARIANT_CLASSES[item.variant]
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook used by pages: `const { toast } = useToast();` */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
