import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const RESERVED = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "hub-admin",
  "new",
  "settings",
  "forgot",
  "reset",
  "billing",
  "e",
]);

const schema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .transform((s) => s.toLowerCase()),
});

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Slug must be 2–63 characters" },
      { status: 400 }
    );
  }
  const slug = parsed.data.slug;
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      {
        error:
          "Use lowercase letters, numbers, and hyphens only (no leading/trailing hyphen).",
      },
      { status: 400 }
    );
  }
  if (RESERVED.has(slug)) {
    return NextResponse.json(
      { error: "That slug is reserved. Pick something else." },
      { status: 400 }
    );
  }

  const taken = await prisma.event.findFirst({
    where: { slug, NOT: { id: params.eventId } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json(
      { error: "Another event already uses that slug" },
      { status: 409 }
    );
  }

  const current = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { slug: true, name: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (current.slug === slug) {
    return NextResponse.json({ ok: true, slug });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // If the new slug is sitting in the alias table (e.g. organizer is
    // rewinding to a previous name), free it up first.
    await tx.slugAlias.deleteMany({ where: { slug } });

    const ev = await tx.event.update({
      where: { id: params.eventId },
      data: { slug },
      select: { id: true, slug: true, name: true },
    });

    // Remember the previous slug so old links keep working.
    await tx.slugAlias.upsert({
      where: { slug: current.slug },
      update: { eventId: ev.id },
      create: { slug: current.slug, eventId: ev.id },
    });

    return ev;
  });

  await writeAudit({
    session,
    action: "event.slug.changed",
    targetType: "event",
    targetId: updated.id,
    summary: `Renamed slug for ${updated.name}: /e/${current.slug} → /e/${slug}`,
  });

  return NextResponse.json({ ok: true, slug: updated.slug });
}
