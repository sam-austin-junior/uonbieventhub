import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.eventId || !body?.title?.trim() || !body?.body?.trim()) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = await prisma.discussion.create({
    data: {
      eventId: body.eventId,
      authorId: session.userId,
      title: body.title.trim(),
      body: body.body.trim(),
    },
  });
  return NextResponse.json({ discussion: d });
}
