"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart3,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronUp,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

type PollOption = {
  id: string;
  label: string;
  votes: number | null;
  votedByMe: boolean;
};

type Poll = {
  id: string;
  question: string;
  allowMultiple: boolean;
  isOpen: boolean;
  resultsVisible: boolean;
  totalVotes: number;
  options: PollOption[];
};

type Question = {
  id: string;
  text: string;
  author: { id: string; name: string; avatarUrl: string | null };
  answered: boolean;
  pinned: boolean;
  upvotes: number;
  upvotedByMe: boolean;
  isMine: boolean;
  createdAt: string;
};

export function SessionEngagement({ sessionId }: { sessionId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/engagement`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401) return; // not signed in; sidebar nudges sign-in elsewhere
        throw new Error("Could not load polls and Q&A");
      }
      const data = await res.json();
      setPolls(data.polls);
      setQuestions(data.questions);
      setError(null);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
      setLoaded(true);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
    intervalRef.current = window.setInterval(refresh, 4000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [refresh]);

  async function vote(poll: Poll, optionId: string) {
    if (!poll.isOpen) return;
    setError(null);
    // Toggle selection for multi-select; single-select replaces.
    let optionIds: string[];
    if (poll.allowMultiple) {
      const currentlySelected = poll.options
        .filter((o) => o.votedByMe)
        .map((o) => o.id);
      optionIds = currentlySelected.includes(optionId)
        ? currentlySelected.filter((id) => id !== optionId)
        : [...currentlySelected, optionId];
      if (optionIds.length === 0) {
        // Voting endpoint requires at least 1; treat as no-op
        return;
      }
    } else {
      optionIds = [optionId];
    }
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ optionIds }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not vote");
      return;
    }
    refresh();
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setPostError(null);
    setPostingQuestion(true);
    const res = await fetch(`/api/sessions/${sessionId}/questions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: questionText.trim() }),
    });
    setPostingQuestion(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setPostError(d.error ?? "Could not post question");
      return;
    }
    setQuestionText("");
    refresh();
  }

  async function toggleUpvote(q: Question) {
    if (q.isMine) return;
    const method = q.upvotedByMe ? "DELETE" : "POST";
    await fetch(`/api/questions/${q.id}/upvote`, { method });
    refresh();
  }

  if (!loaded) {
    return (
      <div className="mt-10 text-sm text-ink-500">Loading live engagement…</div>
    );
  }

  if (polls.length === 0 && questions.length === 0 && !error) {
    return (
      <div className="mt-10 rounded-xl ring-1 ring-ink-100 bg-white p-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold inline-flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" /> Q&amp;A
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Be the first to ask a question. The speaker and other attendees can
          upvote and reply in real time.
        </p>
        <form onSubmit={ask} className="mt-4 flex gap-2">
          <input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question…"
            className="input"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={postingQuestion || !questionText.trim()}
            className="btn-primary"
          >
            {postingQuestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        {postError ? (
          <div className="mt-2 text-xs text-red-600 inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {postError}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {polls.length > 0 ? (
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold mb-4 inline-flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> Live polls
          </h2>
          <div className="space-y-4">
            {polls.map((p) => (
              <AttendeePollCard key={p.id} poll={p} onVote={(opt) => vote(p, opt)} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold mb-4 inline-flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" /> Q&amp;A ({questions.length})
        </h2>

        <form onSubmit={ask} className="flex gap-2 mb-5">
          <input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ask a question…"
            className="input"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={postingQuestion || !questionText.trim()}
            className="btn-primary"
          >
            {postingQuestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        {postError ? (
          <div className="mb-3 text-xs text-red-600 inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {postError}
          </div>
        ) : null}

        {questions.length === 0 ? (
          <p className="text-sm text-ink-500">No questions yet — go first.</p>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => (
              <li
                key={q.id}
                className={`flex gap-3 rounded-xl ring-1 p-4 ${
                  q.pinned
                    ? "ring-amber-200 bg-amber-50/60"
                    : q.answered
                    ? "ring-emerald-200 bg-emerald-50/40"
                    : "ring-ink-100 bg-white"
                }`}
              >
                <button
                  onClick={() => toggleUpvote(q)}
                  disabled={q.isMine}
                  className={`shrink-0 flex flex-col items-center justify-center w-12 rounded-lg py-1 transition ${
                    q.upvotedByMe
                      ? "bg-brand-700 text-white"
                      : "bg-ink-50 text-ink-700 hover:bg-ink-100"
                  } ${q.isMine ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={q.isMine ? "You can't upvote your own question" : "Upvote"}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-xs font-semibold">{q.upvotes}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink-800">{q.text}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
                    <Avatar
                      name={q.author.name}
                      src={q.author.avatarUrl}
                      size={18}
                    />
                    <span>{q.author.name}</span>
                    {q.answered ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Answered
                      </span>
                    ) : null}
                    {q.pinned ? (
                      <span className="text-amber-700">📌 Pinned</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      ) : null}
    </div>
  );
}

function AttendeePollCard({
  poll,
  onVote,
}: {
  poll: Poll;
  onVote: (optionId: string) => void;
}) {
  const showResults = poll.options.some((o) => o.votes !== null);
  const max = Math.max(1, ...poll.options.map((o) => o.votes ?? 0));

  return (
    <div className="rounded-xl ring-1 ring-ink-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink-900">{poll.question}</h3>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
            poll.isOpen
              ? "bg-emerald-100 text-emerald-800"
              : "bg-ink-100 text-ink-600"
          }`}
        >
          {poll.isOpen ? "Open" : "Closed"}
        </span>
      </div>
      {poll.allowMultiple ? (
        <div className="text-xs text-ink-500 mt-1">Pick all that apply</div>
      ) : null}

      <div className="mt-4 space-y-2">
        {poll.options.map((o) => {
          const pct = o.votes !== null ? Math.round((o.votes / max) * 100) : 0;
          return (
            <button
              key={o.id}
              onClick={() => onVote(o.id)}
              disabled={!poll.isOpen}
              className={`group block w-full text-left rounded-lg ring-1 transition ${
                o.votedByMe
                  ? "ring-brand-700 bg-brand-50/60"
                  : "ring-ink-200 hover:ring-ink-400"
              } ${!poll.isOpen ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <div className="relative px-4 py-2.5">
                {showResults ? (
                  <div
                    className="absolute inset-y-0 left-0 bg-brand-100/60 rounded-l-lg transition-all"
                    style={{ width: `${pct}%` }}
                  />
                ) : null}
                <div className="relative flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-900">{o.label}</span>
                  {showResults ? (
                    <span className="text-xs text-ink-600 font-medium">
                      {o.votes} ({pct}%)
                    </span>
                  ) : o.votedByMe ? (
                    <CheckCircle className="h-4 w-4 text-brand-700" />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-ink-500">
        {poll.totalVotes} total vote{poll.totalVotes === 1 ? "" : "s"}
      </div>
    </div>
  );
}
