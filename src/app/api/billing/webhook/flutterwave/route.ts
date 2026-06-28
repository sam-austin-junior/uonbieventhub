import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  flutterwaveConfigured,
  verifyTransaction,
  verifyWebhookHash,
} from "@/lib/flutterwave";
import { renewalDays } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookBody = {
  event?: string;
  "event.type"?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

export async function POST(req: Request) {
  if (!flutterwaveConfigured()) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const hash = req.headers.get("verif-hash");
  if (!verifyWebhookHash(hash)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as WebhookBody | null;
  if (!body?.data?.id || !body.data.tx_ref) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Trust no client field — always re-verify the transaction with Flutterwave.
  let verified;
  try {
    verified = await verifyTransaction(body.data.id);
  } catch (err) {
    return NextResponse.json(
      { error: `Verification failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { flutterwaveTxRef: verified.txRef },
  });
  if (!payment) {
    // Not one of ours; ack so Flutterwave doesn't retry forever.
    return NextResponse.json({ received: true, note: "Unknown tx_ref" });
  }

  const wasPaid = payment.status === "paid";
  const isSuccessful = verified.status === "successful";

  if (!isSuccessful) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: verified.status,
        flutterwaveTxId: String(verified.id),
      },
    });
    return NextResponse.json({ received: true });
  }

  // Idempotency: don't extend access twice for the same transaction.
  if (wasPaid) {
    return NextResponse.json({ received: true, note: "Already processed" });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      flutterwaveTxId: String(verified.id),
    },
  });

  // Extend the organizer's access window.
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: { expiresAt: true },
  });
  const base = user?.expiresAt && user.expiresAt > now ? user.expiresAt : now;
  const nextExpiry = new Date(
    base.getTime() + renewalDays() * 24 * 60 * 60 * 1000,
  );
  await prisma.user.update({
    where: { id: payment.userId },
    data: { expiresAt: nextExpiry, suspendedAt: null },
  });

  return NextResponse.json({ received: true });
}
