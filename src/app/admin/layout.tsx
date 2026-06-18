import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "ORGANIZER") redirect("/");

  const event = await prisma.event.findFirst({ orderBy: { startDate: "asc" } });

  return (
    <div className="min-h-screen flex bg-ink-50">
      <AdminSidebar user={{ name: session.name, role: session.role }} eventId={event?.id} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
