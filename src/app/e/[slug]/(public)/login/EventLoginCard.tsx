"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

type Step = "identify" | "code" | "set-password" | "open-register";

export function EventLoginCard({
  slug,
  eventName,
  eventLogoUrl,
  attendeeMode,
}: {
  slug: string;
  eventName: string;
  eventLogoUrl: string | null;
  attendeeMode: "OPEN" | "INVITE_ONLY";
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(attendeeMode === "OPEN" ? "open-register" : "identify");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submitIdentify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const res = await fetch(`/api/e/${slug}/activate/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "We couldn't verify those details");
      return;
    }
    const data = await res.json();
    if (data.devCode) {
      setInfo(`Email isn't configured — your code is: ${data.devCode}`);
    } else {
      setInfo(`We've sent a 6-digit code to ${email}.`);
    }
    setNeedsPassword(!!data.needsPassword);
    setStep("code");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (needsPassword && password.length < 8) {
      setError("Pick a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/e/${slug}/activate/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code, password: needsPassword ? password : undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "That code didn't work");
      return;
    }
    router.push(`/e/${slug}`);
    router.refresh();
  }

  async function submitOpenRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Pick a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/e/${slug}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not register");
      return;
    }
    router.push(`/e/${slug}`);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-pop p-8 sm:p-10">
      <div className="flex flex-col items-center text-center">
        {eventLogoUrl ? (
          <img
            src={eventLogoUrl}
            alt={eventName}
            className="h-16 w-16 rounded-md object-contain ring-1 ring-ink-100 bg-white p-1.5"
          />
        ) : null}
        <h1 className="mt-4 text-2xl font-bold text-ink-900">{eventName}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {step === "open-register" ? "Register" :
           step === "identify" ? "Log in" :
           step === "code" ? "Enter verification code" : "Set your password"}
        </p>
      </div>

      {step === "identify" ? (
        <form onSubmit={submitIdentify} className="mt-8 space-y-4">
          <Field label="First name" required>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="input"
              autoFocus
            />
          </Field>
          <Field label="Last name" required>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="input"
            />
          </Field>
          <Field label="Email address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              autoComplete="email"
            />
          </Field>

          {error ? <Alert kind="error">{error}</Alert> : null}

          <button type="submit" disabled={loading} className="w-full btn-primary justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
          </button>
        </form>
      ) : step === "code" ? (
        <form onSubmit={submitCode} className="mt-8 space-y-4">
          <p className="text-sm text-ink-600">
            We've emailed a 6-digit code to <strong>{email}</strong>. Enter it below to
            access {eventName}.
          </p>
          <Field label="Verification code" required>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              className="input text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              autoComplete="one-time-code"
            />
          </Field>

          {needsPassword ? (
            <Field label="Choose a password" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </Field>
          ) : null}

          {info ? <Alert kind="info">{info}</Alert> : null}
          {error ? <Alert kind="error">{error}</Alert> : null}

          <button type="submit" disabled={loading} className="w-full btn-primary justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and continue"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("identify"); setCode(""); setError(null); setInfo(null); }}
            className="w-full text-sm text-ink-500 hover:text-ink-700 inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
        </form>
      ) : (
        <form onSubmit={submitOpenRegister} className="mt-8 space-y-4">
          <Field label="First name" required>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="input" autoFocus />
          </Field>
          <Field label="Last name" required>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="input" />
          </Field>
          <Field label="Email address" required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" autoComplete="email" />
          </Field>
          <Field label="Choose a password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </Field>

          {error ? <Alert kind="error">{error}</Alert> : null}

          <button type="submit" disabled={loading} className="w-full btn-primary justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-ink-400">
        Copyright {new Date().getFullYear()}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1">
        {required ? <span className="text-red-500 mr-1">*</span> : null}
        {label}
      </label>
      {children}
    </div>
  );
}

function Alert({ kind, children }: { kind: "info" | "error"; children: React.ReactNode }) {
  const cls =
    kind === "error"
      ? "bg-red-50 ring-red-100 text-red-700"
      : "bg-brand-50 ring-brand-100 text-brand-800";
  return (
    <div className={`rounded-md ring-1 ${cls} p-3 text-sm`}>{children}</div>
  );
}
