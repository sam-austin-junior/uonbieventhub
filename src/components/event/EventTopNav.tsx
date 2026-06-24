"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, initials } from "@/lib/utils";
import {
  Bell,
  MessageCircle,
  Calendar as CalIcon,
  ChevronDown,
  Menu,
  X,
  Home,
  Calendar,
  CalendarDays,
  PlayCircle,
  Mic2,
  Users,
  MessageSquare,
  Store,
  FileText,
  UserCog,
  Settings,
  UserPlus,
  Inbox,
  LogOut,
  Shield,
  ClipboardList,
} from "lucide-react";

type CustomPage = { id: string; title: string };

type Props = {
  slug: string;
  eventName: string;
  eventLogoUrl: string | null;
  customPages: CustomPage[];
  user: { name: string; role: string; avatarUrl?: string | null };
  unreadMessages?: number;
  unreadNotifications?: number;
};

export function EventTopNav({
  slug,
  eventName,
  eventLogoUrl,
  customPages,
  user,
  unreadMessages = 0,
  unreadNotifications = 0,
}: Props) {
  const base = `/e/${slug}`;
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const primary = [
    { href: base, label: "Home", icon: Home, exact: true },
    { href: `${base}/sessions`, label: "Sessions", icon: Calendar },
    { href: `${base}/schedule`, label: "Schedule", icon: CalendarDays },
  ];

  const community = [
    { href: `${base}/speakers`, label: "Speakers", icon: Mic2, desc: "Meet the people on stage" },
    { href: `${base}/attendees`, label: "Attendees", icon: Users, desc: "Browse who's here" },
    { href: `${base}/discussions`, label: "Discussions", icon: MessageSquare, desc: "Threads and Q&A" },
    { href: `${base}/exhibitors`, label: "Exhibitors", icon: Store, desc: "Partners and booths" },
  ];

  const more = [
    { href: `${base}/ondemand`, label: "On-Demand", icon: PlayCircle, desc: "Recorded sessions" },
    { href: `${base}/survey`, label: "Share feedback", icon: ClipboardList, desc: "Post-event survey" },
    { href: `${base}/connections`, label: "Connections", icon: UserPlus, desc: "Network requests" },
    { href: `${base}/profile-edit`, label: "My profile", icon: UserCog, desc: "Edit your bio" },
    { href: `${base}/settings`, label: "Settings", icon: Settings, desc: "Notifications and privacy" },
  ];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/e/${slug}/login`);
    router.refresh();
  }

  const communityActive = community.some((l) => isActive(l.href));
  const moreActive = more.some((l) => isActive(l.href)) || customPages.some((p) => isActive(`${base}/pages/${p.id}`));

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-ink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Brand: event logo + name */}
        <Link href={base} className="flex items-center gap-2 shrink-0 min-w-0">
          {eventLogoUrl ? (
            <img
              src={eventLogoUrl}
              alt={eventName}
              className="h-9 w-9 rounded-md object-contain ring-1 ring-ink-100 bg-white"
            />
          ) : (
            <div className="h-9 w-9 rounded-md bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
              {initials(eventName)}
            </div>
          )}
          <span className="hidden sm:inline text-sm font-semibold text-ink-900 truncate max-w-[180px] xl:max-w-[260px]">
            {eventName}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1" ref={wrapRef}>
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "text-brand-700 bg-brand-50"
                  : "text-ink-700 hover:text-ink-900 hover:bg-ink-50"
              )}
            >
              {item.label}
            </Link>
          ))}

          <Dropdown
            label="Community"
            open={openMenu === "community"}
            active={communityActive}
            onToggle={() => setOpenMenu((m) => (m === "community" ? null : "community"))}
          >
            <div className="grid grid-cols-1 gap-1 p-2 w-72">
              {community.map((item) => (
                <DropdownItem key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>
          </Dropdown>

          {customPages.length > 0 ? (
            <Dropdown
              label="Pages"
              open={openMenu === "pages"}
              active={customPages.some((p) => isActive(`${base}/pages/${p.id}`))}
              onToggle={() => setOpenMenu((m) => (m === "pages" ? null : "pages"))}
            >
              <div className="grid grid-cols-1 gap-1 p-2 w-64">
                {customPages.map((p) => (
                  <DropdownItem
                    key={p.id}
                    href={`${base}/pages/${p.id}`}
                    label={p.title}
                    icon={FileText}
                    active={isActive(`${base}/pages/${p.id}`)}
                  />
                ))}
              </div>
            </Dropdown>
          ) : null}

          <Dropdown
            label="More"
            open={openMenu === "more"}
            active={moreActive}
            onToggle={() => setOpenMenu((m) => (m === "more" ? null : "more"))}
          >
            <div className="grid grid-cols-1 gap-1 p-2 w-72">
              {more.map((item) => (
                <DropdownItem key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>
          </Dropdown>
        </nav>

        {/* Right action icons */}
        <div className="ml-auto flex items-center gap-1">
          <IconLink
            href={`${base}/schedule`}
            label="My schedule"
            icon={<CalIcon className="h-5 w-5" />}
            active={isActive(`${base}/schedule`)}
          />
          <IconLink
            href={`${base}/messages`}
            label="Messages"
            icon={<MessageCircle className="h-5 w-5" />}
            badge={unreadMessages}
            active={isActive(`${base}/messages`)}
          />
          <IconLink
            href={`${base}`}
            label="Notifications"
            icon={<Bell className="h-5 w-5" />}
            badge={unreadNotifications}
          />

          {/* User menu */}
          <div className="relative ml-1" ref={wrapRef}>
            <button
              onClick={() => setOpenMenu((m) => (m === "user" ? null : "user"))}
              className="flex items-center gap-1 rounded-full p-0.5 hover:ring-2 hover:ring-brand-200 transition"
              aria-label="Account menu"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-ink-100"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-semibold">
                  {initials(user.name)}
                </div>
              )}
            </button>
            {openMenu === "user" ? (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-pop ring-1 ring-ink-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-ink-100">
                  <div className="font-medium text-ink-900 truncate">{user.name}</div>
                  <div className="text-xs text-ink-500 capitalize">{user.role.toLowerCase()}</div>
                </div>
                <UserMenuLink href={`${base}/profile-edit`} icon={<UserCog className="h-4 w-4" />} label="My profile" />
                <UserMenuLink href={`${base}/settings`} icon={<Settings className="h-4 w-4" />} label="Settings" />
                <UserMenuLink href={`${base}/connections`} icon={<UserPlus className="h-4 w-4" />} label="Connections" />
                <UserMenuLink href={`${base}/messages`} icon={<Inbox className="h-4 w-4" />} label="Messages" />
                {user.role !== "ATTENDEE" ? (
                  <>
                    <div className="border-t border-ink-100 my-1" />
                    <UserMenuLink href="/admin" icon={<Shield className="h-4 w-4" />} label="Organizer dashboard" />
                    {user.role === "SUPERADMIN" ? (
                      <UserMenuLink href="/hub-admin" icon={<Shield className="h-4 w-4" />} label="Hub admin" />
                    ) : null}
                  </>
                ) : null}
                <div className="border-t border-ink-100 my-1" />
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 inline-flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="lg:hidden ml-1 p-2 rounded-md hover:bg-ink-100"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden border-t border-ink-100 bg-white max-h-[70vh] overflow-y-auto">
          <MobileNavSection label="Event">
            {primary.map((i) => (
              <MobileLink key={i.href} href={i.href} active={isActive(i.href, i.exact)} label={i.label} />
            ))}
          </MobileNavSection>
          <MobileNavSection label="Community">
            {community.map((i) => (
              <MobileLink key={i.href} href={i.href} active={isActive(i.href)} label={i.label} />
            ))}
          </MobileNavSection>
          {customPages.length > 0 ? (
            <MobileNavSection label="Pages">
              {customPages.map((p) => (
                <MobileLink
                  key={p.id}
                  href={`${base}/pages/${p.id}`}
                  active={isActive(`${base}/pages/${p.id}`)}
                  label={p.title}
                />
              ))}
            </MobileNavSection>
          ) : null}
          <MobileNavSection label="More">
            {more.map((i) => (
              <MobileLink key={i.href} href={i.href} active={isActive(i.href)} label={i.label} />
            ))}
            <MobileLink href={`${base}/messages`} active={isActive(`${base}/messages`)} label="Messages" />
          </MobileNavSection>
          <div className="border-t border-ink-100 p-2">
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 rounded-md inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Dropdown({
  label,
  open,
  active,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium inline-flex items-center gap-1 transition-colors",
          active || open ? "text-brand-700 bg-brand-50" : "text-ink-700 hover:text-ink-900 hover:bg-ink-50"
        )}
      >
        {label} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-lg bg-white shadow-pop ring-1 ring-ink-100 z-50">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function DropdownItem({
  href,
  label,
  icon: Icon,
  desc,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  desc?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
        active ? "bg-brand-50" : "hover:bg-ink-50"
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-brand-700" : "text-ink-400")} />
      <div className="min-w-0">
        <div className={cn("text-sm font-medium", active ? "text-brand-800" : "text-ink-900")}>
          {label}
        </div>
        {desc ? <div className="text-xs text-ink-500">{desc}</div> : null}
      </div>
    </Link>
  );
}

function IconLink({
  href,
  label,
  icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "relative p-2 rounded-md transition-colors",
        active ? "text-brand-700 bg-brand-50" : "text-ink-500 hover:text-ink-900 hover:bg-ink-100"
      )}
    >
      {icon}
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-accent text-ink-900 text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function UserMenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">
      <span className="text-ink-400">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink-100 pt-2 pb-1">
      <div className="px-4 pb-1 text-[11px] uppercase tracking-wider text-ink-400 font-semibold">{label}</div>
      <div className="px-2">{children}</div>
    </div>
  );
}

function MobileLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 rounded-md text-sm",
        active ? "bg-brand-50 text-brand-800 font-medium" : "text-ink-700 hover:bg-ink-100"
      )}
    >
      {label}
    </Link>
  );
}
