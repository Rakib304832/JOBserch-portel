"use client";

/**
 * ============================================================================
 * components/checkout/SuccessReceipt.tsx — "Payment Successful" receipt
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Checkout — Payment Successful)
 *   Success message "Welcome to HireLoop Pro" · amount paid · Stripe session
 *   id · "Go to Workspace Dashboard" button.
 *
 * WHERE THE VALUES COME FROM
 * CheckoutForm redirects here with the server's answer in the query string:
 *   /checkout/success?plan=Pro&amount=19&session=ch_demo_…&audience=seeker
 * Reading search params is a client concern, so this file is a Client
 * Component and the page wraps it in <Suspense>.
 * ============================================================================
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";

/** Where each audience lands after paying (the requirements' dashboard paths). */
const DASHBOARD_HOME: Record<string, string> = {
  seeker: "/dashboard/seeker",
  recruiter: "/dashboard/recruiter",
};

export function SuccessReceipt() {
  // Query values written by CheckoutForm after a successful POST.
  const searchParams = useSearchParams();

  // Sensible defaults keep the page useful if someone opens it directly.
  const plan = searchParams.get("plan") ?? "Pro";
  const amount = searchParams.get("amount") ?? "0";
  const session = searchParams.get("session") ?? "cs_test_demo";
  const audience = searchParams.get("audience") === "recruiter" ? "recruiter" : "seeker";

  return (
    <div className="mx-auto max-w-xl text-center">
      {/* ---- Success mark ---- */}
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-400" />
      </span>

      {/* ---- Message ---- */}
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Welcome to HireLoop {plan}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        Your payment went through and your new plan is active. Everything in{" "}
        {plan} is unlocked right now.
      </p>

      {/* ---- Receipt card ---- */}
      <dl className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left text-sm">
        {/* Plan */}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-400">Plan</dt>
          <dd className="font-medium text-white">{plan}</dd>
        </div>

        {/* Amount — the server stores whole dollars. */}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-400">Amount paid</dt>
          <dd className="font-medium text-white">${Number(amount).toFixed(2)}</dd>
        </div>

        {/* Stripe session id */}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-zinc-400">Session ID</dt>
          <dd
            // Long ids must wrap instead of stretching the card.
            className="max-w-[60%] break-all text-right font-mono text-xs text-zinc-300"
          >
            {session}
          </dd>
        </div>

        {/* Sandbox note, matching the Figma "SANDBOX" badge. */}
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
          <dt className="text-zinc-400">Environment</dt>
          <dd className="text-xs font-medium uppercase tracking-wider text-amber-300">
            Sandbox
          </dd>
        </div>
      </dl>

      {/* ---- Actions ---- */}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          {/* Destination follows the audience that just paid. */}
          <Link href={DASHBOARD_HOME[audience]}>Go to Workspace Dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/jobs">Browse jobs</Link>
        </Button>
      </div>
    </div>
  );
}
