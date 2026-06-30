import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { LOCALE_LABELS, parseLocales } from "@/lib/i18n";
import { TranslationsEditor } from "./TranslationsEditor";

export const dynamic = "force-dynamic";

export default async function TranslationsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const translations = await prisma.eventTranslation.findMany({
    where: { eventId: event.id },
    orderBy: { locale: "asc" },
  });

  const supported = parseLocales(event.supportedLocales, event.defaultLocale);

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Translations</h1>
        <p className="text-sm text-ink-500 mt-1">
          Translate the event name, tagline, description and venue so attendees
          see them in their language. The default locale ({event.defaultLocale}{" "}
          — {LOCALE_LABELS[event.defaultLocale] ?? event.defaultLocale}) reads
          from the main event fields and falls back when a translation is empty.
        </p>
      </header>

      <TranslationsEditor
        eventId={event.id}
        defaultLocale={event.defaultLocale}
        baseEvent={{
          name: event.name,
          tagline: event.tagline,
          description: event.description,
          venue: event.venue,
        }}
        supportedLocales={supported}
        initialTranslations={translations.map((t) => ({
          locale: t.locale,
          name: t.name ?? "",
          tagline: t.tagline ?? "",
          description: t.description ?? "",
          venue: t.venue ?? "",
        }))}
        availableLocales={Object.entries(LOCALE_LABELS).map(([code, label]) => ({
          code,
          label,
        }))}
      />
    </div>
  );
}
