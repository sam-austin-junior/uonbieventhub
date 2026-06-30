import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  notes: z.string().max(500).optional().nullable(),
  qualified: z.boolean().optional(),
});

async function loadLeadIfMember(leadId: string, userId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      exhibitor: {
        include: {
          members: { where: { userId }, select: { id: true } },
        },
      },
    },
  });
  if (!lead) return null;
  if (lead.exhibitor.members.length === 0) return null;
  return lead;
}

export async function PATCH(req: Request, { params }: { params: { leadId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const lead = await loadLeadIfMember(params.leadId, session.userId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { leadId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const lead = await loadLeadIfMember(params.leadId, session.userId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  await prisma.lead.delete({ where: { id: lead.id } });
  return NextResponse.json({ ok: true });
}
