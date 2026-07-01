import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function AllEvents() {
  // Explicit select — only pull the columns the table renders. Resilient
  // to Prisma-vs-DB schema drift on Event.
  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      startDate: true,
      attendeeMode: true,
      organizer: { select: { name: true, email: true } },
      _count: { select: { sessions: true, registrations: true } },
    },
  });

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">All events</h1>
        <p className="text-sm text-ink-500 mt-1">
          {events.length} event{events.length === 1 ? "" : "s"} across the hub.
        </p>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Event</th>
              <th className="px-5 py-3 text-left">Organizer</th>
              <th className="px-5 py-3 text-left">Dates</th>
              <th className="px-5 py-3 text-left">Mode</th>
              <th className="px-5 py-3 text-left">URL</th>
              <th className="px-5 py-3 text-right">Sessions</th>
              <th className="px-5 py-3 text-right">Attending</th>
              <th className="px-5 py-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-ink-50">
                <td className="px-5 py-3 font-medium text-ink-900">{e.name}</td>
                <td className="px-5 py-3 text-ink-600">
                  <div>{e.organizer.name}</div>
                  <div className="text-xs text-ink-500">{e.organizer.email}</div>
                </td>
                <td className="px-5 py-3 text-ink-600 whitespace-nowrap">{formatDate(e.startDate)}</td>
                <td className="px-5 py-3">
                  <span className={e.attendeeMode === "OPEN" ? "badge-brand" : "badge-accent"}>
                    {e.attendeeMode === "OPEN" ? "Open" : "Invite-only"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/e/${e.slug}`} target="_blank" className="text-brand-700 hover:underline inline-flex items-center gap-1 font-mono text-xs">
                    /e/{e.slug} <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
                <td className="px-5 py-3 text-right">{e._count.sessions}</td>
                <td className="px-5 py-3 text-right">{e._count.registrations}</td>
                <td className="px-3 py-3 text-right">
                  <DeleteEventButton eventId={e.id} eventName={e.name} eventSlug={e.slug} />
                </td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-ink-500">No events yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
