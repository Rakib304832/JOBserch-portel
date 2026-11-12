"use client"

/**
 * navbar.tsx — the sticky top navigation shown on every PUBLIC page.
 *
 * BEHAVIOR
 * • Desktop: inline links + Sign In + "Get Started".
 * • Mobile (narrower than md): the links collapse into a slide-in Sheet
 *   (a drawer) triggered by a hamburger button.
 * • Logged-in visitors: the auth buttons are replaced by "Dashboard" and a
 *   small avatar with their name, so returning users go straight to their
 *   role's home (useAuth reads the shared AuthProvider state).
 */

import Image from "next/image"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers"

/** Where the navbar can send you. Data-driven so adding a page is one line. */
const navLinks = [
  { title: "Browse Jobs", href: "/jobs" },
  { title: "Companies", href: "/companies" },
  { title: "Pricing", href: "/pricing" },
]

/** Where each role lands right after signing in. */
const DASHBOARD_HOME: Record<string, string> = {
  seeker: "/dashboard/seeker",
  recruiter: "/dashboard/recruiter",
  admin: "/dashboard/admin",
}

const getStartedClassName =
  "h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-sm font-medium text-white hover:from-indigo-400 hover:to-violet-400"

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="HireLoop home"
      className={cn("flex shrink-0 items-center", className)}
    >
      <Image
        src="/logo.png"
        alt="HireLoop"
        width={154}
        height={44}
        className="h-8 w-auto"
        priority
      />
    </Link>
  )
}

export function Navbar() {
  // Live login state comes from the AuthProvider context mounted in the root layout.
  const { user, loading } = useAuth()

  /**
   * Small helper that renders the right side of the navbar. Used twice —
   * once for desktop, once inside the mobile drawer — so the two stay in sync.
   */
  const authControls = (onNavigate?: () => void) =>
    // While the first "who am I?" check is in flight we show the signed-out
    // buttons; a flash is less jarring than an empty header.
    loading || !user ? (
      <>
        <Link
          href="/signin"
          onClick={onNavigate}
          className="rounded-lg px-2 py-2 text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Sign In
        </Link>
        <Button asChild className={cn("ml-3", getStartedClassName)}>
          <Link href="/signup" onClick={onNavigate}>
            Get Started
          </Link>
        </Button>
      </>
    ) : (
      <>
        <Link
          href={DASHBOARD_HOME[user.role] ?? "/"}
          onClick={onNavigate}
          className="rounded-lg px-2 py-2 text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Dashboard
        </Link>
        {/* Avatar + first name — a visual confirmation that you're logged in */}
        <span className="ml-3 flex items-center gap-2">
          <Avatar src={user.avatarUrl} name={user.name} className="h-8 w-8" />
          <span className="hidden text-sm text-zinc-300 lg:inline">
            {user.name.split(" ")[0]}
          </span>
        </span>
      </>
    )

  return (
    <header className="sticky top-0 z-50 w-full bg-[#17181c] text-zinc-100 shadow-lg shadow-black/20">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center md:flex">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.title}>
                <Link
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
          <Separator
            orientation="vertical"
            className="mx-4 h-5 shrink-0 bg-white/20"
          />
          {authControls()}
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="text-zinc-100 hover:bg-white/10 hover:text-white"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-white/10 bg-[#17181c] text-zinc-100"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-1 flex-col gap-2 px-4 pb-6">
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Separator className="bg-white/10" />
                {/* Same controls as desktop; onNavigate closes the drawer */}
                <div className="flex flex-col items-start gap-2">
                  {authControls()}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
