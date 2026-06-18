import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, Award, Download, CheckCircle, Clock } from "lucide-react";

export default async function CertificatesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const eligible = registrations.filter((r) => r.checkedInAt);
  const pending = registrations.filter((r) => !r.checkedInAt);

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/admin/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <header className="mt-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 inline-flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" /> Certificates of attendance
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Generated as a styled PDF on demand. Attendees can also download their own from
            <strong> My Schedule</strong> once they've been checked in.
          </p>
        </div>
      </header>

      <section className="card p-5 mb-6">
        <h2 className="font-semibold text-ink-900 mb-1 inline-flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" /> Eligible ({eligible.length})
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          Attendees who have been checked in. Click <strong>Download</strong> to issue.
        </p>
        {eligible.length === 0 ? (
          <p className="text-sm text-ink-500">No-one has been checked in yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {eligible.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <Avatar name={r.user.name} src={r.user.avatarUrl} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900 truncate">{r.user.name}</div>
                  <div className="text-xs text-ink-500 truncate">
                    {r.user.email} · checked in {new Date(r.checkedInAt!).toLocaleString()}
                  </div>
                </div>
                <a
                  href={`/api/e/${event.slug}/certificate?userId=${r.userId}`}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 ? (
        <section className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-1 inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" /> Not yet eligible ({pending.length})
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Registered but haven't been checked in. They become eligible after QR check-in.
          </p>
          <ul className="divide-y divide-ink-100">
            {pending.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <Avatar name={r.user.name} src={r.user.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-900 truncate">{r.user.name}</div>
                  <div className="text-xs text-ink-500 truncate">{r.user.email}</div>
                </div>
                <span className="badge-gray">Pending check-in</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
