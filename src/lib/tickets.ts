import { prisma } from "./prisma";

export type TicketAvailability = {
  available: boolean;
  remaining: number | null;
  reason?: "NOT_ON_SALE_YET" | "SALE_ENDED" | "SOLD_OUT" | "INACTIVE";
};

export function checkTicketAvailability(t: {
  active: boolean;
  capacity: number | null;
  soldCount: number;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
}, now: Date = new Date()): TicketAvailability {
  if (!t.active) return { available: false, remaining: 0, reason: "INACTIVE" };
  if (t.saleStartsAt && t.saleStartsAt > now)
    return { available: false, remaining: t.capacity, reason: "NOT_ON_SALE_YET" };
  if (t.saleEndsAt && t.saleEndsAt < now)
    return { available: false, remaining: 0, reason: "SALE_ENDED" };
  if (t.capacity !== null && t.soldCount >= t.capacity)
    return { available: false, remaining: 0, reason: "SOLD_OUT" };
  return {
    available: true,
    remaining: t.capacity === null ? null : t.capacity - t.soldCount,
  };
}

export function formatTicketMoney(cents: number, currency: string) {
  if (cents === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export type PromoValidation =
  | { ok: true; discountCents: number; finalCents: number; codeId: string }
  | { ok: false; error: string };

/**
 * Validate a promo code against a ticket type. Pure pricing math + capacity
 * checks; does NOT mutate usedCount (that happens at purchase time).
 */
export async function validatePromoCode(args: {
  eventId: string;
  ticketTypeId: string;
  code: string;
  basePriceCents: number;
}): Promise<PromoValidation> {
  const normalised = args.code.trim().toUpperCase();
  if (!normalised) return { ok: false, error: "Enter a code" };

  const codes = await prisma.promoCode.findMany({
    where: { eventId: args.eventId, active: true },
  });
  const promo = codes.find((c) => c.code.toUpperCase() === normalised);
  if (!promo) return { ok: false, error: "That code isn't valid for this event" };

  const now = new Date();
  if (promo.validFrom && promo.validFrom > now)
    return { ok: false, error: "This code isn't active yet" };
  if (promo.validUntil && promo.validUntil < now)
    return { ok: false, error: "This code has expired" };
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
    return { ok: false, error: "This code has reached its usage limit" };
  if (promo.ticketTypeId && promo.ticketTypeId !== args.ticketTypeId)
    return { ok: false, error: "This code doesn't apply to the selected ticket" };

  let discount = 0;
  if (promo.discountType === "percent") {
    discount = Math.floor((args.basePriceCents * promo.discountValue) / 100);
  } else {
    discount = promo.discountValue;
  }
  discount = Math.min(discount, args.basePriceCents);

  return {
    ok: true,
    discountCents: discount,
    finalCents: args.basePriceCents - discount,
    codeId: promo.id,
  };
}

export const RESERVED_TICKET_NAMES: string[] = [];
