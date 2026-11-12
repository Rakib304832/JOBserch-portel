/**
 * ============================================================================
 * seed.ts — the demo database content ("what's inside the box on day one")
 * ============================================================================
 *
 * A real app starts with an empty database. A DEMO app is nicer when it
 * already contains believable data — companies, jobs, applications, payments —
 * so every screen looks alive the first time you open it.
 *
 * This file builds that starter data with plain JavaScript objects. It runs
 * once, when the server starts, and its result is copied into the in-memory
 * store (src/lib/store.ts).
 *
 * Everything is dated RELATIVE to "today" (e.g. daysAgo(6)) so the charts that
 * look at "the last 30 days" always have fresh-looking data, no matter when
 * you run the project.
 * ============================================================================
 */

import type {
  Application,
  Company,
  Job,
  Payment,
  SavedJob,
  User,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Date helpers — so all demo dates stay believable relative to today        */
/* -------------------------------------------------------------------------- */

/** Returns an ISO timestamp from `n` days ago (e.g. daysAgo(6) = last week). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Returns an ISO timestamp `n` days in the future (used for deadlines). */
function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** Just the date part (YYYY-MM-DD) of "n days from now" — for deadlines. */
function dateOnlyAhead(n: number): string {
  return daysAhead(n).slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/*  USERS                                                                     */
/* -------------------------------------------------------------------------- */
/*  Demo password for EVERY seeded account: "demo1234"                        */
/*  The sign-in page has buttons that fill these in for you.                  */
/* -------------------------------------------------------------------------- */

export const seedUsers: User[] = [
  // ---- the three "main character" accounts (used in the README tour) ----
  {
    id: "u_admin",
    name: "Ava Admin",
    email: "admin@demo.com",
    password: "demo1234",
    role: "admin",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(60),
    plan: "free",
  },
  {
    id: "u_seeker",
    name: "Sam Seeker",
    email: "seeker@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(21),
    plan: "pro",
    headline: "Frontend developer who loves clean UI",
    bio: "5 years building React apps. Looking for a senior frontend role.",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    resumeUrl: "",
  },
  {
    id: "u_recruiter",
    name: "Rex Recruiter",
    email: "recruiter@demo.com",
    password: "demo1234",
    role: "recruiter",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(45),
    plan: "free",
  },

  // ---- extra seekers (they make the admin growth chart & applicant
  //      tables look populated; createdAt spread across 30 days) ----
  {
    id: "u_s2",
    name: "Mia Chen",
    email: "mia@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(2),
    plan: "free",
    headline: "Data analyst",
    skills: ["SQL", "Python"],
  },
  {
    id: "u_s3",
    name: "Leo Park",
    email: "leo@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(5),
    plan: "premium",
    headline: "Product designer",
    skills: ["Figma", "UX research"],
  },
  {
    id: "u_s4",
    name: "Nina Gomez",
    email: "nina@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(9),
    plan: "free",
    headline: "Marketing grad",
    skills: ["SEO", "Content"],
  },
  {
    id: "u_s5",
    name: "Omar Farouk",
    email: "omar@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(14),
    plan: "free",
    headline: "DevOps enthusiast",
    skills: ["Kubernetes", "AWS"],
  },
  {
    id: "u_s6",
    name: "Priya Nair",
    email: "priya@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(19),
    plan: "pro",
    headline: "Full-stack developer",
    skills: ["Node.js", "React", "MongoDB"],
  },
  {
    id: "u_s7",
    name: "Tom Weber",
    email: "tom@demo.com",
    password: "demo1234",
    role: "seeker",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(27),
    plan: "free",
    headline: "Support specialist",
    skills: ["Zendesk", "Communication"],
  },

  // ---- extra recruiters (each one owns a company below) ----
  {
    id: "u_rec2",
    name: "Dana Wells",
    email: "dana@demo.com",
    password: "demo1234",
    role: "recruiter",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(3), // brand-new registration → company still pending
    plan: "free",
  },
  {
    id: "u_rec3",
    name: "Hassan Ali",
    email: "hassan@demo.com",
    password: "demo1234",
    role: "recruiter",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(30),
    plan: "free",
  },
  {
    id: "u_rec4",
    name: "Grace Kim",
    email: "grace@demo.com",
    password: "demo1234",
    role: "recruiter",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(50),
    plan: "free",
  },
  {
    id: "u_rec5",
    name: "Peter Fox",
    email: "peter@demo.com",
    password: "demo1234",
    role: "recruiter",
    avatarUrl: "",
    suspended: false,
    createdAt: daysAgo(33),
    plan: "free",
  },
];

/* -------------------------------------------------------------------------- */
/*  COMPANIES                                                                 */
/* -------------------------------------------------------------------------- */
/*  Logos reuse images that already ship in the /public folder, so the        */
/*  project works fully offline.                                              */
/* -------------------------------------------------------------------------- */

export const seedCompanies: Company[] = [
  {
    id: "c_nimbus",
    name: "Nimbus Labs",
    industry: "AI",
    website: "https://nimbuslabs.example.com",
    location: "San Francisco, United States",
    employeeCount: "51-200",
    logoUrl: "/nvidia.png",
    description:
      "We build AI tooling that helps developers ship faster. Our platform is used by 400+ engineering teams worldwide.",
    recruiterId: "u_recruiter",
    recruiterEmail: "recruiter@demo.com",
    status: "approved",
    plan: "growth", // Growth plan → up to 10 active job posts
    createdAt: daysAgo(45),
  },
  {
    id: "c_vaulta",
    name: "Vaulta Pay",
    industry: "Fintech",
    website: "https://vaultapay.example.com",
    location: "New York, United States",
    employeeCount: "201-500",
    logoUrl: "/amazon.png",
    description:
      "Payment infrastructure for marketplaces — split payments, payouts, and fraud protection in one API.",
    recruiterId: "u_rec3",
    recruiterEmail: "hassan@demo.com",
    status: "approved",
    plan: "free",
    createdAt: daysAgo(38),
  },
  {
    id: "c_craft",
    name: "Craftboard",
    industry: "Developer Tools",
    website: "https://craftboard.example.com",
    location: "Dublin, Ireland",
    employeeCount: "11-50",
    logoUrl: "/microsoft.png",
    description:
      "A visual builder for internal tools. Trusted by 12,000 developers to prototype dashboards in minutes.",
    recruiterId: "u_rec4",
    recruiterEmail: "grace@demo.com",
    status: "approved",
    plan: "enterprise", // Enterprise → up to 50 active job posts
    createdAt: daysAgo(52),
  },
  {
    id: "c_loom",
    name: "Loom & Cart",
    industry: "E-Commerce",
    website: "https://loomcart.example.com",
    location: "London, United Kingdom",
    employeeCount: "51-200",
    logoUrl: "/airbnb.png",
    description:
      "A curated marketplace for handcrafted home goods from independent makers across Europe.",
    recruiterId: "u_rec4",
    recruiterEmail: "grace@demo.com",
    status: "approved",
    plan: "free",
    createdAt: daysAgo(25),
  },
  {
    id: "c_pulse",
    name: "Pulsebyte Health",
    industry: "HealthTech",
    website: "https://pulsebyte.example.com",
    location: "Boston, United States",
    employeeCount: "1-10",
    logoUrl: "/apple.png",
    description:
      "Remote patient monitoring devices with clinician-first dashboards for small practices.",
    recruiterId: "u_rec3",
    recruiterEmail: "hassan@demo.com",
    status: "approved",
    plan: "free",
    createdAt: daysAgo(18),
  },
  {
    // Pending company → this is what the ADMIN approves in the demo tour
    id: "c_datawoven",
    name: "Datawoven",
    industry: "AI",
    website: "https://datawoven.example.com",
    location: "Berlin, Germany",
    employeeCount: "1-10",
    logoUrl: "/meta.png",
    description:
      "Data pipelines that weave messy sources into clean warehouses. Founded by two ex-research engineers.",
    recruiterId: "u_rec2",
    recruiterEmail: "dana@demo.com",
    status: "pending", // awaiting Admin review — does NOT appear publicly yet
    plan: "free",
    createdAt: daysAgo(3),
  },
  {
    // Rejected company → shows the third state in the Admin table
    id: "c_ghostwrite",
    name: "Ghostwrite AI",
    industry: "AI",
    website: "https://ghostwrite.example.com",
    location: "Remote",
    employeeCount: "1-10",
    logoUrl: "/spotify.png",
    description: "Automated essay writing service.",
    recruiterId: "u_rec5",
    recruiterEmail: "peter@demo.com",
    status: "rejected", // declined by Admin — stays hidden from the public
    plan: "free",
    createdAt: daysAgo(20),
  },
];

/* -------------------------------------------------------------------------- */
/*  JOBS                                                                      */
/* -------------------------------------------------------------------------- */

export const seedJobs: Job[] = [
  {
    id: "j_fe",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "Senior Frontend Engineer",
    category: "Engineering",
    type: "Full-time",
    salaryMin: 120000,
    salaryMax: 160000,
    currency: "USD",
    city: "San Francisco",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(21),
    responsibilities:
      "Own the React design system used across 4 products\nLead frontend architecture reviews\nMentor two mid-level engineers\nPartner with design on motion and accessibility",
    requirements:
      "5+ years with React and TypeScript\nExperience with design systems\nStrong CSS fundamentals\nNice to have: Next.js App Router experience",
    benefits:
      "Equity package\nAnnual learning budget $2,000\n4-day remote weeks\nHealth, dental, vision",
    status: "active",
    featured: true, // shows on the home page
    createdAt: daysAgo(6),
  },
  {
    id: "j_react",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "React Native Developer",
    category: "Engineering",
    type: "Remote",
    salaryMin: 90000,
    salaryMax: 120000,
    currency: "USD",
    city: "Berlin",
    country: "Germany",
    isRemote: true,
    deadline: dateOnlyAhead(14),
    responsibilities:
      "Build and maintain our iOS and Android apps\nShip weekly releases\nWork with backend on API contracts",
    requirements:
      "3+ years React Native\nApp Store / Play Store release experience\nComfortable with TypeScript",
    benefits: "Fully remote\nHardware budget\nCo-working stipend",
    status: "active",
    featured: true,
    createdAt: daysAgo(3),
  },
  {
    id: "j_ds",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "Product Designer",
    category: "Design",
    type: "Full-time",
    salaryMin: 100000,
    salaryMax: 130000,
    currency: "USD",
    city: "Amsterdam",
    country: "Netherlands",
    isRemote: false,
    deadline: dateOnlyAhead(10),
    responsibilities:
      "Design end-to-end flows for the AI console\nRun usability tests every sprint\nMaintain the Figma library",
    requirements:
      "Portfolio with 2+ shipped products\nStrong interaction design skills\nExperience with complex data-heavy UIs",
    benefits: "Relocation support\n30 days paid leave",
    status: "active",
    featured: true,
    createdAt: daysAgo(8),
  },
  {
    id: "j_ml",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "Machine Learning Engineer",
    category: "Data",
    type: "Remote",
    salaryMin: 140000,
    salaryMax: 180000,
    currency: "USD",
    city: "London",
    country: "United Kingdom",
    isRemote: true,
    deadline: dateOnlyAhead(25),
    responsibilities:
      "Train and deploy recommendation models\nOwn the feature store\nWrite model cards and eval reports",
    requirements:
      "Python, PyTorch, SQL\nMLOps experience (CI/CD for models)\nPublication record is a plus",
    benefits: "Conference budget\nStocked kitchen",
    status: "active",
    featured: true,
    createdAt: daysAgo(12),
  },
  {
    id: "j_pay",
    companyId: "c_vaulta",
    recruiterId: "u_rec3",
    title: "Payments Product Manager",
    category: "Product",
    type: "Full-time",
    salaryMin: 110000,
    salaryMax: 140000,
    currency: "USD",
    city: "New York",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(18),
    responsibilities:
      "Own the payouts roadmap\nWork with compliance on regulatory launches\nDefine success metrics for each release",
    requirements:
      "4+ years in payments or fintech\nExperience with API products\nExcellent written communication",
    benefits: "Commuter benefits\nAnnual bonus",
    status: "active",
    featured: false,
    createdAt: daysAgo(4),
  },
  {
    id: "j_fin",
    companyId: "c_vaulta",
    recruiterId: "u_rec3",
    title: "Financial Data Analyst",
    category: "Data",
    type: "Contract",
    salaryMin: 70000,
    salaryMax: 90000,
    currency: "USD",
    city: "London",
    country: "United Kingdom",
    isRemote: false,
    deadline: dateOnlyAhead(12),
    responsibilities:
      "Build dashboards for the finance team\nAutomate monthly reconciliation reports",
    requirements:
      "Advanced Excel + SQL\n3 years in finance analytics\nAttention to detail",
    benefits: "6-month contract with extension option",
    status: "active",
    featured: false,
    createdAt: daysAgo(9),
  },
  {
    id: "j_devx",
    companyId: "c_craft",
    recruiterId: "u_rec4",
    title: "Developer Advocate",
    category: "Marketing",
    type: "Remote",
    salaryMin: 85000,
    salaryMax: 110000,
    currency: "USD",
    city: "Remote",
    country: "United States",
    isRemote: true,
    deadline: dateOnlyAhead(30),
    responsibilities:
      "Create tutorials and sample apps\nSpeak at 6 conferences a year\nGather community feedback for product",
    requirements:
      "Strong writing samples\nExperience building with modern JS frameworks\nPublic speaking experience",
    benefits: "Travel budget\nFlexible hours",
    status: "active",
    featured: false,
    createdAt: daysAgo(2),
  },
  {
    id: "j_sre",
    companyId: "c_craft",
    recruiterId: "u_rec4",
    title: "Platform Engineer (DevOps)",
    category: "Engineering",
    type: "Full-time",
    salaryMin: 115000,
    salaryMax: 150000,
    currency: "USD",
    city: "Dublin",
    country: "Ireland",
    isRemote: false,
    deadline: dateOnlyAhead(20),
    responsibilities:
      "Own Kubernetes clusters across 3 regions\nImprove deploy pipeline (currently 12 deploys/day)\nRun incident reviews",
    requirements:
      "Terraform + Kubernetes in production\nSRE on-call experience\nScripting in Go or Python",
    benefits: "Visa sponsorship\nOn-call compensation",
    status: "active",
    featured: false,
    createdAt: daysAgo(15),
  },
  {
    id: "j_growth",
    companyId: "c_loom",
    recruiterId: "u_rec4",
    title: "Growth Marketing Manager",
    category: "Marketing",
    type: "Part-time",
    salaryMin: 50000,
    salaryMax: 70000,
    currency: "USD",
    city: "Remote",
    country: "United Kingdom",
    isRemote: true,
    deadline: dateOnlyAhead(16),
    responsibilities:
      "Own paid acquisition channels\nRun A/B tests on landing pages\nReport weekly on CAC and ROAS",
    requirements:
      "3 years in growth marketing\nHands-on with Meta and Google Ads\nSQL basics",
    benefits: "20 hours/week\nAsync-first team",
    status: "active",
    featured: false,
    createdAt: daysAgo(5),
  },
  {
    id: "j_sup",
    companyId: "c_loom",
    recruiterId: "u_rec4",
    title: "Customer Support Specialist",
    category: "Support",
    type: "Full-time",
    salaryMin: 40000,
    salaryMax: 55000,
    currency: "USD",
    city: "Manila",
    country: "Philippines",
    isRemote: false,
    deadline: dateOnlyAhead(11),
    responsibilities:
      "Answer maker and buyer tickets within SLA\nWrite help-center articles\nFlag product issues to engineering",
    requirements:
      "2 years customer support\nExcellent English written skills\nEmpathy first mindset",
    benefits: "HMO coverage\n13th month pay",
    status: "active",
    featured: false,
    createdAt: daysAgo(7),
  },
  {
    id: "j_int",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "Frontend Engineer Intern",
    category: "Engineering",
    type: "Internship",
    salaryMin: 30000,
    salaryMax: 45000,
    currency: "USD",
    city: "San Francisco",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(28),
    responsibilities:
      "Pair with senior engineers on small features\nLearn our testing setup\nShip one solo project by end of internship",
    requirements:
      "Currently enrolled or recent graduate\nBasic React knowledge\nEager to learn",
    benefits: "Mentorship\nReturn offer potential",
    status: "active",
    featured: false,
    createdAt: daysAgo(1),
  },
  {
    id: "j_ops",
    companyId: "c_pulse",
    recruiterId: "u_rec3",
    title: "Clinical Operations Lead",
    category: "Operations",
    type: "Full-time",
    salaryMin: 95000,
    salaryMax: 120000,
    currency: "USD",
    city: "Boston",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(17),
    responsibilities:
      "Manage pilot programs with 5 clinics\nOwn the rollout checklist\nCoordinate with regulatory consultants",
    requirements:
      "Healthcare operations background\nRN or equivalent clinical experience preferred\nProject management skills",
    benefits: "Health coverage\nFlexible PTO",
    status: "active",
    featured: false,
    createdAt: daysAgo(11),
  },
  {
    // CLOSED job → not on the public site, but visible to its recruiter and
    // in the Admin's "Manage Jobs" table with a "Closed" badge
    id: "j_sales",
    companyId: "c_vaulta",
    recruiterId: "u_rec3",
    title: "Enterprise Account Executive",
    category: "Sales",
    type: "Full-time",
    salaryMin: 90000,
    salaryMax: 130000,
    currency: "USD",
    city: "Chicago",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(-3), // deadline already passed
    responsibilities: "Close enterprise deals\nManage pipeline",
    requirements: "5 years SaaS sales",
    benefits: "Uncapped commission",
    status: "closed",
    featured: false,
    createdAt: daysAgo(20),
  },
  {
    // DRAFT job → only visible to the recruiter who wrote it (not saved as
    // "active" yet, and does not count against the plan's active-job limit)
    id: "j_draft",
    companyId: "c_nimbus",
    recruiterId: "u_recruiter",
    title: "Data Platform Lead",
    category: "Data",
    type: "Full-time",
    salaryMin: 150000,
    salaryMax: 190000,
    currency: "USD",
    city: "San Francisco",
    country: "United States",
    isRemote: false,
    deadline: dateOnlyAhead(35),
    responsibilities: "To be written",
    requirements: "To be written",
    benefits: "",
    status: "draft",
    featured: false,
    createdAt: daysAgo(1),
  },
];

/* -------------------------------------------------------------------------- */
/*  APPLICATIONS                                                              */
/* -------------------------------------------------------------------------- */
/*  Spread across the last 30 days so the recruiter's "applicants per job"    */
/*  bar chart has interesting bars.                                           */
/* -------------------------------------------------------------------------- */

export const seedApplications: Application[] = [
  // ---- applications by the DEMO seeker (u_seeker) — these drive their
  //      dashboard: pie chart, status table, recent activity ----
  {
    id: "a_1",
    jobId: "j_fe",
    seekerId: "u_seeker",
    coverLetter: "I have shipped two design systems and would love to own yours.",
    status: "under_review",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
  },
  {
    id: "a_2",
    jobId: "j_react",
    seekerId: "u_seeker",
    coverLetter: "React Native is my daily driver — happy to share released apps.",
    status: "offered",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: "a_3",
    jobId: "j_pay",
    seekerId: "u_seeker",
    coverLetter: "Excited about fintech; my last product processed $2M/mo.",
    status: "applied",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "a_4",
    jobId: "j_ds",
    seekerId: "u_seeker",
    coverLetter: "While I'm a developer, I also maintain a Figma library.",
    status: "rejected",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
  },

  // ---- applications from OTHER seekers (populate recruiter tables & charts).
  //      status distribution matches the required pipeline mix. ----
  {
    id: "a_5",
    jobId: "j_fe",
    seekerId: "u_s6",
    coverLetter: "Full-stack, but frontend is home.",
    status: "shortlisted",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: "a_6",
    jobId: "j_fe",
    seekerId: "u_s2",
    coverLetter: "Transitioning from data to frontend.",
    status: "applied",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "a_7",
    jobId: "j_react",
    seekerId: "u_s6",
    coverLetter: "Two published RN apps.",
    status: "applied",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "a_8",
    jobId: "j_ds",
    seekerId: "u_s3",
    coverLetter: "Portfolio: leodesign.example.com",
    status: "shortlisted",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
  },
  {
    id: "a_9",
    jobId: "j_ml",
    seekerId: "u_s2",
    coverLetter: "ML pipelines are my specialty.",
    status: "applied",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "a_10",
    jobId: "j_devx",
    seekerId: "u_s4",
    coverLetter: "I run a JS newsletter with 8k subscribers.",
    status: "applied",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "a_11",
    jobId: "j_sre",
    seekerId: "u_s5",
    coverLetter: "Kubernetes since 1.12.",
    status: "under_review",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  },
  {
    id: "a_12",
    jobId: "j_int",
    seekerId: "u_s2",
    coverLetter: "Final-year student, eager to learn.",
    status: "applied",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "a_13",
    jobId: "j_sup",
    seekerId: "u_s7",
    coverLetter: "Support is my craft.",
    status: "applied",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "a_14",
    jobId: "j_growth",
    seekerId: "u_s4",
    coverLetter: "Grew a DTC brand 4x in one year.",
    status: "under_review",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
  },
];

/* -------------------------------------------------------------------------- */
/*  SAVED JOBS (bookmarks of the demo seeker)                                 */
/* -------------------------------------------------------------------------- */

export const seedSavedJobs: SavedJob[] = [
  { id: "sv_1", seekerId: "u_seeker", jobId: "j_ml", createdAt: daysAgo(9) },
  { id: "sv_2", seekerId: "u_seeker", jobId: "j_sre", createdAt: daysAgo(6) },
  { id: "sv_3", seekerId: "u_seeker", jobId: "j_growth", createdAt: daysAgo(2) },
];

/* -------------------------------------------------------------------------- */
/*  PAYMENTS (subscription history)                                           */
/* -------------------------------------------------------------------------- */
/*  Transaction ids imitate Stripe's "ch_…" charge id format.                 */
/* -------------------------------------------------------------------------- */

export const seedPayments: Payment[] = [
  {
    id: "pay_1",
    userId: "u_seeker",
    userEmail: "seeker@demo.com",
    audience: "seeker",
    plan: "pro",
    planLabel: "Pro",
    amount: 19,
    currency: "USD",
    transactionId: "ch_demo_1Fq9xSeekerPro",
    status: "paid",
    createdAt: daysAgo(15),
  },
  {
    id: "pay_2",
    userId: "u_rec4",
    userEmail: "grace@demo.com",
    audience: "recruiter",
    plan: "enterprise",
    planLabel: "Enterprise",
    amount: 149,
    currency: "USD",
    transactionId: "ch_demo_2Kx3CraftEnt",
    status: "paid",
    createdAt: daysAgo(10),
  },
  {
    id: "pay_3",
    userId: "u_rec3",
    userEmail: "hassan@demo.com",
    audience: "recruiter",
    plan: "growth",
    planLabel: "Growth",
    amount: 49,
    currency: "USD",
    transactionId: "ch_demo_3Pz7VaultaGrw",
    status: "paid",
    createdAt: daysAgo(8),
  },
  {
    id: "pay_4",
    userId: "u_s3",
    userEmail: "leo@demo.com",
    audience: "seeker",
    plan: "premium",
    planLabel: "Premium",
    amount: 39,
    currency: "USD",
    transactionId: "ch_demo_4Tq1LeoPrem",
    status: "paid",
    createdAt: daysAgo(5),
  },
  {
    id: "pay_5",
    userId: "u_s6",
    userEmail: "priya@demo.com",
    audience: "seeker",
    plan: "pro",
    planLabel: "Pro",
    amount: 19,
    currency: "USD",
    transactionId: "ch_demo_5Wn9PriyaPro",
    status: "paid",
    createdAt: daysAgo(2),
  },
  {
    id: "pay_6",
    userId: "u_s6",
    userEmail: "priya@demo.com",
    audience: "seeker",
    plan: "free",
    planLabel: "Free",
    amount: 0,
    currency: "USD",
    transactionId: "ch_demo_6Yb2PriyaDown",
    status: "paid",
    createdAt: daysAgo(28),
  },
];
