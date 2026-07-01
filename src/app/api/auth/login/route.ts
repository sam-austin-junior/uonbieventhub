import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  createTotpChallengeCookie,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;
    // Explicit select so this route stays healthy even if the User schema
    // grows fields the current running deploy hasn't been rebuilt against.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        suspendedAt: true,
        expiresAt: true,
        totpEnabledAt: true,
        totpSecret: true,
      },
    });
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.suspendedAt) {
      return NextResponse.json(
        { error: "This account has been suspended. Contact the hub admin." },
        { status: 403 },
      );
    }
    if (user.expiresAt && user.expiresAt < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { suspendedAt: new Date() },
      });
      return NextResponse.json(
        { error: "Your access window has ended. Contact the hub admin to renew." },
        { status: 403 },
      );
    }
    if (user.totpEnabledAt && user.totpSecret) {
      await createTotpChallengeCookie({ userId: user.id, email: user.email });
      return NextResponse.json({ needsTotp: true });
    }
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    await setSessionCookie(token);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[api/auth/login] crashed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: `Sign in failed on the server: ${message.slice(0, 300)}`,
      },
      { status: 500 },
    );
  }
}
