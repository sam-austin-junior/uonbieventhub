import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!#$%";
  return Array.from(crypto.randomBytes(14))
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s || s.role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const password = randomPassword();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  let emailSent = false;
  if (await isEmailConfigured()) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Your UoN Event Hub password has been reset",
        html: emailTemplate({
          heading: "Password reset",
          body: `<p>The hub admin reset your password.</p><p><strong>New password:</strong> <code>${password}</code></p><p>Please sign in and change it.</p>`,
          cta: { label: "Sign in", href: `${appUrl}/login` },
        }),
      });
      emailSent = true;
    } catch {}
  }

  return NextResponse.json({
    credentials: { name: user.name, email: user.email, password, emailSent },
  });
}
