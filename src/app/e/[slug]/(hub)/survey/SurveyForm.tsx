"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  prompt: string;
  type: "rating" | "text" | "multiple_choice";
  options: string[];
  required: boolean;
};

export function SurveyForm({
  slug,
  questions,
  initial,
  submitLabel,
}: {
  slug: string;
  questions: Q[];
  initial: Record<string, string>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setAnswer(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/e/${slug}/survey`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save your response");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {questions.map((q, i) => (
        <fieldset key={q.id} className="space-y-3">
          <legend className="font-medium text-ink-900">
            {i + 1}. {q.prompt}
            {q.required ? <span className="text-red-500 ml-1">*</span> : null}
          </legend>

          {q.type === "rating" ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = Number(answers[q.id] ?? 0) === n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setAnswer(q.id, String(n))}
                    className={cn(
                      "p-2 rounded-md transition",
                      selected ? "bg-accent/20" : "hover:bg-ink-50"
                    )}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  >
                    <Star
                      className={cn(
                        "h-7 w-7",
                        selected ? "fill-accent text-accent" : "text-ink-300"
                      )}
                    />
                  </button>
                );
              })}
              {answers[q.id] ? (
                <span className="text-sm text-ink-500 ml-2">{answers[q.id]} / 5</span>
              ) : null}
            </div>
          ) : q.type === "multiple_choice" ? (
            <div className="space-y-1.5">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 ring-1 cursor-pointer transition",
                    answers[q.id] === opt
                      ? "ring-brand-500 bg-brand-50"
                      : "ring-ink-200 hover:ring-brand-300"
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswer(q.id, opt)}
                    required={q.required}
                  />
                  <span className="text-sm text-ink-800">{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              required={q.required}
              rows={3}
              className="input"
              placeholder="Type your answer…"
            />
          )}
        </fieldset>
      ))}

      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> Saved — thank you.
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  );
}
