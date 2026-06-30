import { prisma } from "./prisma";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "./email";

/**
 * After a seat opens on a ticket type (capacity increased, registration
 * cancelled, etc.), notify the next N people on the waitlist that they
 * can now buy. Idempotent — only notifies entries that haven't been
 * notified yet, in position order. Set `count` to how many seats freed.
 *
 * Email is best-effort: failures are swallowed so the caller doesn't
 * bubble them up to the user.
 */
export async function notifyWaitlistOpenings(
  ticketTypeId: string,
  count: number,
): Promise<number> {
  if (count <= 0) return 0;

  const ticket = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    include: {
      event: { select: { slug: true, name: true } },
    },
  });
  if (!ticket) return 0;

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      ticketTypeId,
      status: "waiting",
      notifiedAt: null,
    },
    orderBy: { position: "asc" },
    include: { user: { select: { email: true, name: true } } },
    take: count,
  });

  if (entries.length === 0) return 0;

  const now = new Date();
  await prisma.waitlistEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: { status: "notified", notifiedAt: now },
  });

  if (!(await isEmailConfigured())) return entries.length;

  for (const entry of entries) {
    try {
      await sendEmail({
        to: entry.user.email,
        subject: `A ${ticket.name} ticket just opened for ${ticket.event.name}`,
        html: emailTemplate({
          heading: `A seat just opened up`,
          body: `<p>Hi ${escapeHtml(entry.user.name)},</p>
            <p>A <strong>${escapeHtml(ticket.name)}</strong> ticket has just become available for <strong>${escapeHtml(ticket.event.name)}</strong>. Tickets are first-come, first-served — head to the event page and grab yours.</p>`,
          cta: {
            label: "Get my ticket",
            href: `${appUrl}/e/${ticket.event.slug}/tickets`,
          },
        }),
      });
    } catch {
      // soft-fail per recipient
    }
  }

  return entries.length;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
