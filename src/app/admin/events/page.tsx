import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { requireStaff, eventScope } from "@/lib/admin-scope";
import { ExternalLink } from "lucide-react";

export default async function AdminEventsList() {
  const session = await requireStaff();
  const scope = eventScope(session);

  const events = await prisma.event.findMany({
    where: scope,
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { sessions: true, registrations: true } },
      organizer: session.role === "SUPERADMIN" ? { select: { name: true, email: true } } : false,
    },
  });

  return (
    <div className="p-4 sm:p-8">
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Events</h1>
          <p className="text-sm text-ink-500 mt-1">
            {session.role === "SUPERADMIN" ? "All events across the hub." : "Your events only."}
          </p>
        </div>
        <Link href="/admin/events/new" className="btn-primary">
          New event
        </Link>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3 text-left">Event</th>
                {session.role === "SUPERADMIN" ? <th className="px-5 py-3 text-left">Organizer</th> : null}
                <th className="px-5 py-3 text-left">Dates</th>
                <th className="px-5 py-3 text-left">Mode</th>
                <th className="px-5 py-3 text-left">URL</th>
                <th className="px-5 py-3 text-right">Sessions</th>
                <th className="px-5 py-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/events/${e.id}`} className="font-medium text-brand-700 hover:underline">
                      {e.name}
                    </Link>
                    {e.tagline ? <div className="text-xs text-ink-500">{e.tagline}</div> : null}
                  </td>
                  {session.role === "SUPERADMIN" ? (
                    <td className="px-5 py-3 text-ink-700">
                      <div>{(e as any).organizer?.name ?? "—"}</div>
                      <div className="text-xs text-ink-500">{(e as any).organizer?.email}</div>
                    </td>
                  ) : null}
                  <td className="px-5 py-3 text-ink-700 whitespace-nowrap">
                    {formatDate(e.startDate)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={e.attendeeMode === "OPEN" ? "badge-brand" : "badge-accent"}>
                      {e.attendeeMode === "OPEN" ? "Open" : "Invite-only"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/e/${e.slug}`}
                      target="_blank"
                      className="text-brand-700 hover:underline inline-flex items-center gap-1 font-mono text-xs"
                    >
                      /e/{e.slug} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{e._count.sessions}</td>
                  <td className="px-5 py-3 text-right font-semibold">{e._count.registrations}</td>
                </tr>
              ))}
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                    No events yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
