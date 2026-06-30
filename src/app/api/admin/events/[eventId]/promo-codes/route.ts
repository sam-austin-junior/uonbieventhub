import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, digits, hyphen or underscore only"),
  discountType: z.enum(["percent", "fixed"]).default("percent"),
  discountValue: z.number().int().min(1),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  ticketTypeId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  if (parsed.data.discountType === "percent" && parsed.data.discountValue > 100) {
    return NextResponse.json(
      { error: "Percent discount cannot exceed 100" },
      { status: 400 },
    );
  }

  const code = parsed.data.code.toUpperCase();
  const existing = await prisma.promoCode.findFirst({
    where: { eventId: params.eventId, code },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A code with this name already exists for this event" },
      { status: 409 },
    );
  }

  if (parsed.data.ticketTypeId) {
    const t = await prisma.ticketType.findFirst({
      where: { id: parsed.data.ticketTypeId, eventId: params.eventId },
    });
    if (!t) {
      return NextResponse.json(
        { error: "The selected ticket type does not exist on this event" },
        { status: 400 },
      );
    }
  }

  const promo = await prisma.promoCode.create({
    data: {
      eventId: params.eventId,
      code,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      maxUses: parsed.data.maxUses ?? null,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      ticketTypeId: parsed.data.ticketTypeId ?? null,
      active: parsed.data.active ?? true,
    },
  });

  await writeAudit({
    session,
    action: "promo.create",
    targetType: "PromoCode",
    targetId: promo.id,
    summary: `Created promo "${code}" on event ${params.eventId}`,
  });

  return NextResponse.json({ promo });
}
