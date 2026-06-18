import { cache } from "react";
import { prisma } from "./prisma";

export const SUSPENSION_GRACE_DAYS = 14;

export const getEventBySlug = cache(async (slug: string) => {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          jobTitle: true,
          suspendedAt: true,
          expiresAt: true,
        },
      },
    },
  });
});

export type EventAvailability =
  | { available: true }
  | { available: false; reason: "EVENT_ENDED" | "ORGANIZER_SUSPENDED" | "ORGANIZER_EXPIRED"; suspendedSince?: Date };

export function checkEventAvailability(event: {
  endDate: Date | string;
  status: string;
  organizer: { suspendedAt: Date | null; expiresAt: Date | null };
}): EventAvailability {
  const now = new Date();
  if (event.organizer.suspendedAt) {
    return { available: false, reason: "ORGANIZER_SUSPENDED", suspendedSince: event.organizer.suspendedAt };
  }
  if (event.organizer.expiresAt && new Date(event.organizer.expiresAt) < now) {
    return { available: false, reason: "ORGANIZER_EXPIRED", suspendedSince: new Date(event.organizer.expiresAt) };
  }
  const cutoff = new Date(new Date(event.endDate).getTime() + SUSPENSION_GRACE_DAYS * 24 * 60 * 60 * 1000);
  if (cutoff < now) {
    return { available: false, reason: "EVENT_ENDED", suspendedSince: cutoff };
  }
  return { available: true };
}
