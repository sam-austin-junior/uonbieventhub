import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  jobTitle: z.string().max(160).optional().nullable(),
  organization: z.string().max(160).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  faculty: z.string().max(160).optional().nullable(),
  studentId: z.string().max(60).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  showInDirectory: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
  });
  return NextResponse.json({ user });
}
