import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3),
  capacity: z.number().int().min(1).optional().nullable(),
  saleStartsAt: z.string().optional().nullable(),
  saleEndsAt: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const ticket = await prisma.ticketType.create({
    data: {
      eventId: params.eventId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      priceCents: parsed.data.priceCents,
      currency: parsed.data.currency.toUpperCase(),
      capacity: parsed.data.capacity ?? null,
      saleStartsAt: parsed.data.saleStartsAt ? new Date(parsed.data.saleStartsAt) : null,
      saleEndsAt: parsed.data.saleEndsAt ? new Date(parsed.data.saleEndsAt) : null,
      sortOrder: parsed.data.sortOrder ?? 0,
      active: parsed.data.active ?? true,
    },
  });

  await writeAudit({
    session,
    action: "ticket.create",
    targetType: "TicketType",
    targetId: ticket.id,
    summary: `Created ticket "${ticket.name}" on event ${params.eventId}`,
  });

  return NextResponse.json({ ticket });
}
