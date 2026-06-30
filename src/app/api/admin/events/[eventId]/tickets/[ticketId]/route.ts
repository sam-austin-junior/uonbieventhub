import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";
import { notifyWaitlistOpenings } from "@/lib/waitlist";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  capacity: z.number().int().min(1).optional().nullable(),
  saleStartsAt: z.string().optional().nullable(),
  saleEndsAt: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

async function loadAndAssert(session: Awaited<ReturnType<typeof requireStaff>>, eventId: string, ticketId: string) {
  await assertOwnsEvent(session, eventId);
  const ticket = await prisma.ticketType.findFirst({
    where: { id: ticketId, eventId },
  });
  return ticket;
}

export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string; ticketId: string } },
) {
  const session = await requireStaff();
  const ticket = await loadAndAssert(session, params.eventId, params.ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof data.currency === "string") data.currency = (data.currency as string).toUpperCase();
  if ("saleStartsAt" in parsed.data) {
    data.saleStartsAt = parsed.data.saleStartsAt ? new Date(parsed.data.saleStartsAt) : null;
  }
  if ("saleEndsAt" in parsed.data) {
    data.saleEndsAt = parsed.data.saleEndsAt ? new Date(parsed.data.saleEndsAt) : null;
  }

  const updated = await prisma.ticketType.update({
    where: { id: ticket.id },
    data,
  });

  await writeAudit({
    session,
    action: "ticket.update",
    targetType: "TicketType",
    targetId: ticket.id,
    summary: `Updated ticket "${updated.name}"`,
  });

  // If capacity grew (or was lifted entirely) we may have freed seats —
  // notify the next people on the waitlist.
  const oldRoom = ticket.capacity === null ? Infinity : Math.max(0, ticket.capacity - ticket.soldCount);
  const newRoom = updated.capacity === null ? Infinity : Math.max(0, updated.capacity - updated.soldCount);
  if (newRoom > oldRoom) {
    const delta = newRoom === Infinity ? 50 : newRoom - oldRoom;
    notifyWaitlistOpenings(ticket.id, delta).catch(() => {});
  }

  return NextResponse.json({ ticket: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string; ticketId: string } },
) {
  const session = await requireStaff();
  const ticket = await loadAndAssert(session, params.eventId, params.ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (ticket.soldCount > 0) {
    return NextResponse.json(
      {
        error:
          "This ticket already has registrations. Deactivate it instead of deleting so existing buyers keep their tickets.",
      },
      { status: 400 },
    );
  }

  await prisma.ticketType.delete({ where: { id: ticket.id } });

  await writeAudit({
    session,
    action: "ticket.delete",
    targetType: "TicketType",
    targetId: ticket.id,
    summary: `Deleted ticket "${ticket.name}"`,
  });

  return NextResponse.json({ ok: true });
}
