import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/event";

export default async function CustomPageView({
  params,
}: {
  params: { slug: string; pageId: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const page = await prisma.customPage.findUnique({ where: { id: params.pageId } });
  if (!page || page.eventId !== event.id) notFound();

  const paragraphs = page.body.split(/\n\n+/);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-ink-900 mb-4">{page.title}</h1>
      <div className="card p-8 space-y-4 text-ink-700 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
