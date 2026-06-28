"use client";
import { useState } from "react";
import { Loader2, CreditCard, Smartphone, AlertCircle } from "lucide-react";

export function PlanCheckout({
  plan,
  stripeEnabled,
  flutterwaveEnabled,
}: {
  plan: {
    id: string;
    name: string;
    tagline: string | null;
    description: string;
    priceCents: number;
    currency: string;
    billingPeriod: string;
    features: string[];
  };
  stripeEnabled: boolean;
  flutterwaveEnabled: boolean;
}) {
  const [loading, setLoading] = useState<"stripe" | "flutterwave" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(provider: "stripe" | "flutterwave") {
    setError(null);
    setLoading(provider);
    try {
      const url =
        provider === "flutterwave"
          ? "/api/billing/checkout/flutterwave"
          : "/api/billing/checkout";
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setLoading(null);
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  return (
    <section className="card p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {plan.tagline ? (
            <div className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold mb-1">
              {plan.tagline}
            </div>
          ) : null}
          <h2 className="text-2xl font-bold text-ink-900">{plan.name}</h2>
          <p className="text-sm text-ink-600 mt-1 max-w-md">{plan.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-ink-900">
            {formatMoney(plan.priceCents, plan.currency)}
          </div>
          <div className="text-xs text-ink-500">{periodLabel(plan.billingPeriod)}</div>
        </div>
      </div>

      <ul className="mt-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-ink-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-700 mt-2 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-ink-100 pt-6">
        <div className="text-sm font-semibold text-ink-900 mb-3">Pay with</div>

        {error ? (
          <div className="mb-4 rounded-md bg-red-50 ring-1 ring-red-100 px-3 py-2 text-sm text-red-700 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-3">
          {flutterwaveEnabled ? (
            <button
              onClick={() => pay("flutterwave")}
              disabled={loading !== null}
              className="card p-4 text-left hover:ring-brand-700 hover:bg-brand-50/30 transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-ink-900">
                    <Smartphone className="h-4 w-4 text-brand-700" />
                    Flutterwave
                  </div>
                  <div className="text-xs text-ink-500 mt-1">
                    Cards, M-Pesa, mobile money, bank transfer
                  </div>
                </div>
                {loading === "flutterwave" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
                ) : null}
              </div>
            </button>
          ) : null}

          {stripeEnabled ? (
            <button
              onClick={() => pay("stripe")}
              disabled={loading !== null}
              className="card p-4 text-left hover:ring-brand-700 hover:bg-brand-50/30 transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-ink-900">
                    <CreditCard className="h-4 w-4 text-brand-700" />
                    Stripe
                  </div>
                  <div className="text-xs text-ink-500 mt-1">
                    International cards, Apple Pay, Google Pay
                  </div>
                </div>
                {loading === "stripe" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
                ) : null}
              </div>
            </button>
          ) : null}
        </div>

        {!stripeEnabled && !flutterwaveEnabled ? (
          <div className="text-sm text-ink-500">
            No payment processors are configured yet. Contact the hub admin.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function periodLabel(p: string) {
  if (p === "month") return "billed monthly";
  if (p === "year") return "billed yearly";
  return "one-time";
}
