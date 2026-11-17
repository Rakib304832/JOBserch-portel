/**
 * ==================================================================
 *  STATUS BADGE — src/app/(secker)/_components/StatusBadge.tsx
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  The coloured pill that shows an application's stage:
 *
 *      ● Applied   ● Under Review   ● Shortlisted   ● Offered   ● Rejected
 *
 *  WHY IT EXISTS
 *  The database stores machine keys ("underReview"), but a human should
 *  read "Under Review". Keeping that mapping in ONE component means the
 *  applications table, the dashboard pipeline chart and the job card all
 *  use the exact same label and colour.
 * ==================================================================
 */

import {
  APPLICATION_STATUS_META,
} from "../_lib/format";
import type { ApplicationStatus } from "../_lib/types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  // `?? meta.applied` is defensive: if the server ever adds a new status
  // the UI falls back to "Applied" instead of crashing on undefined.
  const meta = APPLICATION_STATUS_META[status] ?? APPLICATION_STATUS_META.applied;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badge}`}
    >
      {/* The little coloured dot makes the status recognisable at a glance. */}
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
