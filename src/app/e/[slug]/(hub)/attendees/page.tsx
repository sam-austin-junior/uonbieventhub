import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ConnectButton } from "@/components/event/ConnectButton";
import { NetworkingRecommendations } from "@/components/event/NetworkingRecommendations";
import { Search } from "lucide-react";

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { q?: string; faculty?: string };
}) {
  const session = await getSession();
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const q = searchParams.q?.trim();
  const userWhere: any = { showInDirectory: true };
  if (q) {
    userWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { organization: { contains: q, mode: "insensitive" } },
      { jobTitle: { contains: q, mode: "insensitive" } },
    ];
  }
  if (searchParams.faculty) userWhere.faculty = searchParams.faculty;

  const regs = await prisma.registration.findMany({
    where: { eventId: event.id, user: userWhere },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const allFacultyRows = await prisma.registration.findMany({
    where: { eventId: event.id },
    select: { user: { select: { faculty: true } } },
  });
  const faculties = Array.from(
    new Set(allFacultyRows.map((r) => r.user.faculty).filter(Boolean) as string[])
  ).sort();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Attendees</h1>
          <p className="text-sm text-ink-500 mt-1">
            {regs.length} attendee{regs.length === 1 ? "" : "s"}.
          </p>
        </div>
        <form className="flex gap-2 flex-wrap" action="">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search by name or role…"
              className="input pl-9 w-64"
            />
          </div>
          <select name="faculty" defaultValue={searchParams.faculty ?? ""} className="input w-56">
            <option value="">All faculties</option>
            {faculties.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <button className="btn-primary">Filter</button>
        </form>
      </header>

      {session ? (
        <div className="mb-6">
          <NetworkingRecommendations slug={event.slug} />
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {regs.map(({ user: u }) => (
          <div key={u.id} className="card p-5 flex gap-4">
            <Avatar name={u.name} src={u.avatarUrl} size={56} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink-900 truncate">{u.name}</div>
              {u.jobTitle ? (
                <div className="text-sm text-ink-500 truncate">{u.jobTitle}</div>
              ) : null}
              {u.faculty ? (
                <div className="text-xs text-ink-400 truncate">{u.faculty}</div>
              ) : null}
              {session && session.userId !== u.id ? (
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/e/${event.slug}/messages?attendeeId=${u.id}`}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    Message
                  </Link>
                  <span className="text-ink-300">·</span>
                  <ConnectButton receiverId={u.id} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
