"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  BarChart3,
  Pin,
  PinOff,
  CheckCircle,
  Circle,
  EyeOff as Hide,
  Eye as Show,
} from "lucide-react";

type SessionRow = { id: string; title: string; startTime: string };

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
  hidden: boolean;
  pinned: boolean;
  upvotes: number;
  upvotedByMe: boolean;
  isMine: boolean;
  createdAt: string;
};

export function EngagementBoard({
  eventId,
  sessions,
}: {
  eventId: string;
  sessions: SessionRow[];
}) {
  const [openSessionId, setOpenSessionId] = useState<string>(sessions[0]?.id ?? "");

  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <SessionSection
          key={s.id}
          session={s}
          eventId={eventId}
          open={openSessionId === s.id}
          onToggle={() =>
            setOpenSessionId(openSessionId === s.id ? "" : s.id)
          }
        />
      ))}
    </div>
  );
}

function SessionSection({
  session,
  eventId,
  open,
  onToggle,
}: {
  session: SessionRow;
  eventId: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-ink-50 text-left"
      >
        <div>
          <div className="font-semibold text-ink-900">{session.title}</div>
          <div className="text-xs text-ink-500 mt-0.5">
            {new Date(session.startTime).toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-ink-500 inline-flex items-center gap-1.5">
          {open ? "Hide" : "Open"} {open ? "▴" : "▾"}
        </div>
      </button>
      {open ? (
        <div className="border-t border-ink-100">
          <SessionEngagement sessionId={session.id} eventId={eventId} />
        </div>
      ) : null}
    </div>
  );
}

function SessionEngagement({
  sessionId,
  eventId,
}: {
  sessionId: string;
  eventId: string;
}) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/engagement`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not load engagement data");
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

  async function updatePoll(pollId: string, patch: Partial<Poll>) {
    setError(null);
    const res = await fetch(`/api/admin/polls/${pollId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update poll");
      return;
    }
    refresh();
  }

  async function deletePoll(pollId: string) {
    if (!confirm("Delete this poll? All votes will be lost.")) return;
    const res = await fetch(`/api/admin/polls/${pollId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete poll");
      return;
    }
    refresh();
  }

  async function moderateQuestion(qId: string, patch: Partial<Question>) {
    const res = await fetch(`/api/admin/questions/${qId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update question");
      return;
    }
    refresh();
  }

  async function deleteQuestion(qId: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/questions/${qId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not delete question");
      return;
    }
    refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-px bg-ink-100">
      {/* POLLS */}
      <div className="bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-600 inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Polls
          </h3>
          <button
            onClick={() => setCreatingPoll(true)}
            className="btn-secondary text-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New poll
          </button>
        </div>

        {error ? (
          <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        ) : null}

        {!loaded ? (
          <div className="text-sm text-ink-500">Loading…</div>
        ) : polls.length === 0 ? (
          <div className="text-sm text-ink-500">
            No polls yet. Create one to start engaging the room.
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                onUpdate={(patch) => updatePoll(p.id, patch)}
                onDelete={() => deletePoll(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Q&A */}
      <div className="bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-600">
          Questions ({questions.length})
        </h3>

        {!loaded ? (
          <div className="text-sm text-ink-500">Loading…</div>
        ) : questions.length === 0 ? (
          <div className="text-sm text-ink-500">No questions yet.</div>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => (
              <li
                key={q.id}
                className={`rounded-lg p-3 ring-1 ${
                  q.hidden
                    ? "ring-ink-200 bg-ink-50 opacity-60"
                    : q.pinned
                    ? "ring-amber-200 bg-amber-50"
                    : q.answered
                    ? "ring-emerald-200 bg-emerald-50/40"
                    : "ring-ink-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xs font-semibold text-ink-700 shrink-0 inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-ink-100 px-2 py-0.5">
                    ▲ {q.upvotes}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink-800">{q.text}</div>
                    <div className="text-xs text-ink-500 mt-1">
                      {q.author.name} · {new Date(q.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => moderateQuestion(q.id, { pinned: !q.pinned })}
                    className="text-xs text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"
                    title={q.pinned ? "Unpin" : "Pin to top"}
                  >
                    {q.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    {q.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => moderateQuestion(q.id, { answered: !q.answered })}
                    className="text-xs text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"
                  >
                    {q.answered ? <Circle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    {q.answered ? "Reopen" : "Mark answered"}
                  </button>
                  <button
                    onClick={() => moderateQuestion(q.id, { hidden: !q.hidden })}
                    className="text-xs text-ink-600 hover:text-ink-900 inline-flex items-center gap-1"
                  >
                    {q.hidden ? <Show className="h-3.5 w-3.5" /> : <Hide className="h-3.5 w-3.5" />}
                    {q.hidden ? "Unhide" : "Hide"}
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {creatingPoll ? (
        <PollCreateModal
          sessionId={sessionId}
          onClose={() => setCreatingPoll(false)}
          onCreated={() => {
            setCreatingPoll(false);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function PollCard({
  poll,
  onUpdate,
  onDelete,
}: {
  poll: Poll;
  onUpdate: (patch: Partial<Poll>) => void;
  onDelete: () => void;
}) {
  const max = Math.max(1, ...poll.options.map((o) => o.votes ?? 0));
  return (
    <div className="rounded-lg ring-1 ring-ink-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium text-ink-900">{poll.question}</div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onUpdate({ isOpen: !poll.isOpen })}
            className="text-xs text-brand-700 inline-flex items-center gap-1 hover:underline"
            title={poll.isOpen ? "Close voting" : "Open voting"}
          >
            {poll.isOpen ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {poll.isOpen ? "Close" : "Open"}
          </button>
          <button
            onClick={() => onUpdate({ resultsVisible: !poll.resultsVisible })}
            className="text-xs text-brand-700 inline-flex items-center gap-1 hover:underline"
            title={poll.resultsVisible ? "Hide results" : "Reveal results"}
          >
            {poll.resultsVisible ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {poll.resultsVisible ? "Hide" : "Reveal"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-ink-500">
        {poll.isOpen ? "🟢 Voting open" : "⚪ Closed"} · {poll.totalVotes} total
        vote{poll.totalVotes === 1 ? "" : "s"}
      </div>
      <div className="mt-3 space-y-1.5">
        {poll.options.map((o) => {
          const pct = o.votes !== null ? Math.round((o.votes / max) * 100) : 0;
          return (
            <div key={o.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{o.label}</span>
                <span className="text-xs text-ink-500">
                  {o.votes !== null ? `${o.votes}` : "—"}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full bg-brand-700 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PollCreateModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setOption(idx: number, val: string) {
    setOptions((o) => o.map((v, i) => (i === idx ? val : v)));
  }
  function addOption() {
    if (options.length < 10) setOptions([...options, ""]);
  }
  function removeOption(idx: number) {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  }

  async function submit() {
    setError(null);
    const trimmed = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) {
      setError("Question is required");
      return;
    }
    if (trimmed.length < 2) {
      setError("At least 2 options are required");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/sessions/${sessionId}/polls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        allowMultiple,
        options: trimmed,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not create poll");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-pop">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">New poll</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Question</label>
            <input
              className="input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What did you think of the keynote?"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Options</label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    value={o}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 ? (
                    <button
                      onClick={() => removeOption(i)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {options.length < 10 ? (
              <button
                onClick={addOption}
                className="mt-2 text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            ) : null}
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
            />
            Allow multiple selections
          </label>
          {error ? (
            <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !question || options.filter(Boolean).length < 2}
            className="btn-primary"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create poll"}
          </button>
        </div>
      </div>
    </div>
  );
}
