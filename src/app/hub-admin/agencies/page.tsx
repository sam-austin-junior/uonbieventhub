import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AgenciesEditor } from "./AgenciesEditor";

export const dynamic = "force-dynamic";

export default async function AgenciesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/hub-admin/agencies");
  if (session.role !== "SUPERADMIN") redirect("/");

  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, isAgencyOwner: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Agencies</h1>
        <p className="text-sm text-ink-500 mt-1">
          White-label partners that re-sell the platform to their own clients.
          Their events render with the agency's brand instead of UoN Event Hub.
        </p>
      </header>

      <AgenciesEditor
        initialAgencies={agencies.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          logoUrl: a.logoUrl,
          supportEmail: a.supportEmail,
          website: a.website,
          memberCount: a._count.members,
          members: a.members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
            isAgencyOwner: m.isAgencyOwner,
          })),
        }))}
      />
    </div>
  );
}
