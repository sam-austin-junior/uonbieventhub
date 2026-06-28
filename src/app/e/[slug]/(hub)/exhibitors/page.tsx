import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExternalLink, Mail, MapPin } from "lucide-react";

export default async function ExhibitorsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { category?: string };
}) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const exhibitors = await prisma.exhibitor.findMany({
    where: {
      eventId: event.id,
      ...(searchParams.category ? { category: searchParams.category } : {}),
    },
    orderBy: { name: "asc" },
  });

  const allCategories = await prisma.exhibitor.findMany({
    where: { eventId: event.id },
    select: { category: true },
  });
  const categories = Array.from(
    new Set(allCategories.map((c) => c.category).filter(Boolean) as string[])
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Exhibitors</h1>
          <p className="text-sm text-ink-500 mt-1">
            Visit the {exhibitors.length} organizations exhibiting at this event.
          </p>
        </div>
        <form className="flex gap-2" action="">
          <select name="category" defaultValue={searchParams.category ?? ""} className="input w-56">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="btn-primary">Filter</button>
        </form>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {exhibitors.map((e) => (
          <div key={e.id} className="card p-5">
            <div className="flex items-start gap-4">
              {e.logoUrl ? (
                <Image
                  src={e.logoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-md object-cover ring-1 ring-ink-100 bg-white"
                />
              ) : (
                <div className="h-14 w-14 rounded-md bg-ink-100" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink-900">{e.name}</h3>
                {e.tagline ? (
                  <p className="text-sm text-ink-500 line-clamp-1">{e.tagline}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {e.category ? <span className="badge-brand">{e.category}</span> : null}
                  {e.boothNumber ? (
                    <span className="badge-gray inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Booth {e.boothNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-600 line-clamp-3">{e.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {e.website ? (
                <a
                  href={e.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Visit website
                </a>
              ) : null}
              {e.email ? (
                <a
                  href={`mailto:${e.email}`}
                  className="text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" /> Contact
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
