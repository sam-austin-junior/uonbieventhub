import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { ArrowLeft } from "lucide-react";
import { StaffEditor } from "./StaffEditor";

export const dynamic = "force-dynamic";

export default async function ExhibitorStaffPage({
  params,
}: {
  params: { eventId: string; exhibitorId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const exhibitor = await prisma.exhibitor.findFirst({
    where: { id: params.exhibitorId, eventId: event.id },
  });
  if (!exhibitor) notFound();

  const [members, leadCount] = await Promise.all([
    prisma.exhibitorMember.findMany({
      where: { exhibitorId: exhibitor.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.lead.count({ where: { exhibitorId: exhibitor.id } }),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link
        href={`/admin/events/${event.id}/exhibitors`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All exhibitors
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">{exhibitor.name}</h1>
        <p className="text-sm text-ink-500 mt-1">
          Booth team and lead capture. Staff sign in to{" "}
          <Link href="/exhibitor" className="text-brand-700 hover:underline">
            /exhibitor
          </Link>{" "}
          to scan badges and export leads.
        </p>
      </header>

      <div className="mb-6 grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-500">
            Team size
          </div>
          <div className="text-2xl font-bold text-ink-900 mt-1">
            {members.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-ink-500">
            Leads captured
          </div>
          <div className="text-2xl font-bold text-ink-900 mt-1">
            {leadCount}
          </div>
        </div>
      </div>

      <StaffEditor
        exhibitorId={exhibitor.id}
        initialMembers={members.map((m) => ({
          id: m.id,
          isOwner: m.isOwner,
          user: m.user,
        }))}
      />
    </div>
  );
}
