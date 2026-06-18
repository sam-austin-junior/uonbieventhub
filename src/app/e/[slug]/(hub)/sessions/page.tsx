import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTime, formatDay } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { MapPin, Clock, Star } from "lucide-react";

export default async function SessionsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { track?: string; q?: string };
}) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const where: any = { eventId: event.id };
  if (searchParams.track) where.track = searchParams.track;
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const sessions = await prisma.session.findMany({
    where,
    include: { speakers: { include: { speaker: true } } },
    orderBy: { startTime: "asc" },
  });

  const tracks = Array.from(new Set(sessions.map((s) => s.track).filter(Boolean) as string[]));

  const grouped = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = new Date(s.startTime).toDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Sessions</h1>
          <p className="text-sm text-ink-500 mt-1">
            Browse the full programme. {sessions.length} session{sessions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <form className="flex gap-2 items-center" action="">
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search sessions…"
            className="input w-64"
          />
          <select name="track" defaultValue={searchParams.track ?? ""} className="input w-44">
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button className="btn-primary">Filter</button>
        </form>
      </header>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([day, items]) => (
          <section key={day}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3 sticky top-0 bg-ink-50 py-2">
              {formatDay(day)}
            </h2>
            <div className="space-y-3">
              {items.map((s) => (
                <Link
                  key={s.id}
                  href={`/e/${event.slug}/sessions/${s.id}`}
                  className="card p-5 flex flex-col sm:flex-row gap-4 hover:shadow-pop transition-shadow"
                >
                  <div className="sm:w-40 shrink-0">
                    <div className="text-xs text-ink-400 uppercase">
                      {s.format.replace("_", " ").toLowerCase()}
                    </div>
                    <div className="text-base font-semibold text-brand-700 mt-0.5 inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </div>
                    {s.track ? <div className="mt-2 badge-brand">{s.track}</div> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {s.isFeatured ? <Star className="h-4 w-4 text-accent shrink-0 mt-1" /> : null}
                      <h3 className="font-semibold text-ink-900">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-ink-600 line-clamp-2">{s.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-500">
                      {s.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {s.location}
                        </span>
                      ) : null}
                      {s.speakers.length > 0 ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="flex -space-x-1.5">
                            {s.speakers.slice(0, 3).map(({ speaker }) => (
                              <Avatar key={speaker.id} name={speaker.name} src={speaker.photoUrl} size={22} />
                            ))}
                          </span>
                          <span>
                            {s.speakers.map((sp) => sp.speaker.name).join(", ")}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
