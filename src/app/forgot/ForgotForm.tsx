"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-4 text-sm text-emerald-800">
        <div className="inline-flex items-center gap-2 font-semibold">
          <CheckCircle className="h-4 w-4" /> Check your inbox
        </div>
        <p className="mt-1">
          If <strong>{email}</strong> matches an active hub admin or organizer account, a reset link
          is on its way. The link expires in 1 hour.
        </p>
        <p className="mt-2 text-xs">
          Didn't get it? Check spam, or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-emerald-900 underline"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="input pl-9"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
      </button>

      <p className="text-xs text-ink-400 text-center">
        Remembered it?{" "}
        <Link href="/login" className="text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
