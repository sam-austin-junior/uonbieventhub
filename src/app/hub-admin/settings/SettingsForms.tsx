"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, Sparkles, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

type Initial = {
  brandName: string;
  fromName: string;
  fromEmail: string;
};

export function SettingsForms({
  initial,
  resendConfigured,
}: {
  initial: Initial;
  resendConfigured: boolean;
}) {
  const router = useRouter();
  const [brand, setBrand] = useState({ brandName: initial.brandName });
  const [email, setEmail] = useState({ fromName: initial.fromName, fromEmail: initial.fromEmail });
  const [savedBrand, setSavedBrand] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    setSavingBrand(true);
    setSavedBrand(false);
    const res = await fetch("/api/hub-admin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brandName: brand.brandName }),
    });
    setSavingBrand(false);
    if (res.ok) { setSavedBrand(true); router.refresh(); }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setSavedEmail(false);
    const res = await fetch("/api/hub-admin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fromName: email.fromName || null, fromEmail: email.fromEmail || null }),
    });
    setSavingEmail(false);
    if (res.ok) { setSavedEmail(true); router.refresh(); }
  }

  async function sendTest() {
    if (!testTo) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/hub-admin/config/test-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: testTo }),
    });
    setTesting(false);
    const data = await res.json().catch(() => ({}));
    setTestResult({
      ok: res.ok,
      message: res.ok ? `Test email sent to ${testTo}` : data.error ?? "Send failed",
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveBrand} className="card p-6">
        <h2 className="font-semibold text-ink-900 mb-1 inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-700" /> Brand
        </h2>
        <p className="text-sm text-ink-500 mb-5">
          Used in the hub admin sidebar and as the email "From" name fallback.
        </p>
        <div>
          <label className="label">Brand name</label>
          <input
            value={brand.brandName}
            onChange={(e) => setBrand({ brandName: e.target.value })}
            required
            className="input"
          />
        </div>
        <div className="flex items-center justify-end gap-3 mt-5">
          {savedBrand ? <span className="text-sm text-emerald-700">Saved</span> : null}
          <button type="submit" disabled={savingBrand} className="btn-primary">
            {savingBrand ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <form onSubmit={saveEmail} className="card p-6">
        <h2 className="font-semibold text-ink-900 mb-1 inline-flex items-center gap-2">
          <Mail className="h-4 w-4 text-brand-700" /> Email (Resend)
        </h2>
        <p className="text-sm text-ink-500 mb-5">
          All transactional email goes through <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-brand-700 hover:underline inline-flex items-center gap-0.5">Resend <ExternalLink className="h-3 w-3" /></a>.
          The API key lives in the <code className="font-mono text-xs bg-ink-100 px-1 rounded">RESEND_API_KEY</code> env
          var on the server; configure the "From" identity here.
        </p>

        <div
          className={
            "mb-5 rounded-md p-3 text-sm ring-1 inline-flex items-start gap-2 " +
            (resendConfigured
              ? "bg-emerald-50 ring-emerald-100 text-emerald-800"
              : "bg-amber-50 ring-amber-100 text-amber-800")
          }
        >
          {resendConfigured ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <div>
            <strong>
              {resendConfigured ? "Resend is configured." : "Resend isn't configured yet."}
            </strong>{" "}
            {resendConfigured
              ? "Emails will be sent."
              : "Set RESEND_API_KEY in your .env file. The app still works without it — activation codes will be shown on screen instead."}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">From name</label>
            <input
              value={email.fromName}
              onChange={(e) => setEmail({ ...email, fromName: e.target.value })}
              className="input"
              placeholder="UoN Event Hub"
            />
          </div>
          <div>
            <label className="label">From email</label>
            <input
              type="email"
              value={email.fromEmail}
              onChange={(e) => setEmail({ ...email, fromEmail: e.target.value })}
              className="input"
              placeholder="events@yourdomain.ac.ke"
            />
            <p className="text-xs text-ink-400 mt-1">
              Must be a domain you've verified in your Resend dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          {savedEmail ? <span className="text-sm text-emerald-700">Saved</span> : null}
          <button type="submit" disabled={savingEmail} className="btn-primary">
            {savingEmail ? "Saving…" : "Save email settings"}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-ink-100">
          <div className="text-sm font-medium text-ink-800 mb-2">Send a test email</div>
          <div className="flex gap-2">
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="input flex-1"
              placeholder="you@example.com"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={testing || !testTo || !resendConfigured}
              className="btn-secondary"
            >
              {testing ? "Sending…" : <><Send className="h-4 w-4" /> Send test</>}
            </button>
          </div>
          {testResult ? (
            <div
              className={`mt-3 text-sm inline-flex items-center gap-2 ${testResult.ok ? "text-emerald-700" : "text-red-700"}`}
            >
              {testResult.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
