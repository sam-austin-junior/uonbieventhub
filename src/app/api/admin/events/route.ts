import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const inviteeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  tagline: z.string().optional(),
  description: z.string().min(10),
  startDate: z.string(),
  endDate: z.string(),
  venue: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  attendeeMode: z.enum(["OPEN", "INVITE_ONLY"]).default("INVITE_ONLY"),
  invitees: z.array(inviteeSchema).optional().default([]),
});

const RESERVED_SLUGS = ["admin", "hub", "hub-admin", "api", "login", "register", "e", "activate", "uploads"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { coverImage, logoUrl, invitees, attendeeMode, ...rest } = parsed.data;

  if (RESERVED_SLUGS.includes(rest.slug)) {
    return NextResponse.json({ error: `"${rest.slug}" is a reserved word — pick a different slug` }, { status: 400 });
  }

  const existing = await prisma.event.findUnique({ where: { slug: rest.slug } });
  if (existing) return NextResponse.json({ error: "An event with that URL slug already exists" }, { status: 409 });

  const event = await prisma.event.create({
    data: {
      ...rest,
      coverImage: coverImage || null,
      logoUrl: logoUrl || null,
      attendeeMode,
      startDate: new Date(rest.startDate),
      endDate: new Date(rest.endDate),
      organizerId: session.userId,
    },
  });

  if (attendeeMode === "INVITE_ONLY" && invitees && invitees.length > 0) {
    const seen = new Set<string>();
    for (const inv of invitees) {
      const lower = inv.email.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      try {
        await prisma.attendeeInvite.create({
          data: {
            eventId: event.id,
            firstName: inv.firstName,
            lastName: inv.lastName,
            email: lower,
          },
        });
      } catch {
        // skip duplicates
      }
    }
  }

  return NextResponse.json({ event });
}
