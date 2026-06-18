import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HubAdminSidebar } from "@/components/hub-admin/HubAdminSidebar";

export default async function HubAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/hub-admin");
  if (session.role !== "SUPERADMIN") redirect("/");
  return (
    <div className="min-h-screen flex bg-ink-50">
      <HubAdminSidebar user={{ name: session.name, role: session.role }} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
