import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  question: z.string().min(2),
  allowMultiple: z.boolean().default(false),
  options: z.array(z.string().min(1)).min(2).max(10),
});

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  const session = await requireStaff();

  const sessionRow = await prisma.session.findUnique({
    where: { id: params.sessionId },
    select: { id: true, eventId: true },
  });
  if (!sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  await assertOwnsEvent(session, sessionRow.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const count = await prisma.poll.count({ where: { sessionId: sessionRow.id } });

  const poll = await prisma.poll.create({
    data: {
      sessionId: sessionRow.id,
      eventId: sessionRow.eventId,
      question: parsed.data.question,
      allowMultiple: parsed.data.allowMultiple,
      sortOrder: count * 10,
      options: {
        create: parsed.data.options.map((label, idx) => ({
          label,
          sortOrder: idx * 10,
        })),
      },
    },
    include: { options: true },
  });

  await writeAudit({
    session,
    action: "poll.create",
    targetType: "Poll",
    targetId: poll.id,
    summary: `Created poll on session ${sessionRow.id}`,
  });

  return NextResponse.json({ poll });
}
