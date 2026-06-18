"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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
    const role = data?.user?.role as string | undefined;
    const target =
      next ||
      (role === "SUPERADMIN" ? "/hub-admin" : role === "ORGANIZER" || role === "ADMIN" ? "/admin" : "/");
    router.push(target);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
          <a href="#" className="text-xs text-brand-700 hover:underline">
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
