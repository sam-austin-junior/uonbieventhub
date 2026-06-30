/**
 * Client-safe locale metadata. No server-only imports — both client and
 * server modules can pull from here. The server-only resolver lives in
 * lib/i18n.ts.
 */

export const LOCALE_COOKIE = "uon_locale";

export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  sw: "Kiswahili",
  ar: "العربية",
  zh: "中文",
  hi: "हिन्दी",
  ja: "日本語",
};

export function localeLabel(code: string) {
  return LOCALE_LABELS[code] ?? code.toUpperCase();
}

export function parseLocales(csv: string, defaultLocale: string): string[] {
  const list = (csv ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(defaultLocale)) list.unshift(defaultLocale);
  return Array.from(new Set(list));
}
