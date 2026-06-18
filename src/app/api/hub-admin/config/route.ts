import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  brandName: z.string().min(1).optional(),
  fromName: z.string().nullable().optional(),
  fromEmail: z.string().email().nullable().optional().or(z.literal("").transform(() => null)),
});

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const config = await prisma.platformConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ config });
}
