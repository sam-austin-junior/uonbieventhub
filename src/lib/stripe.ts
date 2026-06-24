import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured (set STRIPE_SECRET_KEY)");
  }
  _client = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _client;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function renewalPriceCents() {
  const v = parseInt(process.env.STRIPE_RENEWAL_PRICE_CENTS ?? "50000", 10);
  return Number.isFinite(v) && v > 0 ? v : 50000;
}

export function renewalCurrency() {
  return (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase();
}

export function renewalDays() {
  const v = parseInt(process.env.STRIPE_RENEWAL_DAYS ?? "365", 10);
  return Number.isFinite(v) && v > 0 ? v : 365;
}

export function formatMoney(cents: number, currency = renewalCurrency()) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
