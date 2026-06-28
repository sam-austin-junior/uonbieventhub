"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Star,
  EyeOff,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

export type Plan = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  description: string;
  priceCents: number;
  currency: string;
  billingPeriod: string;
  recommended: boolean;
  active: boolean;
  sortOrder: number;
  features: string;
};

type Draft = Omit<Plan, "id"> & { id: string | null };

const BLANK: Draft = {
  id: null,
  code: "",
  name: "",
  tagline: "",
  description: "",
  priceCents: 0,
  currency: "USD",
  billingPeriod: "one_time",
  recommended: false,
  active: true,
  sortOrder: 0,
  features: "",
};

export function PlansEditor({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function startNew() {
    setEditing({ ...BLANK, sortOrder: initialPlans.length * 10 });
    setError(null);
    setInfo(null);
  }

  function startEdit(p: Plan) {
    setEditing({ ...p, tagline: p.tagline ?? "" });
    setError(null);
    setInfo(null);
  }

  async function save() {
    if (!editing) return;
    setError(null);
    setInfo(null);
    const url = editing.id
      ? `/api/hub-admin/plans/${editing.id}`
      : "/api/hub-admin/plans";
    const method = editing.id ? "PATCH" : "POST";
    const body = {
      code: editing.code,
      name: editing.name,
      tagline: editing.tagline || null,
      description: editing.description,
      priceCents: editing.priceCents,
      currency: editing.currency,
      billingPeriod: editing.billingPeriod,
      recommended: editing.recommended,
      active: editing.active,
      sortOrder: editing.sortOrder,
      features: editing.features,
    };
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save plan");
      return;
    }
    setEditing(null);
    setInfo(editing.id ? "Plan updated." : "Plan created.");
    startTransition(() => router.refresh());
  }

  async function remove(plan: Plan) {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    setError(null);
    const res = await fetch(`/api/hub-admin/plans/${plan.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete plan");
      return;
    }
    setInfo(`Plan "${plan.name}" deleted.`);
    startTransition(() => router.refresh());
  }

  async function quickToggleActive(plan: Plan) {
    setError(null);
    const res = await fetch(`/api/hub-admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !plan.active }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update plan");
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {initialPlans.length} plan{initialPlans.length === 1 ? "" : "s"} configured
        </p>
        <button onClick={startNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New plan
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Plan</th>
              <th className="px-5 py-3 text-left">Code</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3 text-left">Period</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {initialPlans.map((p) => (
              <tr key={p.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-900 flex items-center gap-2">
                    {p.name}
                    {p.recommended ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-full px-2 py-0.5">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    ) : null}
                  </div>
                  {p.tagline ? (
                    <div className="text-xs text-ink-500 mt-0.5">{p.tagline}</div>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink-600 font-mono text-xs">{p.code}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap text-ink-900 font-medium">
                  {formatMoney(p.priceCents, p.currency)}
                </td>
                <td className="px-5 py-3 text-ink-600">{periodLabel(p.billingPeriod)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => quickToggleActive(p)}
                    className={
                      p.active
                        ? "inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                        : "inline-flex items-center gap-1 text-xs text-ink-500 hover:underline"
                    }
                    disabled={pending}
                  >
                    {p.active ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
                      </>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3 text-right space-x-1 whitespace-nowrap">
                  <button
                    onClick={() => startEdit(p)}
                    className="inline-flex items-center text-xs text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete plan"
                    disabled={pending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {initialPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-500">
                  No plans configured yet. Create one to populate the public
                  pricing section.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <PlanForm
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

function PlanForm({
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
            {draft.id ? `Edit plan: ${draft.name}` : "New plan"}
          </h3>
          <button onClick={onCancel} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Display name</label>
              <input
                className="input"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Team"
              />
            </div>
            <div>
              <label className="label">Code (machine identifier)</label>
              <input
                className="input font-mono text-sm"
                value={draft.code}
                onChange={(e) =>
                  update("code", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="e.g. team"
                disabled={!!draft.id}
              />
              <p className="text-xs text-ink-500 mt-1">
                Lowercase, digits, underscores. Cannot be changed after creation.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Tagline</label>
            <input
              className="input"
              value={draft.tagline ?? ""}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. Most popular"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[64px]"
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="One sentence describing who this plan is for."
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Price</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={1}
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
            </div>
            <div>
              <label className="label">Currency</label>
              <input
                className="input uppercase"
                value={draft.currency}
                onChange={(e) => update("currency", e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
              />
            </div>
            <div>
              <label className="label">Billing period</label>
              <select
                className="input"
                value={draft.billingPeriod}
                onChange={(e) => update("billingPeriod", e.target.value)}
              >
                <option value="one_time">One-off (per event)</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Features (one per line)</label>
            <textarea
              className="input min-h-[160px] font-mono text-sm"
              value={draft.features}
              onChange={(e) => update("features", e.target.value)}
              placeholder={"Unlimited sessions & speakers\nUnlimited attendees\nQR check-in & certificates"}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.recommended}
                onChange={(e) => update("recommended", e.target.checked)}
              />
              Feature this plan
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => update("active", e.target.checked)}
              />
              Show on public page
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
            disabled={saving || !draft.name || !draft.code || !draft.description}
            className="btn-primary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {draft.id ? "Save changes" : "Create plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
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

function periodLabel(p: string) {
  if (p === "month") return "Monthly";
  if (p === "year") return "Yearly";
  return "One-off";
}
