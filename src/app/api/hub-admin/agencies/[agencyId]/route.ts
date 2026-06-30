import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
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

export async function PATCH(req: Request, { params }: { params: { agencyId: string } }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } });
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data: Record<string, unknown> = { ...parsed.data };
  for (const k of ["logoUrl", "supportEmail", "website"] as const) {
    if (data[k] === "") data[k] = null;
  }

  await prisma.agency.update({ where: { id: agency.id }, data });
  await writeAudit({
    session: auth.session,
    action: "agency.update",
    targetType: "Agency",
    targetId: agency.id,
    summary: `Updated agency "${agency.name}"`,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { agencyId: string } }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } });
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.agency.delete({ where: { id: agency.id } });
  await writeAudit({
    session: auth.session,
    action: "agency.delete",
    targetType: "Agency",
    targetId: agency.id,
    summary: `Deleted agency "${agency.name}"`,
  });
  return NextResponse.json({ ok: true });
}
