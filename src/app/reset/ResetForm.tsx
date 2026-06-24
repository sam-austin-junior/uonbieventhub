"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="mt-6 rounded-md bg-amber-50 ring-1 ring-amber-100 p-4 text-sm text-amber-800 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <div>
          This link is missing its token.{" "}
          <Link href="/forgot" className="text-amber-900 underline">
            Request a fresh one
          </Link>
          .
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Pick a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not reset password");
      return;
    }
    const data = await res.json().catch(() => ({}));
    router.push(data?.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Field label="New password" show={show} setShow={setShow}>
        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="input pl-9 pr-10"
          placeholder="At least 8 characters"
        />
      </Field>
      <Field label="Confirm password" show={show} setShow={setShow}>
        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="input pl-9 pr-10"
          placeholder="Same again"
        />
      </Field>

      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save and sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  show,
  setShow,
  children,
}: {
  label: string;
  show: boolean;
  setShow: (b: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        {children}
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
