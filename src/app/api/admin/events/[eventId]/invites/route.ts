import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";

const schema = z.object({
  invitees: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
    })
  ),
  sendEmail: z.boolean().optional().default(true),
});

async function assertStaff() {
  const s = await getSession();
  if (!s || (s.role !== "ADMIN" && s.role !== "ORGANIZER" && s.role !== "SUPERADMIN")) return null;
  return s;
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let added = 0, skipped = 0, emailed = 0, emailFailed = 0;
  const canEmail = parsed.data.sendEmail && (await isEmailConfigured());
  const eventUrl = `${appUrl}/e/${event.slug}/login`;

  for (const inv of parsed.data.invitees) {
    const lower = inv.email.toLowerCase();
    const existing = await prisma.attendeeInvite.findUnique({
      where: { eventId_email: { eventId: event.id, email: lower } },
    });
    if (existing) { skipped++; continue; }
    const created = await prisma.attendeeInvite.create({
      data: {
        eventId: event.id,
        firstName: inv.firstName,
        lastName: inv.lastName,
        email: lower,
      },
    });
    added++;

    if (canEmail) {
      try {
        await sendInviteEmail({ event, invite: created, eventUrl });
        await prisma.attendeeInvite.update({
          where: { id: created.id },
          data: { emailSentAt: new Date() },
        });
        emailed++;
      } catch {
        emailFailed++;
      }
    }
  }

  return NextResponse.json({ added, skipped, emailed, emailFailed });
}

export async function DELETE(req: Request, { params }: { params: { eventId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.attendeeInvite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

async function sendInviteEmail({
  event,
  invite,
  eventUrl,
}: {
  event: { name: string };
  invite: { firstName: string; email: string };
  eventUrl: string;
}) {
  await sendEmail({
    to: invite.email,
    subject: `You're invited to ${event.name}`,
    html: emailTemplate({
      heading: `You're invited to ${event.name}`,
      body: `
        <p>Hi ${escapeHtml(invite.firstName)},</p>
        <p>You've been invited to attend <strong>${escapeHtml(event.name)}</strong>. To activate your account:</p>
        <ol>
          <li>Open the event link below.</li>
          <li>Enter your first name, last name and this email address (${escapeHtml(invite.email)}).</li>
          <li>Check your inbox for a 6-digit verification code and enter it.</li>
        </ol>
      `,
      cta: { label: "Activate my account", href: eventUrl },
      footer: `If the button doesn't work, paste this link in your browser:<br><a href="${eventUrl}" style="color:#174776;word-break:break-all;">${eventUrl}</a>`,
    }),
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
