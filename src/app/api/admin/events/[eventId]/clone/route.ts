import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  startDate: z.string(),
  endDate: z.string(),
});

const RESERVED = ["admin", "hub", "hub-admin", "api", "login", "register", "e", "activate", "uploads", "forgot", "reset"];

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const session = await requireStaff();
  const source = await assertOwnsEvent(session, params.eventId);

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { name, slug, startDate, endDate } = parsed.data;

  if (RESERVED.includes(slug)) {
    return NextResponse.json({ error: `"${slug}" is a reserved word` }, { status: 400 });
  }
  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const dateShiftMs = new Date(startDate).getTime() - source.startDate.getTime();

  const clone = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        name,
        slug,
        tagline: source.tagline,
        description: source.description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timezone: source.timezone,
        venue: source.venue,
        coverImage: source.coverImage,
        logoUrl: source.logoUrl,
        status: "DRAFT",
        attendeeMode: source.attendeeMode,
        organizerId: session.userId,
      },
    });

    // Speakers (clone first so we can map old→new IDs for sessions)
    const speakers = await tx.speaker.findMany({ where: { eventId: source.id } });
    const speakerIdMap = new Map<string, string>();
    for (const s of speakers) {
      const created = await tx.speaker.create({
        data: {
          eventId: newEvent.id,
          name: s.name,
          jobTitle: s.jobTitle,
          organization: s.organization,
          bio: s.bio,
          photoUrl: s.photoUrl,
          linkedinUrl: s.linkedinUrl,
          twitterUrl: s.twitterUrl,
          isKeynote: s.isKeynote,
        },
      });
      speakerIdMap.set(s.id, created.id);
    }

    // Sessions (with date shift)
    const sessions = await tx.session.findMany({
      where: { eventId: source.id },
      include: { speakers: true },
    });
    for (const s of sessions) {
      const created = await tx.session.create({
        data: {
          eventId: newEvent.id,
          title: s.title,
          description: s.description,
          startTime: new Date(s.startTime.getTime() + dateShiftMs),
          endTime: new Date(s.endTime.getTime() + dateShiftMs),
          location: s.location,
          format: s.format,
          capacity: s.capacity,
          videoUrl: s.videoUrl,
          isFeatured: s.isFeatured,
          track: s.track,
        },
      });
      for (const ss of s.speakers) {
        const mapped = speakerIdMap.get(ss.speakerId);
        if (mapped) {
          await tx.sessionSpeaker.create({
            data: { sessionId: created.id, speakerId: mapped },
          });
        }
      }
    }

    // Exhibitors
    const exhibitors = await tx.exhibitor.findMany({ where: { eventId: source.id } });
    for (const e of exhibitors) {
      await tx.exhibitor.create({
        data: {
          eventId: newEvent.id,
          name: e.name,
          tagline: e.tagline,
          description: e.description,
          logoUrl: e.logoUrl,
          website: e.website,
          email: e.email,
          boothNumber: e.boothNumber,
          category: e.category,
        },
      });
    }

    // Custom pages
    const pages = await tx.customPage.findMany({ where: { eventId: source.id } });
    for (const p of pages) {
      await tx.customPage.create({
        data: {
          eventId: newEvent.id,
          slug: p.slug,
          title: p.title,
          body: p.body,
          order: p.order,
          showInNav: p.showInNav,
        },
      });
    }

    return newEvent;
  });

  await writeAudit({
    session,
    action: "event.clone",
    targetType: "event",
    targetId: clone.id,
    summary: `Cloned "${source.name}" → "${clone.name}"`,
  });

  return NextResponse.json({ event: clone });
}
