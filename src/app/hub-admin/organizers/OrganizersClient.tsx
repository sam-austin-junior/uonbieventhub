"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  CheckCircle,
  Mail,
  CalendarClock,
  Ban,
  RotateCcw,
} from "lucide-react";

type Row = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  suspendedAt: string | null;
  eventCount: number;
  createdAt: string;
};

type CreatedCreds = { name: string; email: string; password: string; emailSent: boolean };

const VALIDITY_PRESETS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "6 months", value: 180 },
  { label: "1 year", value: 365 },
  { label: "No expiry", value: 0 },
];

function emptyForm() {
  return { name: "", email: "", organization: "", validityDays: 365, sendCredentialsEmail: true };
}

function statusFor(o: Row): { label: string; cls: string } {
  if (o.suspendedAt) return { label: "Suspended", cls: "badge bg-red-100 text-red-700" };
  if (o.expiresAt && new Date(o.expiresAt) < new Date()) return { label: "Expired", cls: "badge bg-amber-100 text-amber-700" };
  if (!o.activatedAt) return { label: "Pending", cls: "badge bg-amber-100 text-amber-700" };
  return { label: "Active", cls: "badge-green" };
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toLocalDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const tzOff = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOff).toISOString().slice(0, 10);
}

export function OrganizersClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", organization: "", expiresAt: "" });
  const [confirm, setConfirm] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<CreatedCreds | null>(null);
  const [copied, setCopied] = useState(false);

  function openCreate() {
    setForm(emptyForm());
    setError(null);
    setCreating(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setEditForm({
      name: row.name,
      email: row.email,
      organization: row.organization ?? "",
      expiresAt: toLocalDateInput(row.expiresAt),
    });
    setError(null);
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/hub-admin/organizers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        validityDays: form.validityDays > 0 ? form.validityDays : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create organizer");
      return;
    }
    const data = await res.json();
    setCreating(false);
    if (data.credentials) setCreds(data.credentials);
    startTransition(() => router.refresh());
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/hub-admin/organizers/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        email: editForm.email,
        organization: editForm.organization || null,
        expiresAt: editForm.expiresAt
          ? new Date(editForm.expiresAt + "T23:59:59").toISOString()
          : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    setEditing(null);
    startTransition(() => router.refresh());
  }

  async function quickAction(row: Row, payload: Record<string, unknown>) {
    const res = await fetch(`/api/hub-admin/organizers/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function destroy(row: Row) {
    const res = await fetch(`/api/hub-admin/organizers/${row.id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function resetPassword(row: Row) {
    const res = await fetch(`/api/hub-admin/organizers/${row.id}/reset-password`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setCreds(data.credentials);
    }
  }

  function copyCreds() {
    if (!creds) return;
    const txt = `${creds.name} — UoN Event Hub organizer account\n\nEmail: ${creds.email}\nPassword: ${creds.password}\n\nSign in at: ${location.origin}/login`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Organizers</h1>
          <p className="text-sm text-ink-500 mt-1">
            Each organizer is created with a validity period. When it ends, their account and all
            of their events are archived for audit.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> New organizer
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-5 py-3 text-left">Organizer</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Organization</th>
                <th className="px-5 py-3 text-right">Events</th>
                <th className="px-5 py-3 text-left">Valid until</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((o) => {
                const status = statusFor(o);
                return (
                  <tr key={o.id} className="hover:bg-ink-50">
                    <td className="px-5 py-3 font-medium text-ink-900">{o.name}</td>
                    <td className="px-5 py-3 text-ink-600">{o.email}</td>
                    <td className="px-5 py-3 text-ink-600">{o.organization ?? "—"}</td>
                    <td className="px-5 py-3 text-right">{o.eventCount}</td>
                    <td className="px-5 py-3 text-ink-600 whitespace-nowrap inline-flex items-center gap-1">
                      {o.expiresAt ? (
                        <>
                          <CalendarClock className="h-3.5 w-3.5 text-ink-400" />
                          {fmtDate(o.expiresAt)}
                        </>
                      ) : (
                        <span className="text-ink-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={status.cls}>{status.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {o.suspendedAt ? (
                          <button
                            onClick={() => quickAction(o, { suspend: false })}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700"
                            title="Reactivate"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => quickAction(o, { suspend: true })}
                            className="p-1.5 rounded hover:bg-amber-50 text-amber-700"
                            title="Suspend"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => resetPassword(o)}
                          className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                          title="Reset password (reveal)"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(o)}
                          className="p-1.5 rounded hover:bg-brand-50 text-brand-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirm(o)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                    No organizers yet. Click <strong>New organizer</strong> to add one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New organizer">
        <form onSubmit={createOrg} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input"
              placeholder="Dr. Jane Wanjiku"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="input"
              placeholder="organizer@institution.ac.ke"
            />
          </div>
          <div>
            <label className="label">Organization / Institution</label>
            <input
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              className="input"
              placeholder="Optional, e.g. Faculty of Engineering"
            />
          </div>
          <div>
            <label className="label inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Validity period
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VALIDITY_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, validityDays: p.value })}
                  className={
                    "text-xs rounded-full px-3 py-1 ring-1 transition " +
                    (form.validityDays === p.value
                      ? "bg-brand-700 text-white ring-brand-700"
                      : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-300")
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={3650}
                value={form.validityDays}
                onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value || 0) })}
                className="input w-24"
              />
              <span className="text-xs text-ink-500">days (0 = no expiry)</span>
            </div>
            <p className="text-xs text-ink-400 mt-2">
              After this period the account and all of its events are automatically suspended and
              archived for audit. You can extend or reactivate from the edit dialog.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm rounded-md ring-1 ring-ink-200 p-3 bg-ink-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendCredentialsEmail}
              onChange={(e) => setForm({ ...form, sendCredentialsEmail: e.target.checked })}
              className="mt-0.5"
            />
            <div>
              <div className="font-medium text-ink-800">Email the credentials automatically</div>
              <div className="text-xs text-ink-500">
                If off (or Resend not configured), you'll see the password once on screen to share manually.
              </div>
            </div>
          </label>

          {error ? (
            <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Creating…" : "Create organizer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit organizer">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Organization</label>
                <input
                  value={editForm.organization}
                  onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" /> Valid until
                </label>
                <input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                  className="input"
                />
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => quickAction(editing, { extendDays: 30 })}
                    className="rounded-full px-3 py-1 bg-white ring-1 ring-ink-200 hover:ring-brand-300"
                  >
                    +30 days
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAction(editing, { extendDays: 90 })}
                    className="rounded-full px-3 py-1 bg-white ring-1 ring-ink-200 hover:ring-brand-300"
                  >
                    +90 days
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAction(editing, { extendDays: 365 })}
                    className="rounded-full px-3 py-1 bg-white ring-1 ring-ink-200 hover:ring-brand-300"
                  >
                    +1 year
                  </button>
                </div>
                <p className="text-xs text-ink-400 mt-2">
                  Leave blank for no expiry. Quick-extend buttons add days from today (or the
                  current expiry, whichever is later) and also reactivate a suspended account.
                </p>
              </div>
            </div>
            {error ? (
              <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">{error}</div>
            ) : null}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
              <div>
                {editing.suspendedAt ? (
                  <button
                    type="button"
                    onClick={() => { quickAction(editing, { suspend: false }); setEditing(null); }}
                    className="btn-secondary"
                  >
                    <RotateCcw className="h-4 w-4" /> Reactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { quickAction(editing, { suspend: true }); setEditing(null); }}
                    className="btn-ghost text-amber-700"
                  >
                    <Ban className="h-4 w-4" /> Suspend now
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={!!creds} onClose={() => setCreds(null)} title="Organizer credentials">
        {creds ? (
          <div>
            <div className="rounded-md bg-amber-50 ring-1 ring-amber-100 p-3 text-sm text-amber-800">
              <strong>This password will not be shown again.</strong>{" "}
              {creds.emailSent
                ? "We've also emailed it to the organizer."
                : "Email isn't configured — copy these now and share securely."}
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Name" value={creds.name} />
              <Field label="Email" value={creds.email} mono />
              <Field label="Password" value={creds.password} mono />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={copyCreds} className="btn-secondary">
                {copied ? (
                  <><CheckCircle className="h-4 w-4" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy details</>
                )}
              </button>
              <button onClick={() => setCreds(null)} className="btn-primary">Done</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && destroy(confirm)}
        title="Delete organizer?"
        body={`"${confirm?.name}" and all of their events will be permanently deleted. Use Suspend instead if you want to archive for audit.`}
      />
    </>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md ring-1 ring-ink-200 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono" : ""} text-ink-900 break-all`}>{value}</div>
    </div>
  );
}
