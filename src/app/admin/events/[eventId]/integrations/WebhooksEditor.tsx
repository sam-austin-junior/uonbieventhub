"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Webhook as WebhookIcon,
  X,
} from "lucide-react";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveredAt: string | null;
  lastError: string | null;
};

export function WebhooksEditor({
  eventId,
  availableEvents,
  initialWebhooks,
}: {
  eventId: string;
  availableEvents: string[];
  initialWebhooks: Webhook[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [secretJustCreated, setSecretJustCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(w: Webhook) {
    const res = await fetch(`/api/admin/webhooks/${w.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !w.active }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update");
      return;
    }
    startTransition(() => router.refresh());
  }
  async function remove(w: Webhook) {
    if (!confirm(`Delete webhook to ${w.url}?`)) return;
    const res = await fetch(`/api/admin/webhooks/${w.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      {secretJustCreated ? (
        <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-800 inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Webhook created
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Copy this signing secret now — you won't see it again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="font-mono text-xs bg-white ring-1 ring-emerald-200 rounded px-2 py-1 select-all">
                  {secretJustCreated}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(secretJustCreated)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:underline"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setSecretJustCreated(null)}
              className="text-emerald-800 hover:text-emerald-900"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-ink-500 inline-flex items-center gap-2">
          <WebhookIcon className="h-4 w-4" />
          {initialWebhooks.length} webhook
          {initialWebhooks.length === 1 ? "" : "s"} configured
        </p>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New webhook
        </button>
      </div>

      <ul className="space-y-3">
        {initialWebhooks.map((w) => (
          <li key={w.id} className="card p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-mono text-sm text-ink-900 break-all">{w.url}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {w.events.map((e) => (
                    <span
                      key={e}
                      className="badge-brand text-[10px] uppercase tracking-wider"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                {w.lastDeliveredAt ? (
                  <div className="mt-2 text-xs text-ink-500">
                    Last delivered{" "}
                    {new Date(w.lastDeliveredAt).toLocaleString()}
                    {w.lastError ? (
                      <span className="text-red-600 ml-2">· {w.lastError}</span>
                    ) : (
                      <span className="text-emerald-700 ml-2">· OK</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-ink-400">No deliveries yet</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(w)}
                  className={`text-xs ${w.active ? "text-emerald-700" : "text-ink-500"} hover:underline`}
                >
                  {w.active ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => remove(w)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
        {initialWebhooks.length === 0 ? (
          <li className="card p-10 text-center text-sm text-ink-500">
            No webhooks yet. Create one to start mirroring events to your CRM.
          </li>
        ) : null}
      </ul>

      {creating ? (
        <WebhookCreateModal
          eventId={eventId}
          availableEvents={availableEvents}
          onClose={() => setCreating(false)}
          onCreated={(secret) => {
            setSecretJustCreated(secret);
            setCreating(false);
            startTransition(() => router.refresh());
          }}
        />
      ) : null}
    </div>
  );
}

function WebhookCreateModal({
  eventId,
  availableEvents,
  onClose,
  onCreated,
}: {
  eventId: string;
  availableEvents: string[];
  onClose: () => void;
  onCreated: (secret: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(availableEvents);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(e: string) {
    setSelected((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  async function submit() {
    setErr(null);
    if (!url) {
      setErr("URL is required");
      return;
    }
    if (selected.length === 0) {
      setErr("Pick at least one event");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/events/${eventId}/webhooks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, events: selected }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create webhook");
      return;
    }
    const data = await res.json();
    onCreated(data.webhook.secret);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-pop">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">New webhook</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Destination URL</label>
            <input
              type="url"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.example.com/uon"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Events to receive</label>
            <div className="space-y-1.5">
              {availableEvents.map((e) => (
                <label
                  key={e}
                  className="flex items-center gap-2 text-sm font-mono"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(e)}
                    onChange={() => toggle(e)}
                  />
                  {e}
                </label>
              ))}
            </div>
          </div>
          {err ? (
            <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {err}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={submit} disabled={saving || !url} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create webhook"}
          </button>
        </div>
      </div>
    </div>
  );
}
