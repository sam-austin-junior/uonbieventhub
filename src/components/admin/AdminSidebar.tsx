"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Calendar,
  Mic2,
  Users,
  Store,
  FileText,
  QrCode,
  Megaphone,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

export function AdminSidebar({
  user,
  eventId,
}: {
  user: { name: string; role: string };
  eventId?: string;
}) {
  const pathname = usePathname();
  const top = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/events", label: "Events", icon: CalendarRange },
    { href: "/admin/check-in", label: "QR Check-in", icon: QrCode },
  ];
  const eventScoped = eventId
    ? [
        { href: `/admin/events/${eventId}/sessions`, label: "Sessions", icon: Calendar },
        { href: `/admin/events/${eventId}/speakers`, label: "Speakers", icon: Mic2 },
        { href: `/admin/events/${eventId}/attendees`, label: "Attendees", icon: Users },
        { href: `/admin/events/${eventId}/exhibitors`, label: "Exhibitors", icon: Store },
        { href: `/admin/events/${eventId}/pages`, label: "Custom Pages", icon: FileText },
        { href: `/admin/events/${eventId}/announcements`, label: "Announcements", icon: Megaphone },
      ]
    : [];

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-ink-900 text-ink-100 h-screen sticky top-0">
      <div className="p-4 border-b border-ink-800">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo size={36} bg="white" />
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-400">Organizer</div>
            <div className="text-sm font-semibold">Dashboard</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <SectionLabel>Manage</SectionLabel>
        {top.map((i) => (
          <NavItem
            key={i.href}
            href={i.href}
            active={isActive(i.href, i.exact)}
            icon={<i.icon className="h-4 w-4" />}
            label={i.label}
          />
        ))}

        {eventScoped.length > 0 ? (
          <>
            <SectionLabel className="mt-4">This event</SectionLabel>
            {eventScoped.map((i) => (
              <NavItem
                key={i.href}
                href={i.href}
                active={isActive(i.href)}
                icon={<i.icon className="h-4 w-4" />}
                label={i.label}
              />
            ))}
          </>
        ) : null}

        <SectionLabel className="mt-4">Switch</SectionLabel>
        <NavItem
          href="/"
          active={false}
          icon={<ArrowLeftRight className="h-4 w-4" />}
          label="Attendee view"
        />
      </nav>

      <div className="p-3 border-t border-ink-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-accent text-ink-900 text-xs flex items-center justify-center font-semibold">
            {user.name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("")}
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

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400", className)}>
      {children}
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-brand-700 text-white"
          : "text-ink-300 hover:bg-ink-800 hover:text-white"
      )}
    >
      <span className={cn(active ? "text-accent" : "text-ink-400")}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
