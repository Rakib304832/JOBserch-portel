/**
 * /api/payments — subscription payments (billing pages).
 *
 * GET   →
 *   • a seeker/recruiter sees THEIR payment history + their current plan
 *     summary (label, limit, usage) for the billing header
 *   • an admin sees every payment on the platform
 *
 * POST  → "checkout": upgrade or downgrade to a plan.
 *
 * ⚠️  STRIPE INTEGRATION — DEMO VERSION
 * The requirements say payments run through Stripe. Real Stripe checkout is a
 * redirect dance (your server → Stripe's hosted page → webhook confirms →
 * then you activate the plan) that needs STRIPE_SECRET_KEY and a public
 * webhook URL. This demo SIMULATES the happy path so the full product flow
 * is testable offline:
 *      1. validate the chosen plan
 *      2. record a payment with a Stripe-style transaction id (ch_demo_…)
 *      3. activate the new plan immediately
 *      4. return success → the UI shows the success toast
 * Where the real Stripe SDK calls would go is marked with [STRIPE] below.
 */

import { type NextRequest } from "next/server";
import {
  badRequest,
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/session";
import {
  addPayment,
  countActiveJobs,
  countApplicationsThisMonth,
  getCompanyByRecruiter,
  listPayments,
  newId,
  nowIso,
  sendEmail,
  updateUser,
} from "@/lib/store";
import { getRecruiterPlan, getSeekerPlan } from "@/lib/plans";
import { updateCompany } from "@/lib/store";
import type { RecruiterPlanId, SeekerPlanId } from "@/lib/types";
import type { PaymentsResponse } from "@/lib/api-types";

/* -------------------------------------------------------------------------- */
/*  GET — history + current plan summary                                      */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  // ---- Admin sees everything ----
  if (user.role === "admin") {
    return Response.json({ payments: listPayments({}), plan: null });
  }

  // ---- Everyone else sees their own rows ----
  const payments = listPayments({ userId: user.id });

  if (user.role === "seeker") {
    const plan = getSeekerPlan(user.plan);
    const body: PaymentsResponse = {
      payments,
      plan: {
        audience: "seeker",
        id: plan.id,
        label: plan.label,
        limit: plan.limit, // null = unlimited applications
        used: countApplicationsThisMonth(user.id),
      },
    };
    return Response.json(body);
  }

  // ---- Recruiter: the plan belongs to their COMPANY ----
  const company = getCompanyByRecruiter(user.id);
  const plan = getRecruiterPlan(company?.plan ?? "free");
  const body: PaymentsResponse = {
    payments,
    plan: company
      ? {
          audience: "recruiter",
          id: plan.id,
          label: plan.label,
          limit: plan.limit,
          used: countActiveJobs(company.id),
        }
      : null,
  };
  return Response.json(body);
}

/* -------------------------------------------------------------------------- */
/*  POST — upgrade / downgrade ("checkout")                                   */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }

  if (user.role === "admin") {
    return forbidden("Admins don't have subscriptions.");
  }

  const requested = body.plan ?? "";

  /* ---- [STRIPE] In production this is where you'd: ------------------------
       1. create a Stripe Checkout Session for the plan's price id:
            const session = await stripe.checkout.sessions.create({
              mode: "subscription",
              line_items: [{ price: PRICE_IDS[requested], quantity: 1 }],
              success_url, cancel_url, customer_email: user.email,
            });
       2. redirect the browser to session.url
       3. activate the plan ONLY in the checkout.session.completed webhook
          (never trust the redirect alone).
       The demo below does the "webhook received" part directly. -------------- */

  if (user.role === "seeker") {
    const plan = getSeekerPlan(requested);
    if (plan.id !== requested) return badRequest("Unknown plan.");

    const payment = {
      id: newId("pay"),
      userId: user.id,
      userEmail: user.email,
      audience: "seeker" as const,
      plan: plan.id,
      planLabel: plan.label,
      amount: plan.price,
      currency: "USD",
      // Stripe-style charge id, generated locally for the demo.
      transactionId: `ch_demo_${newId("tx").replace("tx_", "").toUpperCase()}`,
      status: "paid" as const,
      createdAt: nowIso(),
    };
    addPayment(payment);
    // `as SeekerPlanId` narrows the generic string to the union type.
    updateUser(user.id, { plan: plan.id as SeekerPlanId }); // ← activate the plan
    sendEmail(
      user.email,
      `Your ${plan.label} plan is active`,
      `Thanks for upgrading! Your ${plan.label} plan is now active on HireLoop.`
    );
    return Response.json({ payment }, { status: 201 });
  }

  /* ---- Recruiter: the plan upgrades their COMPANY ---- */
  const company = getCompanyByRecruiter(user.id);
  if (!company) {
    return badRequest("Register a company before choosing a recruiter plan.");
  }
  const plan = getRecruiterPlan(requested);
  if (plan.id !== requested) return badRequest("Unknown plan.");

  const payment = {
    id: newId("pay"),
    userId: user.id,
    userEmail: user.email,
    audience: "recruiter" as const,
    plan: plan.id,
    planLabel: plan.label,
    amount: plan.price,
    currency: "USD",
    transactionId: `ch_demo_${newId("tx").replace("tx_", "").toUpperCase()}`,
    status: "paid" as const,
    createdAt: nowIso(),
  };
  addPayment(payment);
  updateCompany(company.id, { plan: plan.id as RecruiterPlanId }); // ← raises the job-post limit
  sendEmail(
    user.email,
    `Your ${plan.label} plan is active`,
    `Your company "${company.name}" now allows ${plan.limit ?? "unlimited"} active job posts.`
  );
  return Response.json({ payment }, { status: 201 });
}
