import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, assertOwnsEvent } from "@/lib/admin-scope";
import { AUTOMATION_TRIGGERS } from "@/lib/automations";

export const runtime = "nodejs";

const schema = z.object({
  enabled: z.boolean().optional(),
  subject: z.string().min(2).max(180).optional(),
  body: z.string().min(2).max(5000).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string; trigger: string } },
) {
  const session = await requireStaff();
  await assertOwnsEvent(session, params.eventId);

  if (!(AUTOMATION_TRIGGERS as readonly string[]).includes(params.trigger)) {
    return NextResponse.json({ error: "Unknown trigger" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await prisma.emailAutomation.upsert({
    where: {
      eventId_trigger: { eventId: params.eventId, trigger: params.trigger },
    },
    create: {
      eventId: params.eventId,
      trigger: params.trigger,
      enabled: parsed.data.enabled ?? false,
      subject: parsed.data.subject ?? "",
      body: parsed.data.body ?? "",
    },
    update: {
      enabled: parsed.data.enabled,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });
  return NextResponse.json({ automation: result });
}
