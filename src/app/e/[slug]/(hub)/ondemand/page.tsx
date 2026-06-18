import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { PlayCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function OnDemandPage({ params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const sessions = await prisma.session.findMany({
    where: {
      eventId: event.id,
      OR: [{ format: "ON_DEMAND" }, { videoUrl: { not: null } }],
    },
    include: { speakers: { include: { speaker: true } } },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">On-Demand Library</h1>
        <p className="text-sm text-ink-500 mt-1">
          Catch up on recorded sessions or stream content you may have missed.
        </p>
      </header>

      {sessions.length === 0 ? (
        <EmptyState
          title="No recordings yet"
          description="Recordings will appear here as sessions are published."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/e/${event.slug}/sessions/${s.id}`}
              className="card overflow-hidden hover:shadow-pop transition-shadow"
            >
              <div className="relative aspect-video bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                <PlayCircle className="h-14 w-14 text-white/90" />
                {s.track ? (
                  <div className="absolute top-3 left-3 badge-accent">{s.track}</div>
                ) : null}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-ink-900 line-clamp-2">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-500 line-clamp-2">{s.description}</p>
                {s.speakers.length > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {s.speakers.slice(0, 3).map(({ speaker }) => (
                        <Avatar key={speaker.id} name={speaker.name} src={speaker.photoUrl} size={22} />
                      ))}
                    </div>
                    <span className="text-xs text-ink-500 truncate">
                      {s.speakers.map((sp) => sp.speaker.name).join(", ")}
                    </span>
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
