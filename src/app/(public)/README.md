# app/(public)/ — the public site

`(public)` is a **route group**: the parentheses keep the folder name out of
the URL, while giving every page inside the same `layout.tsx` (Navbar +
content + Footer). Dashboards will use their own groups later, so they never
have to fight the public chrome.

| File | URL | What it is |
| --- | --- | --- |
| `page.tsx` | `/` | Landing page (Hero, Stats, JobDiscovery, Features, Pricing, CtaSection) |
| `jobs/page.tsx` | `/jobs` | Browse Jobs — search, filters, sorting, pagination |
| `jobs/[jobId]/page.tsx` | `/jobs/:jobId` | Job Details — posting, company card, Apply, similar jobs |
| `companies/page.tsx` | `/companies` | Approved companies grid with industry tabs |
| `companies/[companyId]/page.tsx` | `/companies/:companyId` | One company's profile + its open roles |
| `pricing/page.tsx` | `/pricing` | Seeker/Recruiter plans + FAQ |
| `checkout/page.tsx` | `/checkout` | Plan summary + payment form |
| `checkout/success/page.tsx` | `/checkout/success` | Receipt ("Welcome to HireLoop Pro") |

Notes:

- **Server vs client.** Page files are thin shells. Anything with state or URL
  params is a client component under `src/components/`, which keeps the route
  files readable and lets them keep `metadata` exports.
- **Suspense.** Pages whose child calls `useSearchParams()` (`/jobs`, checkout,
  checkout success) wrap it in `<Suspense>` so Next can prerender the shell.
- **Data.** Live data comes from the existing API routes (`/api/jobs`,
  `/api/companies`, `/api/stats/public`, `/api/auth/me`, `/api/payments`).
  Static copy lives in `src/lib/data.ts`.
