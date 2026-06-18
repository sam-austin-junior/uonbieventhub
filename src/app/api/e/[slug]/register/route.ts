import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { firstName, lastName, email, password } = parsed.data;
  const lower = email.toLowerCase();

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.attendeeMode !== "OPEN") {
    return NextResponse.json({ error: "This event is invite-only." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Use the activation flow above." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email: lower,
      name: `${firstName} ${lastName}`,
      role: "ATTENDEE",
      passwordHash: await hashPassword(password),
      activatedAt: new Date(),
    },
  });

  await prisma.registration.create({
    data: { eventId: event.id, userId: user.id },
  });

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
