import { redirect, notFound } from "next/navigation";
import { prisma } from "./prisma";
import { getSession, type SessionPayload } from "./auth";

export async function requireStaff(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "ADMIN" && s.role !== "ORGANIZER" && s.role !== "SUPERADMIN") redirect("/");
  return s;
}

export function eventScope(session: SessionPayload) {
  if (session.role === "SUPERADMIN") return {};
  return { organizerId: session.userId };
}

export async function getOwnedEvent(session: SessionPayload, eventId: string) {
  const where: any = { id: eventId };
  if (session.role !== "SUPERADMIN") where.organizerId = session.userId;
  const event = await prisma.event.findFirst({ where });
  if (!event) notFound();
  return event;
}

export async function assertOwnsEvent(session: SessionPayload, eventId: string) {
  if (session.role === "SUPERADMIN") {
    const exists = await prisma.event.findUnique({ where: { id: eventId } });
    if (!exists) notFound();
    return exists;
  }
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.userId },
  });
  if (!event) notFound();
  return event;
}
