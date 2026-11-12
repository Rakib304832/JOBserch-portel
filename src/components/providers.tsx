"use client";

/**
 * providers.tsx — the two app-wide contexts every page can use:
 *
 *   1. ToastProvider  → lets any component pop a notification
 *   2. AuthProvider   → remembers "who is logged in" on the client side
 *
 * WHY A CONTEXT? (React's global-memory system)
 * Many screens need the current user: the navbar shows their name, the
 * dashboard guard checks their role, settings pages edit their profile.
 * Passing the user down as props through every nested component would be
 * endless. A Context lets any component ask for it directly:
 *
 *      const { user } = useAuth();
 *
 * IMPORTANT MENTAL MODEL
 * The cookie (server side) is the source of truth for security. This context
 * is only a convenient client-side *copy* of it, refreshed from /api/auth/me.
 * Nothing sensitive lives here — just the display name, role, plan, etc.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "@/lib/api-client";
import { ToastProvider } from "@/components/ui/toast";
import type { UserRole } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  The "safe" user shape the browser is allowed to see                        */
/* -------------------------------------------------------------------------- */

/**
 * The server NEVER sends the password to the browser — not even hashed.
 * This type describes what /api/auth/me returns: everything except `password`.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  suspended: boolean;
  createdAt: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  resumeUrl?: string;
  plan: string; // "free" | "pro" | "premium" (seekers)
}

interface AuthContextValue {
  user: PublicUser | null; // null = signed out (or still loading!)
  loading: boolean; // true while the first /api/auth/me check is in flight
  /** Re-check the server ("did something change?"). */
  refresh: () => Promise<void>;
  /** POST /api/auth/login. Returns the user or throws with the server's message. */
  login: (email: string, password: string) => Promise<PublicUser>;
  /** POST /api/auth/register. */
  register: (
    data: { name: string; email: string; password: string; role: UserRole }
  ) => Promise<PublicUser>;
  /** POST /api/auth/logout — clears the cookie, then clears local state. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true); // start optimistic: "checking…"

  /** Ask the server who we are. The httpOnly cookie travels automatically. */
  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: PublicUser | null }>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null); // 401 or network issue → treat as signed out
    } finally {
      setLoading(false); // the app may now decide what to render
    }
  }, []);

  // On very first render, check once whether the visitor has a valid cookie
  // (e.g. they logged in yesterday and the cookie is still valid).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      // The server validates credentials and SETS THE COOKIE in its response.
      const res = await apiFetch<{ user: PublicUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(res.user); // instant UI update; cookie persists across reloads
      return res.user;
    },
    []
  );

  const register = useCallback(
    async (data: { name: string; email: string; password: string; role: UserRole }) => {
      const res = await apiFetch<{ user: PublicUser }>("/api/auth/register", {
        method: "POST",
        body: data,
      });
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    // Tell the server to delete the cookie. Then clear the local copy so
    // every page that reads the context re-renders to the signed-out view.
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, login, register, logout }}
    >
      {/* ToastProvider nests inside so toasts can be shown on auth pages too */}
      <ToastProvider>{children}</ToastProvider>
    </AuthContext.Provider>
  );
}

/** Hook for pages: `const { user, logout } = useAuth();` */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
