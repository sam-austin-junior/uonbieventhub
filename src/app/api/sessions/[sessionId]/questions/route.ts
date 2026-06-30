import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().min(3).max(500),
});

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const s = await prisma.session.findUnique({
    where: { id: params.sessionId },
    select: { id: true, eventId: true },
  });
  if (!s) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: s.eventId, userId: session.userId } },
    select: { id: true },
  });
  if (!reg) {
    return NextResponse.json(
      { error: "You must be registered for this event to ask a question" },
      { status: 403 },
    );
  }

  const q = await prisma.question.create({
    data: {
      sessionId: s.id,
      eventId: s.eventId,
      userId: session.userId,
      text: parsed.data.text.trim(),
    },
  });
  return NextResponse.json({ question: { id: q.id } });
}
