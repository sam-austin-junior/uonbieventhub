import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { relativeTime, cn } from "@/lib/utils";
import { MessageThread } from "./MessageThread";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { attendeeId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: session.userId }, { receiverId: session.userId }],
    },
    orderBy: { sentAt: "desc" },
    include: { sender: true, receiver: true },
  });

  const threads = new Map<
    string,
    { otherId: string; otherName: string; otherAvatar: string | null; last: (typeof messages)[0] }
  >();
  for (const m of messages) {
    const otherId = m.senderId === session.userId ? m.receiverId : m.senderId;
    const other = m.senderId === session.userId ? m.receiver : m.sender;
    if (!threads.has(otherId)) {
      threads.set(otherId, {
        otherId,
        otherName: other.name,
        otherAvatar: other.avatarUrl,
        last: m,
      });
    }
  }

  const threadList = Array.from(threads.values());
  const activeId = searchParams.attendeeId ?? threadList[0]?.otherId;
  const activeOther = activeId
    ? await prisma.user.findUnique({ where: { id: activeId } })
    : null;

  const conversation = activeId
    ? await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.userId, receiverId: activeId },
            { senderId: activeId, receiverId: session.userId },
          ],
        },
        orderBy: { sentAt: "asc" },
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Messages</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 h-[600px]">
        <aside className="card overflow-y-auto">
          {threadList.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-500">
              No messages yet. Start a conversation from the attendees directory.
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {threadList.map((t) => (
                <li key={t.otherId}>
                  <Link
                    href={`/e/${params.slug}/messages?attendeeId=${t.otherId}`}
                    className={cn(
                      "flex gap-3 p-3 hover:bg-ink-50",
                      activeId === t.otherId ? "bg-brand-50" : ""
                    )}
                  >
                    <Avatar name={t.otherName} src={t.otherAvatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink-900 truncate">{t.otherName}</span>
                        <span className="text-[10px] text-ink-400 shrink-0">
                          {relativeTime(t.last.sentAt)}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 line-clamp-1">{t.last.body}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="card flex flex-col">
          {activeOther ? (
            <MessageThread
              currentUserId={session.userId}
              other={{ id: activeOther.id, name: activeOther.name, avatarUrl: activeOther.avatarUrl }}
              initialMessages={conversation.map((m) => ({
                id: m.id,
                senderId: m.senderId,
                body: m.body,
                sentAt: m.sentAt.toISOString(),
              }))}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                title="Select a conversation"
                description="Pick a message thread on the left, or start a new one from the attendees directory."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
