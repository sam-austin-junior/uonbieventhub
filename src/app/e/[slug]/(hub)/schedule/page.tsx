import Link from "next/link";
import QRCode from "qrcode";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatTime, formatDay } from "@/lib/utils";
import { Clock, MapPin, QrCode, Award, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MySchedulePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const registration = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
  });

  const myRegs = await prisma.sessionRegistration.findMany({
    where: {
      userId: session.userId,
      session: { eventId: event.id },
    },
    include: { session: { include: { speakers: { include: { speaker: true } } } } },
    orderBy: { session: { startTime: "asc" } },
  });

  const grouped = new Map<string, typeof myRegs>();
  for (const r of myRegs) {
    const key = new Date(r.session.startTime).toDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const qrDataUrl = registration
    ? await QRCode.toDataURL(registration.qrToken, { width: 220, margin: 1 })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">My Schedule</h1>
        <p className="text-sm text-ink-500 mt-1">
          Sessions you've added to your personal agenda for {event.name}.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {myRegs.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Browse sessions and tap 'Add to my schedule' to build your personal agenda."
              action={
                <Link href={`/e/${event.slug}/sessions`} className="btn-primary">
                  Browse sessions
                </Link>
              }
            />
          ) : (
            Array.from(grouped.entries()).map(([day, regs]) => (
              <section key={day}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
                  {formatDay(day)}
                </h2>
                <div className="space-y-3">
                  {regs.map(({ session: s }) => (
                    <Link
                      key={s.id}
                      href={`/e/${event.slug}/sessions/${s.id}`}
                      className="card p-4 flex items-start gap-4 hover:shadow-pop transition-shadow"
                    >
                      <div className="shrink-0 w-24">
                        <div className="text-sm font-semibold text-brand-700 inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(s.startTime)}
                        </div>
                        <div className="text-xs text-ink-400">to {formatTime(s.endTime)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-ink-900">{s.title}</h3>
                        {s.location ? (
                          <div className="text-xs text-ink-500 mt-1 inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {s.location}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-6">
          {qrDataUrl ? (
            <div className="card p-5 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-500 font-semibold">
                <QrCode className="h-3.5 w-3.5" /> Your check-in code
              </div>
              <img src={qrDataUrl} alt="Check-in QR" className="mx-auto mt-3" />
              <p className="text-xs text-ink-500 mt-3">
                Show this at the registration desk and at session entry points for fast check-in.
              </p>
              {registration?.checkedInAt ? (
                <div className="mt-3 badge-green inline-flex">
                  Checked in {new Date(registration.checkedInAt).toLocaleDateString()}
                </div>
              ) : null}
            </div>
          ) : null}

          {registration?.checkedInAt ? (
            <div className="card p-5">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-500 font-semibold mb-2">
                <Award className="h-3.5 w-3.5 text-accent" /> Certificate of attendance
              </div>
              <p className="text-xs text-ink-500 mb-3">
                You've been checked in — your certificate is ready to download.
              </p>
              <a
                href={`/api/e/${event.slug}/certificate`}
                className="btn-primary w-full justify-center"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
