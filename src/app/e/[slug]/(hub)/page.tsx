import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDate, formatTime, formatDateRange } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { EventChatBot } from "@/components/chat/EventChatBot";
import {
  Calendar,
  MapPin,
  Users,
  Mic2,
  MessageSquare,
  Store,
  ArrowRight,
  LogIn,
} from "lucide-react";

export default async function HubHomePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      organizer: true,
      _count: {
        select: { sessions: true, speakers: true, exhibitors: true, registrations: true, discussions: true },
      },
    },
  });
  if (!event) notFound();

  const featured = await prisma.session.findMany({
    where: { eventId: event.id, isFeatured: true },
    include: { speakers: { include: { speaker: true } } },
    orderBy: { startTime: "asc" },
    take: 4,
  });

  const upcoming = await prisma.session.findMany({
    where: { eventId: event.id, startTime: { gte: new Date() }, format: { not: "ON_DEMAND" } },
    include: { speakers: { include: { speaker: true } } },
    orderBy: { startTime: "asc" },
    take: 3,
  });

  const notifications = session
    ? await prisma.notification.findMany({
        where: { userId: session.userId, eventId: event.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <div>
      <section className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid lg:grid-cols-[5fr_6fr] gap-8 lg:gap-12 items-center">
          {/* Left: event brand block */}
          <div className="min-w-0">
            {event.logoUrl ? (
              <Image
                src={event.logoUrl}
                alt={event.name}
                width={80}
                height={80}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-md object-contain ring-1 ring-ink-100 bg-white mb-5"
              />
            ) : null}
            {event.tagline ? (
              <div className="text-brand-700 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] mb-3">
                {event.tagline}
              </div>
            ) : null}
            <h1 className="text-3xl sm:text-5xl font-bold leading-[1.05] text-ink-900">
              {event.name}
            </h1>
            <div className="mt-5 flex flex-col gap-2 text-sm sm:text-base text-ink-600">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span className="font-medium text-accent">
                  {formatDate(event.startDate)} – {formatDate(event.endDate)}
                </span>
              </span>
              {event.venue ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-medium text-accent">{event.venue}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Right: cover image */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden bg-ink-100">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-900" />
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-ink-900 mb-3">About this event</h2>
            <p className="text-ink-700 leading-relaxed">{event.description}</p>
          </section>

          {featured.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-ink-900">Featured sessions</h2>
                <Link
                  href={`/e/${event.slug}/sessions`}
                  className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  All sessions <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {featured.map((s) => (
                  <Link
                    key={s.id}
                    href={`/e/${event.slug}/sessions/${s.id}`}
                    className="card p-5 hover:shadow-pop transition-shadow"
                  >
                    <div className="text-xs text-brand-700 font-medium uppercase tracking-wide">
                      {s.track ?? "Session"}
                    </div>
                    <h3 className="mt-1 font-semibold text-ink-900 line-clamp-2">{s.title}</h3>
                    <p className="mt-2 text-sm text-ink-500 line-clamp-2">{s.description}</p>
                    <div className="mt-3 text-xs text-ink-500">
                      {formatDateRange(s.startTime, s.endTime)}
                    </div>
                    {s.speakers.length > 0 ? (
                      <div className="mt-3 flex -space-x-2">
                        {s.speakers.slice(0, 4).map(({ speaker }) => (
                          <Avatar key={speaker.id} name={speaker.name} src={speaker.photoUrl} size={28} />
                        ))}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold text-ink-900 mb-3">Coming up next</h2>
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <Link
                    key={s.id}
                    href={`/e/${event.slug}/sessions/${s.id}`}
                    className="card p-4 flex items-start gap-4 hover:shadow-pop transition-shadow"
                  >
                    <div className="shrink-0 w-16 text-center">
                      <div className="text-xs text-ink-400 uppercase">
                        {new Date(s.startTime).toLocaleDateString("en-GB", { month: "short" })}
                      </div>
                      <div className="text-2xl font-bold text-brand-700 leading-none">
                        {new Date(s.startTime).getDate()}
                      </div>
                      <div className="text-xs text-ink-500 mt-1">{formatTime(s.startTime)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-ink-900 truncate">{s.title}</h3>
                      <p className="text-sm text-ink-500 line-clamp-2 mt-0.5">{s.description}</p>
                      {s.location ? (
                        <div className="mt-2 text-xs text-ink-500 inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {s.location}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase text-ink-500 tracking-wide mb-3">At a glance</h3>
            <ul className="space-y-2 text-sm">
              <Stat icon={<Calendar className="h-4 w-4" />} label="Sessions" value={event._count.sessions} />
              <Stat icon={<Mic2 className="h-4 w-4" />} label="Speakers" value={event._count.speakers} />
              <Stat icon={<Users className="h-4 w-4" />} label="Attendees" value={event._count.registrations} />
              <Stat icon={<Store className="h-4 w-4" />} label="Exhibitors" value={event._count.exhibitors} />
              <Stat icon={<MessageSquare className="h-4 w-4" />} label="Discussions" value={event._count.discussions} />
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase text-ink-500 tracking-wide mb-3">Organizer</h3>
            <div className="flex items-center gap-3">
              <Avatar name={event.organizer.name} src={event.organizer.avatarUrl} size={40} />
              <div>
                <div className="font-medium">{event.organizer.name}</div>
                <div className="text-xs text-ink-500">{event.organizer.jobTitle}</div>
              </div>
            </div>
          </div>

          {notifications.length > 0 ? (
            <div className="card p-5">
              <h3 className="text-sm font-semibold uppercase text-ink-500 tracking-wide mb-3">Notifications</h3>
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <div className="font-medium text-ink-800">{n.title}</div>
                    {n.body ? <div className="text-ink-500 text-xs mt-0.5">{n.body}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {session ? (
        <EventChatBot eventId={event.id} eventName={event.name} />
      ) : (
        <section className="bg-brand-900 text-white mt-8">
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold">
              Join {event.name}
            </h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto text-sm sm:text-base">
              Sign in or activate your invite to register, chat with other
              attendees, and access the full agenda.
            </p>
            <Link
              href={`/e/${event.slug}/login`}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent text-ink-900 px-6 py-3 text-sm font-semibold hover:bg-accent-dark hover:text-white transition"
            >
              <LogIn className="h-4 w-4" /> Sign in to participate
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-ink-600">
        <span className="text-brand-700">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-ink-900">{value}</span>
    </li>
  );
}
