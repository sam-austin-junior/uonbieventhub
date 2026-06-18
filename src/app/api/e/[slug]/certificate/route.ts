import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateCertificate } from "@/lib/certificate";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const requestedUserId = url.searchParams.get("userId");

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: { organizer: { select: { name: true } } },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const targetUserId = requestedUserId || session.userId;

  if (requestedUserId && requestedUserId !== session.userId) {
    if (session.role !== "ADMIN" && session.role !== "ORGANIZER" && session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: targetUserId } },
    include: { user: { select: { name: true } } },
  });
  if (!reg) return NextResponse.json({ error: "Not registered for this event" }, { status: 404 });
  if (!reg.checkedInAt && targetUserId === session.userId) {
    return NextResponse.json(
      { error: "Certificate available after you've checked in to the event." },
      { status: 403 }
    );
  }

  const pdf = await generateCertificate({
    attendeeName: reg.user.name,
    eventName: event.name,
    eventTagline: event.tagline,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: event.venue,
    organizerName: event.organizer.name,
    certificateId: reg.id.slice(-8).toUpperCase(),
    issuedAt: new Date(),
  });

  const safeName = reg.user.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const safeEvent = event.slug;
  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}-${safeEvent}-certificate.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
