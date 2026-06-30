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
  Tag,
} from "lucide-react";

export type PromoCode = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  ticketTypeId: string | null;
  active: boolean;
};

type Draft = Omit<PromoCode, "id" | "usedCount"> & { id: string | null };

const BLANK: Draft = {
  id: null,
  code: "",
  discountType: "percent",
  discountValue: 10,
  maxUses: null,
  validFrom: null,
  validUntil: null,
  ticketTypeId: null,
  active: true,
};

export function PromoCodesEditor({
  eventId,
  ticketTypes,
  initialCodes,
}: {
  eventId: string;
  ticketTypes: { id: string; name: string }[];
  initialCodes: PromoCode[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function startNew() {
    setEditing({ ...BLANK });
    setError(null);
    setInfo(null);
  }

  function startEdit(c: PromoCode) {
    setEditing({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxUses: c.maxUses,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      ticketTypeId: c.ticketTypeId,
      active: c.active,
    });
    setError(null);
    setInfo(null);
  }

  async function save() {
    if (!editing) return;
    setError(null);
    setInfo(null);
    const isNew = !editing.id;
    const url = isNew
      ? `/api/admin/events/${eventId}/promo-codes`
      : `/api/admin/events/${eventId}/promo-codes/${editing.id}`;
    const method = isNew ? "POST" : "PATCH";
    const body: Record<string, unknown> = {
      discountType: editing.discountType,
      discountValue: editing.discountValue,
      maxUses: editing.maxUses,
      validFrom: editing.validFrom,
      validUntil: editing.validUntil,
      ticketTypeId: editing.ticketTypeId,
      active: editing.active,
    };
    if (isNew) body.code = editing.code;
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save code");
      return;
    }
    setEditing(null);
    setInfo(isNew ? "Code created." : "Code updated.");
    startTransition(() => router.refresh());
  }

  async function remove(c: PromoCode) {
    if (!confirm(`Delete code "${c.code}"? This cannot be undone.`)) return;
    setError(null);
    const res = await fetch(
      `/api/admin/events/${eventId}/promo-codes/${c.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete code");
      return;
    }
    setInfo(`Code "${c.code}" deleted.`);
    startTransition(() => router.refresh());
  }

  async function toggleActive(c: PromoCode) {
    setError(null);
    const res = await fetch(
      `/api/admin/events/${eventId}/promo-codes/${c.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      },
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update");
      return;
    }
    startTransition(() => router.refresh());
  }

  const ticketLabel = (id: string | null) => {
    if (!id) return "All tickets";
    return ticketTypes.find((t) => t.id === id)?.name ?? "Unknown ticket";
  };

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
          <Tag className="h-4 w-4" />
          {initialCodes.length} code{initialCodes.length === 1 ? "" : "s"}
        </p>
        <button onClick={startNew} className="btn-primary" disabled={ticketTypes.length === 0}>
          <Plus className="h-4 w-4" /> New code
        </button>
      </div>

      {ticketTypes.length === 0 ? (
        <div className="rounded-md bg-amber-50 ring-1 ring-amber-100 p-4 text-sm text-amber-800">
          You need at least one ticket type before promo codes are useful. Add
          one on the Tickets page.
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Code</th>
              <th className="px-5 py-3 text-right">Discount</th>
              <th className="px-5 py-3 text-left">Applies to</th>
              <th className="px-5 py-3 text-right">Uses</th>
              <th className="px-5 py-3 text-left">Window</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {initialCodes.map((c) => (
              <tr key={c.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3 font-mono font-medium text-ink-900">
                  {c.code}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap text-ink-900">
                  {c.discountType === "percent"
                    ? `${c.discountValue}%`
                    : `${(c.discountValue / 100).toFixed(2)} flat`}
                </td>
                <td className="px-5 py-3 text-ink-600 text-xs">{ticketLabel(c.ticketTypeId)}</td>
                <td className="px-5 py-3 text-right text-ink-600">
                  {c.usedCount}
                  {c.maxUses !== null ? <span className="text-ink-400"> / {c.maxUses}</span> : null}
                </td>
                <td className="px-5 py-3 text-xs text-ink-600">
                  {formatWindow(c.validFrom, c.validUntil)}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={pending}
                    className={
                      c.active
                        ? "inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                        : "inline-flex items-center gap-1 text-xs text-ink-500 hover:underline"
                    }
                  >
                    {c.active ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Live
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Paused
                      </>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap space-x-1">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c)}
                    disabled={pending}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete code"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {initialCodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                  No codes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <PromoForm
          draft={editing}
          ticketTypes={ticketTypes}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={save}
          saving={pending}
        />
      ) : null}
    </div>
  );
}

function PromoForm({
  draft,
  ticketTypes,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  ticketTypes: { id: string; name: string }[];
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
      <div className="relative w-full max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-pop max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">
            {draft.id ? `Edit code ${draft.code}` : "New promo code"}
          </h3>
          <button onClick={onCancel} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="label">Code</label>
            <input
              className="input font-mono uppercase tracking-wider"
              value={draft.code}
              onChange={(e) =>
                update(
                  "code",
                  e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                )
              }
              disabled={!!draft.id}
              placeholder="e.g. EARLYBIRD25"
            />
            <p className="text-xs text-ink-500 mt-1">
              Letters, digits, hyphen, underscore. Cannot be changed after
              creation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Discount type</label>
              <select
                className="input"
                value={draft.discountType}
                onChange={(e) => update("discountType", e.target.value)}
              >
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </div>
            <div>
              <label className="label">
                {draft.discountType === "percent" ? "Percent (1–100)" : "Amount (cents)"}
              </label>
              <input
                type="number"
                min={1}
                max={draft.discountType === "percent" ? 100 : undefined}
                className="input"
                value={draft.discountValue}
                onChange={(e) =>
                  update("discountValue", parseInt(e.target.value || "0", 10))
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Applies to</label>
            <select
              className="input"
              value={draft.ticketTypeId ?? ""}
              onChange={(e) => update("ticketTypeId", e.target.value || null)}
            >
              <option value="">All ticket types</option>
              {ticketTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Valid from (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocal(draft.validFrom)}
                onChange={(e) => update("validFrom", localToIso(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Valid until (optional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocal(draft.validUntil)}
                onChange={(e) => update("validUntil", localToIso(e.target.value))}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="label">Max uses (optional)</label>
              <input
                type="number"
                min={1}
                className="input"
                value={draft.maxUses ?? ""}
                onChange={(e) =>
                  update(
                    "maxUses",
                    e.target.value === "" ? null : parseInt(e.target.value, 10),
                  )
                }
                placeholder="Unlimited"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => update("active", e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-ink-100 px-6 py-4 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !draft.code || !draft.discountValue}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {draft.id ? "Save changes" : "Create code"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatWindow(start: string | null, end: string | null) {
  if (!start && !end) return "Always";
  const s = start ? new Date(start).toLocaleDateString() : "Now";
  const e = end ? new Date(end).toLocaleDateString() : "Forever";
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
