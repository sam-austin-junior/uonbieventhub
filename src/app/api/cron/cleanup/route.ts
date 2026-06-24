import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Daily housekeeping cron. Scheduled via vercel.json.
 *
 * - Wipes expired 6-digit activation codes (pendingCode/pendingCodeExpiresAt).
 * - Wipes expired password-reset tokens.
 * - Auto-suspends organizers whose expiresAt has passed.
 *
 * Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>. We accept
 * that header OR a ?secret= query for manual invocation during setup.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const headerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken = new URL(req.url).searchParams.get("secret");
  if (headerToken !== expected && queryToken !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const [expiredCodes, expiredResets, expiredOrganizers] = await Promise.all([
    prisma.user.updateMany({
      where: {
        pendingCode: { not: null },
        pendingCodeExpiresAt: { lt: now },
      },
      data: { pendingCode: null, pendingCodeExpiresAt: null },
    }),
    prisma.user.updateMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpiresAt: { lt: now },
      },
      data: { passwordResetToken: null, passwordResetExpiresAt: null },
    }),
    prisma.user.updateMany({
      where: {
        role: "ORGANIZER",
        suspendedAt: null,
        expiresAt: { not: null, lt: now },
      },
      data: { suspendedAt: now },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    cleared: {
      expiredCodes: expiredCodes.count,
      expiredResets: expiredResets.count,
      suspendedExpiredOrganizers: expiredOrganizers.count,
    },
  });
}
