import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { BoothLeadConsole } from "./BoothLeadConsole";
import { ArrowLeft, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExhibitorBoothPage({
  params,
}: {
  params: { exhibitorId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/exhibitor");

  const membership = await prisma.exhibitorMember.findFirst({
    where: { exhibitorId: params.exhibitorId, userId: session.userId },
    include: {
      exhibitor: {
        include: { event: { select: { id: true, slug: true, name: true } } },
      },
    },
  });
  if (!membership) notFound();
  const { exhibitor } = membership;

  const leads = await prisma.lead.findMany({
    where: { exhibitorId: exhibitor.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          organization: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/exhibitor"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" /> All booths
          </Link>
          <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold">
            {exhibitor.event.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            {exhibitor.name}
          </h1>
        </div>

        <BoothLeadConsole
          exhibitorId={exhibitor.id}
          initialLeads={leads.map((l) => ({
            id: l.id,
            notes: l.notes,
            qualified: l.qualified,
            createdAt: l.createdAt.toISOString(),
            attendee: l.user,
          }))}
        />

        <div className="mt-6 flex justify-end">
          <a
            href={`/api/exhibitor/${exhibitor.id}/leads/export`}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800 transition"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
