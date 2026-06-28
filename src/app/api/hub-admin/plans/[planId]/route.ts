import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().optional().nullable(),
  description: z.string().min(2).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  billingPeriod: z.enum(["one_time", "month", "year"]).optional(),
  recommended: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  features: z.string().optional(),
});

async function requireSuperadmin() {
  const session = await getSession();
  if (!session) return { error: "Sign in required", status: 401 as const };
  if (session.role !== "SUPERADMIN")
    return { error: "Only the hub admin can manage plans", status: 403 as const };
  return { session };
}

export async function PATCH(req: Request, { params }: { params: { planId: string } }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const existing = await prisma.plan.findUnique({ where: { id: params.planId } });
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (typeof data.currency === "string") data.currency = (data.currency as string).toUpperCase();

  const plan = await prisma.plan.update({
    where: { id: params.planId },
    data,
  });

  await writeAudit({
    session: auth.session,
    action: "plan.update",
    targetType: "Plan",
    targetId: plan.id,
    summary: `Updated plan "${plan.name}" (${plan.code})`,
  });

  return NextResponse.json({ plan });
}

export async function DELETE(_req: Request, { params }: { params: { planId: string } }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const existing = await prisma.plan.findUnique({ where: { id: params.planId } });
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  await prisma.plan.delete({ where: { id: params.planId } });

  await writeAudit({
    session: auth.session,
    action: "plan.delete",
    targetType: "Plan",
    targetId: existing.id,
    summary: `Deleted plan "${existing.name}" (${existing.code})`,
  });

  return NextResponse.json({ ok: true });
}
