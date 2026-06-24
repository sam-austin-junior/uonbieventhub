"use client";
import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function RenewButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not start checkout");
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url as string;
    } else {
      setError("No checkout URL returned");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={onClick} disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Renew now
      </button>
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
