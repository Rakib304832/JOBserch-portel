/**
 * footer.tsx — the site-wide footer required by the spec:
 * link columns for Job Seekers, Employers, and Company info, plus the logo
 * and a small legal line.
 *
 * Rendered inside (public)/layout.tsx, so it appears on every public page
 * (and automatically disappears on dashboard pages, which use another layout).
 */

import Image from "next/image";
import Link from "next/link";

/** Each column is just data — adding a link means adding one object. */
const columns = [
  {
    heading: "For Job Seekers",
    links: [
      { label: "Browse Jobs", href: "/jobs" },
      { label: "Companies", href: "/companies" },
      { label: "Pricing", href: "/pricing" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
  {
    heading: "For Employers",
    links: [
      { label: "Post a Job", href: "/signup" },
      { label: "Recruiter Pricing", href: "/pricing" },
      { label: "Sign In", href: "/signin" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/" },
      { label: "Contact", href: "/" },
      { label: "Privacy Policy", href: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#121317] text-zinc-400">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top area: brand blurb on the left, three link columns on the right.
            Grid collapses to a single column on small screens. */}
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Image
              src="/logo.png"
              alt="HireLoop"
              width={154}
              height={44}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              HireLoop bridges job seekers and employers with smart search,
              transparent tracking, and subscription tools for both sides of
              hiring.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-sm font-semibold text-zinc-200">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} HireLoop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
