import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { speakerId: string } },
) {
  const session = await requireStaff();
  const speaker = await prisma.speaker.findUnique({
    where: { id: params.speakerId },
    include: { event: { select: { id: true, slug: true, name: true } } },
  });
  if (!speaker) {
    return NextResponse.json({ error: "Speaker not found" }, { status: 404 });
  }
  await assertOwnsEvent(session, speaker.eventId);

  if (!speaker.email) {
    return NextResponse.json(
      { error: "Set the speaker's email before sending an invite." },
      { status: 400 },
    );
  }
  if (!(await isEmailConfigured())) {
    return NextResponse.json(
      { error: "Email is not configured on this platform." },
      { status: 503 },
    );
  }

  const portalUrl = `${appUrl}/speaker`;
  const loginUrl = `${appUrl}/login`;
  await sendEmail({
    to: speaker.email,
    subject: `You're a speaker at ${speaker.event.name} — manage your profile`,
    html: emailTemplate({
      heading: `You're speaking at ${speaker.event.name}`,
      preheader: `Edit your bio, photo and upload slides from the speaker portal.`,
      body: `<p>Hi ${escapeHtml(speaker.name)},</p>
        <p>You've been added as a speaker at <strong>${escapeHtml(speaker.event.name)}</strong>. You can manage your profile and upload session materials from the speaker portal.</p>
        <p>If you don't have an account yet, sign in or sign up with this exact email (${escapeHtml(speaker.email)}) and your speaker profile will link automatically the first time you visit the portal.</p>`,
      cta: { label: "Open the speaker portal", href: portalUrl },
      footer: `Don't have an account? <a href="${loginUrl}" style="color:#174776;">Sign in or sign up</a> with ${escapeHtml(speaker.email)}.`,
    }),
  });

  await writeAudit({
    session,
    action: "speaker.invite",
    targetType: "Speaker",
    targetId: speaker.id,
    summary: `Sent speaker-portal invite to ${speaker.email}`,
  });

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
