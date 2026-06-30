import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  isOwner: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { exhibitorId: string } },
) {
  const session = await requireStaff();
  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: params.exhibitorId },
    include: { event: { select: { id: true, name: true } } },
  });
  if (!exhibitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await assertOwnsEvent(session, exhibitor.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      {
        error:
          "No account exists for that email. Ask the staff member to sign up first, then try again.",
      },
      { status: 404 },
    );
  }

  const member = await prisma.exhibitorMember.upsert({
    where: {
      exhibitorId_userId: { exhibitorId: exhibitor.id, userId: user.id },
    },
    create: {
      exhibitorId: exhibitor.id,
      userId: user.id,
      isOwner: parsed.data.isOwner ?? false,
    },
    update: { isOwner: parsed.data.isOwner ?? undefined },
  });

  if (await isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: `You're on the ${exhibitor.name} booth team at ${exhibitor.event.name}`,
        html: emailTemplate({
          heading: `Booth staff access`,
          body: `<p>You've been added to the staff team for <strong>${exhibitor.name}</strong> at ${exhibitor.event.name}.</p>
            <p>From the exhibitor portal you can scan attendee badges to capture leads and export the list as CSV.</p>`,
          cta: { label: "Open the exhibitor portal", href: `${appUrl}/exhibitor` },
        }),
      });
    } catch {
      // Soft-fail email; member is still added.
    }
  }

  await writeAudit({
    session,
    action: "exhibitor.member.add",
    targetType: "ExhibitorMember",
    targetId: member.id,
    summary: `Added ${email} to ${exhibitor.name} staff`,
  });

  return NextResponse.json({ ok: true, memberId: member.id });
}

export async function DELETE(
  req: Request,
  { params }: { params: { exhibitorId: string } },
) {
  const session = await requireStaff();
  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: params.exhibitorId },
    select: { eventId: true },
  });
  if (!exhibitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await assertOwnsEvent(session, exhibitor.eventId);

  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  await prisma.exhibitorMember
    .delete({ where: { id: memberId } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
