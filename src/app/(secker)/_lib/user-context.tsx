"use client";

/**
 * ==================================================================
 *  USER CONTEXT — src/app/(secker)/_lib/user-context.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  A React "context" that shares the logged-in user with every dashboard
 *  page WITHOUT passing it down as a prop through ten components.
 *
 *  THE PROBLEM IT SOLVES
 *  The layout (layout.tsx) is the only place that fetches `/api/me`.
 *  Pages like Settings also need that user, and after saving a new name
 *  the sidebar must show the new name immediately. A context gives both
 *  places the same live value plus a `refresh()` function.
 *
 *  HOW IT IS USED
 *    1. layout.tsx wraps the dashboard in <SeekerUserProvider value={...}>.
 *    2. Any page calls `const { user, refresh } = useSeekerUser();`.
 *
 *  WHY "use client"?
 *  createContext/useContext are React features that only exist in the
 *  browser build of React, so the file is marked as a Client Component.
 * ==================================================================
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Me } from "./types";

/** Everything the provider exposes to its children. */
type SeekerUserValue = {
  user: Me; // the logged-in seeker
  refresh: () => Promise<void>; // reload /api/me (after saving settings)
  signOut: () => Promise<void>; // clear the cookie and return to the gate
};

/**
 * The context object itself. `null` means "no provider above this
 * component", which useSeekerUser() turns into a helpful error instead
 * of a confusing "cannot read property of null".
 */
const SeekerUserContext = createContext<SeekerUserValue | null>(null);

/** Provider wrapper — keeps the JSX in layout.tsx readable. */
export function SeekerUserProvider({
  value,
  children,
}: {
  value: SeekerUserValue;
  children: ReactNode;
}) {
  return (
    <SeekerUserContext.Provider value={value}>
      {children}
    </SeekerUserContext.Provider>
  );
}

/** Read the current seeker + helpers. Throws if used outside the layout. */
export function useSeekerUser(): SeekerUserValue {
  const value = useContext(SeekerUserContext);

  if (!value) {
    throw new Error("useSeekerUser must be used inside <SeekerUserProvider>.");
  }

  return value;
}
