import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live polling endpoint hit by the attendee/presenter views on a regular
 * interval. Returns the engagement snapshot for one session: polls (with
 * vote counts when results are visible) and Q&A questions (sorted by
 * pinned, then upvotes, then time).
 */
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const sessionRow = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: { event: { select: { id: true, organizerId: true } } },
  });
  if (!sessionRow) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isOrganizer =
    session.role === "SUPERADMIN" ||
    (session.role === "ORGANIZER" && session.userId === sessionRow.event.organizerId) ||
    session.role === "ADMIN";

  const [polls, questions, myVotes, myUpvotes] = await Promise.all([
    prisma.poll.findMany({
      where: { sessionId: sessionRow.id },
      orderBy: { sortOrder: "asc" },
      include: {
        options: { orderBy: { sortOrder: "asc" } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.question.findMany({
      where: {
        sessionId: sessionRow.id,
        ...(isOrganizer ? {} : { hidden: false }),
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { upvotes: true } },
      },
    }),
    prisma.pollVote.findMany({
      where: { userId: session.userId, poll: { sessionId: sessionRow.id } },
      select: { pollId: true, optionId: true },
    }),
    prisma.questionUpvote.findMany({
      where: { userId: session.userId, question: { sessionId: sessionRow.id } },
      select: { questionId: true },
    }),
  ]);

  // For polls, attach per-option vote counts (always for organizer; only
  // when resultsVisible for attendees) and the current user's votes.
  const pollOptionVotes = await prisma.pollVote.groupBy({
    by: ["pollId", "optionId"],
    where: { poll: { sessionId: sessionRow.id } },
    _count: { _all: true },
  });
  const voteIndex = new Map<string, number>();
  for (const row of pollOptionVotes) {
    voteIndex.set(`${row.pollId}:${row.optionId}`, row._count._all);
  }

  const pollsView = polls.map((p) => {
    const showResults = isOrganizer || p.resultsVisible || !p.isOpen;
    return {
      id: p.id,
      question: p.question,
      allowMultiple: p.allowMultiple,
      isOpen: p.isOpen,
      resultsVisible: p.resultsVisible,
      totalVotes: p._count.votes,
      options: p.options.map((o) => ({
        id: o.id,
        label: o.label,
        votes: showResults ? voteIndex.get(`${p.id}:${o.id}`) ?? 0 : null,
        votedByMe: myVotes.some((v) => v.pollId === p.id && v.optionId === o.id),
      })),
    };
  });

  // Sort questions: pinned first (already in DB order), then by upvote
  // count desc, then by time asc.
  const questionsView = questions
    .map((q) => ({
      id: q.id,
      text: q.text,
      author: q.user,
      answered: q.answered,
      hidden: q.hidden,
      pinned: q.pinned,
      upvotes: q._count.upvotes,
      upvotedByMe: myUpvotes.some((u) => u.questionId === q.id),
      isMine: q.userId === session.userId,
      createdAt: q.createdAt.toISOString(),
    }))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
      return a.createdAt.localeCompare(b.createdAt);
    });

  return NextResponse.json({
    isOrganizer,
    polls: pollsView,
    questions: questionsView,
  });
}
