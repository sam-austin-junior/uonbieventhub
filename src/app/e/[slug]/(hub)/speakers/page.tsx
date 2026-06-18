import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { Star } from "lucide-react";

export default async function SpeakersPage({ params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const speakers = await prisma.speaker.findMany({
    where: { eventId: event.id },
    include: { _count: { select: { sessions: true } } },
    orderBy: [{ isKeynote: "desc" }, { name: "asc" }],
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Speakers</h1>
        <p className="text-sm text-ink-500 mt-1">
          Meet the {speakers.length} speakers presenting at {event.name}.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {speakers.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start gap-4">
              <Avatar name={s.name} src={s.photoUrl} size={72} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {s.isKeynote ? <Star className="h-4 w-4 text-accent" /> : null}
                  <h3 className="font-semibold text-ink-900 truncate">{s.name}</h3>
                </div>
                <div className="text-sm text-ink-500 mt-0.5">{s.jobTitle}</div>
                {s.organization ? (
                  <div className="text-xs text-ink-400">{s.organization}</div>
                ) : null}
              </div>
            </div>
            {s.bio ? (
              <p className="mt-3 text-sm text-ink-600 line-clamp-3">{s.bio}</p>
            ) : null}
            <div className="mt-3 text-xs text-ink-500">
              {s._count.sessions} session{s._count.sessions === 1 ? "" : "s"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
