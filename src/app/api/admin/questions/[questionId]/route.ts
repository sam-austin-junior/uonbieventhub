import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";

export const runtime = "nodejs";

const patchSchema = z.object({
  answered: z.boolean().optional(),
  hidden: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { questionId: string } },
) {
  const session = await requireStaff();
  const q = await prisma.question.findUnique({
    where: { id: params.questionId },
    select: { id: true, eventId: true },
  });
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  await assertOwnsEvent(session, q.eventId);

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.question.update({
    where: { id: q.id },
    data: parsed.data,
  });
  return NextResponse.json({ question: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { questionId: string } },
) {
  const session = await requireStaff();
  const q = await prisma.question.findUnique({
    where: { id: params.questionId },
    select: { id: true, eventId: true },
  });
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  await assertOwnsEvent(session, q.eventId);

  await prisma.question.delete({ where: { id: q.id } });
  return NextResponse.json({ ok: true });
}
