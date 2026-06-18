import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { CheckCircle, Clock } from "lucide-react";

export default async function AdminAttendeesPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const checkedIn = registrations.filter((r) => r.checkedInAt).length;

  return (
    <div className="p-8">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Attendees</h1>
          <p className="text-sm text-ink-500 mt-1">
            {registrations.length} registered · {checkedIn} checked in
          </p>
        </div>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Attendee</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Faculty</th>
              <th className="px-5 py-3 text-left">Registered</th>
              <th className="px-5 py-3 text-left">Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {registrations.map((r) => (
              <tr key={r.id} className="hover:bg-ink-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.user.name} src={r.user.avatarUrl} size={32} />
                    <div>
                      <div className="font-medium">{r.user.name}</div>
                      {r.user.jobTitle ? (
                        <div className="text-xs text-ink-500">{r.user.jobTitle}</div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-600">{r.user.email}</td>
                <td className="px-5 py-3 text-ink-600">{r.user.faculty ?? "—"}</td>
                <td className="px-5 py-3 text-ink-600">
                  {new Date(r.registeredAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  {r.checkedInAt ? (
                    <span className="badge-green inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {new Date(r.checkedInAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span className="badge-gray inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Not yet
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
