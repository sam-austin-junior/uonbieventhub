import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExhibitorsTable } from "./ExhibitorsTable";

export default async function AdminExhibitorsPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const exhibitors = await prisma.exhibitor.findMany({
    where: { eventId: event.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <ExhibitorsTable eventId={event.id} rows={exhibitors} />
    </div>
  );
}
