import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SpeakersTable } from "./SpeakersTable";

export default async function AdminSpeakersPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const speakers = await prisma.speaker.findMany({
    where: { eventId: event.id },
    include: { _count: { select: { sessions: true } } },
    orderBy: [{ isKeynote: "desc" }, { name: "asc" }],
  });

  const rows = speakers.map((s) => ({
    id: s.id,
    name: s.name,
    jobTitle: s.jobTitle,
    organization: s.organization,
    bio: s.bio,
    photoUrl: s.photoUrl,
    linkedinUrl: s.linkedinUrl,
    twitterUrl: s.twitterUrl,
    isKeynote: s.isKeynote,
    sessionCount: s._count.sessions,
  }));

  return (
    <div className="p-8">
      <SpeakersTable eventId={event.id} rows={rows} />
    </div>
  );
}
