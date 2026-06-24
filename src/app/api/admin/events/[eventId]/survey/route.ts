import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";

const questionSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().min(1).max(500),
  type: z.enum(["rating", "text", "multiple_choice"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional().default(false),
});

const saveSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional().nullable(),
  enabled: z.boolean().optional().default(true),
  questions: z.array(questionSchema).max(20),
});

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  const survey = await prisma.eventSurvey.findUnique({
    where: { eventId: params.eventId },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  return NextResponse.json({ survey });
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  const json = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.format() }, { status: 400 });
  }
  const { title, description, enabled, questions } = parsed.data;

  const survey = await prisma.$transaction(async (tx) => {
    const upserted = await tx.eventSurvey.upsert({
      where: { eventId: params.eventId },
      create: {
        eventId: params.eventId,
        title,
        description: description ?? null,
        enabled,
      },
      update: {
        title,
        description: description ?? null,
        enabled,
      },
    });
    // Replace all questions on each save (simpler than diffing)
    await tx.eventSurveyQuestion.deleteMany({ where: { surveyId: upserted.id } });
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await tx.eventSurveyQuestion.create({
        data: {
          surveyId: upserted.id,
          order: i,
          prompt: q.prompt,
          type: q.type,
          options: q.options ? JSON.stringify(q.options) : null,
          required: q.required ?? false,
        },
      });
    }
    return upserted;
  });

  return NextResponse.json({ survey });
}

export async function DELETE(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);
  await prisma.eventSurvey.deleteMany({ where: { eventId: params.eventId } });
  return NextResponse.json({ ok: true });
}
