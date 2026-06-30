"use client";
import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

export function SpeakerSessionCard({
  sessionId,
  title,
  startTime,
  endTime,
  location,
  slidesUrl,
  notesUrl,
  attendeeCount,
}: {
  sessionId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  slidesUrl: string | null;
  notesUrl: string | null;
  attendeeCount: number;
}) {
  const [slides, setSlides] = useState(slidesUrl ?? "");
  const [notes, setNotes] = useState(notesUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setInfo(null);
    setSaving(true);
    const res = await fetch(`/api/speaker/sessions/${sessionId}/materials`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slidesUrl: slides || null,
        notesUrl: notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setInfo("Materials updated.");
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-semibold text-ink-900">{title}</h4>
          <div className="mt-1 text-xs text-ink-500 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(startTime).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {attendeeCount} registered
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Slides URL</label>
          <input
            type="url"
            className="input"
            value={slides}
            onChange={(e) => setSlides(e.target.value)}
            placeholder="https://docs.google.com/..."
          />
        </div>
        <div>
          <label className="label text-xs">Notes / handout URL</label>
          <input
            type="url"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs">
          {error ? (
            <span className="text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
          ) : info ? (
            <span className="text-emerald-700 inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {info}
            </span>
          ) : (
            <span className="text-ink-500 inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Attendees see these on the session page.
            </span>
          )}
        </div>
        <button onClick={save} disabled={saving} className="btn-secondary text-sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </button>
      </div>
    </div>
  );
}
