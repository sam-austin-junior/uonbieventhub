import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.receiverId) return NextResponse.json({ error: "Missing receiverId" }, { status: 400 });
  if (body.receiverId === session.userId) {
    return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
  }
  const conn = await prisma.connection.upsert({
    where: {
      requesterId_receiverId: { requesterId: session.userId, receiverId: body.receiverId },
    },
    create: { requesterId: session.userId, receiverId: body.receiverId },
    update: {},
  });
  return NextResponse.json({ connection: conn });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id || !["ACCEPTED", "DECLINED"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const existing = await prisma.connection.findUnique({ where: { id: body.id } });
  if (!existing || existing.receiverId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.connection.update({
    where: { id: body.id },
    data: { status: body.status, respondedAt: new Date() },
  });
  return NextResponse.json({ connection: updated });
}
