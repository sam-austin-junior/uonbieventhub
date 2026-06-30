import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { newWebhookSecret, WEBHOOK_EVENTS } from "@/lib/webhooks";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  active: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const webhook = await prisma.webhook.create({
    data: {
      eventId: params.eventId,
      url: parsed.data.url,
      events: parsed.data.events.join(","),
      secret: newWebhookSecret(),
      active: parsed.data.active ?? true,
    },
  });

  await writeAudit({
    session,
    action: "webhook.create",
    targetType: "Webhook",
    targetId: webhook.id,
    summary: `Created webhook to ${webhook.url}`,
  });

  // Return the secret only once on creation — it's the only time the
  // user sees it in plaintext for copying.
  return NextResponse.json({ webhook });
}
