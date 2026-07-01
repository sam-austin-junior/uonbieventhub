import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    // Explicit select — resilient to Prisma-schema-vs-DB drift on User.
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: parsed.data.token },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        suspendedAt: true,
        passwordResetExpiresAt: true,
      },
    });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 401 },
      );
    }
    if (user.suspendedAt) {
      return NextResponse.json(
        { error: "This account has been suspended. Contact the hub admin." },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    await setSessionCookie(sessionToken);

    const redirectTo =
      user.role === "SUPERADMIN"
        ? "/hub-admin"
        : user.role === "ORGANIZER" || user.role === "ADMIN"
        ? "/admin"
        : "/";

    return NextResponse.json({ ok: true, redirectTo });
  } catch (err) {
    console.error("[api/auth/reset] crashed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Reset failed on the server: ${message.slice(0, 300)}` },
      { status: 500 },
    );
  }
}
