"use client";

/**
 * ============================================================================
 * components/layout/Navbar.tsx — the sticky top navigation on every public page
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR
 *   logo (hireloop) · Browse Jobs · Companies · Pricing · Sign In · Get Started
 * Placeholders: none — every control has a real destination or a commented
 * "not in the design" note.
 *
 * BEHAVIOUR
 *   • Desktop (≥ md): links inline, auth controls on the right.
 *   • Mobile (< md): links collapse behind a hamburger into a dropdown panel.
 *   • Signed-in visitors see "Dashboard" + their avatar/initials instead of
 *     the two auth buttons (useCurrentUser talks to /api/auth/me).
 *
 * WHY "use client"
 * The mobile menu is opened/closed with state, and the auth state arrives from
 * an effect. A server component could not do either.
 * ============================================================================
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { navLinks } from "@/lib/data";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-current-user";

/**
 * Where each role belongs after signing in.
 * The requirements doc names these dashboard routes; if the dashboard side is
 * renamed later, this is the single place to update.
 */
const DASHBOARD_HOME: Record<string, string> = {
  seeker: "/dashboard/seeker",
  recruiter: "/dashboard/recruiter",
  admin: "/dashboard/admin",
};

export function Navbar() {
  // ---- mobile drawer state ----
  const [open, setOpen] = React.useState(false);

  // ---- who is signed in? (cached across the page) ----
  const { user, loading } = useCurrentUser();

  // Close the drawer whenever the route changes via a link.
  const close = () => setOpen(false);

  return (
    /**
     * sticky top-0 keeps the bar visible while scrolling;
     * z-50 lifts it above job cards and the hero glow.
     * The surface (#17181c) matches the hero so the two read as one block.
     */
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#17181c]/95 text-zinc-100 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ---------------- Logo ---------------- */}
        <Link href="/" aria-label="HireLoop home" className="flex shrink-0 items-center">
          {/* next/image optimises the PNG; priority loads it before the LCP text. */}
          <Image
            src="/logo.png"
            alt="HireLoop"
            width={154}
            height={44}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* ---------------- Desktop navigation ---------------- */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // hover:bg-white/5 gives a quiet, non-committal highlight.
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.title}
            </Link>
          ))}

          {/* A hairline divider separates navigation from account actions. */}
          <span aria-hidden="true" className="mx-3 h-5 w-px bg-white/15" />

          {/* Signed out → Sign In + Get Started. Signed in → Dashboard + avatar. */}
          {loading ? (
            // First paint: render the signed-out pair to avoid layout jump.
            <AuthButtons />
          ) : user ? (
            <SignedIn user={user} />
          ) : (
            <AuthButtons />
          )}
        </nav>

        {/* ---------------- Mobile: hamburger ---------------- */}
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            // aria-expanded/aria-controls describe the panel to assistive tech.
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {/* Same slot swaps the icon — no extra layout node. */}
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* ---------------- Mobile: dropdown panel ---------------- */}
      {open && (
        <div
          id="mobile-menu"
          // Rendered only when open; the dark surface matches the header.
          className="border-t border-white/10 bg-[#17181c] px-4 pb-5 pt-2 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // onNavigate closes the panel before the new page paints.
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.title}
              </Link>
            ))}
          </nav>

          {/* Divider between page links and account actions. */}
          <div aria-hidden="true" className="my-2 h-px bg-white/10" />

          <div className="flex flex-col items-stretch gap-2">
            {loading ? (
              <AuthButtons onNavigate={close} stacked />
            ) : user ? (
              // On mobile the dashboard link is full width for a large tap target.
              <Link
                href={DASHBOARD_HOME[user.role] ?? "/"}
                onClick={close}
                className="rounded-lg bg-white/5 px-3 py-2.5 text-sm font-medium text-white"
              >
                Go to dashboard
              </Link>
            ) : (
              <AuthButtons onNavigate={close} stacked />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small pieces kept below so the main JSX stays readable                     */
/* -------------------------------------------------------------------------- */

/** The pre-login pair of buttons. Used by desktop and mobile. */
function AuthButtons({
  onNavigate,
  stacked = false,
}: {
  onNavigate?: () => void; // closes the mobile panel when provided
  stacked?: boolean; // `true` = full width column (mobile)
}) {
  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      {/* Quiet link — signing in is the secondary action. */}
      <Link
        href="/signin"
        onClick={onNavigate}
        className={
          stacked
            ? "rounded-lg px-3 py-2.5 text-sm font-semibold text-indigo-300"
            : "rounded-lg px-2 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200"
        }
      >
        Sign In
      </Link>

      {/* Primary CTA — creating an account is what we want new visitors to do. */}
      <Button asChild size="sm" variant="primary">
        <Link href="/signup" onClick={onNavigate}>
          Get Started
        </Link>
      </Button>
    </div>
  );
}

/** The signed-in state: a dashboard shortcut plus the user's avatar/initials. */
function SignedIn({ user }: { user: CurrentUser }) {
  // Initials are the fallback when the account has no avatar URL.
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Link
        href={DASHBOARD_HOME[user.role] ?? "/"}
        className="rounded-lg px-2 py-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-indigo-200"
      >
        Dashboard
      </Link>

      {/* Avatar: real photo when present, initials otherwise. */}
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full border border-white/10 object-cover"
        />
      ) : (
        <span
          aria-label={user.name}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-indigo-500/20 text-xs font-semibold text-indigo-200"
        >
          {initials}
        </span>
      )}
    </div>
  );
}
