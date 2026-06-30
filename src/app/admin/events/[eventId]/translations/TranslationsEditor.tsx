"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Languages,
  Globe,
} from "lucide-react";

type Translation = {
  locale: string;
  name: string;
  tagline: string;
  description: string;
  venue: string;
};

export function TranslationsEditor({
  eventId,
  defaultLocale,
  baseEvent,
  supportedLocales,
  initialTranslations,
  availableLocales,
}: {
  eventId: string;
  defaultLocale: string;
  baseEvent: {
    name: string;
    tagline: string | null;
    description: string;
    venue: string | null;
  };
  supportedLocales: string[];
  initialTranslations: Translation[];
  availableLocales: { code: string; label: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [translations, setTranslations] = useState(initialTranslations);
  const [adding, setAdding] = useState(false);
  const [newLocale, setNewLocale] = useState("");

  const used = new Set([defaultLocale, ...translations.map((t) => t.locale)]);
  const addable = availableLocales.filter((l) => !used.has(l.code));

  function addLocale() {
    if (!newLocale) return;
    setTranslations((prev) => [
      ...prev,
      {
        locale: newLocale,
        name: "",
        tagline: "",
        description: "",
        venue: "",
      },
    ]);
    setNewLocale("");
    setAdding(false);
  }

  async function remove(locale: string) {
    if (!confirm(`Remove the ${locale} translation? Attendees will see the default.`))
      return;
    const res = await fetch(
      `/api/admin/events/${eventId}/translations/${locale}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    setTranslations((prev) => prev.filter((t) => t.locale !== locale));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-ink-900">
              Default locale: {defaultLocale}
            </h2>
            <p className="text-sm text-ink-500 mt-0.5">
              These are the original event fields. Translations below override
              them when an attendee picks another language.
            </p>
          </div>
        </div>
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-ink-500 text-xs uppercase tracking-wider">Name</dt>
          <dd className="text-ink-900">{baseEvent.name}</dd>
          {baseEvent.tagline ? (
            <>
              <dt className="text-ink-500 text-xs uppercase tracking-wider">Tagline</dt>
              <dd className="text-ink-900">{baseEvent.tagline}</dd>
            </>
          ) : null}
          {baseEvent.venue ? (
            <>
              <dt className="text-ink-500 text-xs uppercase tracking-wider">Venue</dt>
              <dd className="text-ink-900">{baseEvent.venue}</dd>
            </>
          ) : null}
        </dl>
      </section>

      {translations.map((t, idx) => (
        <TranslationCard
          key={t.locale}
          eventId={eventId}
          translation={t}
          availableLocales={availableLocales}
          onRemove={() => remove(t.locale)}
          onChange={(next) =>
            setTranslations((arr) => arr.map((it, i) => (i === idx ? next : it)))
          }
        />
      ))}

      {adding ? (
        <div className="card p-5 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Add a language</label>
            <select
              className="input"
              value={newLocale}
              onChange={(e) => setNewLocale(e.target.value)}
            >
              <option value="">— Pick a language —</option>
              {addable.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={addLocale} disabled={!newLocale} className="btn-primary">
              Add
            </button>
          </div>
        </div>
      ) : addable.length > 0 ? (
        <button
          onClick={() => setAdding(true)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add a language
        </button>
      ) : null}
    </div>
  );
}

function TranslationCard({
  eventId,
  translation,
  availableLocales,
  onChange,
  onRemove,
}: {
  eventId: string;
  translation: Translation;
  availableLocales: { code: string; label: string }[];
  onChange: (next: Translation) => void;
  onRemove: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(translation.name);
  const [tagline, setTagline] = useState(translation.tagline);
  const [description, setDescription] = useState(translation.description);
  const [venue, setVenue] = useState(translation.venue);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label =
    availableLocales.find((l) => l.code === translation.locale)?.label ??
    translation.locale;

  async function save() {
    setError(null);
    setInfo(null);
    setSaving(true);
    const res = await fetch(
      `/api/admin/events/${eventId}/translations/${translation.locale}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          tagline: tagline || null,
          description: description || null,
          venue: venue || null,
        }),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    onChange({ ...translation, name, tagline, description, venue });
    setInfo("Translation saved.");
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2 font-semibold text-ink-900">
          <Languages className="h-4 w-4 text-brand-700" />
          {label}
          <span className="text-xs font-mono text-ink-400">
            {translation.locale}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-ink-500 hover:text-red-600"
          aria-label="Remove translation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leave blank to use default"
          />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input
            className="input"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Leave blank to use default"
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Leave blank to use default"
          />
        </div>
        <div>
          <label className="label">Venue</label>
          <input
            className="input"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Leave blank to use default"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs">
          {error ? (
            <span className="text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
          ) : info ? (
            <span className="text-emerald-700 inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {info}
            </span>
          ) : null}
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  );
}
