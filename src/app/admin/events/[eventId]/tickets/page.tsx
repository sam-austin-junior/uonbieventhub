import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { TicketsEditor } from "./TicketsEditor";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const tickets = await prisma.ticketType.findMany({
    where: { eventId: event.id },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Tickets</h1>
        <p className="text-sm text-ink-500 mt-1">
          Define ticket types attendees can buy. Each ticket can have its own
          price, currency, capacity and sale window. Set the price to{" "}
          <span className="font-mono">0</span> for free registration.
        </p>
      </header>
      <TicketsEditor
        eventId={event.id}
        initialTickets={tickets.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          priceCents: t.priceCents,
          currency: t.currency,
          capacity: t.capacity,
          soldCount: t.soldCount,
          saleStartsAt: t.saleStartsAt?.toISOString() ?? null,
          saleEndsAt: t.saleEndsAt?.toISOString() ?? null,
          sortOrder: t.sortOrder,
          active: t.active,
        }))}
      />
    </div>
  );
}
