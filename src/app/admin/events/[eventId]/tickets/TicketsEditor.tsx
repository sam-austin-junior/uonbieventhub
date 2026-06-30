"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  X,
  Users,
  Ticket,
} from "lucide-react";

export type Ticket = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  capacity: number | null;
  soldCount: number;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  sortOrder: number;
  active: boolean;
};

type Draft = Omit<Ticket, "id" | "soldCount"> & { id: string | null };

const BLANK: Draft = {
  id: null,
  name: "",
  description: "",
  priceCents: 0,
  currency: "USD",
  capacity: null,
  saleStartsAt: null,
  saleEndsAt: null,
  sortOrder: 0,
  active: true,
};

export function TicketsEditor({
  eventId,
  initialTickets,
}: {
  eventId: string;
  initialTickets: Ticket[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function startNew() {
    setEditing({ ...BLANK, sortOrder: initialTickets.length * 10 });
    setError(null);
    setInfo(null);
  }

  function startEdit(t: Ticket) {
    setEditing({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      priceCents: t.priceCents,
      currency: t.currency,
      capacity: t.capacity,
      saleStartsAt: t.saleStartsAt,
      saleEndsAt: t.saleEndsAt,
      sortOrder: t.sortOrder,
      active: t.active,
    });
    setError(null);
    setInfo(null);
  }

  async function save() {
    if (!editing) return;
    setError(null);
    setInfo(null);
    const url = editing.id
      ? `/api/admin/events/${eventId}/tickets/${editing.id}`
      : `/api/admin/events/${eventId}/tickets`;
    const method = editing.id ? "PATCH" : "POST";
    const body = {
      name: editing.name,
      description: editing.description || null,
      priceCents: editing.priceCents,
      currency: editing.currency,
      capacity: editing.capacity,
      saleStartsAt: editing.saleStartsAt,
      saleEndsAt: editing.saleEndsAt,
      sortOrder: editing.sortOrder,
      active: editing.active,
    };
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save ticket");
      return;
    }
    setEditing(null);
    setInfo(editing.id ? "Ticket updated." : "Ticket created.");
    startTransition(() => router.refresh());
  }

  async function remove(t: Ticket) {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/tickets/${t.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete ticket");
      return;
    }
    setInfo(`Ticket "${t.name}" deleted.`);
    startTransition(() => router.refresh());
  }

  async function toggleActive(t: Ticket) {
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/tickets/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update");
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
      {info ? (
        <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 px-4 py-3 text-sm text-emerald-800 inline-flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {info}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-ink-500 inline-flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          {initialTickets.length} ticket type
          {initialTickets.length === 1 ? "" : "s"} configured
        </p>
        <button onClick={startNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Ticket</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3 text-right">Sold</th>
              <th className="px-5 py-3 text-right">Capacity</th>
              <th className="px-5 py-3 text-left">Sale window</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {initialTickets.map((t) => (
              <tr key={t.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-900">{t.name}</div>
                  {t.description ? (
                    <div className="text-xs text-ink-500 mt-0.5 line-clamp-1">
                      {t.description}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap text-ink-900 font-medium">
                  {formatMoney(t.priceCents, t.currency)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-ink-700">
                    <Users className="h-3.5 w-3.5 text-ink-400" />
                    {t.soldCount}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-ink-600">
                  {t.capacity ?? "∞"}
                </td>
                <td className="px-5 py-3 text-xs text-ink-600">
                  {formatSaleWindow(t.saleStartsAt, t.saleEndsAt)}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(t)}
                    disabled={pending}
                    className={
                      t.active
                        ? "inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                        : "inline-flex items-center gap-1 text-xs text-ink-500 hover:underline"
                    }
                  >
                    {t.active ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> On sale
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Off
                      </>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap space-x-1">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(t)}
                    disabled={pending}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete ticket"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {initialTickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                  No tickets yet. Create one to enable paid registration on this
                  event.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <TicketForm
          draft={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={save}
          saving={pending}
        />
      ) : null}
    </div>
  );
}

function TicketForm({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">
            {draft.id ? `Edit ticket: ${draft.name}` : "New ticket type"}
          </h3>
          <button onClick={onCancel} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Early bird"
              autoFocus
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[64px]"
              value={draft.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What's included with this ticket?"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Price</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input pr-16"
                  value={(draft.priceCents / 100).toString()}
                  onChange={(e) =>
                    update("priceCents", Math.round(parseFloat(e.target.value || "0") * 100))
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500">
                  {draft.currency}
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-1">
                Set to 0 for free tickets.
              </p>
            </div>
            <div>
              <label className="label">Currency</label>
              <input
                className="input uppercase"
                value={draft.currency}
                onChange={(e) =>
                  update("currency", e.target.value.toUpperCase().slice(0, 3))
                }
                maxLength={3}
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                type="number"
                min={1}
                className="input"
                value={draft.capacity ?? ""}
                onChange={(e) =>
                  update(
                    "capacity",
                    e.target.value === "" ? null : parseInt(e.target.value, 10),
                  )
                }
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sale starts (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocal(draft.saleStartsAt)}
                onChange={(e) =>
                  update("saleStartsAt", localToIso(e.target.value))
                }
              />
            </div>
            <div>
              <label className="label">Sale ends (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocal(draft.saleEndsAt)}
                onChange={(e) =>
                  update("saleEndsAt", localToIso(e.target.value))
                }
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => update("active", e.target.checked)}
              />
              On sale
            </label>
            <div>
              <label className="label">Sort order</label>
              <input
                type="number"
                className="input"
                value={draft.sortOrder}
                onChange={(e) =>
                  update("sortOrder", parseInt(e.target.value || "0", 10))
                }
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-ink-100 px-6 py-4 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.name}
            className="btn-primary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {draft.id ? "Save changes" : "Create ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
  if (cents === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatSaleWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Always on sale";
  const s = start ? new Date(start).toLocaleDateString() : "Now";
  const e = end ? new Date(end).toLocaleDateString() : "Indefinite";
  return `${s} → ${e}`;
}

function isoToLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function localToIso(local: string) {
  if (!local) return null;
  return new Date(local).toISOString();
}
