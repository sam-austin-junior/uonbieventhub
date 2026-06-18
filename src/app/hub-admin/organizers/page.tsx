import { prisma } from "@/lib/prisma";
import { OrganizersClient } from "./OrganizersClient";

export default async function OrganizersPage() {
  const organizers = await prisma.user.findMany({
    where: { role: "ORGANIZER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { organizedEvents: true } } },
  });

  return (
    <div className="p-8">
      <OrganizersClient
        rows={organizers.map((o) => ({
          id: o.id,
          name: o.name,
          email: o.email,
          organization: o.organization,
          activatedAt: o.activatedAt?.toISOString() ?? null,
          expiresAt: o.expiresAt?.toISOString() ?? null,
          suspendedAt: o.suspendedAt?.toISOString() ?? null,
          eventCount: o._count.organizedEvents,
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
