"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, CheckCircle, Loader2, AlertCircle, X } from "lucide-react";

export function CustomDomainCard({
  eventId,
  initial,
  slug,
  platformHost,
}: {
  eventId: string;
  initial: string | null;
  slug: string;
  platformHost: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(next: string | null) {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/admin/events/${eventId}/domain`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ customDomain: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <section className="card p-5 mb-6">
      <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
        <Globe className="h-4 w-4 text-brand-700" /> Custom domain
      </h2>
      <p className="text-sm text-ink-500 mt-1">
        Point a domain you own (like{" "}
        <span className="font-mono text-ink-700">events.example.com</span>) at
        this event and attendees will visit it instead of{" "}
        <span className="font-mono text-ink-700">
          {platformHost}/e/{slug}
        </span>
        .
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(value.trim() || null);
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[240px]">
          <label className="label">Domain</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="events.example.com"
            className="input"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
          {initial ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setValue("");
                save(null);
              }}
              className="btn-secondary"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="mt-3 rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" /> {error}
        </div>
      ) : null}
      {saved ? (
        <div className="mt-3 rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Saved.
        </div>
      ) : null}

      {initial ? (
        <div className="mt-4 rounded-md bg-ink-50 p-3 text-xs text-ink-600">
          <div className="font-semibold text-ink-800 mb-1">DNS setup</div>
          Create a <span className="font-mono">CNAME</span> record on{" "}
          <span className="font-mono">{initial}</span> pointing to{" "}
          <span className="font-mono">{platformHost}</span> (or to{" "}
          <span className="font-mono">cname.vercel-dns.com</span> if hosted on
          Vercel). Then add the domain in the Vercel project so a TLS cert is
          issued. Once live, visiting{" "}
          <span className="font-mono">https://{initial}</span> will load this
          event.
        </div>
      ) : null}
    </section>
  );
}
