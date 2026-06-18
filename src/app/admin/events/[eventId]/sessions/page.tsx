import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionsTable } from "./SessionsTable";

export default async function AdminSessionsPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const [sessions, speakers] = await Promise.all([
    prisma.session.findMany({
      where: { eventId: event.id },
      include: {
        speakers: { select: { speakerId: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.speaker.findMany({
      where: { eventId: event.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    location: s.location,
    format: s.format,
    capacity: s.capacity,
    videoUrl: s.videoUrl,
    track: s.track,
    isFeatured: s.isFeatured,
    speakerIds: s.speakers.map((ss) => ss.speakerId),
    registrations: s._count.registrations,
  }));

  return (
    <div className="p-8">
      <SessionsTable eventId={event.id} rows={rows} speakers={speakers} />
    </div>
  );
}
