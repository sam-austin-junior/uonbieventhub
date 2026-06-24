import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplate, isEmailConfigured } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

function generateCode() {
  return Array.from(crypto.randomBytes(3))
    .map((b) => b % 10)
    .join("")
    .padEnd(6, "0")
    .slice(0, 6);
}

const CODE_TTL_MS = 15 * 60 * 1000;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all the fields." }, { status: 400 });
  }
  const { firstName, lastName, email } = parsed.data;
  const lower = email.toLowerCase();

  // Throttle: 5 code requests per (ip, email) per 10 minutes.
  const ip = clientIp(req);
  const limited = rateLimit(`activate:${ip}:${lower}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${limited.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (event.attendeeMode === "INVITE_ONLY") {
    const invite = await prisma.attendeeInvite.findUnique({
      where: { eventId_email: { eventId: event.id, email: lower } },
    });
    if (!invite) {
      return NextResponse.json(
        {
          error:
            "We don't have an invitation for that email at this event. Check with the organisers if you think this is a mistake.",
        },
        { status: 404 }
      );
    }
    const nameMatches =
      invite.firstName.trim().toLowerCase() === firstName.trim().toLowerCase() &&
      invite.lastName.trim().toLowerCase() === lastName.trim().toLowerCase();
    if (!nameMatches) {
      return NextResponse.json(
        { error: "The name doesn't match our records for that email." },
        { status: 400 }
      );
    }
  }

  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MS);

  const existingUser = await prisma.user.findUnique({ where: { email: lower } });
  let needsPassword = false;
  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { pendingCode: code, pendingCodeExpiresAt: expires },
    });
    needsPassword = !existingUser.passwordHash;
  } else {
    await prisma.user.create({
      data: {
        email: lower,
        name: `${firstName} ${lastName}`,
        role: "ATTENDEE",
        pendingCode: code,
        pendingCodeExpiresAt: expires,
      },
    });
    needsPassword = true;
  }

  const emailReady = await isEmailConfigured();
  if (emailReady) {
    try {
      await sendEmail({
        to: lower,
        subject: `Your ${event.name} verification code`,
        html: emailTemplate({
          heading: `Welcome to ${event.name}`,
          body: `<p>Hi ${escape(firstName)},</p><p>Use this 6-digit code on the activation page to access the event:</p><p style="font-size:32px;font-family:monospace;letter-spacing:8px;color:#174776;font-weight:700;">${code}</p><p style="font-size:13px;color:#7a8aa3;">This code expires in 15 minutes.</p>`,
          footer: `If you didn't request this, you can safely ignore the email.`,
        }),
      });
      await prisma.attendeeInvite.updateMany({
        where: { eventId: event.id, email: lower },
        data: { emailSentAt: new Date() },
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: `Email send failed: ${e?.message ?? "unknown error"}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, needsPassword });
  }

  return NextResponse.json({ ok: true, needsPassword, devCode: code });
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
