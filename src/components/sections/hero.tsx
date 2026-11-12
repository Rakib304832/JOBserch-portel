import Image from "next/image";
import Link from "next/link";
// Symlink-free imports keep hero.css-free color values in sync with the Figma "dark" theme;
// the exact hexes match the navbar's dark surface so header and hero read as one continuous block.

/** Shape of one stat in the strip: a big number and a label under it. */
export interface HeroStat {
  value: string;
  label: string;
}

/**
 * Live stats strip shown under the hero copy.
 * Kept as a plain array (instead of hard-coding markup 4x) so adding/removing a stat
 * only changes data, not layout. Values are static placeholders until real APIs exist.
 */
const fallbackStats: HeroStat[] = [
  { value: "12,000+", label: "Active Jobs" },
  { value: "3,500+", label: "Companies" },
  { value: "50,000+", label: "Job Seekers" },
  { value: "98%", label: "Satisfaction Rate" },
];

/**
 * Hero section — the top landing block of the home page.
 * It is a Server Component on purpose: it has no interactivity, so nothing
 * prevents it from server-rendering (smaller JS bundle, better SEO for the headline).
 *
 * `stats` is OPTIONAL: the home page passes REAL numbers fetched from
 * /api/stats/public ("live stats" per the requirements); when the hero is
 * previewed without data it falls back to the static array above.
 */
export function Hero({ stats }: { stats?: HeroStat[] }) {
  const heroStats = stats ?? fallbackStats;
  return (
    // `relative` anchors the absolutely-positioned globe image to this section;
    // `overflow-hidden` keeps the oversized image from creating horizontal scrollbars.
    // Colors follow the navbar: same #17181c surface + white text.
    <section
      className="relative overflow-hidden bg-[#17181c] text-zinc-100"
      aria-label="Introduction to HireLoop"
    >
      {/* Soft pink/indigo "aurora" recreated with CSS so it sits behind the text.
          `bg-[radial-gradient(...)]` paints two light pools (pink high, indigo low);
          blur-[80px] melts the gradients into the dark background like the Figma glow,
          and aria-hidden keeps assistive tech from announcing a decorative blob. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-180px] left-1/2 h-[520px] w-[820px] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(224,0,204,0.28),transparent_75%),radial-gradient(closest-side,rgba(93,89,220,0.35),transparent_80%)] blur-[80px]"
      />

      {/* Decorative planet illustration anchored to the bottom edge so its curved,
          glowing horizon reads as a "planet surface" the content floats above.
          aria-hidden because it conveys no information and screen readers should skip it.
          Native dimensions (1440×1882) let next/image avoid layout shift without extra config. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <Image
          src="/globe.png"
          alt=""
          aria-hidden="true"
          width={1440}
          height={1882}
          // `max-w-none` beats the default `max-width:100%` so the planet keeps its
          // designed scale on desktop instead of squeezing to container width.
          className="w-[900px] max-w-none sm:w-[1200px] lg:w-[1440px]"
          priority={false}
        />
      </div>

      {/* mx-auto + max-w center content like the navbar container;
          flex/column/center stack copy and CTAs vertically;
          py paddings create breathing room against the sticky navbar above. */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-40 pt-24 text-center sm:px-6 sm:pt-28 lg:pt-32">
        {/* Headline: text-3xl→text-6xl scales with breakpoints (mobile-first);
            font-semibold + tight tracking mirrors the wordmark's look;
            max-w keeps lines short enough to scan at a glance. */}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find your dream job, faster
        </h1>

        {/* Subheadline: muted color hierarchy — it supports, but must not compete with, the headline. */}
        <p className="mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
          HireLoop connects you with thousands of verified jobs from top
          companies — track your applications, and let the right opportunities
          come to you.
        </p>

        {/* CTA row: stack on mobile (flex-col), side-by-side from sm up (flex-row),
            matching the requirements doc's "Search Jobs" / "Post a Job" pair.
            Real <Link>s (not <button>s) because both are navigations, not actions. */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Primary CTA — identical gradient to the navbar's "Get Started"
              so the page keeps one consistent accent across header and hero. */}
          <Link
            href="/jobs"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-6 text-sm font-medium text-white transition-colors hover:from-indigo-400 hover:to-violet-400"
          >
            Search Jobs
          </Link>

          {/* Secondary CTA — outlined ghost style: visually loud-ish but clearly
              lower priority than the primary button (standard CTA pairing). */}
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
          >
            Post a Job
          </Link>
        </div>

        {/* Live stats: 2 columns on mobile, 4 in a row from md up.
            border-t + pt-8 separates the numbers from the CTAs;
            mt-16 pushes the strip low in the hero so the planet sits behind it. */}
        <div className="mt-20 grid w-full grid-cols-2 gap-y-10 border-t border-white/10 pt-10 md:grid-cols-4">
          {heroStats.map((stat) => (
            // key prefers the label (stable + unique) over the array index
            <div key={stat.label} className="flex flex-col items-center gap-1">
              {/* Big emphasized value; ordering value-then-label follows hero-stat convention */}
              <span className="text-2xl font-semibold text-white sm:text-3xl">
                {stat.value}
              </span>
              <span className="text-sm text-zinc-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
