import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { PromoCodesEditor } from "./PromoCodesEditor";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const [codes, tickets] = await Promise.all([
    prisma.promoCode.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticketType.findMany({
      where: { eventId: event.id },
      orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Promo codes</h1>
        <p className="text-sm text-ink-500 mt-1">
          Create discount codes attendees can enter at checkout. Restrict to a
          single ticket type, cap total uses, or set a validity window.
        </p>
      </header>

      <PromoCodesEditor
        eventId={event.id}
        ticketTypes={tickets}
        initialCodes={codes.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          validFrom: c.validFrom?.toISOString() ?? null,
          validUntil: c.validUntil?.toISOString() ?? null,
          ticketTypeId: c.ticketTypeId,
          active: c.active,
        }))}
      />
    </div>
  );
}
