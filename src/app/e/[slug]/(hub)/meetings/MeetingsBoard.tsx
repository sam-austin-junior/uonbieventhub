"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  Calendar,
  MapPin,
  Check,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";

type Person = {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
};

type Meeting = {
  id: string;
  requester: Person;
  recipient: Person;
  proposedStart: string;
  proposedEnd: string;
  status: string;
  location: string | null;
  message: string | null;
};

export function MeetingsBoard({
  meId,
  meetings,
  slug,
}: {
  meId: string;
  meetings: Meeting[];
  slug: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const incoming = meetings.filter((m) => m.recipient.id === meId && m.status === "pending");
  const outgoing = meetings.filter((m) => m.requester.id === meId && m.status === "pending");
  const upcoming = meetings.filter(
    (m) =>
      m.status === "accepted" && new Date(m.proposedEnd).getTime() > Date.now(),
  );
  const past = meetings.filter(
    (m) =>
      m.status === "accepted" && new Date(m.proposedEnd).getTime() <= Date.now(),
  );
  const archive = meetings.filter(
    (m) => m.status === "declined" || m.status === "cancelled",
  );

  async function respond(id: string, action: "accept" | "decline" | "cancel") {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/meetings/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not update meeting");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-md bg-red-50 ring-1 ring-red-100 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button onClick={() => setComposing(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Request a meeting
        </button>
      </div>

      {composing ? (
        <MeetingComposer
          slug={slug}
          onClose={() => setComposing(false)}
          onCreated={() => {
            setComposing(false);
            startTransition(() => router.refresh());
          }}
        />
      ) : null}

      <Section title="Incoming requests" count={incoming.length}>
        {incoming.length === 0 ? (
          <Empty text="Nothing waiting on you." />
        ) : (
          <ul className="space-y-3">
            {incoming.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                meId={meId}
                actions={[
                  {
                    label: "Accept",
                    icon: <Check className="h-3.5 w-3.5" />,
                    primary: true,
                    onClick: () => respond(m.id, "accept"),
                  },
                  {
                    label: "Decline",
                    icon: <X className="h-3.5 w-3.5" />,
                    onClick: () => respond(m.id, "decline"),
                  },
                ]}
                busy={busyId === m.id}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="You've requested" count={outgoing.length}>
        {outgoing.length === 0 ? (
          <Empty text="No outstanding requests." />
        ) : (
          <ul className="space-y-3">
            {outgoing.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                meId={meId}
                actions={[
                  {
                    label: "Cancel request",
                    onClick: () => respond(m.id, "cancel"),
                  },
                ]}
                busy={busyId === m.id}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Upcoming meetings" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty text="No accepted meetings yet." />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                meId={meId}
                actions={[
                  {
                    label: "Cancel",
                    onClick: () => respond(m.id, "cancel"),
                  },
                ]}
                busy={busyId === m.id}
              />
            ))}
          </ul>
        )}
      </Section>

      {past.length > 0 ? (
        <Section title="Past meetings" count={past.length}>
          <ul className="space-y-3">
            {past.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                meId={meId}
                actions={[]}
                busy={false}
                muted
              />
            ))}
          </ul>
        </Section>
      ) : null}

      {archive.length > 0 ? (
        <Section title="Cancelled / declined" count={archive.length}>
          <ul className="space-y-3">
            {archive.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                meId={meId}
                actions={[]}
                busy={false}
                muted
              />
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold mb-3">
        {title} ({count})
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-ink-50/40 border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
      {text}
    </div>
  );
}

function MeetingCard({
  meeting,
  meId,
  actions,
  busy,
  muted,
}: {
  meeting: Meeting;
  meId: string;
  actions: { label: string; icon?: React.ReactNode; primary?: boolean; onClick: () => void }[];
  busy: boolean;
  muted?: boolean;
}) {
  const other =
    meeting.requester.id === meId ? meeting.recipient : meeting.requester;
  const directionLabel =
    meeting.requester.id === meId ? "You requested" : "Requested by";
  const fromTime = new Date(meeting.proposedStart);
  const toTime = new Date(meeting.proposedEnd);
  return (
    <li className={`card p-5 ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4 flex-wrap">
        <Avatar name={other.name} src={other.avatarUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink-900">{other.name}</div>
          {other.jobTitle ? (
            <div className="text-xs text-ink-500">{other.jobTitle}</div>
          ) : null}
          <div className="mt-2 text-xs text-ink-600 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {fromTime.toLocaleString()} – {toTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {meeting.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {meeting.location}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] text-ink-400">
            {directionLabel} ·{" "}
            <span className="capitalize">{meeting.status}</span>
          </div>
          {meeting.message ? (
            <p className="mt-3 text-sm text-ink-700">"{meeting.message}"</p>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 ml-auto">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                disabled={busy}
                className={
                  a.primary
                    ? "inline-flex items-center gap-1 rounded-full bg-ink-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-ink-800 transition disabled:opacity-50"
                    : "inline-flex items-center gap-1 rounded-full bg-white text-ink-700 ring-1 ring-ink-200 px-3 py-1.5 text-xs font-medium hover:bg-ink-50 transition disabled:opacity-50"
                }
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.icon}
                {a.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function MeetingComposer({
  slug,
  onClose,
  onCreated,
}: {
  slug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; jobTitle: string | null; avatarUrl: string | null }[]
  >([]);
  const [recipient, setRecipient] = useState<
    { id: string; name: string } | null
  >(null);
  const [searching, setSearching] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(
      `/api/e/${slug}/attendees/search?q=${encodeURIComponent(query)}`,
      { cache: "no-store" },
    );
    setSearching(false);
    if (res.ok) {
      const data = await res.json();
      setResults(data.attendees ?? []);
    }
  }

  async function submit() {
    setErr(null);
    if (!recipient) {
      setErr("Pick someone to meet");
      return;
    }
    if (!start || !end) {
      setErr("Pick a start and end time");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/e/${slug}/meetings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipientId: recipient.id,
        proposedStart: new Date(start).toISOString(),
        proposedEnd: new Date(end).toISOString(),
        location: location || null,
        message: message || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Could not send request");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-pop max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink-900">Request a meeting</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!recipient ? (
            <>
              <div>
                <label className="label">Find an attendee</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name or organisation…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        search();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={search}
                    disabled={searching || !query.trim()}
                    className="btn-secondary"
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setRecipient(r)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-50"
                    >
                      <Avatar name={r.name} src={r.avatarUrl} size={32} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-900">{r.name}</div>
                        {r.jobTitle ? (
                          <div className="text-xs text-ink-500">{r.jobTitle}</div>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
                {!searching && query && results.length === 0 ? (
                  <li className="text-xs text-ink-500 px-3 py-2">
                    No attendees matched.
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-ink-50 ring-1 ring-ink-100 px-3 py-2 text-sm flex items-center justify-between">
                <span>
                  Meeting with <strong>{recipient.name}</strong>
                </span>
                <button
                  onClick={() => setRecipient(null)}
                  className="text-xs text-brand-700 hover:underline"
                >
                  Change
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Start</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Where (optional)</label>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Booth 12 / Cafe / Zoom"
                />
              </div>
              <div>
                <label className="label">Message (optional)</label>
                <textarea
                  className="input min-h-[80px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  placeholder="What would you like to discuss?"
                />
              </div>
              {err ? (
                <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {err}
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          {recipient ? (
            <button
              onClick={submit}
              disabled={submitting || !start || !end}
              className="btn-primary"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send request"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
