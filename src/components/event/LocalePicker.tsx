"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { LOCALE_LABELS } from "@/lib/locales";

export function LocalePicker({
  supportedLocales,
  activeLocale,
}: {
  supportedLocales: string[];
  activeLocale: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (supportedLocales.length <= 1) return null;

  async function pick(locale: string) {
    if (locale === activeLocale) {
      setOpen(false);
      return;
    }
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-200 hover:ring-ink-400 px-3 py-1.5 text-xs font-medium text-ink-700 transition"
      >
        <Globe className="h-3.5 w-3.5" />
        {LOCALE_LABELS[activeLocale] ?? activeLocale.toUpperCase()}
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white ring-1 ring-ink-200 shadow-pop py-1 z-50">
          {supportedLocales.map((code) => (
            <button
              key={code}
              onClick={() => pick(code)}
              className="w-full text-left px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50 flex items-center justify-between"
            >
              <span>
                {LOCALE_LABELS[code] ?? code.toUpperCase()}
                <span className="ml-2 text-xs text-ink-400 font-mono">{code}</span>
              </span>
              {code === activeLocale ? (
                <Check className="h-3.5 w-3.5 text-brand-700" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
