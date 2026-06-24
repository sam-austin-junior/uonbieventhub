import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEventBySlug } from "@/lib/event";
import { CheckCircle, ClipboardList, ArrowLeft } from "lucide-react";
import { SurveyForm } from "./SurveyForm";

export default async function AttendeeSurveyPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const session = await getSession();
  if (!session) notFound();

  const survey = await prisma.eventSurvey.findUnique({
    where: { eventId: event.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  const existing = survey
    ? await prisma.eventSurveyResponse.findUnique({
        where: { surveyId_userId: { surveyId: survey.id, userId: session.userId } },
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/e/${event.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event home
      </Link>

      {!survey ? (
        <div className="card p-10 text-center">
          <ClipboardList className="h-8 w-8 text-ink-300 mx-auto" />
          <h1 className="mt-3 text-xl font-bold text-ink-900">No survey yet</h1>
          <p className="mt-1 text-sm text-ink-500">
            The organizers haven't published a feedback survey for this event.
          </p>
        </div>
      ) : !survey.enabled ? (
        <div className="card p-10 text-center">
          <h1 className="text-xl font-bold text-ink-900">Survey closed</h1>
          <p className="mt-1 text-sm text-ink-500">
            Thanks for your interest — this survey isn't accepting responses right now.
          </p>
        </div>
      ) : existing ? (
        <div className="card p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="mt-3 text-xl font-bold text-ink-900">Thanks for your feedback</h1>
          <p className="mt-2 text-sm text-ink-500">
            You submitted your response on{" "}
            {new Date(existing.submittedAt).toLocaleDateString()}. You can update your answers
            below.
          </p>
          <div className="mt-6 text-left">
            <SurveyForm
              slug={event.slug}
              questions={survey.questions.map((q) => ({
                id: q.id,
                prompt: q.prompt,
                type: q.type as "rating" | "text" | "multiple_choice",
                options: q.options ? (JSON.parse(q.options) as string[]) : [],
                required: q.required,
              }))}
              initial={JSON.parse(existing.answers) as Record<string, string>}
              submitLabel="Update my answers"
            />
          </div>
        </div>
      ) : (
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-ink-900">{survey.title}</h1>
          {survey.description ? (
            <p className="mt-2 text-sm text-ink-600">{survey.description}</p>
          ) : null}
          <p className="mt-3 text-xs text-ink-400">
            Takes ~1 minute. Your responses help the organisers plan the next one.
          </p>

          <div className="mt-6">
            <SurveyForm
              slug={event.slug}
              questions={survey.questions.map((q) => ({
                id: q.id,
                prompt: q.prompt,
                type: q.type as "rating" | "text" | "multiple_choice",
                options: q.options ? (JSON.parse(q.options) as string[]) : [],
                required: q.required,
              }))}
              initial={{}}
              submitLabel="Submit feedback"
            />
          </div>
        </div>
      )}
    </div>
  );
}
