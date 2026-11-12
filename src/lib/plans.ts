/**
 * ============================================================================
 * plans.ts — the subscription plans (the "price tags" of HireLoop)
 * ============================================================================
 *
 * HireLoop sells two different things, so it has two price tables:
 *   • Seekers pay for  → how many jobs they can APPLY to each month
 *   • Recruiters pay for → how many job posts can be ACTIVE at the same time
 *
 * Every plan here mirrors the numbers written in "Project requirements.md":
 *
 *   Seekers:    Free $0 (3 applications/mo, 10 saved) · Pro $19 (30/mo) ·
 *               Premium $39 (unlimited)
 *   Recruiters: Free $0 (3 active posts) · Growth $49 (10) · Enterprise $149 (50)
 *
 * Because both the Pricing page AND the API limits read from this one file,
 * changing a number here automatically changes it everywhere. One source of
 * truth — that's the point.
 * ============================================================================
 */

import type { RecruiterPlanId, SeekerPlanId } from "./types";

/** The shape of one row in either price table. */
export interface Plan {
  id: string; // machine name, e.g. "pro"
  label: string; // human name, e.g. "Pro"
  price: number; // dollars per month (0 = free)
  /** What the buyer gets. Shown as bullet points on the Pricing page. */
  features: string[];
  /** The headline limit: applications/mo for seekers, active posts for recruiters. */
  limit: number | null; // null = "unlimited"
  /** Extra one-line pitch shown under the price. */
  tagline: string;
}

/* -------------------------------------------------------------------------- */
/*  SEEKER PLANS — limits are "applications per month"                          */
/* -------------------------------------------------------------------------- */

export const SEEKER_PLANS: Plan[] = [
  {
    id: "free",
    label: "Free",
    price: 0,
    tagline: "For casual browsing",
    limit: 3, // up to 3 applications per month
    features: [
      "Browse & save up to 10 jobs",
      "Apply to up to 3 jobs per month",
      "Basic profile",
      "Email alerts",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    price: 19,
    tagline: "For an active job hunt",
    limit: 30, // up to 30 applications per month
    features: [
      "Apply to up to 30 jobs per month",
      "Unlimited saved jobs",
      "Application tracking",
      "Salary insights",
    ],
  },
  {
    id: "premium",
    label: "Premium",
    price: 39,
    tagline: "For maximum visibility",
    limit: null, // unlimited applications
    features: [
      "Everything in Pro",
      "Unlimited applications",
      "Profile boost to recruiters",
      "Early access to new jobs",
      "Priority support",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  RECRUITER PLANS — limits are "active job posts at once"                     */
/* -------------------------------------------------------------------------- */

export const RECRUITER_PLANS: Plan[] = [
  {
    id: "free",
    label: "Free",
    price: 0,
    tagline: "Great for a first year of hiring",
    limit: 3, // up to 3 active job posts
    features: [
      "Up to 3 active job posts",
      "Basic applicant management",
      "Standard listing visibility",
    ],
  },
  {
    id: "growth",
    label: "Growth",
    price: 49,
    tagline: "For growing teams",
    limit: 10, // up to 10 active job posts
    features: [
      "Up to 10 active job posts",
      "Applicant tracking",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: 149,
    tagline: "For hiring at scale",
    limit: 50, // up to 50 active job posts
    features: [
      "Up to 50 active job posts",
      "Advanced analytics dashboard",
      "Featured job listings",
      "Team collaboration",
      "Custom branding",
      "Priority support",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Small helpers the rest of the app uses                                     */
/* -------------------------------------------------------------------------- */

/** Look up one seeker plan by id. Unknown ids fall back to Free. */
export function getSeekerPlan(id: string): Plan {
  return SEEKER_PLANS.find((p) => p.id === id) ?? SEEKER_PLANS[0];
}

/** Look up one recruiter plan by id. Unknown ids fall back to Free. */
export function getRecruiterPlan(id: string): Plan {
  return RECRUITER_PLANS.find((p) => p.id === id) ?? RECRUITER_PLANS[0];
}

/** All industries shown as filter tabs on the Companies page. */
export const INDUSTRIES = [
  "All",
  "AI",
  "Fintech",
  "Developer Tools",
  "E-Commerce",
  "HealthTech",
  "Gaming",
  "Cybersecurity",
] as const;

/** Job categories used on post-job forms and the jobs filter sidebar. */
export const JOB_CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Data",
  "Marketing",
  "Sales",
  "Support",
  "Operations",
] as const;

/** The five application statuses, in pipeline order. */
export const APPLICATION_STATUSES = [
  "applied",
  "under_review",
  "shortlisted",
  "rejected",
  "offered",
] as const;

/** How many jobs each employee-count dropdown option represents. */
export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
