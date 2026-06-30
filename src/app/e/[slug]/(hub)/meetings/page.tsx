import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { MeetingsBoard } from "./MeetingsBoard";

export const dynamic = "force-dynamic";

export default async function MeetingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session) redirect(`/e/${params.slug}/login?next=/e/${params.slug}/meetings`);

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true },
  });
  if (!event) notFound();

  const meetings = await prisma.meetingRequest.findMany({
    where: {
      eventId: event.id,
      OR: [{ requesterId: session.userId }, { recipientId: session.userId }],
    },
    include: {
      requester: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
      recipient: { select: { id: true, name: true, avatarUrl: true, jobTitle: true } },
    },
    orderBy: { proposedStart: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">Meetings</h1>
        <p className="text-sm text-ink-500 mt-1">
          1-to-1 meetings with other attendees at {event.name}. Find someone
          you'd like to meet in the{" "}
          <a
            href={`/e/${event.slug}/attendees`}
            className="text-brand-700 hover:underline"
          >
            attendee directory
          </a>{" "}
          and request a time.
        </p>
      </header>

      <MeetingsBoard
        meId={session.userId}
        slug={event.slug}
        meetings={meetings.map((m) => ({
          id: m.id,
          requester: m.requester,
          recipient: m.recipient,
          proposedStart: m.proposedStart.toISOString(),
          proposedEnd: m.proposedEnd.toISOString(),
          status: m.status,
          location: m.location,
          message: m.message,
        }))}
      />
    </div>
  );
}
