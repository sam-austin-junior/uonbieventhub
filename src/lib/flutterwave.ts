/**
 * Thin wrapper around the Flutterwave REST API.
 * Docs: https://developer.flutterwave.com/reference
 *
 * We talk to the v3 Standard endpoint (`/v3/payments`) which returns a hosted
 * checkout link that supports cards, M-Pesa, mobile money, bank transfer and
 * PayPal depending on the merchant account configuration.
 */

const BASE = "https://api.flutterwave.com/v3";

export function flutterwaveConfigured() {
  return Boolean(process.env.FLW_SECRET_KEY);
}

function key() {
  const k = process.env.FLW_SECRET_KEY;
  if (!k) throw new Error("Flutterwave is not configured (set FLW_SECRET_KEY)");
  return k;
}

export type StandardChargeArgs = {
  txRef: string;
  amount: number; // major units, e.g. 250 for $2.50? No — major units, e.g. 250 for KES 250.
  currency: string;
  redirectUrl: string;
  customer: { email: string; name?: string; phonenumber?: string };
  meta?: Record<string, string | number>;
  customizations?: { title?: string; description?: string; logo?: string };
};

export async function createStandardCharge(args: StandardChargeArgs) {
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: args.txRef,
      amount: args.amount,
      currency: args.currency.toUpperCase(),
      redirect_url: args.redirectUrl,
      customer: args.customer,
      meta: args.meta,
      customizations: args.customizations,
      payment_options: "card,mobilemoney,ussd,banktransfer,mpesa",
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | { status: string; message: string; data?: { link: string } }
    | null;
  if (!res.ok || !json || json.status !== "success" || !json.data?.link) {
    throw new Error(
      json?.message ?? `Flutterwave API error: HTTP ${res.status}`,
    );
  }
  return { hostedLink: json.data.link };
}

export type VerifiedTransaction = {
  id: number;
  txRef: string;
  status: string;
  amount: number;
  currency: string;
  customer: { email: string };
};

export async function verifyTransaction(transactionId: string | number): Promise<VerifiedTransaction> {
  const res = await fetch(`${BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const json = (await res.json().catch(() => null)) as
    | {
        status: string;
        message: string;
        data?: {
          id: number;
          tx_ref: string;
          status: string;
          amount: number;
          currency: string;
          customer: { email: string };
        };
      }
    | null;
  if (!res.ok || !json || json.status !== "success" || !json.data) {
    throw new Error(json?.message ?? `Verification failed: HTTP ${res.status}`);
  }
  return {
    id: json.data.id,
    txRef: json.data.tx_ref,
    status: json.data.status,
    amount: json.data.amount,
    currency: json.data.currency,
    customer: { email: json.data.customer.email },
  };
}

/**
 * Flutterwave secures webhooks with a static "verif-hash" header set in their
 * dashboard. There's no HMAC — just compare against the env value.
 */
export function verifyWebhookHash(receivedHash: string | null): boolean {
  const expected = process.env.FLW_WEBHOOK_HASH;
  if (!expected) return false;
  return receivedHash === expected;
}
