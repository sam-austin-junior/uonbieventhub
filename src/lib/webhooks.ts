import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

/**
 * Outbound webhook event names. Add new ones here when wiring new
 * triggers; clients pick which to subscribe to via the comma-separated
 * `events` field on the Webhook row.
 */
export const WEBHOOK_EVENTS = [
  "registration.created",
  "registration.checked_in",
  "ticket.purchased",
  "waitlist.joined",
  "lead.captured",
  "meeting.requested",
  "meeting.responded",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function newWebhookSecret() {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

function sign(secret: string, body: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Fire a webhook event. Looks up active webhooks subscribed to that
 * event scoped to the given event (or hub-level if eventId is null on
 * the subscription) and POSTs the payload to each, fire-and-forget.
 * Failures are recorded on the webhook row but never bubble up to the
 * caller — webhooks must never block the user flow that triggered them.
 */
export async function fireWebhook(
  event: WebhookEvent,
  payload: Record<string, unknown> & { eventId?: string | null },
) {
  const eventId = payload.eventId ?? null;

  let hooks;
  try {
    hooks = await prisma.webhook.findMany({
      where: {
        active: true,
        OR: [
          { eventId: eventId ?? undefined },
          { eventId: null },
        ],
      },
    });
  } catch {
    return;
  }

  if (hooks.length === 0) return;

  const envelope = {
    event,
    occurredAt: new Date().toISOString(),
    data: payload,
  };
  const body = JSON.stringify(envelope);

  await Promise.all(
    hooks
      .filter((h) => h.events.split(",").map((s) => s.trim()).includes(event))
      .map(async (h) => {
        const signature = sign(h.secret, body);
        try {
          const res = await fetch(h.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-uon-event": event,
              "x-uon-signature": `sha256=${signature}`,
              "user-agent": "uon-event-hub-webhook/1",
            },
            body,
            // Don't let a slow consumer hang the request.
            signal: AbortSignal.timeout(8000),
          });
          await prisma.webhook.update({
            where: { id: h.id },
            data: {
              lastDeliveredAt: new Date(),
              lastError: res.ok ? null : `HTTP ${res.status}`,
            },
          });
        } catch (err) {
          await prisma.webhook
            .update({
              where: { id: h.id },
              data: {
                lastError:
                  err instanceof Error ? err.message.slice(0, 500) : "unknown error",
              },
            })
            .catch(() => null);
        }
      }),
  );
}
