"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function EmailChangeCard({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newEmail || !password) return;
    setLoading(true);
    const res = await fetch("/api/security/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ newEmail, currentPassword: password }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not change email");
      return;
    }
    const data = await res.json();
    setSuccess(`Email updated to ${data.email}. Use it next time you sign in.`);
    setNewEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink-900">Email address</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Current:{" "}
            <span className="font-mono text-ink-700">{currentEmail}</span>
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 max-w-md">
        <div>
          <label className="label">New email address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
            required
            className="input"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label className="label">Confirm with your current password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="input"
          />
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Update email"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
