import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { SurveyEditor } from "./SurveyEditor";

export default async function SurveyPage({ params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const survey = await prisma.eventSurvey.findUnique({
    where: { eventId: params.eventId },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { user: { select: { name: true, email: true, avatarUrl: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <SurveyEditor
        eventId={params.eventId}
        initial={
          survey
            ? {
                title: survey.title,
                description: survey.description,
                enabled: survey.enabled,
                questions: survey.questions.map((q) => ({
                  id: q.id,
                  prompt: q.prompt,
                  type: q.type as "rating" | "text" | "multiple_choice",
                  options: q.options ? (JSON.parse(q.options) as string[]) : [],
                  required: q.required,
                })),
              }
            : null
        }
        responses={
          survey
            ? survey.responses.map((r) => ({
                id: r.id,
                userName: r.user.name,
                userEmail: r.user.email,
                userAvatar: r.user.avatarUrl,
                answers: JSON.parse(r.answers) as Record<string, string>,
                submittedAt: r.submittedAt.toISOString(),
              }))
            : []
        }
      />
    </div>
  );
}
