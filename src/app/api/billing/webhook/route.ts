import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, renewalDays, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;
      if (paymentId && userId) {
        const intentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "paid",
            paidAt: new Date(),
            stripePaymentIntentId: intentId ?? undefined,
          },
        });

        const now = new Date();
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { expiresAt: true },
        });
        const base =
          user?.expiresAt && user.expiresAt > now ? user.expiresAt : now;
        const nextExpiry = new Date(
          base.getTime() + renewalDays() * 24 * 60 * 60 * 1000
        );
        await prisma.user.update({
          where: { id: userId },
          data: {
            expiresAt: nextExpiry,
            suspendedAt: null,
          },
        });
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "expired" },
        });
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: "failed" },
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Handler failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
