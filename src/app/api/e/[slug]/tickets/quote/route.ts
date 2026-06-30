import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkTicketAvailability,
  validatePromoCode,
} from "@/lib/tickets";

export const runtime = "nodejs";

const schema = z.object({
  ticketTypeId: z.string(),
  code: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
      {
        error:
          availability.reason === "SOLD_OUT"
            ? "This ticket has sold out"
            : availability.reason === "SALE_ENDED"
            ? "Sales for this ticket have ended"
            : availability.reason === "NOT_ON_SALE_YET"
            ? "This ticket isn't on sale yet"
            : "This ticket isn't available",
      },
      { status: 400 },
    );
  }

  let discountCents = 0;
  let finalCents = ticket.priceCents;
  let promoError: string | null = null;
  let promoCodeId: string | null = null;

  if (parsed.data.code && parsed.data.code.trim()) {
    const result = await validatePromoCode({
      eventId: event.id,
      ticketTypeId: ticket.id,
      code: parsed.data.code,
      basePriceCents: ticket.priceCents,
    });
    if (result.ok) {
      discountCents = result.discountCents;
      finalCents = result.finalCents;
      promoCodeId = result.codeId;
    } else {
      promoError = result.error;
    }
  }

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      name: ticket.name,
      priceCents: ticket.priceCents,
      currency: ticket.currency,
    },
    discountCents,
    finalCents,
    promoCodeId,
    promoError,
  });
}
