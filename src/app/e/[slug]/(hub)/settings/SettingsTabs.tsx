"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "languageAndTime", label: "Language & Time" },
  { id: "privacy", label: "Privacy" },
];

export function SettingsTabs({ slug, current }: { slug: string; current: string }) {
  return (
    <nav className="space-y-1">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`/e/${slug}/settings?tabId=${t.id}`}
          className={cn(
            "block rounded-md px-3 py-2 text-sm",
            current === t.id
              ? "bg-brand-50 text-brand-800 font-medium"
              : "text-ink-600 hover:bg-ink-100"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
