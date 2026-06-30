import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fireWebhook } from "@/lib/webhooks";
import { triggerAutomation, eventVars } from "@/lib/automations";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.qrToken) return NextResponse.json({ error: "Missing qrToken" }, { status: 400 });

  const reg = await prisma.registration.findUnique({
    where: { qrToken: body.qrToken },
    include: { user: true, event: { select: { id: true, name: true, organizerId: true } } },
  });
  if (!reg) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

  if (session.role !== "SUPERADMIN" && reg.event.organizerId !== session.userId) {
    return NextResponse.json(
      { error: "This QR belongs to an event you don't own." },
      { status: 403 }
    );
  }

  if (reg.checkedInAt) {
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      attendee: { name: reg.user.name, email: reg.user.email, faculty: reg.user.faculty },
      event: { name: reg.event.name },
      checkedInAt: reg.checkedInAt,
    });
  }

  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: { checkedInAt: new Date() },
  });

  // Fire-and-forget integrations.
  fireWebhook("registration.checked_in", {
    eventId: reg.event.id,
    attendeeEmail: reg.user.email,
    attendeeName: reg.user.name,
    checkedInAt: updated.checkedInAt?.toISOString(),
  }).catch(() => {});
  (async () => {
    const fullEvent = await prisma.event.findUnique({
      where: { id: reg.event.id },
      select: { id: true, slug: true, name: true, startDate: true, endDate: true, venue: true },
    });
    if (fullEvent) {
      await triggerAutomation(
        "registration.checked_in",
        fullEvent.id,
        reg.user.email,
        { ...eventVars(fullEvent), attendee_name: reg.user.name },
      );
    }
  })().catch(() => {});

  return NextResponse.json({
    ok: true,
    alreadyCheckedIn: false,
    attendee: { name: reg.user.name, email: reg.user.email, faculty: reg.user.faculty },
    event: { name: reg.event.name },
    checkedInAt: updated.checkedInAt,
  });
}
