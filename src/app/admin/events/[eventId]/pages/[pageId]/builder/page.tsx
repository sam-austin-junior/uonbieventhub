import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { parseBlocks } from "@/lib/blocks";
import { BlockBuilder } from "./BlockBuilder";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PageBuilderRoute({
  params,
}: {
  params: { eventId: string; pageId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const page = await prisma.customPage.findFirst({
    where: { id: params.pageId, eventId: event.id },
  });
  if (!page) notFound();

  const blocks = parseBlocks(page.blocks) ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <Link
          href={`/admin/events/${event.id}/pages`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All pages
        </Link>
        <Link
          href={`/e/${event.slug}/pages/${page.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          Preview <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Page builder</h1>
        <p className="text-sm text-ink-500 mt-1">
          Editing <span className="font-semibold text-ink-700">{page.title}</span>{" "}
          (/e/{event.slug}/pages/{page.id}). Compose blocks below — they render
          top-to-bottom on the public page.
        </p>
      </header>

      <BlockBuilder pageId={page.id} initialBlocks={blocks} />
    </div>
  );
}
