"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Copy, Loader2 } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tzOff = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOff).toISOString().slice(0, 16);
}

export function CloneEventButton({
  eventId,
  sourceName,
  sourceStart,
  sourceEnd,
}: {
  eventId: string;
  sourceName: string;
  sourceStart: string;
  sourceEnd: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${sourceName} (copy)`);
  const [slug, setSlug] = useState(slugify(`${sourceName}-copy`));
  // Shift dates by 1 year as a sensible default
  const yearShift = 365 * 24 * 60 * 60 * 1000;
  const [start, setStart] = useState(
    toLocalInput(new Date(new Date(sourceStart).getTime() + yearShift).toISOString())
  );
  const [end, setEnd] = useState(
    toLocalInput(new Date(new Date(sourceEnd).getTime() + yearShift).toISOString())
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/clone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not clone event");
      return;
    }
    const data = await res.json();
    setOpen(false);
    router.push(`/admin/events/${data.event.id}?cloned=1`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm">
        <Copy className="h-4 w-4" /> Duplicate event
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Duplicate this event">
        <p className="text-sm text-ink-500 mb-4">
          Creates a draft copy with all sessions, speakers, exhibitors and custom pages.
          Registrations, check-ins, invites, discussions and announcements are NOT copied.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">New event name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">URL slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              className="input font-mono text-xs"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="input"
              />
            </div>
          </div>
          <p className="text-xs text-ink-400">
            All session times are shifted by the same offset as the start date — they keep
            their relative positions.
          </p>

          {error ? (
            <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cloning…
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Create copy
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
