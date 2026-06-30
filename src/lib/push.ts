import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Web Push dispatcher. Reads VAPID keys from env on first use and
 * sends to every PushSubscription row for the given user. Expired
 * subscriptions (HTTP 410 / 404) are cleaned up automatically.
 */

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@uonbieventhub.co.ke";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Push a notification to every device a user has subscribed from.
 * Best-effort: failures are swallowed so a notification never blocks
 * the user flow that triggered it.
 */
export async function pushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  const expired: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription is gone (user unsubscribed / device wiped) — prune.
          expired.push(s.id);
        }
      }
    }),
  );

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
}

/** Push to many users in parallel; useful for "all attendees of an event". */
export async function pushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureConfigured()) return;
  await Promise.all(userIds.map((id) => pushToUser(id, payload)));
}
