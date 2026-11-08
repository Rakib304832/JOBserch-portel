"use client"

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

const navLinks = [
  { title: "Browse Jobs", href: "/jobs" },
  { title: "Company", href: "/company" },
  { title: "Pricing", href: "/pricing" },
]

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
          <Link
            href="/signin"
            className="rounded-lg px-2 py-2 text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Sign In
          </Link>
          <Button asChild className={cn("ml-3", getStartedClassName)}>
            <Link href="/signup">Get Started</Link>
          </Button>
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
                <Link
                  href="/signin"
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-indigo-400 transition-colors hover:bg-white/5 hover:text-indigo-300"
                >
                  Sign In
                </Link>
                <Button asChild className={cn("mt-2 w-full", getStartedClassName)}>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
