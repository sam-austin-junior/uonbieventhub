import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEventBySlug, checkEventAvailability } from "@/lib/event";
import { EventTopNav } from "@/components/event/EventTopNav";
import { EventUnavailable } from "@/components/event/EventUnavailable";

export default async function EventHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
  if (!session) redirect(`/e/${params.slug}/login`);

  const registered = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
  });
  if (!registered && session.role !== "SUPERADMIN") {
    redirect(`/e/${params.slug}/login`);
  }

  const [customPages, unreadMessages, unreadNotifications, me] = await Promise.all([
    prisma.customPage.findMany({
      where: { eventId: event.id, showInNav: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
    prisma.message.count({ where: { receiverId: session.userId, readAt: null } }),
    prisma.notification.count({
      where: { userId: session.userId, eventId: event.id, readAt: null },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <EventTopNav
        slug={event.slug}
        eventName={event.name}
        eventLogoUrl={event.logoUrl}
        customPages={customPages}
        user={{ name: session.name, role: session.role, avatarUrl: me?.avatarUrl }}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
