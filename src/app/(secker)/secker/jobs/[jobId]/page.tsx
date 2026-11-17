/**
 * ==================================================================
 *  JOB DETAIL ROUTE — src/app/(secker)/secker/jobs/[jobId]/page.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The route shell for one job inside the dashboard:
 *
 *      /secker/jobs/<mongoId>
 *
 *  WHY IT IS A SERVER COMPONENT
 *  In this version of Next.js the dynamic segment arrives as a Promise.
 *  A Server Component can simply `await` it and pass the plain string to
 *  the client view; the view then needs no `useParams()` hook and no extra
 *  Suspense boundary of its own.
 *
 *  WHERE IS THE UI?
 *  In `(secker)/_components/JobDetailsView.tsx`. Keeping the drawing code
 *  there means this file stays a two-line adapter, and the same view can be
 *  reused later (for example from a recruiter "preview" screen).
 * ==================================================================
 */

import { JobDetailsView } from "../../../_components/JobDetailsView";

/**
 * Next.js hands us the URL segments inside `params`. `jobId` is the folder
 * name in brackets above ([jobId]), so its value is whatever the URL has
 * after `/secker/jobs/`.
 */
export default async function SeekerJobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return <JobDetailsView jobId={jobId} />;
}
