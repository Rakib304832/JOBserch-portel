/**
 * ============================================================================
 * lib/data.ts — every piece of STATIC copy the public site shows
 * ============================================================================
 *
 * WHY THIS FILE EXISTS
 * The DOCX "Project Structure & Page Guide" asks for one file that holds the
 * demo/static content used by the public pages, so that changing a link, a
 * feature card or a plan does not mean editing JSX in five places.
 *
 * WHAT LIVES HERE (and what does NOT)
 *   ✔ Text that never changes at runtime — nav links, footer columns, feature
 *     blurbs, FAQ answers, trending search chips, fallback numbers.
 *   ✔ The plan lists, re-exported from lib/plans.ts so there is ONE source of
 *     truth for prices (the requirements doc's numbers).
 *   ✘ Live data (jobs, companies, payments). Those come from the API routes
 *     the backend already exposes (/api/jobs, /api/companies, …).
 *
 * WHO IMPORTS IT
 *   Navbar, Footer, Hero, Stats, JobDiscovery, Features, Pricing, CtaSection,
 *   the Pricing page and the Browse Jobs filter sidebar.
 * ============================================================================
 */

// Plan prices live in lib/plans.ts (shared with the API's usage limits).
// Re-exporting them here keeps the UI importing from one place.
import { RECRUITER_PLANS, SEEKER_PLANS, type Plan } from "./plans";

/* -------------------------------------------------------------------------- */
/*  Types for the content in this file                                        */
/* -------------------------------------------------------------------------- */

/** One link in the navbar or the footer. */
export interface NavLink {
  title: string; // text the visitor reads, e.g. "Browse Jobs"
  href: string; // where the link navigates, e.g. "/jobs"
}

/** One card in the Stats strip (value on top, label underneath). */
export interface StatCard {
  value: string; // big number, e.g. "50K"
  label: string; // caption, e.g. "Active Jobs"
}

/**
 * The icon keys the Features grid understands.
 * Keeping icons as strings (instead of importing components here) lets this
 * file stay plain data — the component decides which Lucide icon to draw.
 */
export type FeatureIcon =
  | "search" // smart search
  | "salary" // salary insights
  | "companies" // top companies
  | "saved" // saved jobs
  | "apply" // one-click apply
  | "resume" // resume builder
  | "matching" // skill-based matching
  | "growth"; // career resources

/** One item in the "Everything you need to succeed" grid. */
export interface Feature {
  title: string; // e.g. "Smart Search"
  description: string; // one supporting sentence
  icon: FeatureIcon; // which icon to render (see Features.tsx)
}

/** One column of footer links (Product / Navigations / Resources). */
export interface FooterColumn {
  title: string; // column heading
  links: NavLink[]; // links under the heading
}

/** One question/answer pair in the Pricing page FAQ accordion. */
export interface Faq {
  question: string;
  answer: string;
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Top navigation, in the order the Figma navbar shows them.
 * The DOCX labels the second link "Company"; the requirements doc calls the
 * page "Companies", so the label matches the page it opens.
 */
export const navLinks: NavLink[] = [
  { title: "Browse Jobs", href: "/jobs" },
  { title: "Companies", href: "/companies" },
  { title: "Pricing", href: "/pricing" },
];

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

/** Small chips under the hero search bar ("Trending Position"). */
export const trendingTags: string[] = [
  "Product Designer",
  "AI Engineering",
  "Dev-ops Engineer",
];

/* -------------------------------------------------------------------------- */
/*  Stats strip                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Fallback numbers for the Stats section.
 * The real numbers are fetched from /api/stats/public; these show for the
 * split second before the API answers (and if the API is unavailable).
 * Values follow the requirements doc: 50K / 12K / 2M / 97%.
 */
export const fallbackStats: StatCard[] = [
  { value: "50K", label: "Active Jobs" },
  { value: "12K", label: "Companies" },
  { value: "2M", label: "Job Seekers" },
  { value: "97%", label: "Satisfaction Rate" },
];

/* -------------------------------------------------------------------------- */
/*  Features                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The eight platform features the requirements doc lists for the home page.
 * Order matters: the grid renders them left-to-right, top-to-bottom.
 */
export const features: Feature[] = [
  {
    title: "Smart Search",
    description:
      "Match with roles that fit your skills — not just the keywords you typed.",
    icon: "search",
  },
  {
    title: "Salary Insights",
    description:
      "See real pay ranges before you apply, so you negotiate from facts.",
    icon: "salary",
  },
  {
    title: "Top Companies",
    description:
      "Follow verified employers and get alerted the moment they open a role.",
    icon: "companies",
  },
  {
    title: "Saved Jobs",
    description:
      "Keep a shortlist of roles and pick up exactly where you left off.",
    icon: "saved",
  },
  {
    title: "One-Click Apply",
    description:
      "Apply with the profile you already built — no forms to retype.",
    icon: "apply",
  },
  {
    title: "Resume Builder",
    description:
      "Turn your experience into a recruiter-ready resume in minutes.",
    icon: "resume",
  },
  {
    title: "Skill-Based Matching",
    description:
      "Our matching engine surfaces the jobs your profile actually qualifies for.",
    icon: "matching",
  },
  {
    title: "Career Growth Resources",
    description:
      "Guides, salary data and interview prep written by hiring experts.",
    icon: "growth",
  },
];

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Landing-page pricing shows the SEEKER ladder (people browsing for a job).
 * The full /pricing page shows both ladders via PricingTabs.tsx.
 * Re-exported rather than copied so a price change happens in lib/plans.ts.
 */
export const seekerPlans: Plan[] = SEEKER_PLANS;
export const recruiterPlans: Plan[] = RECRUITER_PLANS;

/**
 * The "Yearly" toggle advertises "-25%", but the Figma file has no yearly
 * prices, so we derive them: 25% off the monthly price, billed annually.
 * `Math.round` keeps the display tidy (19 → 14, 39 → 29).
 */
export const YEARLY_DISCOUNT = 0.25;

/** Price to show for a plan in the current billing mode. */
export function priceFor(plan: Plan, yearly: boolean): number {
  // Free plans stay $0 in both modes.
  if (plan.price === 0) return 0;
  // Paid plans: 25% off when paying for a year.
  return yearly ? Math.round(plan.price * (1 - YEARLY_DISCOUNT)) : plan.price;
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

/** The four questions the requirements doc asks for on the Pricing page. */
export const faqs: Faq[] = [
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Cancel from Billing & Subscription whenever you like — your plan stays active until the end of the current billing period and there is no cancellation fee.",
  },
  {
    question: "How do refunds work?",
    answer:
      "Every paid plan includes a 14-day money-back guarantee. Contact support within 14 days of your first payment and we refund it in full, no questions asked.",
  },
  {
    question: "Which payment methods do you accept?",
    answer:
      "All major credit and debit cards, processed securely by Stripe. You choose the currency (USD or BDT) at checkout.",
  },
  {
    question: "Can I switch plans?",
    answer:
      "Anytime. Upgrades take effect immediately; downgrades start on your next renewal. Stripe prorates the difference automatically.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Three link columns, matching the Figma footer.
 * Destinations the design does not reveal use "#" (they stay on the page) —
 * the DOCX explicitly says those targets were "পাওয়া যায়নি" (not found).
 */
export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { title: "Job discovery", href: "/jobs" },
      { title: "Worker AI", href: "#" }, // destination not in the design
      { title: "Companies", href: "/companies" },
      { title: "Salary data", href: "#" }, // destination not in the design
    ],
  },
  {
    title: "Navigations",
    links: [
      { title: "Help center", href: "#" }, // destination not in the design
      { title: "Career library", href: "#" }, // destination not in the design
      { title: "Contact", href: "#" }, // destination not in the design
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Brand Guideline", href: "#" }, // destination not in the design
      { title: "Newsroom", href: "#" }, // destination not in the design
    ],
  },
];

/** Footer tagline under the logo (verbatim from the Figma copy). */
export const footerTagline =
  "The AI-native career platform. Built for people who take their work seriously.";

/**
 * Social links. The icons are drawn inline in Footer.tsx because Lucide 1.x
 * no longer ships brand icons.
 */
export const socialLinks = [
  { title: "Facebook", href: "#" }, // destination not in the design
  { title: "Pinterest", href: "#" }, // destination not in the design
  { title: "LinkedIn", href: "#" }, // destination not in the design
];

/* -------------------------------------------------------------------------- */
/*  Browse Jobs — filter options                                              */
/* -------------------------------------------------------------------------- */

/** The five job types used by the filters and the post-job form. */
export const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Remote",
  "Contract",
  "Internship",
] as const;

/** Sort choices above the job results. */
export const JOB_SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "salary", label: "Highest Salary" },
] as const;

/** How many job cards fit one page of results (2 columns × 3 rows). */
export const JOBS_PER_PAGE = 6;
