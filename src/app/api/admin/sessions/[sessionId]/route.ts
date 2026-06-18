import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional().nullable(),
  format: z.enum(["IN_PERSON", "VIRTUAL", "HYBRID", "ON_DEMAND"]).optional(),
  capacity: z.number().int().positive().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  track: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  speakerIds: z.array(z.string()).optional(),
});

async function assertStaff() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
    return null;
  }
  return session;
}

export async function PATCH(req: Request, { params }: { params: { sessionId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { speakerIds, startTime, endTime, ...rest } = parsed.data;

  const data: any = { ...rest };
  if (startTime) data.startTime = new Date(startTime);
  if (endTime) data.endTime = new Date(endTime);

  if (speakerIds) {
    await prisma.sessionSpeaker.deleteMany({ where: { sessionId: params.sessionId } });
    data.speakers = { create: speakerIds.map((id) => ({ speaker: { connect: { id } } })) };
  }

  const updated = await prisma.session.update({
    where: { id: params.sessionId },
    data,
  });
  return NextResponse.json({ session: updated });
}

export async function DELETE(_req: Request, { params }: { params: { sessionId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.session.delete({ where: { id: params.sessionId } });
  return NextResponse.json({ ok: true });
}
