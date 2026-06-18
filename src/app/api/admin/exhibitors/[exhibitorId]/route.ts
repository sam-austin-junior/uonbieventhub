import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  website: z.string().url().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  boothNumber: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

async function assertStaff() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: { exhibitorId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data: any = { ...parsed.data };
  for (const k of ["logoUrl", "website", "email"] as const) if (data[k] === "") data[k] = null;
  const exhibitor = await prisma.exhibitor.update({ where: { id: params.exhibitorId }, data });
  return NextResponse.json({ exhibitor });
}

export async function DELETE(_req: Request, { params }: { params: { exhibitorId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.exhibitor.delete({ where: { id: params.exhibitorId } });
  return NextResponse.json({ ok: true });
}
