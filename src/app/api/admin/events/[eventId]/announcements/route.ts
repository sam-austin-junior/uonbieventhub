import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";

const schema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(8000),
  audience: z.enum(["ALL_ATTENDEES", "CHECKED_IN", "SPEAKERS", "EXHIBITORS"]),
  sendEmail: z.boolean().optional().default(true),
  sendInApp: z.boolean().optional().default(true),
});

async function assertStaff() {
  const s = await getSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "ORGANIZER" && s.role !== "SUPERADMIN")) return null;
  return s;
}

async function resolveRecipients(eventId: string, audience: string) {
  if (audience === "SPEAKERS") {
    const speakers = await prisma.speaker.findMany({
      where: { eventId, user: { isNot: null } },
      include: { user: true },
    });
    return speakers.map((s) => s.user!).filter(Boolean);
  }
  if (audience === "EXHIBITORS") {
    const exhibitors = await prisma.exhibitor.findMany({
      where: { eventId, email: { not: null } },
    });
    return exhibitors.map((e) => ({
      id: `exhibitor-${e.id}`,
      email: e.email!,
      name: e.name,
    }));
  }
  const where: any = { eventId };
  if (audience === "CHECKED_IN") where.checkedInAt = { not: null };
  const regs = await prisma.registration.findMany({
    where,
    include: { user: true },
  });
  return regs.map((r) => r.user);
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await assertStaff();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { title, body, audience, sendEmail: doEmail, sendInApp } = parsed.data;

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { id: true, name: true, slug: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const recipients = await resolveRecipients(event.id, audience);
  const link = `${appUrl}/e/${event.slug}`;

  let emailsSent = 0;
  let emailsFailed = 0;
  const canEmail = doEmail && (await isEmailConfigured());

  if (canEmail) {
    for (const r of recipients) {
      if (!r?.email) continue;
      try {
        await sendEmail({
          to: r.email,
          subject: `[${event.name}] ${title}`,
          html: emailTemplate({
            preheader: title,
            heading: title,
            body: `<div style="white-space:pre-line;">${escapeHtml(body)}</div>`,
            cta: { label: "Open the event hub", href: link },
            footer: `An announcement from ${escapeHtml(event.name)}.`,
          }),
        });
        emailsSent++;
      } catch {
        emailsFailed++;
      }
    }
  }

  if (sendInApp) {
    const userIds = recipients
      .map((r) => (r && "id" in r ? r.id : null))
      .filter((id): id is string => !!id && !id.startsWith("exhibitor-"));
    if (userIds.length > 0) {
      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          eventId: event.id,
          type: "announcement",
          title,
          body,
          link: `/e/${event.slug}`,
        })),
      });
    }
  }

  const announcement = await prisma.announcement.create({
    data: {
      eventId: event.id,
      authorId: session.userId,
      title,
      body,
      audience,
      sendEmail: doEmail,
      sendInApp,
      sentAt: new Date(),
      recipientCount: recipients.length,
      emailsSent,
      emailsFailed,
    },
  });

  return NextResponse.json({
    announcement,
    summary: {
      recipientCount: recipients.length,
      emailsSent,
      emailsFailed,
      emailSkipped: !canEmail && doEmail,
    },
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
