import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fireWebhook } from "@/lib/webhooks";

export const runtime = "nodejs";

const schema = z.object({
  exhibitorId: z.string(),
  qrToken: z.string(),
  notes: z.string().max(500).optional(),
});

/**
 * Capture a lead. Exhibitor staff scans the attendee's QR badge; we
 * look up the Registration by qrToken, confirm the scanner is a member
 * of the exhibitor on that event, and upsert a Lead row.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Confirm scanner is on the exhibitor staff list.
  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: parsed.data.exhibitorId },
    include: {
      members: { where: { userId: session.userId }, select: { id: true } },
    },
  });
  if (!exhibitor) {
    return NextResponse.json({ error: "Exhibitor not found" }, { status: 404 });
  }
  if (exhibitor.members.length === 0) {
    return NextResponse.json(
      { error: "You're not on the staff list for this exhibitor" },
      { status: 403 },
    );
  }

  const reg = await prisma.registration.findUnique({
    where: { qrToken: parsed.data.qrToken },
    include: {
      user: { select: { id: true, name: true, email: true, jobTitle: true, organization: true } },
    },
  });
  if (!reg) {
    return NextResponse.json(
      { error: "QR code not recognised. Ask the attendee to refresh their badge." },
      { status: 404 },
    );
  }
  if (reg.eventId !== exhibitor.eventId) {
    return NextResponse.json(
      { error: "That attendee is registered for a different event" },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.upsert({
    where: {
      exhibitorId_userId: {
        exhibitorId: exhibitor.id,
        userId: reg.user.id,
      },
    },
    create: {
      exhibitorId: exhibitor.id,
      userId: reg.user.id,
      capturedById: session.userId,
      notes: parsed.data.notes ?? null,
    },
    update: {
      notes: parsed.data.notes
        ? parsed.data.notes
        : undefined,
    },
  });

  fireWebhook("lead.captured", {
    eventId: exhibitor.eventId,
    exhibitorId: exhibitor.id,
    exhibitorName: exhibitor.name,
    attendeeEmail: reg.user.email,
    attendeeName: reg.user.name,
    capturedByEmail: session.email,
    notes: parsed.data.notes ?? null,
  }).catch(() => {});

  return NextResponse.json({
    lead: {
      id: lead.id,
      attendee: reg.user,
      capturedAt: lead.createdAt,
    },
  });
}
