/**
 * ============================================================================
 * components/layout/Footer.tsx — the site footer on every public page
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR
 *   logo + tagline · three link columns (Product / Navigations / Resources)
 *   social icons (Facebook, Pinterest, LinkedIn) · copyright line.
 *
 * WHY IT IS A SERVER COMPONENT
 * Nothing here needs state or events. Keeping it server-side ships zero
 * JavaScript for the footer, which is most of the page's link markup.
 *
 * LINKS come from lib/data.ts (`footerColumns`), so adding a link never means
 * touching this file.
 * ============================================================================
 */

import Image from "next/image";
import Link from "next/link";

import {
  footerColumns,
  footerTagline,
  socialLinks,
} from "@/lib/data";

/* -------------------------------------------------------------------------- */
/*  Brand icons                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Lucide 1.x removed brand icons, so the three social marks are tiny inline
 * SVGs. They are decorative; the surrounding link carries the accessible name.
 */
const SOCIAL_PATHS: Record<string, string> = {
  Facebook:
    "M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.063 4.388 23.027 10.125 23.927v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.063 24 12.073z",
  Pinterest:
    "M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.966 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z",
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
};

export function Footer() {
  // A constant, not `new Date()`: with Cache Components the build prerenders
  // this server component, and reading the clock during prerender is blocked
  // ("unstable value"). Bump this number when the year changes.
  const year = 2026;

  return (
    // The footer sits on a slightly darker surface than the page body so it
    // reads as a distinct closing block.
    <footer className="border-t border-white/10 bg-[#141519]">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* ---- Top area: brand on the left, link columns on the right ----
         * base → one column; sm → 2×2; lg → brand + three link columns.
         */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand block (spans both columns on tablet so it reads as a header) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="HireLoop home" className="inline-flex">
              <Image
                src="/logo.png"
                alt="HireLoop"
                width={154}
                height={44}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              {footerTagline}
            </p>

            {/* Social icons under the tagline */}
            <ul className="mt-6 flex items-center gap-3" aria-label="Social media">
              {socialLinks.map((social) => (
                <li key={social.title}>
                  <a
                    href={social.href}
                    // External destinations are not known → keep the link local.
                    aria-label={social.title}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-indigo-400/40 hover:text-indigo-300"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      // currentColor lets the hover colour flow into the icon.
                      fill="currentColor"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path d={SOCIAL_PATHS[social.title]} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Three mapped link columns — one <div> per column from data. */}
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ---- Bottom bar: copyright + legal links ---- */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright {year} — HireLoop. All rights reserved.</p>
          <p className="flex items-center gap-1">
            {/* Legal destinations are not in the design → "#" placeholders. */}
            <a href="#" className="hover:text-zinc-300">
              Terms &amp; Policy
            </a>
            <span aria-hidden="true">·</span>
            <a href="#" className="hover:text-zinc-300">
              Privacy Guideline
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
