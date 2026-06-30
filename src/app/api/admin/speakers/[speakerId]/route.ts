import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  jobTitle: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
  isKeynote: z.boolean().optional(),
});

async function assertStaff() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: { speakerId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data: any = { ...parsed.data };
  if (data.photoUrl === "") data.photoUrl = null;
  if (data.linkedinUrl === "") data.linkedinUrl = null;
  if (data.twitterUrl === "") data.twitterUrl = null;
  if (typeof data.email === "string") data.email = data.email ? data.email.toLowerCase() : null;
  const speaker = await prisma.speaker.update({ where: { id: params.speakerId }, data });
  return NextResponse.json({ speaker });
}

export async function DELETE(_req: Request, { params }: { params: { speakerId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.speaker.delete({ where: { id: params.speakerId } });
  return NextResponse.json({ ok: true });
}
