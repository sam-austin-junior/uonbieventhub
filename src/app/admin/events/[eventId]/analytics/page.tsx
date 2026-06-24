import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  UserCheck,
  Activity,
  Calendar,
  Sparkles,
  MessageSquare,
  ClipboardList,
  Megaphone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventAnalyticsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: {
      id: true,
      slug: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });
  if (!event) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    regCount,
    checkedIn,
    regsLast7,
    sessionCount,
    sessionsWithCapacity,
    discussionCount,
    chatCount,
    chatLast7,
    announcementCount,
    surveyResponses,
    surveyHasSurvey,
    topSessions,
    recentRegs,
  ] = await Promise.all([
    prisma.registration.count({ where: { eventId: event.id } }),
    prisma.registration.count({ where: { eventId: event.id, checkedInAt: { not: null } } }),
    prisma.registration.count({
      where: { eventId: event.id, registeredAt: { gte: sevenDaysAgo } },
    }),
    prisma.session.count({ where: { eventId: event.id } }),
    prisma.session.findMany({
      where: { eventId: event.id, capacity: { not: null } },
      select: {
        id: true,
        title: true,
        capacity: true,
        startTime: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.discussion.count({ where: { eventId: event.id } }),
    prisma.chatMessage.count({ where: { eventId: event.id } }),
    prisma.chatMessage.count({
      where: { eventId: event.id, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.announcement.count({ where: { eventId: event.id } }),
    prisma.eventSurveyResponse.count({
      where: { survey: { eventId: event.id } },
    }),
    prisma.eventSurvey.findUnique({
      where: { eventId: event.id },
      select: { id: true, enabled: true },
    }),
    prisma.session.findMany({
      where: { eventId: event.id },
      orderBy: { registrations: { _count: "desc" } },
      take: 6,
      include: { _count: { select: { registrations: true } } },
    }),
    prisma.registration.findMany({
      where: { eventId: event.id },
      orderBy: { registeredAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const checkinRate = regCount ? Math.round((checkedIn / regCount) * 100) : 0;

  return (
    <div className="p-8">
      <Link
        href={`/admin/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900">Analytics — {event.name}</h1>
        <p className="text-sm text-ink-500 mt-1">
          {formatDate(event.startDate)} – {formatDate(event.endDate)}
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Users className="h-4 w-4" />} label="Registrations" value={regCount} sub={`+${regsLast7} this week`} />
        <Kpi icon={<UserCheck className="h-4 w-4" />} label="Check-in rate" value={`${checkinRate}%`} sub={`${checkedIn.toLocaleString()} checked in`} />
        <Kpi icon={<Calendar className="h-4 w-4" />} label="Sessions" value={sessionCount} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Survey responses" value={surveyResponses} sub={surveyHasSurvey ? (surveyHasSurvey.enabled ? "Survey open" : "Survey closed") : "No survey"} />
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Chatbot messages" value={chatCount} sub={`+${chatLast7} this week`} />
        <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Discussions" value={discussionCount} />
        <Kpi icon={<Megaphone className="h-4 w-4" />} label="Announcements" value={announcementCount} />
        <Kpi icon={<ClipboardList className="h-4 w-4" />} label="Capacity sessions" value={sessionsWithCapacity.length} sub="With caps set" />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Top sessions by registration</h2>
          {topSessions.length === 0 ? (
            <p className="text-sm text-ink-500">No sessions yet.</p>
          ) : (
            <ul className="space-y-3">
              {topSessions.map((s) => {
                const max = topSessions[0]._count.registrations || 1;
                const pct = Math.round((s._count.registrations / max) * 100);
                return (
                  <li key={s.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-ink-900 truncate">{s.title}</span>
                      <span className="text-ink-500 shrink-0 ml-3">{s._count.registrations}</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full bg-brand-700" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Capacity utilization</h2>
          {sessionsWithCapacity.length === 0 ? (
            <p className="text-sm text-ink-500">No sessions have capacity set.</p>
          ) : (
            <ul className="space-y-3">
              {sessionsWithCapacity.slice(0, 8).map((s) => {
                const cap = s.capacity ?? 0;
                const fill = cap ? Math.min(100, Math.round((s._count.registrations / cap) * 100)) : 0;
                const full = cap && s._count.registrations >= cap;
                return (
                  <li key={s.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-ink-900 truncate">{s.title}</span>
                      <span className={full ? "text-red-600 font-medium shrink-0" : "text-ink-500 shrink-0"}>
                        {s._count.registrations} / {cap}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className={full ? "h-full bg-red-500" : "h-full bg-brand-700"}
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-6 mt-6">
        <h2 className="font-semibold text-ink-900 mb-4">Recent registrations</h2>
        {recentRegs.length === 0 ? (
          <p className="text-sm text-ink-500">Nobody has registered yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Checked in</th>
                  <th className="text-right px-6 py-2">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {recentRegs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-2 font-medium text-ink-800">{r.user.name}</td>
                    <td className="px-3 py-2 text-ink-600">{r.user.email}</td>
                    <td className="px-3 py-2 text-ink-600">
                      {r.checkedInAt ? (
                        <span className="badge-green">Yes</span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-2 text-right text-ink-500">
                      {r.registeredAt.toLocaleDateString()}
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
