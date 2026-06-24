import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const host = (url.searchParams.get("host") ?? "").toLowerCase().trim();
  if (!host) return NextResponse.json({ slug: null }, { status: 400 });
  const ev = await prisma.event.findUnique({
    where: { customDomain: host },
    select: { slug: true },
  });
  return NextResponse.json({ slug: ev?.slug ?? null });
}
