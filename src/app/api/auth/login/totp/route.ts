import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearTotpChallengeCookie,
  createSessionToken,
  readTotpChallengeCookie,
  setSessionCookie,
} from "@/lib/auth";
import { verifyToken } from "@/lib/totp";

const schema = z.object({
  code: z.string().min(6).max(10),
});

export async function POST(req: Request) {
  const challenge = await readTotpChallengeCookie();
  if (!challenge) {
    return NextResponse.json(
      { error: "Your verification step expired. Sign in again." },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
  if (!user || !user.totpSecret) {
    await clearTotpChallengeCookie();
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const ok = verifyToken(parsed.data.code.replace(/\s+/g, ""), user.totpSecret);
  if (!ok) {
    return NextResponse.json({ error: "Wrong code. Try again." }, { status: 401 });
  }

  await clearTotpChallengeCookie();
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
}
