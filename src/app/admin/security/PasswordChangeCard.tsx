"use client";
import { useState } from "react";
import {
  KeyRound,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export function PasswordChangeCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/security/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not change password");
      return;
    }
    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-ink-900">Change password</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Use a strong, unique password. At least 8 characters.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 max-w-md">
        <Field
          label="Current password"
          type={show ? "text" : "password"}
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          required
        />
        <Field
          label="New password"
          type={show ? "text" : "password"}
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Field
          label="Confirm new password"
          type={show ? "text" : "password"}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-xs text-ink-500 hover:text-ink-700 inline-flex items-center gap-1"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? "Hide" : "Show"} passwords
        </button>

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Password updated. Use the new one next time you sign in.
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Update password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="input"
      />
    </div>
  );
}
