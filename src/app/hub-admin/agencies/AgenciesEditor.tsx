"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Crown,
  X,
  UserPlus,
  Save,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAgencyOwner: boolean;
};

type Agency = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  supportEmail: string | null;
  website: string | null;
  memberCount: number;
  members: Member[];
};

export function AgenciesEditor({ initialAgencies }: { initialAgencies: Agency[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [agencies, setAgencies] = useState(initialAgencies);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function remove(a: Agency) {
    if (!confirm(`Delete agency "${a.name}"? Members will be unlinked.`)) return;
    const res = await fetch(`/api/hub-admin/agencies/${a.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete");
      return;
    }
    setAgencies((arr) => arr.filter((x) => x.id !== a.id));
    setInfo(`Deleted "${a.name}"`);
    refresh();
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
          {agencies.length} agenc{agencies.length === 1 ? "y" : "ies"}
        </p>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New agency
        </button>
      </div>

      <ul className="space-y-3">
        {agencies.map((a) => (
          <li key={a.id} className="card overflow-hidden">
            <div className="p-5 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-ink-900">{a.name}</h2>
                  <span className="text-xs font-mono text-ink-400">{a.slug}</span>
                </div>
                <div className="mt-1 text-xs text-ink-500 flex flex-wrap gap-3">
                  <span>{a.memberCount} member{a.memberCount === 1 ? "" : "s"}</span>
                  {a.supportEmail ? <span>{a.supportEmail}</span> : null}
                  {a.website ? (
                    <a
                      href={a.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:underline"
                    >
                      {a.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                  className="text-xs text-brand-700 hover:underline"
                >
                  {editingId === a.id ? "Close" : "Manage"}
                </button>
                <button
                  onClick={() => remove(a)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                  title="Delete agency"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {editingId === a.id ? (
              <AgencyEditor
                agency={a}
                onUpdated={(next) =>
                  setAgencies((arr) => arr.map((x) => (x.id === next.id ? next : x)))
                }
              />
            ) : null}
          </li>
        ))}
        {agencies.length === 0 ? (
          <li className="card p-10 text-center text-sm text-ink-500">
            No agencies yet.
          </li>
        ) : null}
      </ul>

      {creating ? (
        <NewAgencyModal
          onClose={() => setCreating(false)}
          onCreated={(a) => {
            setAgencies((arr) => [{ ...a, memberCount: 0, members: [] }, ...arr]);
            setCreating(false);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function AgencyEditor({
  agency,
  onUpdated,
}: {
  agency: Agency;
  onUpdated: (next: Agency) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(agency.name);
  const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? "");
  const [supportEmail, setSupportEmail] = useState(agency.supportEmail ?? "");
  const [website, setWebsite] = useState(agency.website ?? "");
  const [members, setMembers] = useState(agency.members);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberIsOwner, setMemberIsOwner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function saveMeta() {
    setSaving(true);
    setError(null);
    setInfo(null);
    const res = await fetch(`/api/hub-admin/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        logoUrl: logoUrl || null,
        supportEmail: supportEmail || null,
        website: website || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    onUpdated({ ...agency, name, logoUrl: logoUrl || null, supportEmail: supportEmail || null, website: website || null });
    setInfo("Saved.");
    router.refresh();
  }

  async function addMember() {
    if (!memberEmail) return;
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/hub-admin/agencies/${agency.id}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: memberEmail, isAgencyOwner: memberIsOwner }),
    });
    setAdding(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not add member");
      return;
    }
    setMemberEmail("");
    setMemberIsOwner(false);
    setInfo(`Added ${memberEmail}.`);
    router.refresh();
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member from the agency?")) return;
    const res = await fetch(
      `/api/hub-admin/agencies/${agency.id}/members?userId=${userId}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    setMembers((arr) => arr.filter((m) => m.id !== userId));
    router.refresh();
  }

  return (
    <div className="border-t border-ink-100 bg-ink-50/40 p-5 space-y-5">
      <section>
        <h3 className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">
          Brand
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Display name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input
              type="url"
              className="input"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">Support email</label>
            <input
              type="email"
              className="input"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Website</label>
            <input
              type="url"
              className="input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs">
            {error ? (
              <span className="text-red-600 inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </span>
            ) : info ? (
              <span className="text-emerald-700 inline-flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> {info}
              </span>
            ) : null}
          </div>
          <button onClick={saveMeta} disabled={saving} className="btn-secondary text-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save brand
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-3">
          Members
        </h3>
        <ul className="card overflow-hidden mb-3">
          {members.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-500">No members yet.</li>
          ) : (
            members.map((m) => (
              <li
                key={m.id}
                className="px-4 py-2.5 border-b border-ink-100 last:border-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-900 inline-flex items-center gap-1.5">
                    {m.name}
                    {m.isAgencyOwner ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-full px-1.5 py-0.5">
                        <Crown className="h-2.5 w-2.5" /> Owner
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-ink-500 font-mono">{m.email}</div>
                </div>
                <button
                  onClick={() => removeMember(m.id)}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                  title="Remove from agency"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="label">Add by email</label>
            <input
              type="email"
              className="input"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="member@agency.com"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm h-9 mb-1">
            <input
              type="checkbox"
              checked={memberIsOwner}
              onChange={(e) => setMemberIsOwner(e.target.checked)}
            />
            Agency owner
          </label>
          <button onClick={addMember} disabled={adding || !memberEmail} className="btn-primary mb-1">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add
          </button>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          User must already have an account. Their events automatically render with this agency's brand.
        </p>
      </section>
    </div>
  );
}

function NewAgencyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (a: Omit<Agency, "memberCount" | "members">) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoslug(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function submit() {
    setErr(null);
    if (!name || !slug) {
      setErr("Name and slug are required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/hub-admin/agencies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        supportEmail: supportEmail || null,
        website: website || null,
        logoUrl: logoUrl || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not create");
      return;
    }
    const data = await res.json();
    onCreated(data.agency);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-pop">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">New agency</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === autoslug(name)) setSlug(autoslug(e.target.value));
              }}
              placeholder="Acme Events Co"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              className="input font-mono"
              value={slug}
              onChange={(e) => setSlug(autoslug(e.target.value))}
              placeholder="acme-events"
            />
          </div>
          <div>
            <label className="label">Logo URL (optional)</label>
            <input type="url" className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
          <div>
            <label className="label">Support email (optional)</label>
            <input type="email" className="input" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Website (optional)</label>
            <input type="url" className="input" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          {err ? (
            <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {err}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving || !name || !slug} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
