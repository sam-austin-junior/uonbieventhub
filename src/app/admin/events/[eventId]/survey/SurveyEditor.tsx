"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  CheckCircle,
  ClipboardList,
  BarChart3,
  Star,
  ListChecks,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QType = "rating" | "text" | "multiple_choice";
type Q = { id?: string; prompt: string; type: QType; options: string[]; required: boolean };
type Response = {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  answers: Record<string, string>;
  submittedAt: string;
};

function blank(): Q {
  return { prompt: "", type: "rating", options: [], required: false };
}

export function SurveyEditor({
  eventId,
  initial,
  responses,
}: {
  eventId: string;
  initial: {
    title: string;
    description: string | null;
    enabled: boolean;
    questions: Q[];
  } | null;
  responses: Response[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"edit" | "results">("edit");
  const [title, setTitle] = useState(initial?.title ?? "Help us improve future events");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [questions, setQuestions] = useState<Q[]>(
    initial?.questions ?? [{ prompt: "How would you rate the event overall?", type: "rating", options: [], required: true }]
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Q>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function remove(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    setQuestions((qs) => {
      const next = [...qs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addQuestion() {
    if (questions.length >= 20) return;
    setQuestions((qs) => [...qs, blank()]);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/events/${eventId}/survey`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        enabled,
        questions: questions.map((q) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.type === "multiple_choice" ? q.options.filter(Boolean) : undefined,
          required: q.required,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setSavedAt(new Date());
    router.refresh();
  }

  return (
    <div>
      <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 inline-flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-700" /> Post-event survey
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Attendees see this from the event home page. Keep it short.
          </p>
        </div>
        <div className="flex gap-1 rounded-md ring-1 ring-ink-200 p-0.5 text-xs">
          <button
            onClick={() => setTab("edit")}
            className={cn(
              "px-3 py-1.5 rounded-md inline-flex items-center gap-1",
              tab === "edit" ? "bg-brand-700 text-white" : "text-ink-600 hover:text-ink-900"
            )}
          >
            <ClipboardList className="h-3 w-3" /> Edit
          </button>
          <button
            onClick={() => setTab("results")}
            className={cn(
              "px-3 py-1.5 rounded-md inline-flex items-center gap-1",
              tab === "results" ? "bg-brand-700 text-white" : "text-ink-600 hover:text-ink-900"
            )}
          >
            <BarChart3 className="h-3 w-3" /> Results ({responses.length})
          </button>
        </div>
      </header>

      {tab === "edit" ? (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Survey title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>Survey is open — attendees can submit responses</span>
            </label>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionRow
                key={i}
                index={i}
                q={q}
                onChange={(patch) => update(i, patch)}
                onRemove={() => remove(i)}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < questions.length - 1}
              />
            ))}
          </div>

          <button onClick={addQuestion} className="btn-ghost text-sm" disabled={questions.length >= 20}>
            <Plus className="h-4 w-4" /> Add question
          </button>

          {error ? (
            <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="flex items-center justify-end gap-3 sticky bottom-4">
            {savedAt ? (
              <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Saved {savedAt.toLocaleTimeString()}
              </span>
            ) : null}
            <button onClick={save} disabled={saving || questions.length === 0} className="btn-primary shadow-pop">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save survey</>}
            </button>
          </div>
        </div>
      ) : (
        <Results responses={responses} questions={initial?.questions ?? []} />
      )}
    </div>
  );
}

function QuestionRow({
  index,
  q,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  index: number;
  q: Q;
  onChange: (patch: Partial<Q>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const ICON = q.type === "rating" ? Star : q.type === "multiple_choice" ? ListChecks : Type;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 inline-flex items-center gap-1.5">
          <ICON className="h-3.5 w-3.5 text-brand-700" /> Q{index + 1}
        </div>
        <div className="inline-flex gap-1">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1 rounded hover:bg-ink-50 disabled:opacity-30">
            <ArrowUp className="h-4 w-4 text-ink-500" />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1 rounded hover:bg-ink-50 disabled:opacity-30">
            <ArrowDown className="h-4 w-4 text-ink-500" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Prompt</label>
          <input
            value={q.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            className="input"
            required
            placeholder="e.g. How would you rate the catering?"
          />
        </div>
        <div className="grid sm:grid-cols-[160px_1fr] gap-3">
          <div>
            <label className="label">Type</label>
            <select
              value={q.type}
              onChange={(e) => onChange({ type: e.target.value as QType, options: [] })}
              className="input"
            >
              <option value="rating">Rating (1–5)</option>
              <option value="text">Open text</option>
              <option value="multiple_choice">Multiple choice</option>
            </select>
          </div>
          {q.type === "multiple_choice" ? (
            <div>
              <label className="label">Options (one per line)</label>
              <textarea
                value={q.options.join("\n")}
                onChange={(e) => onChange({ options: e.target.value.split("\n") })}
                rows={3}
                className="input font-mono text-xs"
                placeholder={"Excellent\nGood\nOK\nPoor"}
              />
            </div>
          ) : (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => onChange({ required: e.target.checked })}
                />
                Required
              </label>
            </div>
          )}
        </div>
        {q.type === "multiple_choice" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            Required
          </label>
        ) : null}
      </div>
    </div>
  );
}

function Results({ responses, questions }: { responses: Response[]; questions: Q[] }) {
  const aggregates = useMemo(() => {
    return questions.map((q) => {
      if (!q.id) return { q, count: 0, agg: null };
      const answered = responses
        .map((r) => r.answers[q.id!])
        .filter((v) => v !== undefined && v !== "");
      const count = answered.length;
      if (q.type === "rating") {
        const nums = answered.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        const distribution = [1, 2, 3, 4, 5].map((s) => ({
          star: s,
          n: nums.filter((n) => n === s).length,
        }));
        return { q, count, agg: { kind: "rating" as const, avg, distribution } };
      }
      if (q.type === "multiple_choice") {
        const counts = new Map<string, number>();
        for (const v of answered) counts.set(v, (counts.get(v) ?? 0) + 1);
        const items = q.options.map((opt) => ({ option: opt, n: counts.get(opt) ?? 0 }));
        return { q, count, agg: { kind: "choice" as const, items } };
      }
      return { q, count, agg: { kind: "text" as const, samples: answered.slice(0, 10) } };
    });
  }, [responses, questions]);

  if (responses.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-ink-500">
        No responses yet. Once your survey is enabled and you've shared the event URL, results appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">Summary</div>
        <div className="mt-1 text-2xl font-bold text-ink-900">
          {responses.length} response{responses.length === 1 ? "" : "s"}
        </div>
      </div>

      {aggregates.map(({ q, count, agg }, i) => (
        <div key={i} className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 inline-flex items-center gap-1.5 mb-1">
            Q{i + 1}
            <span className="text-ink-400 font-normal">· {count} answered</span>
          </div>
          <div className="font-medium text-ink-900 mb-3">{q.prompt}</div>

          {agg?.kind === "rating" ? (
            <div>
              <div className="text-3xl font-bold text-brand-700">
                {agg.avg.toFixed(2)} <span className="text-sm text-ink-400 font-normal">/ 5</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {agg.distribution.map((d) => (
                  <div key={d.star} className="grid grid-cols-[24px_1fr_36px] items-center gap-2">
                    <span className="text-xs text-ink-500">{d.star}★</span>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: count ? `${(d.n / count) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-xs text-ink-500 text-right">{d.n}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : agg?.kind === "choice" ? (
            <div className="space-y-1.5">
              {agg.items.map((it) => (
                <div key={it.option} className="grid grid-cols-[1fr_60px_36px] items-center gap-2">
                  <span className="text-sm text-ink-700 truncate">{it.option}</span>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-700 transition-all"
                      style={{ width: count ? `${(it.n / count) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-xs text-ink-500 text-right">{it.n}</span>
                </div>
              ))}
            </div>
          ) : agg?.kind === "text" ? (
            <ul className="space-y-2 text-sm text-ink-700">
              {agg.samples.map((s, idx) => (
                <li key={idx} className="rounded-md bg-ink-50 p-3 whitespace-pre-line">
                  "{s}"
                </li>
              ))}
              {count > agg.samples.length ? (
                <li className="text-xs text-ink-500">+ {count - agg.samples.length} more responses</li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">No data yet.</p>
          )}
        </div>
      ))}
    </div>
  );
}
