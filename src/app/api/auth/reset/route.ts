import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: parsed.data.token },
  });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 401 }
    );
  }
  if (user.suspendedAt) {
    return NextResponse.json(
      { error: "This account has been suspended. Contact the hub admin." },
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  const sessionToken = await createSessionToken({
    userId: updated.id,
    email: updated.email,
    role: updated.role,
    name: updated.name,
  });
  await setSessionCookie(sessionToken);

  const redirectTo =
    updated.role === "SUPERADMIN"
      ? "/hub-admin"
      : updated.role === "ORGANIZER" || updated.role === "ADMIN"
      ? "/admin"
      : "/";

  return NextResponse.json({ ok: true, redirectTo });
}
