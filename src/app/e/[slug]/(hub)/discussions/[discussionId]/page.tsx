import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEventBySlug } from "@/lib/event";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowLeft, Pin } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { ReplyForm } from "./ReplyForm";

export default async function DiscussionDetailPage({
  params,
}: {
  params: { slug: string; discussionId: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const d = await prisma.discussion.findUnique({
    where: { id: params.discussionId },
    include: {
      author: true,
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!d || d.eventId !== event.id) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        href={`/e/${event.slug}/discussions`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All discussions
      </Link>

      <article className="mt-4 card p-6">
        <div className="flex items-center gap-2">
          {d.pinned ? <Pin className="h-4 w-4 text-accent" /> : null}
          <h1 className="text-xl font-bold text-ink-900">{d.title}</h1>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
          <Avatar name={d.author.name} src={d.author.avatarUrl} size={24} />
          <span className="font-medium text-ink-700">{d.author.name}</span>
          <span>·</span>
          <span>{relativeTime(d.createdAt)}</span>
        </div>
        <p className="mt-4 text-ink-700 whitespace-pre-line">{d.body}</p>
      </article>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
        {d.replies.length} repl{d.replies.length === 1 ? "y" : "ies"}
      </h2>

      <div className="space-y-3">
        {d.replies.map((r) => (
          <div key={r.id} className="card p-4 flex gap-3">
            <Avatar name={r.author.name} src={r.author.avatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium text-ink-800">{r.author.name}</span>
                <span className="text-ink-400 ml-2 text-xs">{relativeTime(r.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-700 whitespace-pre-line">{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ReplyForm discussionId={d.id} />
      </div>
    </div>
  );
}
