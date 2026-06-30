import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "lowercase letters, digits, hyphens"),
  name: z.string().min(2),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  supportEmail: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().url().optional().nullable().or(z.literal("")),
});

async function requireSuperadmin() {
  const session = await getSession();
  if (!session) return { error: "Sign in required", status: 401 as const };
  if (session.role !== "SUPERADMIN")
    return { error: "Hub admin only", status: 403 as const };
  return { session };
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

  const dupe = await prisma.agency.findUnique({ where: { slug: parsed.data.slug } });
  if (dupe) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const agency = await prisma.agency.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      supportEmail: parsed.data.supportEmail || null,
      website: parsed.data.website || null,
    },
  });

  await writeAudit({
    session: auth.session,
    action: "agency.create",
    targetType: "Agency",
    targetId: agency.id,
    summary: `Created agency "${agency.name}" (${agency.slug})`,
  });

  return NextResponse.json({ agency });
}
