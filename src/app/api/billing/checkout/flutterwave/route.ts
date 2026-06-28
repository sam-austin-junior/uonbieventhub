import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getSession } from "@/lib/auth";
import {
  flutterwaveConfigured,
  createStandardCharge,
} from "@/lib/flutterwave";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  planId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!flutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Flutterwave is not configured" },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Only organizers can purchase plans" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const txRef = `uon_${plan.code}_${user.id.slice(0, 8)}_${randomUUID().slice(0, 8)}`;
  const origin = new URL(req.url).origin;
  const redirectUrl = `${origin}/admin/billing?provider=flutterwave&txRef=${encodeURIComponent(txRef)}`;

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      provider: "flutterwave",
      amountCents: plan.priceCents,
      currency: plan.currency.toUpperCase(),
      status: "pending",
      description: `${plan.name} plan purchase`,
      flutterwaveTxRef: txRef,
    },
  });

  try {
    const { hostedLink } = await createStandardCharge({
      txRef,
      amount: plan.priceCents / 100,
      currency: plan.currency,
      redirectUrl,
      customer: { email: user.email, name: user.name },
      meta: { userId: user.id, planId: plan.id, paymentId: payment.id },
      customizations: {
        title: "UoN Event Hub",
        description: `${plan.name} — ${plan.tagline ?? "Plan purchase"}`,
        logo: `${origin}/uon-logo.png`,
      },
    });

    const sess = await getSession();
    if (sess) {
      await writeAudit({
        session: sess,
        action: "billing.checkout.create",
        targetType: "Payment",
        targetId: payment.id,
        summary: `Started Flutterwave checkout for ${plan.name}`,
        metadata: { planId: plan.id, txRef, amountCents: plan.priceCents, currency: plan.currency },
      });
    }

    return NextResponse.json({ url: hostedLink });
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        metadata: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 502 },
    );
  }
}
