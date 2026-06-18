"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Pencil, Trash2, Plus, Star } from "lucide-react";
import { formatTime, formatDay } from "@/lib/utils";

type Speaker = { id: string; name: string };
type Row = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string | null;
  format: "IN_PERSON" | "VIRTUAL" | "HYBRID" | "ON_DEMAND";
  capacity: number | null;
  videoUrl: string | null;
  track: string | null;
  isFeatured: boolean;
  speakerIds: string[];
  registrations: number;
};

const FORMATS = ["IN_PERSON", "VIRTUAL", "HYBRID", "ON_DEMAND"] as const;

function emptyForm(): Row {
  return {
    id: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    format: "IN_PERSON",
    capacity: null,
    videoUrl: "",
    track: "",
    isFeatured: false,
    speakerIds: [],
    registrations: 0,
  };
}

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOff = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOff).toISOString().slice(0, 16);
}

export function SessionsTable({
  eventId,
  rows,
  speakers,
}: {
  eventId: string;
  rows: Row[];
  speakers: Speaker[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setEditing(emptyForm());
    setError(null);
  }
  function openEdit(r: Row) {
    setEditing({ ...r, startTime: toLocalInput(r.startTime), endTime: toLocalInput(r.endTime) });
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `/api/admin/events/${eventId}/sessions`
      : `/api/admin/sessions/${editing.id}`;
    const body = {
      title: editing.title,
      description: editing.description,
      startTime: new Date(editing.startTime).toISOString(),
      endTime: new Date(editing.endTime).toISOString(),
      location: editing.location || null,
      format: editing.format,
      capacity: editing.capacity ? Number(editing.capacity) : null,
      videoUrl: editing.videoUrl || null,
      track: editing.track || null,
      isFeatured: editing.isFeatured,
      speakerIds: editing.speakerIds,
    };
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed");
      return;
    }
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function destroy(row: Row) {
    const res = await fetch(`/api/admin/sessions/${row.id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Sessions</h1>
          <p className="text-sm text-ink-500 mt-1">{rows.length} sessions scheduled.</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New session
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Day</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">Session</th>
              <th className="px-5 py-3 text-left">Format</th>
              <th className="px-5 py-3 text-left">Track</th>
              <th className="px-5 py-3 text-right">Registered</th>
              <th className="px-5 py-3 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-ink-50">
                <td className="px-5 py-3 whitespace-nowrap">{formatDay(s.startTime)}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 font-medium text-ink-900">
                    {s.isFeatured ? <Star className="h-3.5 w-3.5 text-accent" /> : null}
                    {s.title}
                  </div>
                  {s.location ? <div className="text-xs text-ink-500">{s.location}</div> : null}
                </td>
                <td className="px-5 py-3 capitalize">{s.format.replace("_", " ").toLowerCase()}</td>
                <td className="px-5 py-3">{s.track ?? "—"}</td>
                <td className="px-5 py-3 text-right font-semibold">{s.registrations}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirm(s)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                  No sessions yet. Click <strong>New session</strong> to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit session" : "New session"}
        size="lg"
      >
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                required
                rows={3}
                className="input"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Start</label>
                <input
                  type="datetime-local"
                  value={editing.startTime}
                  onChange={(e) => setEditing({ ...editing, startTime: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  type="datetime-local"
                  value={editing.endTime}
                  onChange={(e) => setEditing({ ...editing, endTime: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  value={editing.location ?? ""}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  className="input"
                  placeholder="Taifa Hall"
                />
              </div>
              <div>
                <label className="label">Track</label>
                <input
                  value={editing.track ?? ""}
                  onChange={(e) => setEditing({ ...editing, track: e.target.value })}
                  className="input"
                  placeholder="Keynote, Innovation, …"
                />
              </div>
              <div>
                <label className="label">Format</label>
                <select
                  value={editing.format}
                  onChange={(e) =>
                    setEditing({ ...editing, format: e.target.value as Row["format"] })
                  }
                  className="input"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f.replace("_", " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Capacity (optional)</label>
                <input
                  type="number"
                  min={1}
                  value={editing.capacity ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="input"
                />
              </div>
            </div>
            <FileUpload
              label="Video (for on-demand or hybrid)"
              kind="video"
              value={editing.videoUrl}
              onChange={(url) => setEditing({ ...editing, videoUrl: url })}
              hint="For YouTube/Vimeo, switch to 'Paste URL' and use the embed link (e.g. https://www.youtube.com/embed/…)."
            />

            <div>
              <label className="label">Speakers</label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-ink-200 p-2 space-y-1">
                {speakers.map((sp) => {
                  const checked = editing.speakerIds.includes(sp.id);
                  return (
                    <label key={sp.id} className="flex items-center gap-2 px-2 py-1 hover:bg-ink-50 rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setEditing({
                            ...editing,
                            speakerIds: e.target.checked
                              ? [...editing.speakerIds, sp.id]
                              : editing.speakerIds.filter((id) => id !== sp.id),
                          });
                        }}
                      />
                      <span className="text-sm">{sp.name}</span>
                    </label>
                  );
                })}
                {speakers.length === 0 ? (
                  <div className="text-xs text-ink-500 px-2 py-3 text-center">
                    No speakers yet — add some on the Speakers page first.
                  </div>
                ) : null}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.isFeatured}
                onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
              />
              Feature this session on the event home page
            </label>

            {error ? (
              <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : editing.id ? "Save changes" : "Create session"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && destroy(confirm)}
        title="Delete session?"
        body={`"${confirm?.title}" will be removed permanently along with any registrations and speaker links. This can't be undone.`}
      />
    </>
  );
}
