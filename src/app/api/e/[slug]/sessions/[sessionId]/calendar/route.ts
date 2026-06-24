import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcs } from "@/lib/ics";

export async function GET(
  req: Request,
  { params }: { params: { slug: string; sessionId: string } }
) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const s = await prisma.session.findUnique({ where: { id: params.sessionId } });
  if (!s || s.eventId !== event.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const host = url.host;

  const ics = buildIcs({
    events: [
      {
        uid: `session-${s.id}@${host}`,
        start: s.startTime,
        end: s.endTime,
        summary: `${event.name} — ${s.title}`,
        description: s.description,
        location: s.location ?? event.venue ?? undefined,
        url: `${origin}/e/${event.slug}/sessions/${s.id}`,
      },
    ],
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-${s.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
