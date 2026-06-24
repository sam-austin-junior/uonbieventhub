import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyToken } from "@/lib/totp";
import { writeAudit } from "@/lib/audit";

const schema = z.object({ token: z.string().length(6) });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "Start setup first" }, { status: 400 });
  }
  if (!verifyToken(parsed.data.token, user.totpSecret)) {
    return NextResponse.json({ error: "That code doesn't match. Try again." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabledAt: new Date() },
  });
  await writeAudit({
    session,
    action: "security.totp.enable",
    targetType: "user",
    targetId: user.id,
    summary: `Enabled 2FA for ${user.email}`,
  });
  return NextResponse.json({ ok: true });
}
