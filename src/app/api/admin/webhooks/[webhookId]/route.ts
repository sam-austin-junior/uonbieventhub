import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

export const runtime = "nodejs";

const patchSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).optional(),
  active: z.boolean().optional(),
});

async function loadIfOwned(webhookId: string, session: Awaited<ReturnType<typeof requireStaff>>) {
  const hook = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!hook || !hook.eventId) return null;
  await assertOwnsEvent(session, hook.eventId);
  return hook;
}

export async function PATCH(req: Request, { params }: { params: { webhookId: string } }) {
  const session = await requireStaff();
  const hook = await loadIfOwned(params.webhookId, session);
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if (parsed.data.url) data.url = parsed.data.url;
  if (parsed.data.events) data.events = parsed.data.events.join(",");
  if (parsed.data.active !== undefined) data.active = parsed.data.active;

  await prisma.webhook.update({ where: { id: hook.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { webhookId: string } }) {
  const session = await requireStaff();
  const hook = await loadIfOwned(params.webhookId, session);
  if (!hook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.webhook.delete({ where: { id: hook.id } });
  return NextResponse.json({ ok: true });
}
