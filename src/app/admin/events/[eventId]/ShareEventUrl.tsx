"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  CheckCircle,
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

function normalize(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ShareEventUrl({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/e/${slug}`
      : `/e/${slug}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function save() {
    const next = normalize(draft);
    if (!next || next === slug) {
      setEditing(false);
      setDraft(slug);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/slug`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not change slug");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg bg-brand-50 ring-1 ring-brand-100 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-700 font-semibold">
          <LinkIcon className="h-3.5 w-3.5" /> Attendee URL
        </div>
        {!editing ? (
          <button
            onClick={() => {
              setEditing(true);
              setDraft(slug);
              setError(null);
            }}
            className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Change slug
          </button>
        ) : null}
      </div>

      {!editing ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 font-mono text-sm bg-white border border-brand-200 rounded-md px-3 py-2 truncate">
              {url}
            </code>
            <button onClick={copy} className="btn-secondary">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </button>
            <a
              href={`/e/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
          </div>
          <p className="text-xs text-brand-700/80 mt-2">
            Share this link with your attendees. They never see the parent hub
            branding — only your event.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-stretch gap-0 rounded-md overflow-hidden border border-brand-200 bg-white">
            <span className="px-3 py-2 text-sm font-mono text-ink-500 bg-ink-50 select-none">
              uonbieventhub.co.ke/e/
            </span>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => setDraft(normalize(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(slug);
                  setError(null);
                }
              }}
              className="flex-1 px-3 py-2 text-sm font-mono outline-none"
              placeholder="my-event-slug"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDraft(slug);
                setError(null);
              }}
              disabled={saving}
              className="btn-ghost text-sm"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
          {error ? (
            <div className="mt-2 inline-flex items-start gap-1.5 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5" /> {error}
            </div>
          ) : (
            <p className="text-xs text-brand-700/80 mt-2">
              Letters, numbers, and hyphens only. Anyone with the old link will
              get a 404 after you change this.
            </p>
          )}
        </>
      )}
    </div>
  );
}
