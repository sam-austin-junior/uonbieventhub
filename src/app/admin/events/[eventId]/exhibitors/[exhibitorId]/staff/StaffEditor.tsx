"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Trash2,
  Crown,
} from "lucide-react";

type Member = {
  id: string;
  isOwner: boolean;
  user: { id: string; name: string; email: string };
};

export function StaffEditor({
  exhibitorId,
  initialMembers,
}: {
  exhibitorId: string;
  initialMembers: Member[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) return;
    setAdding(true);
    const res = await fetch(`/api/admin/exhibitors/${exhibitorId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), isOwner }),
    });
    setAdding(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not add staff member");
      return;
    }
    setInfo(`Invite sent to ${email}.`);
    setEmail("");
    setIsOwner(false);
    startTransition(() => router.refresh());
  }

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.user.email} from the booth team?`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    const res = await fetch(
      `/api/admin/exhibitors/${exhibitorId}/members?memberId=${member.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setError("Could not remove member");
      // restore
      setMembers((prev) => [...prev, member]);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-semibold text-ink-900 mb-4 inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add booth staff
        </h2>
        <form onSubmit={add} className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
          <div>
            <label className="label">Staff member email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="staff@example.com"
            />
            <p className="text-xs text-ink-500 mt-1">
              They must already have an account. Ask them to sign up first.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm h-9 mb-1">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
            />
            Booth owner
          </label>
          <button type="submit" disabled={adding || !email} className="btn-primary mb-1">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </button>
        </form>
        {error ? (
          <div className="mt-3 text-xs text-red-600 inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        ) : null}
        {info ? (
          <div className="mt-3 text-xs text-emerald-700 inline-flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            {info}
          </div>
        ) : null}
      </section>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-ink-50/50">
                <td className="px-5 py-3 font-medium text-ink-900">
                  {m.user.name}
                </td>
                <td className="px-5 py-3 text-ink-600 font-mono text-xs">
                  {m.user.email}
                </td>
                <td className="px-5 py-3">
                  {m.isOwner ? (
                    <span className="badge-accent inline-flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Owner
                    </span>
                  ) : (
                    <span className="badge-gray">Staff</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => remove(m)}
                    disabled={pending}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                    title="Remove from team"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink-500">
                  No staff yet. Add the booth captain first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
