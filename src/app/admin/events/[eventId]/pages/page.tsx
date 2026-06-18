import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagesTable } from "./PagesTable";

export default async function AdminPagesList({ params }: { params: { eventId: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const pages = await prisma.customPage.findMany({
    where: { eventId: event.id },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-8">
      <PagesTable eventId={event.id} rows={pages} />
    </div>
  );
}
