import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ attendees: [] });

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Confirm asker is registered.
  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    select: { id: true },
  });
  if (!reg) return NextResponse.json({ error: "Register first" }, { status: 403 });

  const regs = await prisma.registration.findMany({
    where: {
      eventId: event.id,
      userId: { not: session.userId },
      user: {
        showInDirectory: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { organization: { contains: q, mode: "insensitive" } },
          { jobTitle: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          jobTitle: true,
          avatarUrl: true,
          allowConnectionRequests: true,
        },
      },
    },
    take: 20,
  });

  return NextResponse.json({
    attendees: regs
      .filter((r) => r.user.allowConnectionRequests)
      .map((r) => ({
        id: r.user.id,
        name: r.user.name,
        jobTitle: r.user.jobTitle,
        avatarUrl: r.user.avatarUrl,
      })),
  });
}
