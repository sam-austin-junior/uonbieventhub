import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  organization: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  extendDays: z.number().int().min(1).max(3650).optional(),
  suspend: z.boolean().optional(),
});

async function assertHubAdmin() {
  const s = await getSession();
  if (!s || s.role !== "SUPERADMIN") return null;
  return s;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await assertHubAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.email) data.email = parsed.data.email.toLowerCase();
  if ("organization" in parsed.data) data.organization = parsed.data.organization;
  if ("expiresAt" in parsed.data) data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (parsed.data.extendDays) {
    const base = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date();
    data.expiresAt = new Date(base.getTime() + parsed.data.extendDays * 24 * 60 * 60 * 1000);
    data.suspendedAt = null;
  }
  if (parsed.data.suspend === true) data.suspendedAt = new Date();
  if (parsed.data.suspend === false) data.suspendedAt = null;

  try {
    const user = await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ organizer: user });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await assertHubAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
