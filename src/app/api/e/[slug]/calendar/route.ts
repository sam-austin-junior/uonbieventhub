import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildIcs, type IcsEvent } from "@/lib/ics";

/**
 * GET /api/e/<slug>/calendar
 *   → all sessions in the event (anyone)
 *
 * GET /api/e/<slug>/calendar?scope=mine
 *   → only sessions the signed-in attendee added to "My Schedule"
 */
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "all";
  const origin = `${url.protocol}//${url.host}`;

  let sessions: Awaited<ReturnType<typeof prisma.session.findMany>>;
  if (scope === "mine") {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to download your schedule" }, { status: 401 });
    }
    const myRegs = await prisma.sessionRegistration.findMany({
      where: { userId: session.userId, session: { eventId: event.id } },
      include: { session: true },
      orderBy: { session: { startTime: "asc" } },
    });
    sessions = myRegs.map((r) => r.session);
  } else {
    sessions = await prisma.session.findMany({
      where: { eventId: event.id },
      orderBy: { startTime: "asc" },
    });
  }

  const host = url.host;
  const events: IcsEvent[] = sessions.map((s) => ({
    uid: `session-${s.id}@${host}`,
    start: s.startTime,
    end: s.endTime,
    summary: `${event.name} — ${s.title}`,
    description: s.description,
    location: s.location ?? event.venue ?? undefined,
    url: `${origin}/e/${event.slug}/sessions/${s.id}`,
  }));

  const ics = buildIcs({ events });
  const filename = scope === "mine" ? `${event.slug}-my-schedule.ics` : `${event.slug}.ics`;

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
