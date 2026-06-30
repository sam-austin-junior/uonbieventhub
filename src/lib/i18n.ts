import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

export { LOCALE_COOKIE, LOCALE_LABELS, localeLabel, parseLocales } from "./locales";
import { LOCALE_COOKIE, parseLocales } from "./locales";

/**
 * Resolve the locale to use for a given request, in priority order:
 *  1. Explicit ?lng= query param (caller already set it, e.g. router param)
 *  2. uon_locale cookie (set by the picker)
 *  3. Accept-Language header best-match against supportedLocales
 *  4. The event's defaultLocale
 */
export function resolveLocale(args: {
  explicit?: string | null;
  supportedLocales: string[];
  defaultLocale: string;
}): string {
  const supported = new Set(args.supportedLocales);
  if (args.explicit && supported.has(args.explicit)) return args.explicit;

  const cookieVal = cookies().get(LOCALE_COOKIE)?.value;
  if (cookieVal && supported.has(cookieVal)) return cookieVal;

  const accept = headers().get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.split(";")[0].trim().toLowerCase();
    if (!code) continue;
    if (supported.has(code)) return code;
    const short = code.split("-")[0];
    if (supported.has(short)) return short;
  }
  return args.defaultLocale;
}

export type LocalisedEvent = {
  name: string;
  tagline: string | null;
  description: string;
  venue: string | null;
  defaultLocale: string;
  supportedLocales: string[];
  activeLocale: string;
};

/**
 * Load + apply translations onto an event row. Falls back to the
 * default-locale (original Event row) field-by-field when a
 * translation is partial.
 */
export async function applyEventTranslation(
  event: {
    id: string;
    name: string;
    tagline: string | null;
    description: string;
    venue: string | null;
    defaultLocale: string;
    supportedLocales: string;
  },
  explicit?: string | null,
): Promise<LocalisedEvent> {
  const supportedLocales = parseLocales(event.supportedLocales, event.defaultLocale);
  const activeLocale = resolveLocale({
    explicit,
    supportedLocales,
    defaultLocale: event.defaultLocale,
  });

  // No-op if asking for the default locale.
  if (activeLocale === event.defaultLocale) {
    return {
      name: event.name,
      tagline: event.tagline,
      description: event.description,
      venue: event.venue,
      defaultLocale: event.defaultLocale,
      supportedLocales,
      activeLocale,
    };
  }

  const tr = await prisma.eventTranslation.findUnique({
    where: { eventId_locale: { eventId: event.id, locale: activeLocale } },
  });
  return {
    name: tr?.name?.trim() || event.name,
    tagline: tr?.tagline?.trim() || event.tagline,
    description: tr?.description?.trim() || event.description,
    venue: tr?.venue?.trim() || event.venue,
    defaultLocale: event.defaultLocale,
    supportedLocales,
    activeLocale,
  };
}

