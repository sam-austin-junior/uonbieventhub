import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: { eventId: string; inviteId: string } }
) {
  const s = await getSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "ORGANIZER" && s.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const invite = await prisma.attendeeInvite.findUnique({
    where: { id: params.inviteId },
    include: { event: true },
  });
  if (!invite || invite.eventId !== params.eventId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const eventUrl = `${appUrl}/e/${invite.event.slug}/login`;
  try {
    await sendEmail({
      to: invite.email,
      subject: `Reminder: you're invited to ${invite.event.name}`,
      html: emailTemplate({
        heading: `Reminder: you're invited to ${invite.event.name}`,
        body: `<p>Hi ${escapeHtml(invite.firstName)},</p><p>Just a reminder — activate your account to access <strong>${escapeHtml(invite.event.name)}</strong>.</p><p>Use the email <strong>${escapeHtml(invite.email)}</strong> when prompted.</p>`,
        cta: { label: "Activate my account", href: eventUrl },
      }),
    });
    await prisma.attendeeInvite.update({
      where: { id: invite.id },
      data: { emailSentAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Send failed" }, { status: 502 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
