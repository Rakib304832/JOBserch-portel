# Seeker (private) dashboard — `src/app/(secker)`

This folder is the logged-in **job seeker** area of HireLoop. Nothing here is
public: the layout checks the login cookie via `GET /api/me` before any page
can render.

> The folder name `(secker)` is a Next.js **route group** — parentheses mean the
> name does not appear in the URL. The real URLs are the folders inside it:
> `/secker/dashbord`, `/secker/jobs`, and so on.

## Pages

| URL                     | File                              | What it shows                                                        |
| ----------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `/secker`               | redirect in `next.config.ts`      | 307 redirect to `/secker/dashbord`                                    |
| `/secker/dashbord`      | `secker/dashbord/page.tsx`        | Counter cards, plan usage, pipeline bars, activity feed, newest jobs  |
| `/secker/jobs`          | `secker/jobs/page.tsx`            | Search/filter the live job feed, save jobs, apply with a cover letter |
| `/secker/jobs/<jobId>`  | `secker/jobs/[jobId]/page.tsx`    | One job in full: description, requirements, benefits, similar roles    |
| `/secker/saved-jobs`    | `secker/saved-jobs/page.tsx`      | Bookmarks with remove + apply actions                                 |
| `/secker/applications`  | `secker/applications/page.tsx`    | Every application, its status, dates and a link to the job            |
| `/secker/billing`       | `secker/billing/page.tsx`         | Current plan, usage, plan comparison, checkout, payment history       |
| `/secker/settings`      | `secker/settings/page.tsx`        | Profile, resume upload, password change, account summary              |

## Files

```
(secker)/
├─ layout.tsx                  # server wrapper: Suspense + `instant = false`
├─ secker/                     # the actual routes (see table above)
├─ _lib/
│  ├─ api.ts                   # fetch helper, ApiError, query builder, upload
│  ├─ types.ts                 # TypeScript shapes of every API response
│  ├─ format.ts                # dates, money, status labels, plan helpers
│  └─ user-context.tsx         # shares the logged-in user with pages
└─ _components/
   ├─ SeekerGate.tsx           # client auth gate: /api/me, 401, logout
   ├─ AuthPanel.tsx            # sign in / register card (shown on 401)
   ├─ LoadingScreen.tsx        # shared "checking your session" screen
   ├─ DashboardShell.tsx       # sidebar, mobile drawer, top bar, logout
   ├─ PageHeader.tsx           # page title block
   ├─ StatCard.tsx             # dashboard counter tile
   ├─ StatusBadge.tsx          # coloured application-status pill
   ├─ JobCard.tsx              # job card with save / apply / remove
   ├─ JobDetailsView.tsx       # full job page: description, facts, similar roles
   ├─ ApplyDialog.tsx          # cover-letter modal
   ├─ EmptyState.tsx           # friendly "nothing here yet" box
   └─ Notice.tsx               # inline success/error/info message
```

Folders that start with `_` are **private folders**: Next.js never turns them
into routes, so helper components and utilities can live next to the pages.

## How the API connection works

The Express server runs on `http://localhost:5000`; this client runs on
`http://localhost:3000`. `next.config.ts` rewrites two prefixes so the browser
only ever talks to port 3000:

| Browser requests          | Next.js forwards to                 |
| ------------------------- | ----------------------------------- |
| `/api/backend/<path>`     | `http://localhost:5000/api/<path>`  |
| `/uploads/<path>`         | `http://localhost:5000/uploads/<path>` |

Why: the login token is an **httpOnly cookie**. Cookies belong to an origin
(scheme + host + port), so a cookie set by port 5000 would never be sent to
port 3000. Going through the rewrite keeps everything same-origin, and the
browser attaches the cookie automatically on every dashboard request.

Set `API_SERVER_URL` in `.env.local` to point somewhere else (for example a
deployed API); the default is `http://localhost:5000`.

## Endpoints used

| Method & path                        | Used by                              |
| ------------------------------------ | ------------------------------------ |
| `GET /api/me`                        | layout gate, Settings                |
| `PATCH /api/me`                      | Settings (profile, resume, password) |
| `POST /api/auth/login`               | AuthPanel                            |
| `POST /api/auth/register`            | AuthPanel (always `role: "seeker"`)  |
| `POST /api/auth/logout`              | sidebar logout                       |
| `GET /api/jobs`                      | Browse Jobs, dashboard suggestions   |
| `GET /api/jobs/:jobId`               | the single job page + similar roles  |
| `GET /api/saved`                     | Saved Jobs, bookmark state           |
| `POST /api/saved`                    | bookmark a job                       |
| `DELETE /api/saved/:jobId`           | remove a bookmark                    |
| `GET /api/applications/mine`         | Applications table, applied markers  |
| `POST /api/applications`             | Apply dialog                         |
| `GET /api/stats/seeker`              | dashboard + billing counters         |
| `GET /api/payments/history`          | billing receipts                     |
| `POST /api/payments/checkout`        | plan upgrade                         |
| `POST /api/upload?folder=resumes`    | resume upload (PDF, ≤ 5 MB)          |

`GET /api/users` is **admin-only**, so a seeker dashboard never calls it. The
public demo pages (`/jobs`, `/companies`, `/signin` …) are a separate,
self-contained demo that keeps its data in memory; the dashboard is the part
of the site that talks to the real Express API.

## Running locally

1. Start MongoDB (or use the Atlas URI in the server's `.env`).
2. In `JOBserch-portel-serve-site`: `npm install`, `npm run seed:demo`,
   `npm run dev` → API on port 5000.
3. In this folder: `npm install`, `npm run dev` → client on port 3000.
4. Open <http://localhost:3000/secker> and sign in with the demo account:

   ```
   seeker@demo.com / demo1234
   ```

## Notes for readers

- Every page is a Client Component because all data depends on the login
  cookie and must refresh without a full reload.
- Requests live inside `useEffect` / event handlers. With Next.js 16
  (`cacheComponents`), starting a fetch during render is not allowed.
- Plan limits are enforced by the **server**, not by these screens. The UI
  only reflects what `/api/stats/seeker` reports, so a tampered client cannot
  send more applications than the plan allows.
