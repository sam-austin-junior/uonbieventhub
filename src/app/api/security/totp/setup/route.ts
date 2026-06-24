import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateSecret, makeQrDataUrl } from "@/lib/totp";

/**
 * Starts a TOTP enrolment: generates a secret, stores it on the user
 * (but does NOT enable 2FA until they verify a code via /enable).
 */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "ATTENDEE") {
    return NextResponse.json({ error: "2FA is for staff accounts only" }, { status: 403 });
  }

  const secret = generateSecret();
  await prisma.user.update({
    where: { id: session.userId },
    data: { totpSecret: secret, totpEnabledAt: null },
  });

  const qr = await makeQrDataUrl(session.email, secret);
  return NextResponse.json({ secret, qr });
}
