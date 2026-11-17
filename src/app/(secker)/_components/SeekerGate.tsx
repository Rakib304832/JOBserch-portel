"use client";

/**
 * ==================================================================
 *  SEEKER GATE — src/app/(secker)/_components/SeekerGate.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The login gate for every private page. It answers one question before
 *  any dashboard page is allowed to render:
 *
 *      "Is there a valid login cookie?"
 *
 *  THE FLOW
 *   1. On mount, call GET /api/me through the Next.js proxy.
 *        · 200 -> we have the user; render <DashboardShell> around the page
 *        · 401 -> no/expired cookie; render <AuthPanel> (sign in/register)
 *        · other error -> show a retry card instead of a blank screen
 *   2. The page inside `children` only mounts when the user exists, so no
 *      dashboard component needs its own "am I logged in?" check.
 *   3. Log out posts to /api/auth/logout, which deletes the httpOnly
 *      cookie on the server, then clears the user from React state.
 *
 *  WHY A CLIENT COMPONENT?
 *  The cookie is httpOnly, so server components cannot read it either;
 *  and the login state must update without a full page reload. Fetching
 *  in `useEffect` keeps the render pure (Next.js 16 forbids starting a
 *  fetch while rendering).
 *
 *  WHY IT LIVES IN _components INSTEAD OF layout.tsx?
 *  The layout must be a Server Component so it can export
 *  `instant = false` (see layout.tsx). This file holds all the hooks.
 * ==================================================================
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { api, ApiError, errorMessage } from "../_lib/api";
import type { Me, MeResponse } from "../_lib/types";
import { SeekerUserProvider } from "../_lib/user-context";
import { AuthPanel } from "./AuthPanel";
import { DashboardShell } from "./DashboardShell";
import { LoadingScreen } from "./LoadingScreen";

export function SeekerGate({ children }: { children: React.ReactNode }) {
  // `user === null` means "not signed in" once loading has finished.
  const [user, setUser] = useState<Me | null>(null);

  // `loading` covers the first /me check.
  const [loading, setLoading] = useState(true);

  // A network/server problem (NOT a 401) is shown as a retry card so the
  // user knows the API is unreachable rather than thinking they are out.
  const [failure, setFailure] = useState("");

  // Tracks a manual sign-out, so the auth panel can say so.
  const [signedOut, setSignedOut] = useState(false);

  /**
   * loadUser — call /api/me and store the result.
   * Wrapped in useCallback so `useEffect` only runs it once.
   */
  const loadUser = useCallback(async () => {
    setLoading(true);
    setFailure("");

    try {
      const data = await api<MeResponse>("/me");
      setUser(data.user);
      setSignedOut(false);
    } catch (error) {
      // 401/403 = not logged in (or suspended). Show the sign-in card.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setUser(null);
      } else {
        // Everything else is an infrastructure problem: keep the user
        // state untouched and offer a retry.
        setFailure(errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once when the gate mounts.
  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  /**
   * refresh — asked by Settings after a successful profile save.
   * It deliberately does NOT show the full-screen loader: the page stays
   * visible while the sidebar's name/avatar quietly update.
   */
  const refresh = useCallback(async () => {
    try {
      const data = await api<MeResponse>("/me");
      setUser(data.user);
    } catch {
      // If the session died in the meantime, `null` sends us to the gate.
      setUser(null);
    }
  }, []);

  /**
   * signOut — clear the cookie on the server, then show the auth panel.
   * Even if the call fails (server offline), we drop local state so the
   * dashboard is not left open on a shared computer.
   */
  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Intentionally ignored: local sign-out still happens below.
    }

    setUser(null);
    setSignedOut(true);
  }, []);

  // ---------- 1. First-load skeleton ----------
  if (loading) {
    return <LoadingScreen />;
  }

  // ---------- 2. Server unreachable ----------
  if (failure && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-7 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <ShieldCheck className="size-5" />
          </span>

          <h1 className="mt-4 text-lg font-semibold text-white">
            Cannot reach the API server
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{failure}</p>

          <p className="mt-3 rounded-xl border border-line bg-elevated px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground">
            Start the Express server (<code className="text-white">npm run dev</code> in
            the server folder) and make sure it is listening on port 5000, then retry.
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadUser()}
              className="rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Retry
            </button>

            <Link
              href="/"
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white hover:bg-elevated"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 3. Not logged in -> sign-in / register ----------
  if (!user) {
    return (
      <div className="bg-ink">
        {signedOut && (
          <p className="border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-2.5 text-center text-sm text-emerald-200">
            You have been signed out.
          </p>
        )}

        <AuthPanel onSuccess={(nextUser) => setUser(nextUser)} />
      </div>
    );
  }

  // ---------- 4. Logged in, but not a seeker ----------
  // This dashboard calls seeker-only endpoints (/api/saved, /api/stats/seeker).
  // Showing the issue here is friendlier than a wall of 403 errors.
  if (user.role !== "seeker") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-7 text-center">
          <h1 className="text-lg font-semibold text-white">
            This is the job seeker dashboard
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You are signed in as a <span className="text-white">{user.role}</span>. The
            saved jobs, applications and seeker stats below belong to seeker accounts.
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <Link
              href="/"
              className="rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to HireLoop
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white hover:bg-elevated"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 5. The happy path ----------
  return (
    <SeekerUserProvider value={{ user, refresh, signOut }}>
      <DashboardShell user={user} onSignOut={signOut}>
        {children}
      </DashboardShell>
    </SeekerUserProvider>
  );
}
