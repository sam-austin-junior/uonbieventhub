import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateSecret, makeQrDataUrl } from "@/lib/totp";

/**
 * Starts a TOTP enrolment: generates a secret, stores it on the user
 * (but does NOT enable 2FA until they verify a code via /enable).
 *
 * Refuses to run if 2FA is already enabled — otherwise the new secret
 * silently orphans the user's authenticator app entry and every code
 * looks "wrong". Users must explicitly disable first to re-enrol.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "ATTENDEE") {
    return NextResponse.json({ error: "2FA is for staff accounts only" }, { status: 403 });
  }

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { totpEnabledAt: true },
  });
  if (current?.totpEnabledAt) {
    return NextResponse.json(
      {
        error:
          "2FA is already enabled on this account. Turn it off first if you want to re-enrol with a different device.",
      },
      { status: 409 },
    );
  }

  const secret = generateSecret();
  await prisma.user.update({
    where: { id: session.userId },
    data: { totpSecret: secret, totpEnabledAt: null },
  });

  const qr = await makeQrDataUrl(session.email, secret);
  return NextResponse.json({ secret, qr });
}
