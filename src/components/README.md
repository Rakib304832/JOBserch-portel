# components/ — folder guide

Every folder here has one job. If a new component does not obviously belong to
one of these folders, it probably belongs in `ui/`.

```
components/
├── layout/      Navbar + Footer — the chrome shared by every public page
├── home/        The six landing-page sections, one file each
├── jobs/        Everything job-shaped: card, filter sidebar, pagination, browse body
├── companies/   Company card + industry tabs
├── pricing/     The two-audience pricing page body
├── checkout/    Payment form + success receipt
└── ui/          Small, reusable primitives (Button, Badge, Field, Accordion…)
```

## Why this split?

- **`layout/`** — rendered by `app/(public)/layout.tsx`, so it is mounted once
  for every public route. Keeping these two files together makes it obvious
  where site-wide navigation lives.
- **`home/`** — the DOCX asks for one component per landing section
  (`Hero`, `Stats`, `JobDiscovery`, `Features`, `Pricing`, `CtaSection`) so a
  change to pricing can never affect the hero. The page file only stacks them.
- **`jobs/`** — `JobCard` is shared by three pages (home, browse, company
  profile); `JobFilters` and `Pagination` are only used by Browse Jobs;
  `JobsBrowse` is the interactive body that the `/jobs` page wraps in Suspense.
- **`companies/`** — the card is reused on the grid and (conceptually) the
  profile page; the tabs are grid-only.
- **`pricing/`** — the `/pricing` page needs a different layout from the
  landing section (two audiences + FAQ), so it has its own body component.
- **`checkout/`** — two client components that read query params. Keeping them
  together makes the "form → receipt" flow easy to follow.
- **`ui/`** — the design system. Every control here is presentational: no
  fetching, no knowledge of jobs or companies. That is what makes them
  reusable on the server and in client pages.

## Conventions used in this folder

1. **File header comment** — every file starts with a block explaining *why it
   exists*, which DOCX/requirements section it implements, and why it is (or
   is not) a Client Component.
2. **`"use client"` only when needed** — state, effects, router hooks or
   Framer Motion. Everything else stays a Server Component and ships no JS.
3. **Data in, markup out** — components receive props; static copy lives in
   `src/lib/data.ts`; live data comes from the API routes in `src/app/api`.
4. **Comments explain intent, not syntax** — e.g. why a boundary is needed,
   not what `className` means.
