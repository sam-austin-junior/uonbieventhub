import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.receiverId || !body?.body?.trim()) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const msg = await prisma.message.create({
    data: {
      senderId: session.userId,
      receiverId: body.receiverId,
      body: body.body.trim(),
    },
  });
  return NextResponse.json({ message: msg });
}
