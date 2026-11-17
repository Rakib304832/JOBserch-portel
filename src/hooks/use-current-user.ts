"use client";

/**
 * ============================================================================
 * hooks/use-current-user.ts — "who is logged in?" for public components
 * ============================================================================
 *
 * WHY IT EXISTS
 * The Navbar changes (Sign In → Dashboard) and Job Details behaves differently
 * when a seeker is signed in. Those are public pages, so they cannot read the
 * server session directly — they ask the backend's existing endpoint instead:
 *
 *      GET /api/auth/me  →  { user: {...} }   or   401 when signed out
 *
 * WHY A SHARED CACHE
 * Two components can mount at once and each would otherwise fire the same
 * request. This module keeps the answer (and the in-flight promise) at module
 * scope, so the network is touched once per page load.
 *
 * WHY useSyncExternalStore (and not useState + useEffect)
 * The cached value lives OUTSIDE React. Reading it in a useState initialiser
 * makes the first client render depend on when the request happened to finish:
 * during hydration the server HTML was rendered with "not fetched yet" while
 * the browser may already know "signed out" → React aborts hydration with
 * "Hydration failed" (this actually happened on /checkout).
 *
 * useSyncExternalStore is the API built for exactly this case:
 *   • the server snapshot is always `undefined` ("unknown"), so the server HTML
 *     and the hydration render agree;
 *   • after hydration React re-reads the client snapshot and updates if the
 *     answer already arrived;
 *   • every component subscribes to the same store, so they all update together.
 *
 * This is the ONLY place the public UI talks about auth — the backend (login,
 * cookies, roles) stays on the server side.
 * ============================================================================
 */

import * as React from "react";

/** The user fields the public UI needs (never include the password). */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "seeker" | "recruiter" | "admin";
  avatarUrl: string;
}

/**
 * What "the current user" means in this store:
 *   undefined → not fetched yet (the "loading" state)
 *   null      → fetched, nobody is signed in
 *   object    → fetched, signed-in user
 */
let cachedUser: CurrentUser | null | undefined = undefined;

/** The request currently in flight, shared between components. */
let inflight: Promise<CurrentUser | null> | null = null;

/** Components currently rendering this hook — notified when the answer lands. */
const listeners = new Set<() => void>();

/** Ask the server once; reuse the answer afterwards. */
async function loadCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      // Send the session cookie with the request.
      credentials: "same-origin",
      // Auth state must never be served from a stale cache layer.
      cache: "no-store",
    });

    // 401 is the normal "signed out" answer, not an error worth logging.
    if (!res.ok) return null;

    // The route returns { user } — unwrap it.
    const data = (await res.json()) as { user?: CurrentUser };
    return data.user ?? null;
  } catch {
    // Network failure: treat it as signed out so the page still renders.
    return null;
  }
}

/** Start the shared request if nobody has started one yet. */
function ensureLoaded(): void {
  // Already answered, or already asking → nothing to do.
  if (cachedUser !== undefined || inflight) return;

  inflight = loadCurrentUser().then((result) => {
    // Remember the answer for every current and future caller…
    cachedUser = result;
    inflight = null;
    // …and re-render every subscribed component.
    for (const listener of listeners) listener();
    // Return the result so `inflight` stays a Promise<CurrentUser | null>
    // (without this the callback returns void and TypeScript rejects it).
    return result;
  });
}

/**
 * subscribe() is called by React when a component mounts (and cleaned up when
 * it unmounts). It both registers the component and kicks off the request.
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureLoaded();

  // React expects an unsubscribe function.
  return () => {
    listeners.delete(listener);
  };
}

/** The browser snapshot: whatever the module currently knows. */
function getSnapshot(): CurrentUser | null | undefined {
  return cachedUser;
}

/**
 * The server snapshot: always "unknown".
 * Returning `undefined` (instead of the real value) guarantees that the server
 * HTML and the hydration render produce identical markup.
 */
function getServerSnapshot(): undefined {
  return undefined;
}

/**
 * Hook used by the Navbar, Job Details and Checkout.
 * Returns the user (or null) plus a `loading` flag for the first moment.
 */
export function useCurrentUser() {
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    // `undefined` means "not answered yet" — callers use the loading flag.
    user: snapshot ?? null,
    loading: snapshot === undefined,
  };
}

/**
 * Update the shared store after the visitor signs in or registers.
 *
 * WHY THIS EXISTS
 * The store also caches "signed out" (null). Without this function, a visitor
 * who signs in would still see the Sign In buttons until a full page reload,
 * because nothing told the cache that the answer changed.
 *
 * The auth forms call this with the user the API just returned; every mounted
 * component (Navbar, checkout, job details) re-renders immediately.
 */
export function setCurrentUser(user: CurrentUser | null): void {
  cachedUser = user;
  // Nobody is loading anything any more.
  inflight = null;
  // Tell every subscribed component to re-read getSnapshot().
  for (const listener of listeners) listener();
}
