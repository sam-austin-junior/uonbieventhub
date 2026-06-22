import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (
    session.role !== "ADMIN" &&
    session.role !== "ORGANIZER" &&
    session.role !== "SUPERADMIN"
  ) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-ink-50">
      <AdminSidebar user={{ name: session.name, role: session.role }} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
