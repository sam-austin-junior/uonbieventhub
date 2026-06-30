import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fireWebhook } from "@/lib/webhooks";
import { triggerAutomation, eventVars } from "@/lib/automations";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { meetingId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const meeting = await prisma.meetingRequest.findUnique({
    where: { id: params.meetingId },
  });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Accept/decline must be the recipient; cancel can be either side.
  if (parsed.data.action === "accept" || parsed.data.action === "decline") {
    if (meeting.recipientId !== session.userId) {
      return NextResponse.json(
        { error: "Only the recipient can respond" },
        { status: 403 },
      );
    }
    if (meeting.status !== "pending") {
      return NextResponse.json(
        { error: `Already ${meeting.status}` },
        { status: 400 },
      );
    }
    const status = parsed.data.action === "accept" ? "accepted" : "declined";
    await prisma.meetingRequest.update({
      where: { id: meeting.id },
      data: { status, respondedAt: new Date() },
    });

    (async () => {
      const [requester, recipient, fullEvent] = await Promise.all([
        prisma.user.findUnique({
          where: { id: meeting.requesterId },
          select: { email: true, name: true },
        }),
        prisma.user.findUnique({
          where: { id: meeting.recipientId },
          select: { email: true, name: true },
        }),
        prisma.event.findUnique({
          where: { id: meeting.eventId },
          select: { id: true, slug: true, name: true, startDate: true, endDate: true, venue: true },
        }),
      ]);
      if (!fullEvent || !requester || !recipient) return;
      await fireWebhook("meeting.responded", {
        eventId: fullEvent.id,
        meetingId: meeting.id,
        status,
        requesterEmail: requester.email,
        recipientEmail: recipient.email,
      });
      if (status === "accepted") {
        await triggerAutomation(
          "meeting.accepted",
          fullEvent.id,
          requester.email,
          {
            ...eventVars(fullEvent),
            attendee_name: requester.name,
            recipient_name: recipient.name,
          },
        );
      }
    })().catch(() => {});

    return NextResponse.json({ ok: true, status });
  }

  // cancel
  if (
    meeting.requesterId !== session.userId &&
    meeting.recipientId !== session.userId
  ) {
    return NextResponse.json({ error: "Not your meeting" }, { status: 403 });
  }
  await prisma.meetingRequest.update({
    where: { id: meeting.id },
    data: { status: "cancelled", respondedAt: new Date() },
  });
  return NextResponse.json({ ok: true, status: "cancelled" });
}
