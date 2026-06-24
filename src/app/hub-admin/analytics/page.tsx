import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  CalendarRange,
  UserCheck,
  Activity,
  MessageSquare,
  MailCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformAnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    organizers,
    events,
    activeEvents,
    upcomingEvents,
    registrations,
    checkInCount,
    organizersThis30,
    eventsThis30,
    regsThis30,
    chatMsgs,
    chatMsgs30,
    messages,
    discussions,
    surveyResponses,
    topEvents,
    topOrganizers,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ORGANIZER" } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED", endDate: { gte: now } } }),
    prisma.event.count({ where: { startDate: { gte: now } } }),
    prisma.registration.count(),
    prisma.registration.count({ where: { checkedInAt: { not: null } } }),
    prisma.user.count({ where: { role: "ORGANIZER", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.event.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.registration.count({ where: { registeredAt: { gte: thirtyDaysAgo } } }),
    prisma.chatMessage.count(),
    prisma.chatMessage.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.message.count(),
    prisma.discussion.count(),
    prisma.eventSurveyResponse.count(),
    prisma.event.findMany({
      orderBy: { registrations: { _count: "desc" } },
      take: 8,
      include: {
        organizer: { select: { name: true } },
        _count: { select: { registrations: true, sessions: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "ORGANIZER" },
      orderBy: { organizedEvents: { _count: "desc" } },
      take: 6,
      include: { _count: { select: { organizedEvents: true } } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const checkinRate = registrations ? Math.round((checkInCount / registrations) * 100) : 0;

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
        <p className="text-sm text-ink-500 mt-1">
          Activity across every event and organizer on the platform.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Users className="h-4 w-4" />} label="Organizers" value={organizers} sub={`+${organizersThis30} this month`} />
        <Kpi icon={<CalendarRange className="h-4 w-4" />} label="Events" value={events} sub={`+${eventsThis30} created · ${activeEvents} active · ${upcomingEvents} upcoming`} />
        <Kpi icon={<UserCheck className="h-4 w-4" />} label="Registrations" value={registrations} sub={`+${regsThis30} this month`} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Check-in rate" value={`${checkinRate}%`} sub={`${checkInCount.toLocaleString()} of ${registrations.toLocaleString()}`} />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Chatbot messages" value={chatMsgs} sub={`+${chatMsgs30} this month`} />
        <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Discussions" value={discussions} />
        <Kpi icon={<MailCheck className="h-4 w-4" />} label="Direct messages" value={messages} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Survey responses" value={surveyResponses} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Top events by attendance</h2>
            <Link href="/hub-admin/events" className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1">
              All events <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {topEvents.length === 0 ? (
            <p className="text-sm text-ink-500">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {topEvents.map((e) => {
                const max = topEvents[0]._count.registrations || 1;
                const pct = Math.round((e._count.registrations / max) * 100);
                return (
                  <li key={e.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <Link href={`/e/${e.slug}`} className="font-medium text-ink-900 hover:text-brand-700 truncate">
                        {e.name}
                      </Link>
                      <span className="text-ink-500 shrink-0 ml-3">{e._count.registrations.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full bg-brand-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-ink-500 mt-1">
                      by {e.organizer.name} · {e._count.sessions} session{e._count.sessions === 1 ? "" : "s"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Most active organizers</h2>
            <Link href="/hub-admin/organizers" className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1">
              All organizers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {topOrganizers.length === 0 ? (
            <p className="text-sm text-ink-500">No organizers yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 -mx-2">
              {topOrganizers.map((o) => (
                <li key={o.id} className="px-2 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900 truncate">{o.name}</div>
                    <div className="text-xs text-ink-500 truncate">{o.email}</div>
                  </div>
                  <div className="text-sm text-ink-600 shrink-0 ml-3">
                    {o._count.organizedEvents} event{o._count.organizedEvents === 1 ? "" : "s"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Recent signups (last 90 days)</h2>
        {recentSignups.length === 0 ? (
          <p className="text-sm text-ink-500">No recent signups.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-right px-6 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {recentSignups.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-2 font-medium text-ink-800">{u.name}</td>
                    <td className="px-3 py-2 text-ink-600">{u.email}</td>
                    <td className="px-3 py-2 text-ink-600 capitalize">{u.role.toLowerCase()}</td>
                    <td className="px-6 py-2 text-right text-ink-500">
                      {u.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs text-ink-500 uppercase tracking-wide inline-flex items-center gap-1.5">
        <span className="text-brand-700">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-ink-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub ? <div className="text-xs text-ink-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}
