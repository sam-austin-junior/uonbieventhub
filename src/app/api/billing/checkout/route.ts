import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getStripe,
  renewalCurrency,
  renewalPriceCents,
  stripeConfigured,
} from "@/lib/stripe";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Only organizers can renew" }, { status: 403 });
  }

  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const origin = new URL(req.url).origin;
  const amount = renewalPriceCents();
  const currency = renewalCurrency();

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      amountCents: amount,
      currency: currency.toUpperCase(),
      status: "pending",
      description: "Organizer access renewal",
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: "UoN Event Hub — Organizer access",
            description: "Renews your organizer access for the next term.",
          },
        },
      },
    ],
    success_url: `${origin}/admin?billing=success`,
    cancel_url: `${origin}/admin?billing=cancelled`,
    metadata: { userId: user.id, paymentId: payment.id, kind: "renewal" },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  await writeAudit({
    session: { userId: user.id, email: user.email, role: user.role, name: user.name },
    action: "billing.checkout.created",
    targetType: "payment",
    targetId: payment.id,
    summary: `Started Stripe checkout (${currency.toUpperCase()} ${(amount / 100).toFixed(2)})`,
  });

  return NextResponse.json({ url: session.url });
}
