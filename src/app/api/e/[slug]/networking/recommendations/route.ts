import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getNetworkingRecommendations } from "@/lib/networking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const reg = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: session.userId } },
    select: { id: true },
  });
  if (!reg) {
    return NextResponse.json(
      { error: "Register for the event first" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  const recommendations = await getNetworkingRecommendations(
    event.id,
    session.userId,
    { forceRefresh },
  );

  return NextResponse.json({ recommendations });
}
