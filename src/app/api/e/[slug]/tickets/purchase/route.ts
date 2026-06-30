import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  checkTicketAvailability,
  validatePromoCode,
} from "@/lib/tickets";
import {
  flutterwaveConfigured,
  createStandardCharge,
} from "@/lib/flutterwave";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

const schema = z.object({
  ticketTypeId: z.string(),
  code: z.string().optional().nullable(),
  provider: z.enum(["stripe", "flutterwave"]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to buy a ticket" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You're already registered for this event" },
      { status: 409 },
    );
  }

  const ticket = await prisma.ticketType.findFirst({
    where: { id: parsed.data.ticketTypeId, eventId: event.id },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const availability = checkTicketAvailability(ticket);
  if (!availability.available) {
    return NextResponse.json(
      { error: "This ticket is no longer available" },
      { status: 400 },
    );
  }

  let finalCents = ticket.priceCents;
  let promoCodeId: string | null = null;

  if (parsed.data.code && parsed.data.code.trim()) {
    const result = await validatePromoCode({
      eventId: event.id,
      ticketTypeId: ticket.id,
      code: parsed.data.code,
      basePriceCents: ticket.priceCents,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    finalCents = result.finalCents;
    promoCodeId = result.codeId;
  }

  // -------- FREE TICKET PATH --------
  if (finalCents === 0) {
    const registration = await prisma.$transaction(async (tx) => {
      // Re-check capacity inside the transaction.
      const t = await tx.ticketType.findUnique({ where: { id: ticket.id } });
      if (!t) throw new Error("Ticket disappeared");
      if (t.capacity !== null && t.soldCount >= t.capacity) {
        throw new Error("This ticket just sold out");
      }
      const reg = await tx.registration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          ticketTypeId: ticket.id,
          promoCodeId: promoCodeId,
          paidCents: 0,
        },
      });
      await tx.ticketType.update({
        where: { id: ticket.id },
        data: { soldCount: { increment: 1 } },
      });
      if (promoCodeId) {
        await tx.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return reg;
    });
    return NextResponse.json({
      free: true,
      registrationId: registration.id,
      redirectTo: `/e/${event.slug}`,
    });
  }

  // -------- PAID TICKET PATH --------
  // Reserve the seat by creating a pending Payment; webhook will create
  // the Registration only after payment succeeds. We do NOT pre-create
  // a Registration to avoid leaking seats to abandoned checkouts.
  const provider =
    parsed.data.provider ??
    (flutterwaveConfigured() ? "flutterwave" : stripeConfigured() ? "stripe" : null);
  if (!provider) {
    return NextResponse.json(
      { error: "No payment provider is configured" },
      { status: 503 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      eventId: event.id,
      ticketTypeId: ticket.id,
      promoCodeId,
      provider,
      kind: "ticket",
      amountCents: finalCents,
      currency: ticket.currency.toUpperCase(),
      status: "pending",
      description: `${event.name} — ${ticket.name}`,
    },
  });

  const origin = new URL(req.url).origin;
  const successUrl = `${origin}/e/${event.slug}?ticket=success&payment=${payment.id}`;
  const cancelUrl = `${origin}/e/${event.slug}/tickets?cancelled=1`;

  if (provider === "flutterwave") {
    if (!flutterwaveConfigured()) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: "Flutterwave is not configured" },
        { status: 503 },
      );
    }
    const txRef = `uon_ticket_${ticket.id.slice(0, 8)}_${randomUUID().slice(0, 8)}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { flutterwaveTxRef: txRef },
    });
    try {
      const { hostedLink } = await createStandardCharge({
        txRef,
        amount: finalCents / 100,
        currency: ticket.currency,
        redirectUrl: successUrl,
        customer: { email: user.email, name: user.name },
        meta: {
          userId: user.id,
          eventId: event.id,
          paymentId: payment.id,
          ticketTypeId: ticket.id,
          ...(promoCodeId ? { promoCodeId } : {}),
        },
        customizations: {
          title: event.name,
          description: ticket.name,
          logo: `${origin}/uon-logo.png`,
        },
      });
      return NextResponse.json({ url: hostedLink });
    } catch (err) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
          metadata: JSON.stringify({
            error: err instanceof Error ? err.message : String(err),
          }),
        },
      });
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Checkout failed" },
        { status: 502 },
      );
    }
  }

  // Stripe
  if (!stripeConfigured()) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: ticket.currency.toLowerCase(),
          unit_amount: finalCents,
          product_data: {
            name: `${event.name} — ${ticket.name}`,
            description: ticket.description ?? undefined,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      paymentId: payment.id,
      kind: "ticket",
      eventId: event.id,
      ticketTypeId: ticket.id,
      ...(promoCodeId ? { promoCodeId } : {}),
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ url: session.url });
}
