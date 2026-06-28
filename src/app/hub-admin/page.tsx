import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  UserCog,
  CalendarRange,
  Users,
  ArrowRight,
  Activity,
  PlusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HubAdminOverview() {
  const [organizerCount, eventCount, attendeeCount, totalUsers, recentEvents, recentOrgs] =
    await Promise.all([
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.event.count(),
      prisma.user.count({ where: { role: "ATTENDEE" } }),
      prisma.user.count(),
      prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          organizer: { select: { name: true } },
          _count: { select: { sessions: true, registrations: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: "ORGANIZER" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { organizedEvents: true } } },
      }),
    ]);

  return (
    <div className="p-8">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Platform overview</h1>
          <p className="text-sm text-ink-500 mt-1">
            Everything happening across the UoN Event Hub at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/hub-admin/organizers" className="btn-primary">
            <PlusCircle className="h-4 w-4" /> New organizer
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi icon={<UserCog className="h-4 w-4" />} label="Organizers" value={organizerCount} />
        <Kpi icon={<CalendarRange className="h-4 w-4" />} label="Events" value={eventCount} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Total users" value={totalUsers} sub={`${attendeeCount} attendees`} />
        <Kpi icon={<Activity className="h-4 w-4" />} label="Hub admin" value={1} sub="that's you" />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
              <UserCog className="h-4 w-4 text-brand-700" />
              Recent organizers
            </h2>
            <Link href="/hub-admin/organizers" className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1">
              All organizers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrgs.length === 0 ? (
            <p className="text-sm text-ink-500">
              No organizers yet.{" "}
              <Link href="/hub-admin/organizers" className="text-brand-700 hover:underline">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-ink-100 -mx-2">
              {recentOrgs.map((o) => (
                <li key={o.id} className="px-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900 truncate">{o.name}</div>
                      <div className="text-xs text-ink-500 truncate">
                        {o.email} · {o._count.organizedEvents} event{o._count.organizedEvents === 1 ? "" : "s"}
                      </div>
                    </div>
                    {o.activatedAt ? (
                      <span className="badge-green">Active</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">Pending</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-brand-700" />
              Recent events
            </h2>
            <Link href="/hub-admin/events" className="text-sm text-brand-700 hover:underline inline-flex items-center gap-1">
              All events <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-ink-500">No events yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100 -mx-2">
              {recentEvents.map((e) => (
                <li key={e.id} className="px-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/e/${e.slug}`} className="font-medium text-ink-900 hover:text-brand-700 truncate block">
                        {e.name}
                      </Link>
                      <div className="text-xs text-ink-500 truncate">
                        by {e.organizer.name} · {formatDate(e.startDate)}
                      </div>
                    </div>
                    <div className="text-xs text-ink-500 shrink-0">
                      {e._count.registrations} attending
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
  value: number;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs text-ink-500 uppercase tracking-wide inline-flex items-center gap-1.5">
        <span className="text-brand-700">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-ink-900">{value.toLocaleString()}</div>
      {sub ? <div className="text-xs text-ink-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}
