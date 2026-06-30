import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { SpeakerProfileEditor } from "./SpeakerProfileEditor";
import { SpeakerSessionCard } from "./SpeakerSessionCard";
import { Mic2, Calendar, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SpeakerPortalPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/speaker");

  // Auto-link any Speaker rows that match the signed-in user's email but
  // were never claimed (organizer added them by email; speaker now signs
  // in for the first time).
  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  if (!me) redirect("/login");

  await prisma.speaker.updateMany({
    where: { email: me.email.toLowerCase(), userId: null },
    data: { userId: me.id },
  });

  const speakers = await prisma.speaker.findMany({
    where: { userId: me.id },
    include: {
      event: {
        select: {
          id: true,
          slug: true,
          name: true,
          startDate: true,
          endDate: true,
          logoUrl: true,
        },
      },
      sessions: {
        include: {
          session: {
            include: {
              _count: { select: { registrations: true } },
            },
          },
        },
      },
    },
    orderBy: { event: { startDate: "asc" } },
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
            <Mic2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
              Speaker portal
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Manage your speaker profile and upload session materials.
            </p>
          </div>
        </div>

        {speakers.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">
            You're not listed as a speaker on any event yet. If you're expecting
            to be, ask the organiser to add your email — your profile here will
            appear automatically the next time you visit.
          </div>
        ) : (
          <div className="space-y-10">
            {speakers.map((sp) => (
              <section key={sp.id} className="space-y-5">
                <div className="flex items-end justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sp.event.startDate).toLocaleDateString()} →{" "}
                      {new Date(sp.event.endDate).toLocaleDateString()}
                    </div>
                    <h2 className="text-xl font-bold text-ink-900 mt-1">
                      {sp.event.name}
                    </h2>
                  </div>
                  <Link
                    href={`/e/${sp.event.slug}`}
                    target="_blank"
                    className="text-sm text-brand-700 hover:underline"
                  >
                    View event page →
                  </Link>
                </div>

                <SpeakerProfileEditor
                  speakerId={sp.id}
                  initialName={sp.name}
                  initialJobTitle={sp.jobTitle}
                  initialOrganization={sp.organization}
                  initialBio={sp.bio}
                  initialPhotoUrl={sp.photoUrl}
                  initialLinkedinUrl={sp.linkedinUrl}
                  initialTwitterUrl={sp.twitterUrl}
                />

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-600 mb-3">
                    Your sessions ({sp.sessions.length})
                  </h3>
                  {sp.sessions.length === 0 ? (
                    <div className="text-sm text-ink-500">
                      No sessions assigned to you yet on this event.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sp.sessions.map(({ session: s }) => (
                        <SpeakerSessionCard
                          key={s.id}
                          sessionId={s.id}
                          title={s.title}
                          startTime={s.startTime.toISOString()}
                          endTime={s.endTime.toISOString()}
                          location={s.location}
                          slidesUrl={s.slidesUrl}
                          notesUrl={s.notesUrl}
                          attendeeCount={s._count.registrations}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
