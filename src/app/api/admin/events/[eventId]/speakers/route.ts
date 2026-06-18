import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  jobTitle: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
  isKeynote: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;
  const speaker = await prisma.speaker.create({
    data: {
      eventId: params.eventId,
      name: data.name,
      jobTitle: data.jobTitle || null,
      organization: data.organization || null,
      bio: data.bio || null,
      photoUrl: data.photoUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      twitterUrl: data.twitterUrl || null,
      isKeynote: data.isKeynote ?? false,
    },
  });
  return NextResponse.json({ speaker });
}
