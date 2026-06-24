import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

const HOST_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

const schema = z.object({
  customDomain: z
    .string()
    .trim()
    .max(253)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null)),
});

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const value = parsed.data.customDomain;
  if (value && !HOST_RE.test(value)) {
    return NextResponse.json(
      { error: "Enter a valid hostname like events.example.com" },
      { status: 400 }
    );
  }
  if (value) {
    const taken = await prisma.event.findFirst({
      where: { customDomain: value, NOT: { id: params.eventId } },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That domain is already used by another event" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.event.update({
    where: { id: params.eventId },
    data: { customDomain: value },
    select: { id: true, customDomain: true, name: true },
  });

  await writeAudit({
    session,
    action: value ? "event.domain.set" : "event.domain.cleared",
    targetType: "event",
    targetId: updated.id,
    summary: value ? `Set custom domain ${value} on ${updated.name}` : `Cleared custom domain on ${updated.name}`,
  });

  return NextResponse.json({ ok: true, customDomain: updated.customDomain });
}
