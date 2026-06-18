import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.sessionRegistration.findUnique({
    where: { sessionId_userId: { sessionId: params.sessionId, userId: session.userId } },
  });
  if (existing) {
    await prisma.sessionRegistration.delete({ where: { id: existing.id } });
    return NextResponse.json({ registered: false });
  }
  await prisma.sessionRegistration.create({
    data: { sessionId: params.sessionId, userId: session.userId },
  });
  return NextResponse.json({ registered: true });
}
