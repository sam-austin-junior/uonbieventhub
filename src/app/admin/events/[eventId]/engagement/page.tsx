import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { EngagementBoard } from "./EngagementBoard";

export const dynamic = "force-dynamic";

export default async function EngagementPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const sessions = await prisma.session.findMany({
    where: { eventId: event.id },
    orderBy: { startTime: "asc" },
    select: { id: true, title: true, startTime: true },
  });

  return (
    <div className="p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Live engagement</h1>
        <p className="text-sm text-ink-500 mt-1">
          Create polls and moderate attendee questions for each session. This
          view auto-refreshes every few seconds so it can be left open on a
          second screen during the event.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-500">
          Add some sessions first — then you can run polls and Q&amp;A on each.
        </div>
      ) : (
        <EngagementBoard
          eventId={event.id}
          sessions={sessions.map((s) => ({
            id: s.id,
            title: s.title,
            startTime: s.startTime.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
