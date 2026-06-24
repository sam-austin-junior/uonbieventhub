import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const survey = await prisma.eventSurvey.findUnique({
    where: { eventId: event.id },
    include: { questions: true },
  });
  if (!survey || !survey.enabled) {
    return NextResponse.json({ error: "This survey isn't open" }, { status: 403 });
  }

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
  });
  if (!reg) {
    return NextResponse.json({ error: "Only registered attendees can submit" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Validate that required questions have answers
  for (const q of survey.questions) {
    if (q.required && !parsed.data.answers[q.id]) {
      return NextResponse.json(
        { error: `Question "${q.prompt}" is required` },
        { status: 400 }
      );
    }
  }

  const response = await prisma.eventSurveyResponse.upsert({
    where: { surveyId_userId: { surveyId: survey.id, userId: session.userId } },
    create: {
      surveyId: survey.id,
      userId: session.userId,
      answers: JSON.stringify(parsed.data.answers),
    },
    update: {
      answers: JSON.stringify(parsed.data.answers),
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, responseId: response.id });
}
