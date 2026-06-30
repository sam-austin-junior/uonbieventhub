import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  slidesUrl: z.string().url().optional().nullable().or(z.literal("")),
  notesUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  // Speaker must be on this session.
  const link = await prisma.sessionSpeaker.findFirst({
    where: {
      sessionId: params.sessionId,
      speaker: { userId: session.userId },
    },
    select: { sessionId: true },
  });
  if (!link) {
    return NextResponse.json(
      { error: "You're not listed as a speaker on this session" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const slides = parsed.data.slidesUrl === "" ? null : parsed.data.slidesUrl ?? null;
  const notes = parsed.data.notesUrl === "" ? null : parsed.data.notesUrl ?? null;

  await prisma.session.update({
    where: { id: params.sessionId },
    data: { slidesUrl: slides, notesUrl: notes },
  });
  return NextResponse.json({ ok: true });
}
