import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkTicketAvailability } from "@/lib/tickets";
import { flutterwaveConfigured } from "@/lib/flutterwave";
import { stripeConfigured } from "@/lib/stripe";
import { TicketSelector } from "./TicketSelector";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { cancelled?: string };
}) {
  const session = await getSession();
  if (!session) redirect(`/e/${params.slug}/login?next=/e/${params.slug}/tickets`);

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true, name: true, tagline: true },
  });
  if (!event) notFound();

  const existing = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    select: { id: true },
  });
  if (existing) redirect(`/e/${event.slug}`);

  const tickets = await prisma.ticketType.findMany({
    where: { eventId: event.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
  const myWaitlist = await prisma.waitlistEntry.findMany({
    where: { userId: session.userId, ticketTypeId: { in: tickets.map((t) => t.id) } },
    select: { ticketTypeId: true },
  });
  const onWaitlist = new Set(myWaitlist.map((w) => w.ticketTypeId));

  const view = tickets.map((t) => {
    const av = checkTicketAvailability(t);
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      priceCents: t.priceCents,
      currency: t.currency,
      remaining: av.remaining,
      available: av.available,
      unavailableReason: av.reason ?? null,
      alreadyOnWaitlist: onWaitlist.has(t.id),
    };
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {searchParams.cancelled ? (
        <div className="mb-6 rounded-md bg-amber-50 ring-1 ring-amber-100 p-3 text-sm text-amber-800">
          Checkout was cancelled. Your seat hasn't been reserved.
        </div>
      ) : null}

      <header className="mb-8">
        {event.tagline ? (
          <div className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold">
            {event.tagline}
          </div>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold text-ink-900">
          {event.name} — Tickets
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Choose a ticket type, apply any promo code, and complete payment.
        </p>
      </header>

      {view.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 p-10 text-center text-sm text-ink-500">
          The organiser hasn't published any tickets for this event yet.
        </div>
      ) : (
        <TicketSelector
          slug={event.slug}
          tickets={view}
          flutterwaveEnabled={flutterwaveConfigured()}
          stripeEnabled={stripeConfigured()}
        />
      )}
    </div>
  );
}
