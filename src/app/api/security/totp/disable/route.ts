import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.userId },
    data: { totpSecret: null, totpEnabledAt: null },
  });
  await writeAudit({
    session,
    action: "security.totp.disable",
    targetType: "user",
    targetId: session.userId,
    summary: `Disabled 2FA for ${session.email}`,
  });
  return NextResponse.json({ ok: true });
}
