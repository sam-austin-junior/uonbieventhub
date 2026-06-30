"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import Link from "next/link";
import { Pencil, Trash2, Plus, LayoutPanelTop } from "lucide-react";

type Row = {
  id: string;
  slug: string;
  title: string;
  body: string;
  order: number;
  showInNav: boolean;
};

function emptyForm(): Row {
  return { id: "", slug: "", title: "", body: "", order: 0, showInNav: true };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PagesTable({ eventId, rows }: { eventId: string; rows: Row[] }) {
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
      ? `/api/admin/events/${eventId}/pages`
      : `/api/admin/pages/${editing.id}`;
    const payload = {
      slug: editing.slug,
      title: editing.title,
      body: editing.body,
      order: Number(editing.order) || 0,
      showInNav: editing.showInNav,
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
    const res = await fetch(`/api/admin/pages/${row.id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Custom pages</h1>
          <p className="text-sm text-ink-500 mt-1">
            Pages displayed in the attendee hub sidebar.
          </p>
        </div>
        <button onClick={() => setEditing(emptyForm())} className="btn-primary">
          <Plus className="h-4 w-4" /> New page
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left w-16">Order</th>
              <th className="px-5 py-3 text-left">Title</th>
              <th className="px-5 py-3 text-left">Slug</th>
              <th className="px-5 py-3 text-left">In nav</th>
              <th className="px-5 py-3 text-right w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50">
                <td className="px-5 py-3 font-mono text-ink-500">{p.order}</td>
                <td className="px-5 py-3 font-medium">{p.title}</td>
                <td className="px-5 py-3 font-mono text-xs text-ink-500">{p.slug}</td>
                <td className="px-5 py-3">
                  {p.showInNav ? (
                    <span className="badge-green">Visible</span>
                  ) : (
                    <span className="badge-gray">Hidden</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Link
                      href={`/admin/events/${eventId}/pages/${p.id}/builder`}
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                      aria-label="Open page builder"
                      title="Open page builder"
                    >
                      <LayoutPanelTop className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setEditing({ ...p })}
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                      aria-label="Edit page meta"
                      title="Edit slug/title/visibility"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirm(p)}
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
                  No pages yet. Click <strong>New page</strong> to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit page" : "New page"}
        size="lg"
      >
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing({
                    ...editing,
                    title,
                    slug: editing.id ? editing.slug : slugify(title),
                  });
                }}
                required
                className="input"
              />
            </div>
            <div className="grid sm:grid-cols-[1fr_120px] gap-4">
              <div>
                <label className="label">URL slug</label>
                <input
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  required
                  className="input font-mono text-xs"
                />
              </div>
              <div>
                <label className="label">Order</label>
                <input
                  type="number"
                  value={editing.order}
                  onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Body</label>
              <textarea
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                required
                rows={10}
                className="input font-mono text-sm"
                placeholder="Use blank lines to separate paragraphs. Markdown-style **bold** is rendered as plain text in this scaffold."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.showInNav}
                onChange={(e) => setEditing({ ...editing, showInNav: e.target.checked })}
              />
              Show in the attendee hub sidebar
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
                {saving ? "Saving…" : editing.id ? "Save changes" : "Create page"}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && destroy(confirm)}
        title="Delete page?"
        body={`"${confirm?.title}" will be removed from the attendee hub.`}
      />
    </>
  );
}
