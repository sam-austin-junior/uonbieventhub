import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional().nullable(),
  format: z.enum(["IN_PERSON", "VIRTUAL", "HYBRID", "ON_DEMAND"]),
  capacity: z.number().int().positive().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  track: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  speakerIds: z.array(z.string()).optional(),
});

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
  }
  const { speakerIds = [], ...data } = parsed.data;
  const s = await prisma.session.create({
    data: {
      ...data,
      eventId: params.eventId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      capacity: data.capacity ?? undefined,
      speakers: {
        create: speakerIds.map((id) => ({ speaker: { connect: { id } } })),
      },
    },
  });
  return NextResponse.json({ session: s });
}
