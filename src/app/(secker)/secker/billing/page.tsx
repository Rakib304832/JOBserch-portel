"use client";

/**
 * ==================================================================
 *  BILLING — src/app/(secker)/secker/billing/page.tsx
 * ==================================================================
 *  WHAT IS THIS PAGE?
 *  Subscription & billing for a Seeker:
 *    · which plan is active right now
 *    · how many applications this month's quota has used
 *    · the three plans (Free / Pro / Premium) with an upgrade button
 *    · the receipt table (payment history)
 *
 *  API CALLS
 *    GET  /api/stats/seeker      current plan + usage + limit
 *    GET  /api/payments/history  every receipt for this user
 *    POST /api/payments/checkout { plan } -> records a payment and applies it
 *
 *  ABOUT THE MONEY
 *  The server's checkout is the demo flow described in its README: it
 *  records a "succeeded" payment with provider "demo" and applies the plan
 *  immediately. No card is charged. When Stripe is wired in, this page
 *  keeps working because it only sends a plan id and reloads the numbers.
 * ==================================================================
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleCheck,
  CreditCard,
  LoaderCircle,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { api, errorMessage } from "../../_lib/api";
import type {
  CheckoutResponse,
  Payment,
  PaymentsResponse,
  SeekerPlanId,
  SeekerStats,
  StatsResponse,
} from "../../_lib/types";
import {
  SEEKER_PLAN_META,
  formatDate,
  formatMoney,
  planUsageLabel,
  usagePercent,
} from "../../_lib/format";
import { PageHeader } from "../../_components/PageHeader";
import { Notice, type NoticeTone } from "../../_components/Notice";
import { EmptyState } from "../../_components/EmptyState";

/** The order plans are displayed in, cheapest first. */
const PLAN_ORDER: SeekerPlanId[] = ["free", "pro", "premium"];

export default function BillingPage() {
  // ---------- Remote data ----------
  const [stats, setStats] = useState<SeekerStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Checkout ----------
  const [busyPlan, setBusyPlan] = useState<SeekerPlanId | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);

  /**
   * load — fetch the plan numbers and the receipt list.
   * Called on mount and again after a successful checkout so the UI
   * immediately shows the new plan and the new receipt.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [statsResult, paymentsResult] = await Promise.allSettled([
      api<StatsResponse>("/stats/seeker"),
      api<PaymentsResponse>("/payments/history"),
    ]);

    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value.stats);
    } else {
      setError(errorMessage(statsResult.reason));
    }

    if (paymentsResult.status === "fulfilled") {
      setPayments(paymentsResult.value.payments);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * choosePlan — send the plan id to the server.
   * The server validates that a seeker cannot buy a recruiter plan, applies
   * the plan and writes the receipt in one call.
   */
  async function choosePlan(planId: SeekerPlanId) {
    setBusyPlan(planId);
    setNotice(null);

    try {
      const data = await api<CheckoutResponse>("/payments/checkout", {
        method: "POST",
        body: { plan: planId },
      });

      const wasAlready = data.wasAlreadyOn === data.plan;
      const label = SEEKER_PLAN_META[data.plan]?.label ?? data.plan;

      setNotice({
        tone: "success",
        text: wasAlready
          ? `You are already on the ${label} plan.`
          : `You are now on the ${label} plan. A receipt was added to your history.`,
      });

      // Pull fresh usage numbers + the new receipt row.
      await load();
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusyPlan(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Loading                                                            */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="size-6 animate-spin text-brand-violet" />
        <p className="text-sm text-muted-foreground">Loading billing details…</p>
      </div>
    );
  }

  // Fall back to Free when the stats call failed, so the page still renders.
  const currentPlan = stats?.plan ?? "free";
  const currentMeta = SEEKER_PLAN_META[currentPlan];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscription"
        title="Billing & plans"
        description="Your plan controls how many applications you can send each calendar month."
        actions={
          <Link
            href="/secker/applications"
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated"
          >
            View applications
          </Link>
        }
      />

      {error && (
        <Notice tone="error" onClose={() => setError("")}>
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            Retry
          </button>
        </Notice>
      )}

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {/* ================= Current plan ================= */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-line bg-gradient-to-br from-[#15152a] to-[#101016] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Current plan
              </p>

              <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
                {currentMeta.label}
                <BadgeCheck className="size-5 text-brand-violet" />
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">{currentMeta.tagline}</p>
            </div>

            <span className="flex size-11 items-center justify-center rounded-2xl border border-brand-orange/30 bg-brand-orange/10 text-brand-orange">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-white">
                {stats?.applicationsUsed ?? 0}{" "}
                <span className="text-muted-foreground">
                  / {stats?.planLimit === null ? "∞" : (stats?.planLimit ?? currentMeta.limit ?? 3)}
                </span>{" "}
                <span className="text-xs text-muted-foreground">applications this month</span>
              </span>

              <span className="text-xs text-muted-foreground">
                {stats ? usagePercent(stats) : 0}% used
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full ${
                  stats?.limitReached
                    ? "bg-gradient-to-r from-rose-500 to-orange-500"
                    : "bg-gradient-to-r from-[#4d6bff] to-[#7c5cff]"
                }`}
                style={{ width: `${stats ? usagePercent(stats) : 0}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {stats ? planUsageLabel(stats) : "Usage unavailable"} · quota resets on the
              1st of each month.
            </p>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            You pay for applications, not for job posts. Cancel any time — a downgrade
            to Free takes effect immediately in this demo.
          </p>
        </div>

        {/* Why upgrade sidebar */}
        <div className="rounded-2xl border border-line bg-panel/80 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            What you get with {currentPlan === "premium" ? "Premium" : "an upgrade"}
          </p>

          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {[
              "More applications every month",
              "Unlimited saved jobs on paid plans",
              "Full status tracking for every application",
            ].map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {perk}
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-brand-orange" />
            Plans are enforced by the API, not just the UI.
          </p>
        </div>
      </section>

      {/* ================= Plan comparison ================= */}
      <section>
        <h2 className="text-lg font-semibold text-white">Choose your plan</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = SEEKER_PLAN_META[planId];
            const isCurrent = planId === currentPlan;

            return (
              <div
                key={planId}
                className={`flex flex-col rounded-2xl border p-5 ${
                  isCurrent
                    ? "border-brand-violet/50 bg-brand-violet/5"
                    : "border-line bg-panel/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{plan.label}</h3>

                  {isCurrent && (
                    <span className="rounded-full border border-brand-violet/40 bg-brand-violet/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                      Current
                    </span>
                  )}
                </div>

                <p className="mt-3 text-3xl font-semibold text-white">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => void choosePlan(planId)}
                  disabled={isCurrent || busyPlan !== null}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform disabled:cursor-not-allowed disabled:opacity-60 ${
                    isCurrent
                      ? "border border-line bg-elevated text-white"
                      : "bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] text-white hover:-translate-y-0.5"
                  }`}
                >
                  {busyPlan === planId ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Applying…
                    </>
                  ) : isCurrent ? (
                    "Active plan"
                  ) : (
                    <>
                      {plan.price === 0 ? "Switch to Free" : `Upgrade to ${plan.label}`}
                      <ArrowUpRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Demo checkout: the API records the payment with provider “demo” and applies the
          plan immediately. No card details are collected.
        </p>
      </section>

      {/* ================= Payment history ================= */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Receipt className="size-4 text-muted-foreground" />
            Payment history
          </h2>

          <span className="text-xs text-muted-foreground">
            {payments.length} receipt{payments.length === 1 ? "" : "s"}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Upgrade to a paid plan and the receipt will appear here with its reference id."
              action={
                <Link
                  href="/secker/billing"
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white hover:bg-elevated"
                >
                  View plans above
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-panel/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Receipt</th>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-line/70 last:border-0 hover:bg-elevated/40"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                        #{payment._id.slice(-6).toUpperCase()}
                      </td>

                      <td className="px-5 py-4 text-white">
                        {payment.planLabel ?? payment.plan}
                      </td>

                      <td className="px-5 py-4 text-white">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
