import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEventBySlug } from "@/lib/event";
import { formatDate, formatTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Calendar, MapPin, Users, ArrowLeft, Clock, Video } from "lucide-react";
import { SessionRegisterButton } from "./RegisterButton";
import { SessionEngagement } from "./SessionEngagement";

export default async function SessionDetailPage({
  params,
}: {
  params: { slug: string; sessionId: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  const session = await getSession();
  const s = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      speakers: { include: { speaker: true } },
      _count: { select: { registrations: true } },
    },
  });
  if (!s || s.eventId !== event.id) notFound();

  let registered = false;
  if (session) {
    const reg = await prisma.sessionRegistration.findUnique({
      where: { sessionId_userId: { sessionId: s.id, userId: session.userId } },
    });
    registered = !!reg;
  }

  const formatLabel = s.format.replace("_", " ").toLowerCase();

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          href={`/e/${event.slug}/sessions`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> All sessions
        </Link>

        <div className="mt-6 grid lg:grid-cols-[1.6fr_1fr] gap-8 lg:gap-12">
          {/* Main column */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {s.track ? <span className="badge-brand">{s.track}</span> : null}
              <span className="badge-gray capitalize">{formatLabel}</span>
              {s.isFeatured ? <span className="badge-accent">Featured</span> : null}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-ink-900">
              {s.title}
            </h1>

            {s.videoUrl ? (
              <div className="mt-6 aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-ink-100">
                <iframe
                  src={s.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold">
                About this session
              </h2>
              <p className="mt-2 text-base sm:text-lg text-ink-700 leading-relaxed whitespace-pre-line">
                {s.description}
              </p>
            </div>

            {session ? <SessionEngagement sessionId={s.id} /> : null}

            {s.speakers.length > 0 ? (
              <div className="mt-10">
                <h2 className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold mb-4">
                  Speakers
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {s.speakers.map(({ speaker }) => (
                    <div
                      key={speaker.id}
                      className="rounded-xl bg-ink-50 ring-1 ring-ink-100 p-5 flex gap-4"
                    >
                      <Avatar name={speaker.name} src={speaker.photoUrl} size={56} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-900">{speaker.name}</div>
                        <div className="text-sm text-ink-500">
                          {speaker.jobTitle}
                          {speaker.organization ? ` · ${speaker.organization}` : ""}
                        </div>
                        {speaker.bio ? (
                          <p className="mt-2 text-sm text-ink-600 line-clamp-3">{speaker.bio}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl ring-1 ring-ink-100 bg-white shadow-card overflow-hidden">
              <div className="p-5 border-b border-ink-100">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">
                  When
                </div>
                <div className="mt-1 inline-flex items-start gap-2 text-ink-900">
                  <Calendar className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">{formatDate(s.startTime)}</div>
                    <div className="text-sm text-ink-500 inline-flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              {s.location ? (
                <div className="p-5 border-b border-ink-100">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">
                    Where
                  </div>
                  <div className="mt-1 inline-flex items-start gap-2 text-ink-900">
                    <MapPin className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span className="font-medium">{s.location}</span>
                  </div>
                </div>
              ) : null}

              <div className="p-5 border-b border-ink-100">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">
                  Format
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-ink-900">
                  <Video className="h-4 w-4 text-accent" />
                  <span className="font-medium capitalize">{formatLabel}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-semibold">
                  Attendance
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-ink-900">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="font-medium">
                    {s._count.registrations} registered
                    {s.capacity ? ` / ${s.capacity}` : ""}
                  </span>
                </div>
                {s.capacity ? (
                  <div className="mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-700 transition-all"
                      style={{
                        width: `${Math.min(100, (s._count.registrations / s.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                ) : null}
                <div className="mt-5">
                  <SessionRegisterButton sessionId={s.id} initialRegistered={registered} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
