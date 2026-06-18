import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.body?.trim()) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const reply = await prisma.discussionReply.create({
    data: {
      discussionId: params.id,
      authorId: session.userId,
      body: body.body.trim(),
    },
  });
  return NextResponse.json({ reply });
}
