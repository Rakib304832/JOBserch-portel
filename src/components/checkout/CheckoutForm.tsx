"use client";

/**
 * ============================================================================
 * components/checkout/CheckoutForm.tsx — the Stripe-style payment step
 * ============================================================================
 *
 * WHAT THE DOCX ASKS FOR (Checkout — Stripe Payment)
 *   Plan summary (name + price) · currency picker (USD / BDT) · email ·
 *   card fields · Pay button · "Powered by Stripe / SANDBOX" note.
 *
 * IMPORTANT — WHAT IS *NOT* HERE
 * Real card processing is server-side work (Stripe Checkout Session + webhook)
 * and belongs to the backend. This component only collects the form and then
 * calls the backend endpoint that already exists:
 *
 *      POST /api/payments { plan }   → { payment }
 *
 * The API records a demo payment, activates the plan and answers with a
 * Stripe-style transaction id. card numbers never leave the browser in this
 * demo — they are validated, then ignored.
 *
 * WHY "use client"
 * Form state, validation and the submit request all run in the browser.
 * The page wraps this component in <Suspense> because it reads useSearchParams.
 * ============================================================================
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";

import { Field, Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api-client";
import { getRecruiterPlan, getSeekerPlan } from "@/lib/plans";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Payment } from "@/lib/types";

/**
 * The conversion rate shown in the Figma checkout screen.
 * The backend always records USD; this only affects the number on screen.
 */
const BDT_PER_USD = 127.6665;

export function CheckoutForm() {
  const router = useRouter();
  // Read the plan/audience the pricing card put in the URL.
  const searchParams = useSearchParams();

  // ---- who is buying? ----
  const audience = searchParams.get("audience") === "recruiter" ? "recruiter" : "seeker";

  // ---- which plan? default to a sensible paid tier per audience ----
  const planId = searchParams.get("plan") ?? (audience === "seeker" ? "pro" : "growth");

  // Look the plan up in the shared price tables (unknown ids fall back to Free).
  const plan = audience === "seeker" ? getSeekerPlan(planId) : getRecruiterPlan(planId);

  // ---- auth (for the "you must sign in first" notice) ----
  const { user, loading } = useCurrentUser();

  // ---- form state ----
  const [currency, setCurrency] = React.useState<"USD" | "BDT">("USD");
  const [emailInput, setEmailInput] = React.useState(""); // payer's typed email
  const [cardName, setCardName] = React.useState(""); // name on card
  const [cardNumber, setCardNumber] = React.useState(""); // digits only
  const [expiry, setExpiry] = React.useState(""); // MM/YY
  const [cvc, setCvc] = React.useState(""); // 3–4 digits
  const [submitting, setSubmitting] = React.useState(false); // request in flight
  const [error, setError] = React.useState<string | null>(null); // shown in red

  /**
   * Derived email: the signed-in address pre-fills the field until the visitor
   * types their own. Deriving it (instead of copying it into state in an
   * effect) keeps the component free of cascading renders.
   */
  const email = emailInput || user?.email || "";

  /** "$19.00" or "৳2,425.67" depending on the currency picker. */
  const amountLabel =
    currency === "USD"
      ? `$${plan.price.toFixed(2)}`
      : `৳${(plan.price * BDT_PER_USD).toFixed(2)}`;

  /** Very light client-side validation — the server remains the authority. */
  function validate(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (cardName.trim().length < 3) return "Enter the name printed on the card.";
    // Strip spaces the visitor may have typed between digit groups.
    if (cardNumber.replace(/\s/g, "").length < 12) return "Enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Expiry must look like MM/YY.";
    if (!/^\d{3,4}$/.test(cvc)) return "CVC must be 3 or 4 digits.";
    return null; // all good
  }

  /** Submit → create the payment on the backend → go to the success page. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Stop early if the fields are obviously wrong.
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);

    try {
      // The ONLY thing the backend needs is which plan was chosen.
      const data = await apiFetch<{ payment: Payment }>("/api/payments", {
        method: "POST",
        body: { plan: plan.id },
      });

      // Build the receipt URL from the real answer (transaction id, amount).
      const params = new URLSearchParams({
        plan: plan.label,
        amount: String(data.payment.amount),
        session: data.payment.transactionId,
        audience,
      });
      router.push(`/checkout/success?${params.toString()}`);
    } catch (caught) {
      // apiFetch throws with the server's message ("You must be logged in." …).
      setError(caught instanceof Error ? caught.message : "Payment failed. Try again.");
    } finally {
      // Whether it worked or not, the button can leave its spinner.
      setSubmitting(false);
    }
  }

  // Does the error mean "not signed in"? If so we add a shortcut link.
  const needsSignIn = Boolean(error && /logged in|sign in/i.test(error));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {/* ==================================================================== */}
      {/*  Left: the payment form                                              */}
      {/* ==================================================================== */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        // A real payment form must never be auto-completed by a password manager.
        autoComplete="off"
      >
        {/* ---- Title row + Stripe badge ---- */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CreditCard aria-hidden="true" className="h-5 w-5 text-indigo-300" />
              Payment details
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Secure checkout — you can cancel or downgrade at any time.
            </p>
          </div>
          {/* The Figma screen carries a small "Powered by Stripe" mark. */}
          <Badge tone="outline" className="shrink-0">
            Powered by Stripe
          </Badge>
        </div>

        {/* ---- Signed-out notice ---- */}
        {!loading && !user && (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            You need a HireLoop account before paying.{" "}
            <Link href="/signin" className="font-semibold underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-semibold underline">
              create one
            </Link>
            .
          </p>
        )}

        {/* ---- Email ---- */}
        <div className="mt-6">
          <Field label="Email" htmlFor="checkout-email">
            <Input
              id="checkout-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
        </div>

        {/* ---- Currency ---- */}
        <div className="mt-4">
          <Label htmlFor="checkout-currency">Currency</Label>
          <Select
            id="checkout-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as "USD" | "BDT")}
          >
            <option value="USD">USD — US Dollar</option>
            <option value="BDT">BDT — Bangladeshi Taka</option>
          </Select>
          {/* Explain the conversion so the number is not a surprise. */}
          {currency === "BDT" && (
            <p className="mt-1.5 text-xs text-zinc-500">
              1 USD = {BDT_PER_USD} BDT (rate shown for reference)
            </p>
          )}
        </div>

        {/* ---- Card holder ---- */}
        <div className="mt-4">
          <Field label="Name on card" htmlFor="checkout-name">
            <Input
              id="checkout-name"
              value={cardName}
              onChange={(event) => setCardName(event.target.value)}
              placeholder="Sam Seeker"
              autoComplete="cc-name"
            />
          </Field>
        </div>

        {/* ---- Card number ---- */}
        <div className="mt-4">
          <Field label="Card number" htmlFor="checkout-card">
            <Input
              id="checkout-card"
              inputMode="numeric"
              value={cardNumber}
              onChange={(event) =>
                // Keep digits + single spaces only, max 19 characters.
                setCardNumber(
                  event.target.value
                    .replace(/[^\d ]/g, "")
                    .slice(0, 19)
                )
              }
              placeholder="4242 4242 4242 4242"
              autoComplete="cc-number"
            />
          </Field>
        </div>

        {/* ---- Expiry + CVC side by side ---- */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Expiry" htmlFor="checkout-expiry">
            <Input
              id="checkout-expiry"
              inputMode="numeric"
              value={expiry}
              onChange={(event) => {
                // Auto-insert the slash: "1226" → "12/26".
                const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
              }}
              placeholder="MM/YY"
              autoComplete="cc-exp"
            />
          </Field>
          <Field label="CVC" htmlFor="checkout-cvc">
            <Input
              id="checkout-cvc"
              inputMode="numeric"
              value={cvc}
              onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              autoComplete="cc-csc"
            />
          </Field>
        </div>

        {/* ---- Error ---- */}
        {error && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
            {needsSignIn && (
              <>
                {" "}
                <Link href="/signin" className="font-semibold underline">
                  Go to sign in →
                </Link>
              </>
            )}
          </p>
        )}

        {/* ---- Submit ---- */}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
          {submitting ? "Processing…" : `Pay ${amountLabel}`}
        </Button>

        {/* Reassurance row under the button. */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
          Demo checkout — no real card is charged.
        </p>
      </form>

      {/* ==================================================================== */}
      {/*  Right: order summary                                               */}
      {/* ==================================================================== */}
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold text-white">Order summary</h2>

        {/* Plan name + audience */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                HireLoop {plan.label}
              </p>
              <p className="mt-0.5 text-xs capitalize text-zinc-400">
                {audience} plan
              </p>
            </div>
            <Badge tone="brand">{plan.limit === null ? "Unlimited" : `${plan.limit} / mo`}</Badge>
          </div>

          {/* The features the buyer is paying for. */}
          <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
            {plan.features.slice(0, 3).map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </div>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
          <span className="text-zinc-400">Total due today</span>
          <span className="text-lg font-semibold text-white">{amountLabel}</span>
        </div>

        {/* Trust note */}
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          14-day money-back guarantee. Cancel anytime from your billing page.
        </p>
      </aside>
    </div>
  );
}
