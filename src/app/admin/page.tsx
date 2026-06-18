import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { requireStaff, eventScope } from "@/lib/admin-scope";
import { Calendar, Users, Mic2, Store, CheckCircle, QrCode } from "lucide-react";

export default async function AdminOverview() {
  const session = await requireStaff();
  const scope = eventScope(session);

  const events = await prisma.event.findMany({
    where: scope,
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: { sessions: true, speakers: true, registrations: true, exhibitors: true },
      },
    },
  });

  const totalEvents = events.length;
  const totalRegistrations = await prisma.registration.count({
    where: { event: scope },
  });
  const totalCheckedIn = await prisma.registration.count({
    where: { event: scope, checkedInAt: { not: null } },
  });

  const isSuperadmin = session.role === "SUPERADMIN";

  return (
    <div className="p-4 sm:p-8">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Organizer overview</h1>
          <p className="text-sm text-ink-500 mt-1">
            {isSuperadmin
              ? "Hub admin view — you see every event on the platform."
              : "Your events only. Other organizers' events are isolated from this view."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/events/new" className="btn-primary">
            New event
          </Link>
          <Link href="/admin/check-in" className="btn-secondary">
            <QrCode className="h-4 w-4" /> Open check-in
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label={isSuperadmin ? "All events" : "My events"} value={totalEvents} icon={<Calendar className="h-4 w-4" />} />
        <KpiCard label="Registrations" value={totalRegistrations} icon={<CheckCircle className="h-4 w-4" />} />
        <KpiCard label="Checked in" value={totalCheckedIn} icon={<CheckCircle className="h-4 w-4" />} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
          {isSuperadmin ? "All events" : "Your events"}
        </h2>
        {events.length === 0 ? (
          <div className="card p-10 text-center text-ink-500">
            No events yet.{" "}
            <Link href="/admin/events/new" className="text-brand-700 hover:underline">
              Create your first event
            </Link>
            .
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Link key={e.id} href={`/admin/events/${e.id}`} className="card p-5 hover:shadow-pop transition-shadow">
                <div className="text-xs text-ink-400 uppercase tracking-wide">{e.status}</div>
                <h3 className="mt-1 font-semibold text-ink-900">{e.name}</h3>
                <p className="text-sm text-ink-500 mt-1">
                  {formatDate(e.startDate)} – {formatDate(e.endDate)}
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <Mini icon={<Calendar className="h-3 w-3" />} value={e._count.sessions} />
                  <Mini icon={<Mic2 className="h-3 w-3" />} value={e._count.speakers} />
                  <Mini icon={<Users className="h-3 w-3" />} value={e._count.registrations} />
                  <Mini icon={<Store className="h-3 w-3" />} value={e._count.exhibitors} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-ink-500 uppercase tracking-wide inline-flex items-center gap-1.5">
        <span className="text-brand-700">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-ink-900">{value.toLocaleString()}</div>
    </div>
  );
}

function Mini({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="rounded-md bg-ink-50 p-2 text-center">
      <div className="text-ink-500 flex justify-center">{icon}</div>
      <div className="font-semibold text-ink-800 mt-0.5">{value}</div>
    </div>
  );
}
