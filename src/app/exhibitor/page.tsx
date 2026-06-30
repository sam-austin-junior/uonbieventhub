import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Store, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExhibitorIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/exhibitor");

  const memberships = await prisma.exhibitorMember.findMany({
    where: { userId: session.userId },
    include: {
      exhibitor: {
        include: {
          event: { select: { id: true, slug: true, name: true, startDate: true } },
          _count: { select: { leads: true } },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink-900"
            aria-label="UoN Event Hub"
          >
            <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
            <span className="text-sm font-semibold tracking-tight">UoN Event Hub</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
              Exhibitor portal
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Scan attendee badges to capture leads at your booth, then export
              them as CSV.
            </p>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">
            You're not on any exhibitor staff team yet. If you should be, ask
            the event organiser to add your email to the booth team.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {memberships.map((m) => (
              <li key={m.id} className="card p-5">
                <div className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold">
                  {m.exhibitor.event.name}
                </div>
                <h2 className="mt-1 text-lg font-bold text-ink-900">
                  {m.exhibitor.name}
                </h2>
                <div className="mt-1 text-xs text-ink-500">
                  {m.exhibitor._count.leads} lead
                  {m.exhibitor._count.leads === 1 ? "" : "s"} captured
                  {m.isOwner ? " · You're the booth owner" : ""}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/exhibitor/${m.exhibitor.id}`}
                    className="btn-primary text-sm flex-1 justify-center"
                  >
                    Open booth
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
