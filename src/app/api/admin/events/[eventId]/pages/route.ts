import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2),
  body: z.string().min(1),
  order: z.number().int().optional(),
  showInNav: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    const page = await prisma.customPage.create({
      data: {
        eventId: params.eventId,
        slug: parsed.data.slug,
        title: parsed.data.title,
        body: parsed.data.body,
        order: parsed.data.order ?? 0,
        showInNav: parsed.data.showInNav ?? true,
      },
    });
    return NextResponse.json({ page });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A page with that slug already exists for this event" }, { status: 409 });
    }
    throw e;
  }
}
