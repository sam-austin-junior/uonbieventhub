import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { isChatbotEnabled } from "@/lib/llm";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { KnowledgeUpload } from "./KnowledgeUpload";
import { ShareEventUrl } from "./ShareEventUrl";
import { Calendar, Mic2, Users, Store, FileText, Megaphone, UserPlus, Award } from "lucide-react";

export default async function AdminEventDetail({ params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      _count: {
        select: {
          sessions: true,
          speakers: true,
          exhibitors: true,
          registrations: true,
          pages: true,
          discussions: true,
          invites: true,
        },
      },
    },
  });
  if (!event) return null;

  const [checkedIn, knowledge] = await Promise.all([
    prisma.registration.count({
      where: { eventId: event.id, checkedInAt: { not: null } },
    }),
    prisma.eventKnowledgeBase.findUnique({
      where: { eventId: event.id },
      select: { fileName: true, fileType: true, charCount: true, updatedAt: true },
    }),
  ]);

  const tiles = [
    { href: `/admin/events/${event.id}/sessions`, label: "Sessions", value: event._count.sessions, icon: Calendar },
    { href: `/admin/events/${event.id}/speakers`, label: "Speakers", value: event._count.speakers, icon: Mic2 },
    { href: `/admin/events/${event.id}/attendees`, label: "Attendees", value: event._count.registrations, icon: Users },
    { href: `/admin/events/${event.id}/exhibitors`, label: "Exhibitors", value: event._count.exhibitors, icon: Store },
    { href: `/admin/events/${event.id}/pages`, label: "Custom pages", value: event._count.pages, icon: FileText },
    { href: `/admin/events/${event.id}/announcements`, label: "Announcements", value: 0, icon: Megaphone },
  ];

  return (
    <div className="p-8">
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-wide flex items-center gap-2">
            {event.status}
            <span className={event.attendeeMode === "OPEN" ? "badge-brand" : "badge-accent"}>
              {event.attendeeMode === "OPEN" ? "Open" : "Invite-only"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mt-1">{event.name}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {formatDate(event.startDate)} – {formatDate(event.endDate)} · {event.venue ?? "Venue TBD"}
          </p>
        </div>
      </header>

      <ShareEventUrl slug={event.slug} />

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 mt-6">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card p-5 hover:shadow-pop transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-500">{t.label}</span>
              <t.icon className="h-4 w-4 text-brand-700" />
            </div>
            <div className="mt-2 text-2xl font-bold text-ink-900">{t.value}</div>
          </Link>
        ))}
      </section>

      {event.attendeeMode === "INVITE_ONLY" ? (
        <section className="card p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-700" /> Attendee invites
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                {event._count.invites} attendee{event._count.invites === 1 ? "" : "s"} invited.
                {event._count.registrations > 0 ? ` ${event._count.registrations} have activated.` : ""}
              </p>
            </div>
            <Link href={`/admin/events/${event.id}/attendees/invite`} className="btn-primary">
              Manage invites
            </Link>
          </div>
        </section>
      ) : null}

      <section className="card p-5 mb-6">
        <h2 className="font-semibold text-ink-900 mb-3">Check-in progress</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-brand-700 transition-all"
              style={{ width: `${event._count.registrations ? (checkedIn / event._count.registrations) * 100 : 0}%` }}
            />
          </div>
          <div className="text-sm font-medium">{checkedIn} / {event._count.registrations}</div>
        </div>
        <p className="text-xs text-ink-500 mt-2">Total attendees checked in to the event.</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <Link href="/admin/check-in" className="btn-primary">Open QR scanner</Link>
          {checkedIn > 0 ? (
            <Link href={`/admin/events/${event.id}/certificates`} className="btn-secondary">
              <Award className="h-4 w-4" /> Issue certificates
            </Link>
          ) : null}
        </div>
      </section>

      <KnowledgeUpload
        eventId={event.id}
        initial={
          knowledge
            ? {
                fileName: knowledge.fileName,
                fileType: knowledge.fileType,
                charCount: knowledge.charCount,
                updatedAt: knowledge.updatedAt.toISOString(),
              }
            : null
        }
        chatbotConfigured={isChatbotEnabled()}
      />
    </div>
  );
}
