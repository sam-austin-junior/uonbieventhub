import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const meetings = await prisma.meetingRequest.findMany({
    where: { eventId: event.id },
    include: {
      requester: { select: { name: true, email: true } },
      recipient: { select: { name: true, email: true } },
    },
    orderBy: { proposedStart: "asc" },
  });

  const stats = {
    total: meetings.length,
    accepted: meetings.filter((m) => m.status === "accepted").length,
    pending: meetings.filter((m) => m.status === "pending").length,
    declined: meetings.filter((m) => m.status === "declined").length,
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Meetings</h1>
        <p className="text-sm text-ink-500 mt-1">
          Overview of attendee-to-attendee meeting requests. Attendees manage
          their own meetings from the event hub.
        </p>
      </header>

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={stats.total} />
        <Stat label="Accepted" value={stats.accepted} tone="emerald" />
        <Stat label="Pending" value={stats.pending} tone="amber" />
        <Stat label="Declined / cancelled" value={stats.declined + meetings.filter((m) => m.status === "cancelled").length} tone="ink" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">When</th>
              <th className="px-5 py-3 text-left">Requester</th>
              <th className="px-5 py-3 text-left">Recipient</th>
              <th className="px-5 py-3 text-left">Location</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {meetings.map((m) => (
              <tr key={m.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3 text-ink-700 whitespace-nowrap">
                  {m.proposedStart.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-ink-700">
                  <div>{m.requester.name}</div>
                  <div className="text-xs text-ink-500">{m.requester.email}</div>
                </td>
                <td className="px-5 py-3 text-ink-700">
                  <div>{m.recipient.name}</div>
                  <div className="text-xs text-ink-500">{m.recipient.email}</div>
                </td>
                <td className="px-5 py-3 text-ink-600">{m.location ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={badgeClass(m.status)}>{m.status}</span>
                </td>
              </tr>
            ))}
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                  No meeting requests yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: "brand" | "emerald" | "amber" | "ink";
}) {
  const accent =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
      ? "text-amber-700"
      : tone === "ink"
      ? "text-ink-700"
      : "text-brand-700";
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function badgeClass(status: string) {
  switch (status) {
    case "accepted":
      return "badge-green";
    case "pending":
      return "badge-accent";
    case "declined":
    case "cancelled":
      return "badge-gray";
    default:
      return "badge-gray";
  }
}
