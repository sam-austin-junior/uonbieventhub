import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { blocksSchema } from "@/lib/blocks";

const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).optional(),
  body: z.string().min(1).optional(),
  blocks: z.union([blocksSchema, z.null()]).optional(),
  order: z.number().int().optional(),
  showInNav: z.boolean().optional(),
});

async function assertStaff() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: { pageId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data: Record<string, unknown> = { ...parsed.data };
  if ("blocks" in parsed.data) {
    data.blocks = parsed.data.blocks ? JSON.stringify(parsed.data.blocks) : null;
  }
  try {
    const page = await prisma.customPage.update({ where: { id: params.pageId }, data });
    return NextResponse.json({ page });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A page with that slug already exists" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: { pageId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.customPage.delete({ where: { id: params.pageId } });
  return NextResponse.json({ ok: true });
}
