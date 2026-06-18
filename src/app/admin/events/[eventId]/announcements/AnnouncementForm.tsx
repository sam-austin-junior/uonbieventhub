"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2, CheckCircle, Users, Mic2, Store, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Audience = "ALL_ATTENDEES" | "CHECKED_IN" | "SPEAKERS" | "EXHIBITORS";

const OPTIONS: { value: Audience; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "ALL_ATTENDEES", label: "All attendees", description: "Everyone registered", icon: <Users className="h-4 w-4" /> },
  { value: "CHECKED_IN", label: "Checked-in only", description: "People physically at the event", icon: <CheckSquare className="h-4 w-4" /> },
  { value: "SPEAKERS", label: "Speakers", description: "Confirmed speakers with accounts", icon: <Mic2 className="h-4 w-4" /> },
  { value: "EXHIBITORS", label: "Exhibitors", description: "Booth contacts with emails", icon: <Store className="h-4 w-4" /> },
];

export function AnnouncementForm({
  eventId,
  emailReady,
  audienceCounts,
}: {
  eventId: string;
  emailReady: boolean;
  audienceCounts: Record<Audience, number>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL_ATTENDEES");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    recipientCount: number;
    emailsSent: number;
    emailsFailed: number;
    emailSkipped: boolean;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (!sendEmail && !sendInApp) {
      setError("Pick at least one delivery channel.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSummary(null);
    const res = await fetch(`/api/admin/events/${eventId}/announcements`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, body, audience, sendEmail, sendInApp }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send announcement");
      return;
    }
    const data = await res.json();
    setSummary(data.summary);
    setTitle("");
    setBody("");
    startTransition(() => router.refresh());
  }

  const count = audienceCounts[audience];

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-5">
      <div>
        <label className="label">Headline</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input"
          placeholder="Programme update for tomorrow"
        />
      </div>
      <div>
        <label className="label">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={6}
          className="input"
          placeholder="Share the details with your attendees…"
        />
      </div>

      <div>
        <label className="label">Audience</label>
        <div className="grid sm:grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const selected = audience === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={cn(
                  "text-left rounded-lg p-4 transition-all",
                  selected
                    ? "ring-2 ring-brand-700 bg-brand-50/50"
                    : "ring-1 ring-ink-200 hover:ring-brand-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "shrink-0 inline-flex h-8 w-8 rounded-md items-center justify-center",
                    selected ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-500"
                  )}>
                    {opt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn("font-medium", selected ? "text-brand-800" : "text-ink-800")}>
                        {opt.label}
                      </div>
                      <span className="text-xs text-ink-500">{audienceCounts[opt.value]}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">{opt.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md ring-1 ring-ink-200 bg-ink-50/50 p-4">
        <div className="text-sm font-medium text-ink-800 mb-3">Send via</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendInApp}
              onChange={(e) => setSendInApp(e.target.checked)}
            />
            In-app notification
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              disabled={!emailReady}
            />
            Email
            {!emailReady ? (
              <span className="text-xs text-amber-700">(SMTP not configured)</span>
            ) : null}
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-start gap-2">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Sent to <strong>{summary.recipientCount}</strong> recipient
            {summary.recipientCount === 1 ? "" : "s"}
            {summary.emailsSent > 0 ? ` · ${summary.emailsSent} email${summary.emailsSent === 1 ? "" : "s"} delivered` : ""}
            {summary.emailsFailed > 0 ? ` · ${summary.emailsFailed} failed` : ""}
            {summary.emailSkipped ? " · email skipped (no SMTP)" : ""}.
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-ink-100">
        <div className="text-xs text-ink-500">
          This will reach <strong>{count}</strong>{" "}
          {audience === "EXHIBITORS" ? "exhibitor" : audience === "SPEAKERS" ? "speaker" : "attendee"}
          {count === 1 ? "" : "s"}.
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Megaphone className="h-4 w-4" /> Send announcement
            </>
          )}
        </button>
      </div>
    </form>
  );
}
