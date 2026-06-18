import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { AnnouncementForm } from "./AnnouncementForm";
import { Avatar } from "@/components/ui/Avatar";
import { formatTime, formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default async function AnnouncementsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const [recent, emailReady, recipientStats] = await Promise.all([
    prisma.announcement.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { author: true },
    }),
    isEmailConfigured(),
    Promise.all([
      prisma.registration.count({ where: { eventId: event.id } }),
      prisma.registration.count({ where: { eventId: event.id, checkedInAt: { not: null } } }),
      prisma.speaker.count({ where: { eventId: event.id, user: { isNot: null } } }),
      prisma.exhibitor.count({ where: { eventId: event.id, email: { not: null } } }),
    ]),
  ]);
  const [allAttendees, checkedIn, speakers, exhibitors] = recipientStats;

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Announcements</h1>
        <p className="text-sm text-ink-500 mt-1">
          Broadcast event-wide messages to your attendees in-app and over email.
        </p>
      </header>

      {!emailReady ? (
        <div className="mb-6 rounded-md bg-amber-50 ring-1 ring-amber-100 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            SMTP isn't configured. In-app notifications will still send, but emails won't go
            out until the hub admin configures SMTP in <strong>Hub admin → Platform settings</strong>.
          </div>
        </div>
      ) : null}

      <AnnouncementForm
        eventId={event.id}
        emailReady={emailReady}
        audienceCounts={{
          ALL_ATTENDEES: allAttendees,
          CHECKED_IN: checkedIn,
          SPEAKERS: speakers,
          EXHIBITORS: exhibitors,
        }}
      />

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-4">
          Recent broadcasts ({recent.length})
        </h2>
        {recent.length === 0 ? (
          <div className="card p-6 text-center text-sm text-ink-500">
            No announcements yet. Use the composer above to send your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((a) => (
              <article key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink-900">{a.title}</h3>
                    <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <Avatar name={a.author.name} src={a.author.avatarUrl} size={18} />
                      <span>{a.author.name}</span>
                      <span>·</span>
                      <span>{formatDate(a.createdAt)} {formatTime(a.createdAt)}</span>
                      <span>·</span>
                      <span className="badge-brand">{a.audience.replace("_", " ").toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-right shrink-0">
                    <div className="text-ink-500">Recipients: {a.recipientCount}</div>
                    {a.sendEmail ? (
                      <div className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> {a.emailsSent} emailed
                        {a.emailsFailed > 0 ? (
                          <span className="text-red-600 inline-flex items-center gap-1 ml-1">
                            <XCircle className="h-3 w-3" /> {a.emailsFailed} failed
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-700 whitespace-pre-line">{a.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
