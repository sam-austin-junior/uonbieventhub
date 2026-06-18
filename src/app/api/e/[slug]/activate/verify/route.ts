import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8).optional(),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, code, password } = parsed.data;
  const lower = email.toLowerCase();

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (!user || user.pendingCode !== code) {
    return NextResponse.json({ error: "That code doesn't match. Try again." }, { status: 401 });
  }
  if (!user.pendingCodeExpiresAt || user.pendingCodeExpiresAt < new Date()) {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 401 });
  }
  if (!user.passwordHash && !password) {
    return NextResponse.json({ error: "Pick a password to finish setting up your account." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingCode: null,
      pendingCodeExpiresAt: null,
      activatedAt: user.activatedAt ?? new Date(),
      passwordHash: password ? await hashPassword(password) : user.passwordHash,
    },
  });

  await prisma.registration.upsert({
    where: { eventId_userId: { eventId: event.id, userId: updated.id } },
    create: { eventId: event.id, userId: updated.id },
    update: {},
  });

  await prisma.attendeeInvite.updateMany({
    where: { eventId: event.id, email: lower },
    data: { activatedAt: new Date() },
  });

  const token = await createSessionToken({
    userId: updated.id,
    email: updated.email,
    role: updated.role,
    name: updated.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
