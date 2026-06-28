import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await requireStaff();
  if (session.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Only the hub admin can delete events" },
      { status: 403 },
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { id: true, name: true, slug: true, organizerId: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id: event.id } });

  await writeAudit({
    session,
    action: "event.delete",
    targetType: "Event",
    targetId: event.id,
    summary: `Deleted event "${event.name}" (/e/${event.slug})`,
    metadata: { slug: event.slug, organizerId: event.organizerId },
  });

  return NextResponse.json({ ok: true });
}
