import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

  return NextResponse.json({
    ok: true,
    alreadyCheckedIn: false,
    attendee: { name: reg.user.name, email: reg.user.email, faculty: reg.user.faculty },
    event: { name: reg.event.name },
    checkedInAt: updated.checkedInAt,
  });
}
