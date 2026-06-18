"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Pencil, Trash2, Plus } from "lucide-react";

type Row = {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  boothNumber: string | null;
  category: string | null;
};

function emptyForm(): Row {
  return {
    id: "",
    name: "",
    tagline: "",
    description: "",
    logoUrl: "",
    website: "",
    email: "",
    boothNumber: "",
    category: "",
  };
}

export function ExhibitorsTable({ eventId, rows }: { eventId: string; rows: Row[] }) {
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
      ? `/api/admin/events/${eventId}/exhibitors`
      : `/api/admin/exhibitors/${editing.id}`;
    const payload = {
      name: editing.name,
      tagline: editing.tagline || null,
      description: editing.description,
      logoUrl: editing.logoUrl || null,
      website: editing.website || null,
      email: editing.email || null,
      boothNumber: editing.boothNumber || null,
      category: editing.category || null,
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

  async function destroy(row: Row) {
    const res = await fetch(`/api/admin/exhibitors/${row.id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Exhibitors</h1>
          <p className="text-sm text-ink-500 mt-1">{rows.length} exhibitors registered.</p>
        </div>
        <button onClick={() => setEditing(emptyForm())} className="btn-primary">
          <Plus className="h-4 w-4" /> New exhibitor
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left">Booth</th>
              <th className="px-5 py-3 text-left">Website</th>
              <th className="px-5 py-3 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-ink-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {e.logoUrl ? (
                      <img src={e.logoUrl} alt="" className="h-8 w-8 rounded ring-1 ring-ink-100" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-ink-100" />
                    )}
                    <div>
                      <div className="font-medium">{e.name}</div>
                      {e.tagline ? <div className="text-xs text-ink-500">{e.tagline}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">{e.category ?? "—"}</td>
                <td className="px-5 py-3">{e.boothNumber ?? "—"}</td>
                <td className="px-5 py-3">
                  {e.website ? (
                    <a href={e.website} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                      {e.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => setEditing({ ...e })}
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirm(e)}
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
                <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                  No exhibitors yet. Click <strong>New exhibitor</strong> to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit exhibitor" : "New exhibitor"}>
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
              <label className="label">Tagline</label>
              <input
                value={editing.tagline ?? ""}
                onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
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
            <FileUpload
              label="Logo"
              kind="image"
              value={editing.logoUrl}
              onChange={(url) => setEditing({ ...editing, logoUrl: url })}
              hint="Square or transparent PNG works best."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  value={editing.website ?? ""}
                  onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Contact email</label>
                <input
                  type="email"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  value={editing.category ?? ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="Industry, Government, Research…"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Booth number</label>
                <input
                  value={editing.boothNumber ?? ""}
                  onChange={(e) => setEditing({ ...editing, boothNumber: e.target.value })}
                  placeholder="A1"
                  className="input"
                />
              </div>
            </div>

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
                {saving ? "Saving…" : editing.id ? "Save changes" : "Create exhibitor"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && destroy(confirm)}
        title="Delete exhibitor?"
        body={`"${confirm?.name}" will be removed from this event.`}
      />
    </>
  );
}
