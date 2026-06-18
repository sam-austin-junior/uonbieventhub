import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { Pin, MessageCircle } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { NewDiscussionForm } from "./NewDiscussionForm";

export default async function DiscussionsPage({ params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();
  const discussions = await prisma.discussion.findMany({
    where: { eventId: event.id },
    include: { author: true, _count: { select: { replies: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <header className="mb-6 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Discussions</h1>
          <p className="text-sm text-ink-500 mt-1">
            Connect, ask questions, and share with other attendees.
          </p>
        </div>
      </header>

      <NewDiscussionForm eventId={event.id} />

      <div className="mt-6 space-y-3">
        {discussions.map((d) => (
          <Link
            key={d.id}
            href={`/e/${event.slug}/discussions/${d.id}`}
            className="card p-5 flex gap-4 hover:shadow-pop transition-shadow"
          >
            <Avatar name={d.author.name} src={d.author.avatarUrl} size={40} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {d.pinned ? <Pin className="h-4 w-4 text-accent" /> : null}
                <h3 className="font-semibold text-ink-900 truncate">{d.title}</h3>
              </div>
              <p className="text-sm text-ink-600 line-clamp-2 mt-1">{d.body}</p>
              <div className="mt-2 text-xs text-ink-500 flex items-center gap-3">
                <span>{d.author.name}</span>
                <span>·</span>
                <span>{relativeTime(d.createdAt)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {d._count.replies} repl
                  {d._count.replies === 1 ? "y" : "ies"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
