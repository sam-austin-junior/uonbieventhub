import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/** Toggle: POST = add upvote, DELETE = remove. */
export async function POST(_req: Request, { params }: { params: { questionId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const q = await prisma.question.findUnique({
    where: { id: params.questionId },
    select: { id: true, eventId: true, userId: true },
  });
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (q.userId === session.userId) {
    return NextResponse.json({ error: "You can't upvote your own question" }, { status: 400 });
  }

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: q.eventId, userId: session.userId } },
    select: { id: true },
  });
  if (!reg) {
    return NextResponse.json(
      { error: "You must be registered for this event to upvote" },
      { status: 403 },
    );
  }

  await prisma.questionUpvote.upsert({
    where: { questionId_userId: { questionId: q.id, userId: session.userId } },
    create: { questionId: q.id, userId: session.userId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { questionId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  await prisma.questionUpvote
    .delete({
      where: {
        questionId_userId: {
          questionId: params.questionId,
          userId: session.userId,
        },
      },
    })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}
