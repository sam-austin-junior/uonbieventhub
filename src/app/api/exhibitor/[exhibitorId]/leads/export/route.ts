import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { exhibitorId: string } },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const exhibitor = await prisma.exhibitor.findUnique({
    where: { id: params.exhibitorId },
    include: {
      members: { where: { userId: session.userId }, select: { id: true } },
      event: { select: { name: true, slug: true } },
    },
  });
  if (!exhibitor) return new Response("Not found", { status: 404 });
  if (exhibitor.members.length === 0) {
    return new Response("Not on exhibitor staff", { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    where: { exhibitorId: exhibitor.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          jobTitle: true,
          organization: true,
          faculty: true,
        },
      },
      capturedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: string[] = [];
  rows.push(
    [
      "Name",
      "Email",
      "Phone",
      "Job title",
      "Organization",
      "Faculty",
      "Notes",
      "Qualified",
      "Captured by",
      "Captured at (ISO)",
    ]
      .map(csvCell)
      .join(","),
  );
  for (const l of leads) {
    rows.push(
      [
        l.user.name ?? "",
        l.user.email ?? "",
        l.user.phone ?? "",
        l.user.jobTitle ?? "",
        l.user.organization ?? "",
        l.user.faculty ?? "",
        l.notes ?? "",
        l.qualified ? "yes" : "no",
        `${l.capturedBy.name} <${l.capturedBy.email}>`,
        l.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const filename = `${exhibitor.event.slug}_${slug(exhibitor.name)}_leads.csv`;
  return new Response(rows.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
