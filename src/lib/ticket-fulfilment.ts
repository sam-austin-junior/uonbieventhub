import { prisma } from "./prisma";
import { fireWebhook } from "./webhooks";
import { triggerAutomation, eventVars } from "./automations";

/**
 * Called by both the Stripe and Flutterwave webhook handlers once a
 * ticket Payment is confirmed paid. Idempotent: safe to call twice for
 * the same payment.
 */
export async function fulfilTicketPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { registration: true },
  });
  if (!payment) return null;
  if (payment.kind !== "ticket") return null;
  if (payment.registration) return payment.registration;
  if (!payment.eventId || !payment.ticketTypeId) return null;

  const registration = await prisma.$transaction(async (tx) => {
    const dup = await tx.registration.findUnique({
      where: {
        eventId_userId: {
          eventId: payment.eventId!,
          userId: payment.userId,
        },
      },
    });
    if (dup) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { metadata: JSON.stringify({ note: "User was already registered" }) },
      });
      return dup;
    }

    const reg = await tx.registration.create({
      data: {
        eventId: payment.eventId!,
        userId: payment.userId,
        ticketTypeId: payment.ticketTypeId,
        promoCodeId: payment.promoCodeId,
        paidCents: payment.amountCents,
        paymentId: payment.id,
      },
    });

    await tx.ticketType.update({
      where: { id: payment.ticketTypeId! },
      data: { soldCount: { increment: 1 } },
    });
    if (payment.promoCodeId) {
      await tx.promoCode.update({
        where: { id: payment.promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return reg;
  });

  // Out-of-band notifications (best-effort).
  notifyTicketPurchase(payment.eventId!, payment.userId, payment.amountCents).catch(() => {});

  return registration;
}

async function notifyTicketPurchase(eventId: string, userId: string, amountCents: number) {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true, name: true, startDate: true, endDate: true, venue: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
  ]);
  if (!event || !user) return;

  await fireWebhook("ticket.purchased", {
    eventId: event.id,
    attendeeEmail: user.email,
    attendeeName: user.name,
    amountCents,
  });
  await triggerAutomation("ticket.purchased", event.id, user.email, {
    ...eventVars(event),
    attendee_name: user.name,
  });
  await triggerAutomation("registration.confirmation", event.id, user.email, {
    ...eventVars(event),
    attendee_name: user.name,
  });
}
