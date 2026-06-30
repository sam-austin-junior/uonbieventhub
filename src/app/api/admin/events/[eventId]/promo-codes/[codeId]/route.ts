import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  discountType: z.enum(["percent", "fixed"]).optional(),
  discountValue: z.number().int().min(1).optional(),
  maxUses: z.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  ticketTypeId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { eventId: string; codeId: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  const promo = await prisma.promoCode.findFirst({
    where: { id: params.codeId, eventId: params.eventId },
  });
  if (!promo) return NextResponse.json({ error: "Code not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  if (
    parsed.data.discountType === "percent" &&
    typeof parsed.data.discountValue === "number" &&
    parsed.data.discountValue > 100
  ) {
    return NextResponse.json(
      { error: "Percent discount cannot exceed 100" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if ("validFrom" in parsed.data) {
    data.validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null;
  }
  if ("validUntil" in parsed.data) {
    data.validUntil = parsed.data.validUntil ? new Date(parsed.data.validUntil) : null;
  }
  if ("ticketTypeId" in parsed.data && parsed.data.ticketTypeId) {
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

  const updated = await prisma.promoCode.update({
    where: { id: promo.id },
    data,
  });

  await writeAudit({
    session,
    action: "promo.update",
    targetType: "PromoCode",
    targetId: updated.id,
    summary: `Updated promo "${updated.code}"`,
  });

  return NextResponse.json({ promo: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string; codeId: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  const promo = await prisma.promoCode.findFirst({
    where: { id: params.codeId, eventId: params.eventId },
  });
  if (!promo) return NextResponse.json({ error: "Code not found" }, { status: 404 });

  await prisma.promoCode.delete({ where: { id: promo.id } });

  await writeAudit({
    session,
    action: "promo.delete",
    targetType: "PromoCode",
    targetId: promo.id,
    summary: `Deleted promo "${promo.code}"`,
  });

  return NextResponse.json({ ok: true });
}
