import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  newEmail: z.string().email("Enter a valid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const newEmail = parsed.data.newEmail.toLowerCase().trim();

  if (newEmail === session.email.toLowerCase()) {
    return NextResponse.json(
      { error: "New email is the same as your current one" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "This account doesn't have a password set" },
      { status: 400 },
    );
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 },
    );
  }

  const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
  if (conflict && conflict.id !== user.id) {
    return NextResponse.json(
      { error: "Another account already uses that email" },
      { status: 409 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  await writeAudit({
    session,
    action: "security.email.change",
    targetType: "User",
    targetId: user.id,
    summary: `Changed account email from ${user.email} to ${newEmail}`,
  });

  return NextResponse.json({ ok: true, email: newEmail });
}
