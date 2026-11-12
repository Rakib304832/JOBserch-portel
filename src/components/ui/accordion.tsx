"use client";

/**
 * accordion.tsx — the expanding/collapsing FAQ rows on the Pricing page.
 *
 * Only one row can be open at a time: `openIndex` state lives in the parent,
 * clicking a row sets it (or closes it by setting it to null).
 */

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: FaqItem[] }) {
  // Which row is open. null = all closed (the initial state).
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            {/* The clickable question row — a real <button> for keyboard users. */}
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen} // tells screen readers "this expands"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
            >
              {item.question}
              {/* Chevron rotates 180° when open — a classic micro-animation. */}
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>

            {/* The answer. `grid-template-rows: 0fr → 1fr` animates height
                from zero to auto — a modern CSS trick that avoids measuring
                scrollHeight in JavaScript. */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
