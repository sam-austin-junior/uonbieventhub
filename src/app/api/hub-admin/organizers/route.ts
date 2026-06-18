import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  organization: z.string().optional().nullable(),
  validityDays: z.number().int().min(1).max(3650).nullable().optional(),
  sendCredentialsEmail: z.boolean().optional().default(true),
});

async function assertHubAdmin() {
  const s = await getSession();
  if (!s || s.role !== "SUPERADMIN") return null;
  return s;
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!#$%";
  return Array.from(crypto.randomBytes(14))
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(req: Request) {
  if (!(await assertHubAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, email, organization, validityDays, sendCredentialsEmail } = parsed.data;
  const lower = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const expiresAt = validityDays
    ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
    : null;

  const password = randomPassword();
  const user = await prisma.user.create({
    data: {
      email: lower,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ORGANIZER",
      organization: organization || null,
      activatedAt: new Date(),
      expiresAt,
    },
  });

  let emailSent = false;
  if (sendCredentialsEmail && (await isEmailConfigured())) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Your UoN Event Hub organizer account",
        html: emailTemplate({
          heading: "Welcome to UoN Event Hub",
          body: `
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>Your organizer account is ready. Sign in with the credentials below — you'll be able to start creating and managing events right away.</p>
            <ul>
              <li><strong>Email:</strong> ${escapeHtml(user.email)}</li>
              <li><strong>Temporary password:</strong> <code>${escapeHtml(password)}</code></li>
              ${expiresAt ? `<li><strong>Access valid until:</strong> ${expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</li>` : ""}
            </ul>
            <p>For security, please sign in and change your password as soon as you can.</p>
          `,
          cta: { label: "Sign in", href: `${appUrl}/login` },
        }),
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return NextResponse.json({
    organizer: user,
    credentials: { name: user.name, email: user.email, password, emailSent },
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
