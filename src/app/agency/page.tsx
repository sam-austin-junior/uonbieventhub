import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  Crown,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgencyDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/agency");

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { agency: true },
  });
  if (!me) redirect("/login");
  if (!me.agencyId || !me.agency) {
    return <NoAgencyState />;
  }

  const agency = me.agency;

  const [members, events] = await Promise.all([
    prisma.user.findMany({
      where: { agencyId: agency.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAgencyOwner: true,
        _count: { select: { organizedEvents: true } },
      },
      orderBy: [{ isAgencyOwner: "desc" }, { name: "asc" }],
    }),
    prisma.event.findMany({
      where: { organizer: { agencyId: agency.id } },
      include: {
        organizer: { select: { name: true, email: true } },
        _count: { select: { sessions: true, registrations: true } },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-ink-900">
            <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
            <span className="text-sm font-semibold tracking-tight">UoN Event Hub</span>
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Organizer dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">{agency.name}</h1>
            <p className="text-sm text-ink-500 mt-1">
              Agency dashboard ·{" "}
              {me.isAgencyOwner ? (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              ) : (
                "Member"
              )}
            </p>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-600">
              Events ({events.length})
            </h2>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 text-left">Event</th>
                  <th className="px-5 py-3 text-left">Organizer</th>
                  <th className="px-5 py-3 text-left">Dates</th>
                  <th className="px-5 py-3 text-right">Sessions</th>
                  <th className="px-5 py-3 text-right">Attendees</th>
                  <th className="px-5 py-3 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-medium text-ink-900">{e.name}</td>
                    <td className="px-5 py-3 text-ink-600">
                      <div>{e.organizer.name}</div>
                      <div className="text-xs text-ink-500">{e.organizer.email}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-600 whitespace-nowrap">
                      {e.startDate.toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">{e._count.sessions}</td>
                    <td className="px-5 py-3 text-right">{e._count.registrations}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/e/${e.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-ink-500">
                      No events from agency organizers yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-600 inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agency members ({members.length})
            </h2>
            <span className="text-xs text-ink-400">
              Hub admin adds/removes members
            </span>
          </div>
          <ul className="card overflow-hidden">
            {members.map((m) => (
              <li
                key={m.id}
                className="px-5 py-3 border-b border-ink-100 last:border-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink-900 inline-flex items-center gap-2">
                    {m.name}
                    {m.isAgencyOwner ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-full px-1.5 py-0.5">
                        <Crown className="h-2.5 w-2.5" /> Owner
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-ink-500">{m.email}</div>
                </div>
                <div className="text-xs text-ink-500 inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {m._count.organizedEvents} event
                  {m._count.organizedEvents === 1 ? "" : "s"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function NoAgencyState() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-ink-100 text-ink-500 flex items-center justify-center mb-6">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">No agency on this account</h1>
        <p className="mt-2 text-sm text-ink-500">
          You aren't a member of any agency yet. Agency owners and partners get a
          dedicated dashboard once the hub admin links them.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Organizer dashboard
        </Link>
      </div>
    </div>
  );
}
