"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/FileUpload";
import { Globe2, Lock, ArrowRight, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Invitee = { firstName: string; lastName: string; email: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseInviteeList(text: string): Invitee[] {
  const out: Invitee[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/[,\t;]+/).map((p) => p.trim());
    if (parts.length < 3) continue;
    const [firstName, lastName, email] = parts;
    if (!email || !/.+@.+\..+/.test(email)) continue;
    out.push({ firstName, lastName, email: email.toLowerCase() });
  }
  return out;
}

export default function NewEventPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    startDate: "",
    endDate: "",
    venue: "",
    coverImage: "",
    logoUrl: "",
    attendeeMode: "INVITE_ONLY" as "OPEN" | "INVITE_ONLY",
    inviteeText: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onFile(file: File) {
    const text = await file.text();
    update("inviteeText", form.inviteeText ? form.inviteeText + "\n" + text : text);
  }

  const invitees = parseInviteeList(form.inviteeText);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.attendeeMode === "INVITE_ONLY" && invitees.length === 0) {
      setError("For invite-only events, paste at least one attendee (First, Last, Email).");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        invitees: form.attendeeMode === "INVITE_ONLY" ? invitees : [],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create event");
      return;
    }
    const data = await res.json();
    router.push(`/admin/events/${data.event.id}?created=1`);
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-2">New event</h1>
      <p className="text-sm text-ink-500 mb-6">
        Once created, your event will live at a unique URL like
        <code className="font-mono mx-1 bg-ink-100 px-1 rounded">/e/{form.slug || "your-event-slug"}</code>
        — share that link with attendees.
      </p>
      <form onSubmit={onSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Event name</label>
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
            }}
            required
            className="input"
            placeholder="AfOx at 10 Celebrations"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">URL slug</label>
            <input
              value={form.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              required
              className="input font-mono text-xs"
              placeholder="afox10"
            />
            <p className="text-xs text-ink-400 mt-1">
              Lowercase letters, numbers and hyphens only. Must be unique.
            </p>
          </div>
          <div>
            <label className="label">Tagline</label>
            <input
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              className="input"
              placeholder="A short marketing line"
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            className="input"
            placeholder="What's the event about?"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Start date &amp; time</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">End date &amp; time</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              required
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label">Venue</label>
          <input
            value={form.venue}
            onChange={(e) => update("venue", e.target.value)}
            className="input"
            placeholder="Conference centre, address, or 'Online'"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FileUpload
            label="Event logo"
            kind="image"
            value={form.logoUrl || null}
            onChange={(url) => update("logoUrl", url ?? "")}
            hint="Square mark. Replaces the hub logo for your attendees."
          />
          <FileUpload
            label="Cover image"
            kind="image"
            value={form.coverImage || null}
            onChange={(url) => update("coverImage", url ?? "")}
            hint="Wide hero — also used as the activation page background."
          />
        </div>

        <div>
          <label className="label">Who can attend?</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <ModeOption
              selected={form.attendeeMode === "INVITE_ONLY"}
              onClick={() => update("attendeeMode", "INVITE_ONLY")}
              icon={<Lock className="h-5 w-5" />}
              title="Invite-only"
              body="You upload a list of attendees (name + email). Each receives a unique activation code."
            />
            <ModeOption
              selected={form.attendeeMode === "OPEN"}
              onClick={() => update("attendeeMode", "OPEN")}
              icon={<Globe2 className="h-5 w-5" />}
              title="Open registration"
              body="Anyone with the event URL can sign up. Best for public events."
            />
          </div>
        </div>

        {form.attendeeMode === "INVITE_ONLY" ? (
          <div className="rounded-md ring-1 ring-ink-200 p-4 bg-ink-50/50 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="label !mb-0">Attendee list</label>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-ink-500">{invitees.length} parsed</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" /> Upload CSV
                </button>
                {form.inviteeText ? (
                  <button
                    type="button"
                    onClick={() => update("inviteeText", "")}
                    className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                ) : null}
              </div>
            </div>
            <textarea
              value={form.inviteeText}
              onChange={(e) => update("inviteeText", e.target.value)}
              rows={6}
              className="input font-mono text-xs"
              placeholder={"First, Last, email@example.com\nBrenda, Kamau, brenda@example.com\nJames, Onyango, james@example.com"}
            />
            <p className="text-xs text-ink-400">
              One attendee per line: <code className="font-mono">First, Last, email</code> (CSV or
              tab-separated). Activation emails go out automatically when SMTP is configured —
              otherwise you can copy each activation link from the event page later.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating…" : <>Create event <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModeOption({
  selected,
  onClick,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg p-4 transition-all",
        selected ? "ring-2 ring-brand-700 bg-brand-50/50" : "ring-1 ring-ink-200 hover:ring-brand-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 inline-flex h-9 w-9 rounded-md items-center justify-center",
            selected ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-500"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("font-medium", selected ? "text-brand-800" : "text-ink-800")}>
            {title}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">{body}</div>
        </div>
      </div>
    </button>
  );
}
