/**
 * ============================================================================
 * app/(public)/checkout/success/page.tsx — PAYMENT SUCCESSFUL
 * ============================================================================
 *
 * The receipt page CheckoutForm redirects to after POST /api/payments succeeds:
 *
 *   /checkout/success?plan=Pro&amount=19&session=ch_demo_…&audience=seeker
 *
 * Like the checkout page, this is a server shell around a client component
 * (SuccessReceipt reads the query string, so it needs Suspense).
 *
 * The DOCX notes the "Go to Workspace Dashboard" destination was not defined
 * in the design; the receipt sends seekers and recruiters to the dashboard
 * routes named in the requirements doc.
 * ============================================================================
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { SuccessReceipt } from "@/components/checkout/SuccessReceipt";

/** Tab title: "Payment Successful · HireLoop". */
export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your HireLoop plan is active.",
  // Receipts are private and must not be indexed.
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <section className="bg-background py-20" aria-label="Payment successful">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Suspense
          // A compact placeholder so the page does not flash a spinner.
          fallback={
            <div className="mx-auto max-w-xl">
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/5" />
              <div className="mx-auto mt-6 h-9 w-72 animate-pulse rounded-lg bg-white/5" />
              <div className="mt-8 h-48 animate-pulse rounded-2xl bg-white/5" />
            </div>
          }
        >
          <SuccessReceipt />
        </Suspense>
      </div>
    </section>
  );
}
