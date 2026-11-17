/**
 * ==================================================================
 *  PRIVATE LAYOUT — src/app/(secker)/layout.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The frame + login gate for every private page in `(secker)`.
 *  It has exactly two jobs:
 *
 *    1. Wrap the page in a <Suspense> boundary (the gate reads the URL
 *       with usePathname, which is request data).
 *    2. Export `instant = false`, telling Next.js that this route is
 *       intentionally allowed to block while the login cookie is checked.
 *
 *  WHERE IS THE ACTUAL AUTH LOGIC?
 *  In `_components/SeekerGate.tsx`. That file is a Client Component because
 *  it uses hooks and fetches `/api/me`. This layout must stay a SERVER
 *  Component, because route-segment config (`instant`) cannot be exported
 *  from a Client Component ("instant cannot be used in Client Components.
 *  It will throw an error." — Next.js docs).
 *
 *  WHY `instant = false`?
 *  With Cache Components + partial prefetching, Next.js checks whether a
 *  navigation can paint its static shell instantly. A dashboard must first
 *  know who is logged in, so a static shell would be wrong (it would flash
 *  "signed in" UI before the cookie is checked, or drop the page segment
 *  entirely). Opting out declares that this route is allowed to wait for
 *  the real render.
 * ==================================================================
 */

import { Suspense } from "react";
import { LoadingScreen } from "./_components/LoadingScreen";
import { SeekerGate } from "./_components/SeekerGate";

// This route is allowed to block until the session check finishes.
export const instant = false;

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * The fallback is the same full-screen loader the gate uses for its
     * first /api/me request, so a navigation never shows a blank frame.
     */
    <Suspense fallback={<LoadingScreen />}>
      <SeekerGate>{children}</SeekerGate>
    </Suspense>
  );
}
