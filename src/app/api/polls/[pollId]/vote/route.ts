import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  optionIds: z.array(z.string()).min(1),
});

export async function POST(req: Request, { params }: { params: { pollId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.pollId },
    include: { options: { select: { id: true } } },
  });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  if (!poll.isOpen) {
    return NextResponse.json({ error: "Voting is closed" }, { status: 400 });
  }

  // Confirm attendee is registered for the event hosting this poll.
  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: poll.eventId, userId: session.userId } },
    select: { id: true },
  });
  if (!reg) {
    return NextResponse.json(
      { error: "You must be registered for this event to vote" },
      { status: 403 },
    );
  }

  const validIds = new Set(poll.options.map((o) => o.id));
  const optionIds = parsed.data.optionIds.filter((id) => validIds.has(id));
  if (optionIds.length === 0) {
    return NextResponse.json({ error: "No valid options selected" }, { status: 400 });
  }
  if (!poll.allowMultiple && optionIds.length > 1) {
    return NextResponse.json(
      { error: "This poll only allows one choice" },
      { status: 400 },
    );
  }

  // Replace the user's existing vote(s) atomically so changing mind works.
  await prisma.$transaction([
    prisma.pollVote.deleteMany({
      where: { pollId: poll.id, userId: session.userId },
    }),
    prisma.pollVote.createMany({
      data: optionIds.map((optionId) => ({
        pollId: poll.id,
        optionId,
        userId: session.userId,
      })),
      skipDuplicates: true,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
