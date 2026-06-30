import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2),
  jobTitle: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export async function PATCH(
  req: Request,
  { params }: { params: { speakerId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const speaker = await prisma.speaker.findUnique({
    where: { id: params.speakerId },
    select: { id: true, userId: true },
  });
  if (!speaker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (speaker.userId !== session.userId) {
    return NextResponse.json({ error: "Not your speaker profile" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  for (const k of ["photoUrl", "linkedinUrl", "twitterUrl"] as const) {
    if (data[k] === "") data[k] = null;
  }

  await prisma.speaker.update({ where: { id: speaker.id }, data });
  return NextResponse.json({ ok: true });
}
