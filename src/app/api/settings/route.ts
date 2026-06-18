import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  showInDirectory: z.boolean().optional(),
  allowConnectionRequests: z.boolean().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  notifySessionEmail: z.boolean().optional(),
  notifySessionInApp: z.boolean().optional(),
  notifyMessagesEmail: z.boolean().optional(),
  notifyMessagesInApp: z.boolean().optional(),
  notifyConnectionsEmail: z.boolean().optional(),
  notifyConnectionsInApp: z.boolean().optional(),
  notifyDiscussionsEmail: z.boolean().optional(),
  notifyDiscussionsInApp: z.boolean().optional(),
  notifyEventUpdatesEmail: z.boolean().optional(),
  notifyEventUpdatesInApp: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const user = await prisma.user.update({ where: { id: session.userId }, data: parsed.data });
  return NextResponse.json({ user });
}
