import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  tagline: z.string().optional().nullable(),
  description: z.string().min(1),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  website: z.string().url().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  boothNumber: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const exhibitor = await prisma.exhibitor.create({
    data: {
      eventId: params.eventId,
      name: d.name,
      tagline: d.tagline || null,
      description: d.description,
      logoUrl: d.logoUrl || null,
      website: d.website || null,
      email: d.email || null,
      boothNumber: d.boothNumber || null,
      category: d.category || null,
    },
  });
  return NextResponse.json({ exhibitor });
}
