import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ConnectionActions } from "./ConnectionActions";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ConnectionsPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const incoming = await prisma.connection.findMany({
    where: { receiverId: session.userId, status: "PENDING" },
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });

  const accepted = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: session.userId }, { receiverId: session.userId }],
    },
    include: { requester: true, receiver: true },
    orderBy: { respondedAt: "desc" },
  });

  const sent = await prisma.connection.findMany({
    where: { requesterId: session.userId, status: "PENDING" },
    include: { receiver: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Connections</h1>
        <p className="text-sm text-ink-500 mt-1">
          Manage your network from this event.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Incoming requests ({incoming.length})
        </h2>
        {incoming.length === 0 ? (
          <EmptyState title="No pending requests" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {incoming.map((c) => (
              <div key={c.id} className="card p-4 flex gap-3 items-center">
                <Avatar name={c.requester.name} src={c.requester.avatarUrl} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.requester.name}</div>
                  <div className="text-xs text-ink-500 truncate">
                    {c.requester.jobTitle ?? c.requester.faculty}
                  </div>
                </div>
                <ConnectionActions id={c.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
          My connections ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <EmptyState
            title="No connections yet"
            description="Find people in the attendees directory and send a request."
            action={
              <Link href={`/e/${event.slug}/attendees`} className="btn-primary">
                Browse attendees
              </Link>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {accepted.map((c) => {
              const other = c.requesterId === session.userId ? c.receiver : c.requester;
              return (
                <Link
                  key={c.id}
                  href={`/e/${event.slug}/messages?attendeeId=${other.id}`}
                  className="card p-4 flex gap-3 items-center hover:shadow-pop transition-shadow"
                >
                  <Avatar name={other.name} src={other.avatarUrl} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{other.name}</div>
                    <div className="text-xs text-ink-500 truncate">
                      {other.jobTitle ?? other.faculty}
                    </div>
                  </div>
                  <span className="text-xs text-brand-700">Message</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {sent.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Sent requests ({sent.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sent.map((c) => (
              <div key={c.id} className="card p-4 flex gap-3 items-center">
                <Avatar name={c.receiver.name} src={c.receiver.avatarUrl} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.receiver.name}</div>
                  <div className="text-xs text-ink-500">Awaiting response</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
