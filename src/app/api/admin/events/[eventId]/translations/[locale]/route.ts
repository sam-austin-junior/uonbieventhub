import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { LOCALE_LABELS, parseLocales } from "@/lib/i18n";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string; locale: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const locale = params.locale.toLowerCase();
  if (!LOCALE_LABELS[locale]) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { defaultLocale: true, supportedLocales: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (locale === event.defaultLocale) {
    return NextResponse.json(
      { error: "Edit the default-locale fields directly on the event" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Add to supportedLocales if not already there.
  const supported = parseLocales(event.supportedLocales, event.defaultLocale);
  if (!supported.includes(locale)) {
    supported.push(locale);
    await prisma.event.update({
      where: { id: params.eventId },
      data: { supportedLocales: supported.join(",") },
    });
  }

  await prisma.eventTranslation.upsert({
    where: { eventId_locale: { eventId: params.eventId, locale } },
    create: {
      eventId: params.eventId,
      locale,
      name: parsed.data.name ?? null,
      tagline: parsed.data.tagline ?? null,
      description: parsed.data.description ?? null,
      venue: parsed.data.venue ?? null,
    },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string; locale: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const locale = params.locale.toLowerCase();
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { defaultLocale: true, supportedLocales: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (locale === event.defaultLocale) {
    return NextResponse.json({ error: "Cannot remove the default locale" }, { status: 400 });
  }

  const supported = parseLocales(event.supportedLocales, event.defaultLocale).filter(
    (l) => l !== locale,
  );
  await prisma.$transaction([
    prisma.eventTranslation.deleteMany({
      where: { eventId: params.eventId, locale },
    }),
    prisma.event.update({
      where: { id: params.eventId },
      data: { supportedLocales: supported.join(",") },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
