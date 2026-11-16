"use client";

/**
 * ============================================================================
 * components/ui/Accordion.tsx — accessible FAQ accordion
 * ============================================================================
 *
 * WHICH PAGE USES IT
 * /pricing has an FAQ section covering cancellation, refunds, payment methods
 * and plan switching (requirements doc). This is the one interactive piece.
 *
 * WHY "use client"
 * Opening/closing needs React state. Anything with state must be a Client
 * Component in the App Router, otherwise it cannot respond to clicks.
 *
 * WHY A SINGLE-OPEN ACCORDION
 * One answer visible at a time keeps a long FAQ short on mobile. Clicking the
 * open item again closes it (toggle behaviour).
 * ============================================================================
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** One row's data: the question and the answer it reveals. */
export interface AccordionItem {
  question: string; // the always-visible row
  answer: string; // revealed when the row is open
}

/**
 * The accordion.
 * `items` comes from lib/data.ts (`faqs`), so the copy is not hard-coded here.
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  // Which row is open right now. null = all closed.
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    // divide-y draws one hairline between rows — cleaner than border on each.
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
      {items.map((item, index) => {
        // Is THIS row the open one?
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="px-5 sm:px-6">
            {/* ---- The clickable question row ---- */}
            <button
              type="button"
              // Clicking the open row closes it; clicking another opens that one.
              onClick={() => setOpenIndex(isOpen ? null : index)}
              // aria-expanded tells screen readers whether the panel is open.
              aria-expanded={isOpen}
              // aria-controls links the button to the panel it toggles.
              aria-controls={`faq-panel-${index}`}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              {/* The question itself */}
              <span className="text-sm font-medium text-zinc-100 sm:text-base">
                {item.question}
              </span>

              {/* Chevron rotates 180° while open — a tiny state cue. */}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200",
                  isOpen && "rotate-180 text-indigo-300"
                )}
              />
            </button>

            {/* ---- The answer panel ---- */}
            {/* AnimatePresence keeps the element mounted long enough to animate out. */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  // id pairs with aria-controls above.
                  id={`faq-panel-${index}`}
                  // role="region" + aria-labelledby makes it a landmark for AT.
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  // Height animation: 0 → auto on enter, auto → 0 on exit.
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  // 200ms feels instant without being jarring.
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  // overflow-hidden clips the text while the height changes.
                  className="overflow-hidden"
                >
                  {/* Bottom padding lives inside so it collapses with the panel. */}
                  <p className="pb-5 text-sm leading-relaxed text-zinc-400">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
