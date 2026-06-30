"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Smartphone,
} from "lucide-react";

type TicketView = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  remaining: number | null;
  available: boolean;
  unavailableReason: string | null;
};

export function TicketSelector({
  slug,
  tickets,
  flutterwaveEnabled,
  stripeEnabled,
}: {
  slug: string;
  tickets: TicketView[];
  flutterwaveEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const firstAvailable = tickets.find((t) => t.available);
  const [selectedId, setSelectedId] = useState<string>(firstAvailable?.id ?? tickets[0].id);
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<{
    finalCents: number;
    discountCents: number;
    promoError: string | null;
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [provider, setProvider] = useState<"stripe" | "flutterwave">(
    flutterwaveEnabled ? "flutterwave" : "stripe",
  );
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = tickets.find((t) => t.id === selectedId);
  const isFree = selected && (quote?.finalCents ?? selected.priceCents) === 0;

  async function applyCode() {
    if (!selected) return;
    setError(null);
    setQuoting(true);
    try {
      const res = await fetch(`/api/e/${slug}/tickets/quote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketTypeId: selected.id, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not validate code");
      setQuote({
        finalCents: data.finalCents,
        discountCents: data.discountCents,
        promoError: data.promoError,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not validate code");
    } finally {
      setQuoting(false);
    }
  }

  function pickTicket(id: string) {
    setSelectedId(id);
    setQuote(null);
    setCode("");
    setError(null);
  }

  async function purchase() {
    if (!selected || !selected.available) return;
    setError(null);
    setPurchasing(true);
    try {
      const res = await fetch(`/api/e/${slug}/tickets/purchase`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketTypeId: selected.id,
          code: code || null,
          provider: isFree ? undefined : provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
      if (data.free) {
        router.push(data.redirectTo ?? `/e/${slug}`);
        router.refresh();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Unexpected checkout response");
    } catch (err) {
      setPurchasing(false);
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  if (!selected) return null;
  const baseTotal = selected.priceCents;
  const finalTotal = quote?.finalCents ?? baseTotal;

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {tickets.map((t) => (
          <li key={t.id}>
            <label
              className={`block rounded-2xl border p-5 cursor-pointer transition ${
                t.id === selectedId
                  ? "border-brand-700 ring-1 ring-brand-700 bg-brand-50/40"
                  : "border-ink-200 hover:border-ink-300"
              } ${!t.available ? "opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="ticket"
                value={t.id}
                checked={t.id === selectedId}
                onChange={() => pickTicket(t.id)}
                disabled={!t.available}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink-900 flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-brand-700" />
                    {t.name}
                  </div>
                  {t.description ? (
                    <p className="mt-1 text-sm text-ink-600">{t.description}</p>
                  ) : null}
                  {!t.available ? (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {labelFor(t.unavailableReason)}
                    </p>
                  ) : t.remaining !== null && t.remaining <= 10 ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Only {t.remaining} left
                    </p>
                  ) : null}
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-xl font-semibold text-ink-900">
                    {formatMoney(t.priceCents, t.currency)}
                  </div>
                </div>
              </div>
            </label>
          </li>
        ))}
      </ul>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Promo code (optional)</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input font-mono uppercase tracking-wider"
              placeholder="EARLYBIRD25"
            />
            <button
              type="button"
              onClick={applyCode}
              disabled={!code || quoting}
              className="btn-secondary"
            >
              {quoting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </div>
          {quote?.promoError ? (
            <p className="mt-2 text-xs text-red-600 inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {quote.promoError}
            </p>
          ) : null}
          {quote && quote.discountCents > 0 ? (
            <p className="mt-2 text-xs text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Discount applied:{" "}
              {formatMoney(quote.discountCents, selected.currency)} off
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-ink-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500">
              Total
            </div>
            <div className="text-2xl font-bold text-ink-900">
              {formatMoney(finalTotal, selected.currency)}
            </div>
            {quote && quote.discountCents > 0 ? (
              <div className="text-xs text-ink-400 line-through">
                {formatMoney(baseTotal, selected.currency)}
              </div>
            ) : null}
          </div>
        </div>

        {!isFree ? (
          <div>
            <div className="text-sm font-semibold text-ink-900 mb-2">Pay with</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {flutterwaveEnabled ? (
                <ProviderButton
                  active={provider === "flutterwave"}
                  onClick={() => setProvider("flutterwave")}
                  icon={<Smartphone className="h-4 w-4" />}
                  label="Flutterwave"
                  sub="Cards, M-Pesa, mobile money"
                />
              ) : null}
              {stripeEnabled ? (
                <ProviderButton
                  active={provider === "stripe"}
                  onClick={() => setProvider("stripe")}
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Stripe"
                  sub="International cards, Apple/Google Pay"
                />
              ) : null}
            </div>
            {!flutterwaveEnabled && !stripeEnabled ? (
              <div className="text-sm text-amber-700">
                No payment processors are configured for this platform yet.
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <button
          onClick={purchase}
          disabled={
            purchasing ||
            !selected.available ||
            (!isFree && !flutterwaveEnabled && !stripeEnabled)
          }
          className="btn-primary w-full justify-center"
        >
          {purchasing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFree ? (
            "Confirm free registration"
          ) : (
            `Pay ${formatMoney(finalTotal, selected.currency)}`
          )}
        </button>
      </div>
    </div>
  );
}

function ProviderButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card p-3 text-left transition ${
        active ? "ring-brand-700 bg-brand-50/40" : "hover:ring-ink-300"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-ink-900">
        {icon}
        {label}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{sub}</div>
    </button>
  );
}

function labelFor(reason: string | null) {
  switch (reason) {
    case "SOLD_OUT":
      return "Sold out";
    case "SALE_ENDED":
      return "Sales ended";
    case "NOT_ON_SALE_YET":
      return "Not on sale yet";
    case "INACTIVE":
      return "Currently unavailable";
    default:
      return "Unavailable";
  }
}

function formatMoney(cents: number, currency: string) {
  if (cents === 0) return "Free";
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
