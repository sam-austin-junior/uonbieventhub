"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"password" | "totp">("password");
  const [code, setCode] = useState("");

  function landingFor(role?: string) {
    return (
      next ||
      (role === "SUPERADMIN"
        ? "/hub-admin"
        : role === "ORGANIZER" || role === "ADMIN"
        ? "/admin"
        : "/")
    );
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign in failed");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data?.needsTotp) {
      setStage("totp");
      setCode("");
      return;
    }
    router.push(landingFor(data?.user?.role));
    router.refresh();
  }

  async function onTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login/totp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Verification failed");
      return;
    }
    const data = await res.json().catch(() => ({}));
    router.push(landingFor(data?.user?.role));
    router.refresh();
  }

  if (stage === "totp") {
    return (
      <form onSubmit={onTotpSubmit} className="mt-8 space-y-4">
        <div className="flex items-start gap-3 rounded-md bg-brand-50 ring-1 ring-brand-100 p-3 text-sm text-brand-800">
          <ShieldCheck className="h-4 w-4 mt-0.5" />
          <div>
            Two-factor authentication is on for this account. Open your
            authenticator app and enter the 6-digit code for{" "}
            <span className="font-medium">{email}</span>.
          </div>
        </div>

        <div>
          <label className="label">Authentication code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 7))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="input text-center font-mono text-lg tracking-widest"
            placeholder="123 456"
          />
          <p className="mt-2 text-xs text-ink-500">
            Codes refresh every 30 seconds. The previous and next code are
            also accepted briefly.
          </p>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Verifying…" : "Verify and sign in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStage("password");
            setError(null);
            setCode("");
          }}
          className="w-full text-center text-xs text-ink-500 hover:text-ink-700"
        >
          Use a different account
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onPasswordSubmit} className="mt-8 space-y-4">
      <div>
        <label className="label">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input pl-9"
            placeholder="you@uonbi.ac.ke"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Password</label>
          <a href="/forgot" className="text-xs text-brand-700 hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input pl-9 pr-10"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center group">
        {loading ? "Signing in…" : "Sign in"}
        {!loading ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </button>
    </form>
  );
}
