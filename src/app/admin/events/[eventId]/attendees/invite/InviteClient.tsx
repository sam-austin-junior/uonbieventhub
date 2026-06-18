"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Upload,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  Mail,
} from "lucide-react";

type Invite = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  invitedAt: string;
  activatedAt: string | null;
  emailSentAt: string | null;
};

function parseList(text: string) {
  const out: { firstName: string; lastName: string; email: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/[,\t;]+/).map((p) => p.trim());
    if (parts.length < 3) continue;
    const [firstName, lastName, email] = parts;
    if (!email || !/.+@.+\..+/.test(email)) continue;
    out.push({ firstName, lastName, email: email.toLowerCase() });
  }
  return out;
}

export function InviteClient({ eventId, invites }: { eventId: string; invites: Invite[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ added: number; skipped: number; emailed: number; emailFailed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const list = parseList(text);
    if (list.length === 0) {
      setError("Add at least one attendee — paste a list or upload a CSV.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSummary(null);
    const res = await fetch(`/api/admin/events/${eventId}/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invitees: list, sendEmail }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save invites");
      return;
    }
    const data = await res.json();
    setSummary(data);
    setText("");
    startTransition(() => router.refresh());
  }

  async function onFile(file: File) {
    const t = await file.text();
    setText((prev) => (prev ? prev + "\n" + t : t));
  }

  async function deleteInvite(id: string) {
    if (!confirm("Remove this invite? If they've already activated, their account stays.")) return;
    const res = await fetch(`/api/admin/events/${eventId}/invites?id=${id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  async function resendOne(inv: Invite) {
    const res = await fetch(`/api/admin/events/${eventId}/invites/${inv.id}/resend`, { method: "POST" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label !mb-0">
              Attendee list <span className="text-ink-400 font-normal">(First, Last, Email — one per line)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                <Upload className="h-3 w-3" /> Upload CSV
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="input font-mono text-xs"
            placeholder={"Brenda, Kamau, brenda@uonbi.ac.ke\nJames, Onyango, james@uonbi.ac.ke"}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          Send activation-info emails right away (requires SMTP)
        </label>

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {summary ? (
          <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800">
            <strong>{summary.added}</strong> invite{summary.added === 1 ? "" : "s"} added
            {summary.skipped > 0 ? `, ${summary.skipped} skipped (already invited)` : ""}
            {sendEmail && summary.emailed > 0 ? `, ${summary.emailed} emailed` : ""}
            {summary.emailFailed > 0 ? ` (${summary.emailFailed} failed)` : ""}.
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Send className="h-4 w-4" /> Add invites</>}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">Invitee</th>
              <th className="px-5 py-3 text-left">Invited</th>
              <th className="px-5 py-3 text-left">Email status</th>
              <th className="px-5 py-3 text-left">Activated</th>
              <th className="px-5 py-3 text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {invites.map((i) => (
              <tr key={i.id} className="hover:bg-ink-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-ink-900">{i.firstName} {i.lastName}</div>
                  <div className="text-xs text-ink-500">{i.email}</div>
                </td>
                <td className="px-5 py-3 text-ink-500 whitespace-nowrap">
                  {new Date(i.invitedAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  {i.emailSentAt ? (
                    <span className="badge-green inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Sent</span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Queued</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {i.activatedAt ? <span className="badge-green">Active</span> : <span className="badge-gray">Pending</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {!i.activatedAt ? (
                      <button onClick={() => resendOne(i)} className="p-1.5 rounded hover:bg-brand-50 text-brand-700" title="Resend info">
                        <Mail className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button onClick={() => deleteInvite(i.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Remove invite">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invites.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-500">No invitees yet. Paste a list above to get started.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
