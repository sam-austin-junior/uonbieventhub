import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fireWebhook } from "@/lib/webhooks";
import { triggerAutomation, eventVars } from "@/lib/automations";

export const runtime = "nodejs";

const schema = z.object({
  recipientId: z.string(),
  proposedStart: z.string(),
  proposedEnd: z.string(),
  location: z.string().max(120).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  if (parsed.data.recipientId === session.userId) {
    return NextResponse.json({ error: "You can't meet with yourself" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Both must be registered for the event.
  const [iAmReg, theyAreReg, recipient] = await Promise.all([
    prisma.registration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    }),
    prisma.registration.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: parsed.data.recipientId },
      },
    }),
    prisma.user.findUnique({
      where: { id: parsed.data.recipientId },
      select: { allowConnectionRequests: true },
    }),
  ]);
  if (!iAmReg) return NextResponse.json({ error: "Register for the event first" }, { status: 403 });
  if (!theyAreReg) {
    return NextResponse.json(
      { error: "That attendee isn't registered for this event" },
      { status: 400 },
    );
  }
  if (recipient && !recipient.allowConnectionRequests) {
    return NextResponse.json(
      { error: "That attendee isn't accepting requests" },
      { status: 403 },
    );
  }

  const start = new Date(parsed.data.proposedStart);
  const end = new Date(parsed.data.proposedEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const meeting = await prisma.meetingRequest.create({
    data: {
      eventId: event.id,
      requesterId: session.userId,
      recipientId: parsed.data.recipientId,
      proposedStart: start,
      proposedEnd: end,
      location: parsed.data.location ?? null,
      message: parsed.data.message ?? null,
    },
  });

  (async () => {
    const [recipientUser, fullEvent] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsed.data.recipientId },
        select: { email: true, name: true },
      }),
      prisma.event.findUnique({
        where: { id: event.id },
        select: { id: true, slug: true, name: true, startDate: true, endDate: true, venue: true },
      }),
    ]);
    if (!recipientUser || !fullEvent) return;
    await fireWebhook("meeting.requested", {
      eventId: fullEvent.id,
      meetingId: meeting.id,
      requesterEmail: session.email,
      recipientEmail: recipientUser.email,
      proposedStart: start.toISOString(),
    });
    await triggerAutomation(
      "meeting.requested",
      fullEvent.id,
      recipientUser.email,
      {
        ...eventVars(fullEvent),
        attendee_name: recipientUser.name,
        requester_name: session.name,
      },
    );
  })().catch(() => {});

  return NextResponse.json({ meeting });
}
