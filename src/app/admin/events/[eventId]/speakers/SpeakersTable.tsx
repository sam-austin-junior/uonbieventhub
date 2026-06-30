"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { FileUpload } from "@/components/ui/FileUpload";
import { Pencil, Trash2, Plus, Star, Mail, Send } from "lucide-react";

type Row = {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  organization: string | null;
  bio: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  isKeynote: boolean;
  sessionCount: number;
};

function emptyForm(): Row {
  return {
    id: "",
    name: "",
    email: "",
    jobTitle: "",
    organization: "",
    bio: "",
    photoUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    isKeynote: false,
    sessionCount: 0,
  };
}

export function SpeakersTable({ eventId, rows }: { eventId: string; rows: Row[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `/api/admin/events/${eventId}/speakers`
      : `/api/admin/speakers/${editing.id}`;
    const payload = {
      name: editing.name,
      email: editing.email || null,
      jobTitle: editing.jobTitle || null,
      organization: editing.organization || null,
      bio: editing.bio || null,
      photoUrl: editing.photoUrl || null,
      linkedinUrl: editing.linkedinUrl || null,
      twitterUrl: editing.twitterUrl || null,
      isKeynote: editing.isKeynote,
    };
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
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

  async function sendInvite(row: Row) {
    setError(null);
    const res = await fetch(`/api/admin/speakers/${row.id}/invite`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not send invite");
      return;
    }
    alert(`Portal invite sent to ${row.email}.`);
  }

  async function destroy(row: Row) {
    const res = await fetch(`/api/admin/speakers/${row.id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Speakers</h1>
          <p className="text-sm text-ink-500 mt-1">{rows.length} speakers in the lineup.</p>
        </div>
        <button onClick={() => setEditing(emptyForm())} className="btn-primary">
          <Plus className="h-4 w-4" /> New speaker
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Speaker</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Organization</th>
              <th className="px-5 py-3 text-right">Sessions</th>
              <th className="px-5 py-3 text-left">Keynote</th>
              <th className="px-5 py-3 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-ink-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.photoUrl} size={32} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-600">{s.jobTitle ?? "—"}</td>
                <td className="px-5 py-3 text-ink-600">{s.organization ?? "—"}</td>
                <td className="px-5 py-3 text-right">{s.sessionCount}</td>
                <td className="px-5 py-3">
                  {s.isKeynote ? (
                    <span className="badge-accent inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> Keynote
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {s.email ? (
                      <button
                        onClick={() => sendInvite(s)}
                        className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                        aria-label="Send portal invite"
                        title={`Email ${s.email} with a link to /speaker`}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => setEditing({ ...s })}
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
                <td colSpan={6} className="px-5 py-10 text-center text-ink-500">
                  No speakers yet. Click <strong>New speaker</strong> to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit speaker" : "New speaker"}>
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-ink-400" />
                Email (optional)
              </label>
              <input
                type="email"
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="input"
                placeholder="speaker@example.com"
              />
              <p className="mt-1 text-xs text-ink-500">
                Needed if you want to send them a link to the speaker portal
                where they can edit their bio and upload slides.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Job title</label>
                <input
                  value={editing.jobTitle ?? ""}
                  onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Organization</label>
                <input
                  value={editing.organization ?? ""}
                  onChange={(e) => setEditing({ ...editing, organization: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <FileUpload
              label="Photo"
              kind="image"
              value={editing.photoUrl}
              onChange={(url) => setEditing({ ...editing, photoUrl: url })}
              hint="Square crop works best."
            />

            <div>
              <label className="label">Bio</label>
              <textarea
                value={editing.bio ?? ""}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                rows={4}
                className="input"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">LinkedIn URL</label>
                <input
                  type="url"
                  value={editing.linkedinUrl ?? ""}
                  onChange={(e) => setEditing({ ...editing, linkedinUrl: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Twitter / X URL</label>
                <input
                  type="url"
                  value={editing.twitterUrl ?? ""}
                  onChange={(e) => setEditing({ ...editing, twitterUrl: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.isKeynote}
                onChange={(e) => setEditing({ ...editing, isKeynote: e.target.checked })}
              />
              Mark as keynote speaker
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
                {saving ? "Saving…" : editing.id ? "Save changes" : "Create speaker"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && destroy(confirm)}
        title="Delete speaker?"
        body={`"${confirm?.name}" will be removed and unlinked from any sessions.`}
      />
    </>
  );
}
