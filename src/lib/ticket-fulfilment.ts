import { prisma } from "./prisma";

/**
 * Called by both the Stripe and Flutterwave webhook handlers once a
 * ticket Payment is confirmed paid. Idempotent: safe to call twice for
 * the same payment.
 *
 * Returns the Registration that was created, or null if no action was
 * required (already fulfilled, payment was a renewal, etc.).
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

  return prisma.$transaction(async (tx) => {
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

    const registration = await tx.registration.create({
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

    return registration;
  });
}
