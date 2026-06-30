import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  question: z.string().min(2).optional(),
  isOpen: z.boolean().optional(),
  resultsVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function loadPoll(pollId: string) {
  return prisma.poll.findUnique({
    where: { id: pollId },
    include: { event: { select: { id: true } } },
  });
}

export async function PATCH(req: Request, { params }: { params: { pollId: string } }) {
  const session = await requireStaff();
  const poll = await loadPoll(params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  await assertOwnsEvent(session, poll.eventId);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.isOpen === false && poll.isOpen) {
    data.closedAt = new Date();
  } else if (parsed.data.isOpen === true && !poll.isOpen) {
    data.closedAt = null;
  }

  const updated = await prisma.poll.update({
    where: { id: poll.id },
    data,
  });

  await writeAudit({
    session,
    action: "poll.update",
    targetType: "Poll",
    targetId: poll.id,
    summary: `Updated poll on event ${poll.eventId}`,
  });

  return NextResponse.json({ poll: updated });
}

export async function DELETE(_req: Request, { params }: { params: { pollId: string } }) {
  const session = await requireStaff();
  const poll = await loadPoll(params.pollId);
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  await assertOwnsEvent(session, poll.eventId);

  await prisma.poll.delete({ where: { id: poll.id } });
  await writeAudit({
    session,
    action: "poll.delete",
    targetType: "Poll",
    targetId: poll.id,
    summary: `Deleted poll on event ${poll.eventId}`,
  });
  return NextResponse.json({ ok: true });
}
