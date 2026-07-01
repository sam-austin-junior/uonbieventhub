import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * SUPERADMIN-only account recovery: wipes both totpSecret + totpEnabledAt.
 * Use when a staff member is locked out because their authenticator app
 * was reset, their phone was lost, or a mis-enrolment orphaned the secret.
 * User can then sign in with just their password and re-enrol from
 * /admin/security if they want to.
 */
export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hub admin only" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, email: true, totpEnabledAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabledAt: null },
  });

  await writeAudit({
    session,
    action: "security.totp.reset",
    targetType: "User",
    targetId: user.id,
    summary: `Reset 2FA for ${user.email}`,
    metadata: { wasEnabled: !!user.totpEnabledAt },
  });

  return NextResponse.json({ ok: true });
}
