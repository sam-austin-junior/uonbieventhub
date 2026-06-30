import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEventBySlug, checkEventAvailability } from "@/lib/event";
import { EventTopNav } from "@/components/event/EventTopNav";
import { EventUnavailable } from "@/components/event/EventUnavailable";
import { Avatar } from "@/components/ui/Avatar";
import { PwaInstaller } from "@/components/PwaInstaller";
import { ArrowRight } from "lucide-react";

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

  if (!session) {
    return (
      <div className="min-h-screen bg-ink-50 flex flex-col">
        <PublicHeader
          slug={params.slug}
          eventName={event.name}
          eventLogoUrl={event.logoUrl}
        />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    );
  }

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
      <PwaInstaller vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
    </div>
  );
}

function PublicHeader({
  slug,
  eventName,
  eventLogoUrl,
}: {
  slug: string;
  eventName: string;
  eventLogoUrl: string | null;
}) {
  return (
    <header className="bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href={`/e/${slug}`} className="flex items-center gap-3 min-w-0">
          {eventLogoUrl ? (
            <Avatar name={eventName} src={eventLogoUrl} size={32} />
          ) : null}
          <span className="font-semibold text-ink-900 truncate">{eventName}</span>
        </Link>
        <Link
          href={`/e/${slug}/login`}
          className="btn-primary text-sm"
        >
          Sign in <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
