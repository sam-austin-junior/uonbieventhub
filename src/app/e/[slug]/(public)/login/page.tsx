import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEventBySlug, checkEventAvailability } from "@/lib/event";
import { EventLoginCard } from "./EventLoginCard";
import { EventUnavailable } from "@/components/event/EventUnavailable";

export const dynamic = "force-dynamic";

export default async function EventLoginPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  const availability = checkEventAvailability(event);
  if (!availability.available) {
    return (
      <EventUnavailable
        reason={availability.reason}
        eventName={event.name}
        eventLogoUrl={event.logoUrl}
        coverImage={event.coverImage}
        suspendedSince={availability.suspendedSince}
      />
    );
  }

  const session = await getSession();
  if (session) {
    const reg = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    });
    if (reg || session.role === "SUPERADMIN") {
      redirect(`/e/${params.slug}`);
    }
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-6 relative bg-ink-900"
      style={
        event.coverImage
          ? {
              backgroundImage: `linear-gradient(rgba(11,20,38,0.55), rgba(11,20,38,0.55)), url("${event.coverImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <EventLoginCard
        slug={event.slug}
        eventName={event.name}
        eventLogoUrl={event.logoUrl}
        attendeeMode={event.attendeeMode}
      />
    </main>
  );
}
