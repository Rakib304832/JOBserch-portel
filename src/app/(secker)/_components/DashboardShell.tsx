"use client";

/**
 * ==================================================================
 *  DASHBOARD SHELL — src/app/(secker)/_components/DashboardShell.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The frame around every private page:
 *
 *     ┌────────────┬──────────────────────────────────┐
 *     │  sidebar   │  top bar                          │
 *     │  · nav     │  ┌─────────────────────────────┐ │
 *     │  · plan    │  │  the page (children)        │ │
 *     │  · user    │  └─────────────────────────────┘ │
 *     └────────────┴──────────────────────────────────┘
 *
 *  RESPONSIVE BEHAVIOUR
 *   - Desktop (lg and up): the sidebar is always visible and sticky.
 *   - Mobile: the sidebar slides in from the left when the menu button is
 *     tapped, with a dark backdrop behind it.
 *
 *  WHY `usePathname()`?
 *  It returns the current URL (e.g. "/secker/applications") so the
 *  matching sidebar link can be highlighted and the top bar can show the
 *  page name. It is called in this component, which the layout wraps in
 *  <Suspense> because the URL is request data.
 * ==================================================================
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { initials, SEEKER_PLAN_META } from "../_lib/format";
import type { Me } from "../_lib/types";

/**
 * The sidebar navigation.
 * `href` must match the folders inside (secker)/secker/.
 */
const NAV_ITEMS = [
  { label: "Overview", href: "/secker/dashbord", icon: LayoutDashboard },
  { label: "Browse Jobs", href: "/secker/jobs", icon: Search },
  { label: "Saved Jobs", href: "/secker/saved-jobs", icon: Bookmark },
  { label: "Applications", href: "/secker/applications", icon: FileText },
  { label: "Billing", href: "/secker/billing", icon: CreditCard },
  { label: "Settings", href: "/secker/settings", icon: Settings },
] as const;

/** The HireLoop wordmark, sized for the sidebar. */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1" aria-label="HireLoop home">
      <span className="text-xl font-semibold tracking-tight text-brand-blue">hire</span>
      <svg viewBox="0 0 54 30" className="h-6 w-[46px]" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="27" height="20" rx="10" stroke="#f97316" strokeWidth="4.5" />
        <rect x="25" y="5" width="27" height="20" rx="10" stroke="#3b82f6" strokeWidth="4.5" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-brand-orange">p</span>
    </Link>
  );
}

export function DashboardShell({
  user,
  onSignOut,
  children,
}: {
  user: Me;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  // Current URL, used for the active link + page title.
  const pathname = usePathname();

  // Mobile drawer open/closed.
  const [menuOpen, setMenuOpen] = useState(false);

  // Logout button spinner state.
  const [signingOut, setSigningOut] = useState(false);

  // Find the nav item whose href is the longest prefix of the current URL.
  // Longest wins so "/secker/jobs" does not also highlight "/secker".
  const activeItem = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const plan = SEEKER_PLAN_META[user.plan] ?? SEEKER_PLAN_META.free;

  /** Stop the spinner only if logout fails; success reloads the page. */
  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  /** The sidebar markup, used twice (desktop rail + mobile drawer). */
  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center justify-between">
        <Logo />

        {/* Close button only exists in the mobile drawer. */}
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-elevated hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 space-y-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Job seeker
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === activeItem?.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              // Close the drawer after navigating on mobile.
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-elevated text-white"
                  : "text-muted-foreground hover:bg-elevated/60 hover:text-white"
              }`}
            >
              <Icon
                className={`size-4 ${isActive ? "text-brand-violet" : ""}`}
                aria-hidden="true"
              />
              {item.label}

              {/* Small chevron marks the active row. */}
              {isActive && (
                <ChevronRight className="ml-auto size-3.5 text-brand-violet" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ---------- Plan card ---------- */}
      <div className="rounded-2xl border border-line bg-gradient-to-br from-[#151529] to-[#101016] p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-orange" />
          <p className="text-sm font-semibold text-white">{plan.label} plan</p>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {plan.limit === null
            ? "Unlimited applications every month."
            : `${plan.limit} applications per month.`}
        </p>

        <Link
          href="/secker/billing"
          onClick={() => setMenuOpen(false)}
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-line bg-elevated px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-brand-violet/50"
        >
          {user.plan === "premium" ? "Manage plan" : "Upgrade plan"}
        </Link>
      </div>

      {/* ---------- Public links ---------- */}
      <Link
        href="/jobs"
        className="flex items-center gap-2 px-3 text-xs text-muted-foreground transition-colors hover:text-white"
      >
        <Globe className="size-3.5" />
        Public job board
      </Link>

      {/* ---------- User block ---------- */}
      <div className="flex items-center gap-3 border-t border-line pt-4">
        {user.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar URL
          <img
            src={user.photo}
            alt={user.name}
            className="size-9 rounded-full border border-line object-cover"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4d6bff] to-[#7c5cff] text-xs font-semibold text-white">
            {initials(user.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-rose-300 disabled:opacity-50"
        >
          {signingOut ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink">
      {/* ================= Desktop sidebar ================= */}
      <aside className="fixed inset-y-0 left-0 hidden w-[264px] border-r border-line bg-panel/60 lg:block">
        {sidebar}
      </aside>

      {/* ================= Mobile drawer ================= */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop closes the drawer. */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-panel shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* ================= Main column ================= */}
      <div className="lg:pl-[264px]">
        {/* Top bar: menu button (mobile), page name, quick actions. */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-ink/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg border border-line p-2 text-muted-foreground hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Seeker dashboard
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {activeItem?.label ?? "Overview"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/secker/jobs"
              className="hidden items-center gap-1.5 rounded-xl border border-line bg-panel px-3 py-2 text-xs font-medium text-white transition-colors hover:border-brand-violet/50 sm:inline-flex"
            >
              <Search className="size-3.5" />
              Find jobs
            </Link>

            <Link
              href="/secker/settings"
              className="flex size-9 items-center justify-center rounded-full border border-line bg-panel text-xs font-semibold text-white"
              aria-label="Open settings"
            >
              {user.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar URL
                <img
                  src={user.photo}
                  alt=""
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                initials(user.name)
              )}
            </Link>
          </div>
        </header>

        {/* The page itself. `max-w` keeps lines readable on wide monitors. */}
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
