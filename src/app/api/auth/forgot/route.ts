import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const lower = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: lower } });

  // Always succeed (don't leak whether the email exists)
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }
  if (user.role === "ATTENDEE") {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiresAt: expires },
  });

  const link = `${appUrl}/reset?token=${token}`;
  if (await isEmailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your UoN Event Hub password",
        html: emailTemplate({
          heading: "Reset your password",
          body: `<p>Hi ${escape(user.name)},</p><p>Click the link below to choose a new password. The link expires in 1 hour. If you didn't request this, you can safely ignore the email.</p>`,
          cta: { label: "Choose a new password", href: link },
          footer: `Or paste this link in your browser:<br><a href="${link}" style="color:#174776;word-break:break-all;">${link}</a>`,
        }),
      });
    } catch {
      // swallow — don't reveal infra state
    }
  }

  return NextResponse.json({ ok: true });
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
