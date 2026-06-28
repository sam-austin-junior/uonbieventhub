import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().min(2).regex(/^[a-z0-9_]+$/, "lowercase letters, digits and underscores only"),
  name: z.string().min(2),
  tagline: z.string().optional().nullable(),
  description: z.string().min(2),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3),
  billingPeriod: z.enum(["one_time", "month", "year"]).default("one_time"),
  recommended: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  features: z.string(),
});

async function requireSuperadmin() {
  const session = await getSession();
  if (!session) return { error: "Sign in required", status: 401 as const };
  if (session.role !== "SUPERADMIN")
    return { error: "Only the hub admin can manage plans", status: 403 as const };
  return { session };
}

export async function GET() {
  const auth = await requireSuperadmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
  });
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.plan.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "A plan with that code already exists" }, { status: 409 });
  }

  const plan = await prisma.plan.create({
    data: {
      ...parsed.data,
      tagline: parsed.data.tagline ?? null,
      currency: parsed.data.currency.toUpperCase(),
    },
  });

  await writeAudit({
    session: auth.session,
    action: "plan.create",
    targetType: "Plan",
    targetId: plan.id,
    summary: `Created plan "${plan.name}" (${plan.code})`,
  });

  return NextResponse.json({ plan });
}
