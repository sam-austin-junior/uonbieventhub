import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  isAgencyOwner: z.boolean().optional(),
});

async function requireSuperadmin() {
  const session = await getSession();
  if (!session) return { error: "Sign in required", status: 401 as const };
  if (session.role !== "SUPERADMIN")
    return { error: "Hub admin only", status: 403 as const };
  return { session };
}

export async function POST(
  req: Request,
  { params }: { params: { agencyId: string } },
) {
  const auth = await requireSuperadmin();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } });
  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json(
      { error: "No account exists for that email. Ask them to sign up first." },
      { status: 404 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      agencyId: agency.id,
      isAgencyOwner: parsed.data.isAgencyOwner ?? false,
    },
  });

  await writeAudit({
    session: auth.session,
    action: "agency.member.add",
    targetType: "Agency",
    targetId: agency.id,
    summary: `Added ${user.email} to agency "${agency.name}"${parsed.data.isAgencyOwner ? " as owner" : ""}`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: { agencyId: string } },
) {
  const auth = await requireSuperadmin();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await prisma.user.updateMany({
    where: { id: userId, agencyId: params.agencyId },
    data: { agencyId: null, isAgencyOwner: false },
  });
  return NextResponse.json({ ok: true });
}
