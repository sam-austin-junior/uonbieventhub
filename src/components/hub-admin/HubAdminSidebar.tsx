"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  UserCog,
  Settings,
  Shield,
  ArrowLeftRight,
  Activity,
} from "lucide-react";

export function HubAdminSidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const items = [
    { href: "/hub-admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/hub-admin/organizers", label: "Organizers", icon: UserCog },
    { href: "/hub-admin/events", label: "All events", icon: CalendarRange },
    { href: "/hub-admin/users", label: "All users", icon: Users },
    { href: "/hub-admin/audit", label: "Audit log", icon: Activity },
    { href: "/hub-admin/settings", label: "Platform settings", icon: Settings },
  ];

  function active(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-900 text-ink-100 h-screen sticky top-0">
      <div className="p-4 border-b border-ink-800">
        <Link href="/hub-admin" className="flex items-center gap-2">
          <Logo size={36} bg="white" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-accent flex items-center gap-1">
              <Shield className="h-3 w-3" /> Hub admin
            </div>
            <div className="text-sm font-semibold">UoN Event Hub</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active(i.href, i.exact)
                ? "bg-brand-700 text-white"
                : "text-ink-300 hover:bg-ink-800 hover:text-white"
            )}
          >
            <i.icon className={cn("h-4 w-4", active(i.href, i.exact) ? "text-accent" : "text-ink-400")} />
            <span className="truncate">{i.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-accent text-ink-900 text-xs flex items-center justify-center font-semibold">
            {user.name.split(" ").slice(0, 2).map((p) => p[0]).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-ink-400 capitalize">{user.role.toLowerCase()}</div>
          </div>
        </div>
        <LogoutButton className="mt-1" variant="admin" />
      </div>
    </aside>
  );
}
