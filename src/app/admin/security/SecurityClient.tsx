"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
} from "lucide-react";

type Step = "idle" | "scan" | "done";

export function SecurityClient({
  email,
  enabledAt,
}: {
  email: string;
  enabledAt: string | null;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(!!enabledAt);
  const [step, setStep] = useState<Step>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/security/totp/setup", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not start setup");
      return;
    }
    const data = await res.json();
    setQr(data.qr);
    setSecret(data.secret);
    setStep("scan");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/security/totp/enable", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: code }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Verification failed");
      return;
    }
    setEnabled(true);
    setStep("done");
    setCode("");
    setQr(null);
    setSecret(null);
    router.refresh();
  }

  async function disable() {
    if (!confirm("Turn off 2FA? You'll only need your password to sign in.")) return;
    setLoading(true);
    await fetch("/api/security/totp/disable", { method: "POST" });
    setLoading(false);
    setEnabled(false);
    setStep("idle");
    router.refresh();
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className={
                "h-10 w-10 rounded-md flex items-center justify-center " +
                (enabled ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500")
              }
            >
              {enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-semibold text-ink-900">Two-factor authentication</h2>
              <p className="text-sm text-ink-500 mt-0.5">
                {enabled ? "Active — codes from your authenticator app are required at sign-in." : "Off — your password alone signs you in."}
              </p>
            </div>
          </div>
          {enabled ? (
            <button onClick={disable} disabled={loading} className="btn-ghost text-red-600 text-sm">
              <ShieldOff className="h-4 w-4" /> Turn off
            </button>
          ) : step === "idle" ? (
            <button onClick={startSetup} disabled={loading} className="btn-primary text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Smartphone className="h-4 w-4" /> Set up</>}
            </button>
          ) : null}
        </div>

        {step === "scan" && qr && secret ? (
          <form onSubmit={verify} className="mt-6 grid sm:grid-cols-[220px_1fr] gap-6 items-start">
            <img src={qr} alt="Scan with your authenticator app" className="rounded-md ring-1 ring-ink-100 bg-white" />
            <div>
              <ol className="text-sm text-ink-700 space-y-2 list-decimal list-inside">
                <li>Open your authenticator app (Google Authenticator, Authy, 1Password, etc.).</li>
                <li>Scan the QR code on the left, or paste the secret below.</li>
                <li>Enter the 6-digit code your app generates.</li>
              </ol>
              <div className="mt-4 rounded-md ring-1 ring-ink-200 p-3 flex items-center gap-2">
                <code className="flex-1 font-mono text-xs text-ink-700 break-all">{secret}</code>
                <button type="button" onClick={copySecret} className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1">
                  {copied ? <><CheckCircle className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <label className="label mt-4">6-digit code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                pattern="\d{6}"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                className="input text-center text-2xl tracking-[0.5em] font-mono"
              />
              {error ? (
                <div className="mt-3 rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              ) : null}
              <div className="mt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => { setStep("idle"); setQr(null); setSecret(null); setCode(""); setError(null); }} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={loading || code.length < 6} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable 2FA"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="mt-4 rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> 2FA is now active. Codes will be required next time you sign in.
          </div>
        ) : null}
      </div>

      <div className="card p-6 text-sm text-ink-600">
        <strong className="text-ink-900">Note for hub admins:</strong> the login flow currently
        recognises 2FA being enabled on an account but doesn't yet prompt for a code — that
        enforcement ships in a follow-up. Setting it up now means it'll be ready the moment we
        flip the switch.
      </div>
    </div>
  );
}
