import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  ticketTypeId: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

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

  // Only allow waitlist sign-ups when the ticket is actually sold out.
  if (ticket.capacity === null) {
    return NextResponse.json(
      { error: "This ticket has no capacity limit — buy a ticket instead." },
      { status: 400 },
    );
  }
  if (ticket.soldCount < ticket.capacity) {
    return NextResponse.json(
      {
        error:
          "Seats are still available — purchase a ticket from the tickets page.",
      },
      { status: 400 },
    );
  }

  // Already registered?
  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    select: { id: true },
  });
  if (reg) {
    return NextResponse.json(
      { error: "You're already registered for this event" },
      { status: 409 },
    );
  }

  const existing = await prisma.waitlistEntry.findUnique({
    where: {
      ticketTypeId_userId: {
        ticketTypeId: ticket.id,
        userId: session.userId,
      },
    },
  });
  if (existing) {
    return NextResponse.json({
      ok: true,
      position: existing.position,
      alreadyOnList: true,
    });
  }

  const last = await prisma.waitlistEntry.findFirst({
    where: { ticketTypeId: ticket.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = (last?.position ?? 0) + 1;

  await prisma.waitlistEntry.create({
    data: {
      eventId: event.id,
      ticketTypeId: ticket.id,
      userId: session.userId,
      position,
    },
  });

  return NextResponse.json({ ok: true, position });
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const url = new URL(req.url);
  const ticketTypeId = url.searchParams.get("ticketTypeId");
  if (!ticketTypeId) {
    return NextResponse.json({ error: "ticketTypeId required" }, { status: 400 });
  }
  await prisma.waitlistEntry
    .delete({
      where: {
        ticketTypeId_userId: {
          ticketTypeId,
          userId: session.userId,
        },
      },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
