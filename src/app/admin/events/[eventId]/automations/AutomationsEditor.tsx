"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, Save } from "lucide-react";

type Automation = {
  trigger: string;
  label: string;
  enabled: boolean;
  subject: string;
  body: string;
};

export function AutomationsEditor({
  eventId,
  initial,
}: {
  eventId: string;
  initial: Automation[];
}) {
  const [items, setItems] = useState(initial);

  return (
    <div className="space-y-4">
      {items.map((a, idx) => (
        <AutomationCard
          key={a.trigger}
          eventId={eventId}
          automation={a}
          onChange={(next) =>
            setItems((arr) => arr.map((it, i) => (i === idx ? next : it)))
          }
        />
      ))}
    </div>
  );
}

function AutomationCard({
  eventId,
  automation,
  onChange,
}: {
  eventId: string;
  automation: Automation;
  onChange: (next: Automation) => void;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(automation.enabled);
  const [subject, setSubject] = useState(automation.subject);
  const [body, setBody] = useState(automation.body);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setInfo(null);
    setSaving(true);
    const res = await fetch(
      `/api/admin/events/${eventId}/automations/${automation.trigger}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, subject, body }),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setInfo(enabled ? "Saved — automation is live." : "Saved (off).");
    onChange({ ...automation, enabled, subject, body });
    router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="font-mono text-xs text-brand-700">
            {automation.trigger}
          </div>
          <div className="text-sm text-ink-600 mt-1">{automation.label}</div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          {enabled ? "Active" : "Off"}
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label text-xs">Subject</label>
          <input
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={180}
          />
        </div>
        <div>
          <label className="label text-xs">Body</label>
          <textarea
            className="input min-h-[140px] font-mono text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
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
        <button onClick={save} disabled={saving} className="btn-secondary text-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>
    </div>
  );
}
