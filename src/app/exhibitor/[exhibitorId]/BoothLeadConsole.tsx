"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Type,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Star,
  StarOff,
  StickyNote,
} from "lucide-react";

type LeadAttendee = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  organization: string | null;
};

type Lead = {
  id: string;
  notes: string | null;
  qualified: boolean;
  createdAt: string;
  attendee: LeadAttendee;
};

export function BoothLeadConsole({
  exhibitorId,
  initialLeads,
}: {
  exhibitorId: string;
  initialLeads: Lead[];
}) {
  const containerId = "booth-qr-region";
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<
    { ok: true; lead: Lead } | { ok: false; error: string } | null
  >(null);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const lastScannedRef = useRef<string>("");
  const lastScannedAtRef = useRef<number>(0);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        scannerRef.current?.stop?.();
      } catch {}
    };
  }, []);

  async function start() {
    setLastResult(null);
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decodedText: string) => {
        const now = Date.now();
        if (
          decodedText === lastScannedRef.current &&
          now - lastScannedAtRef.current < 3000
        )
          return;
        lastScannedRef.current = decodedText;
        lastScannedAtRef.current = now;
        await capture(decodedText);
      },
      () => {},
    );
  }

  async function stop() {
    try {
      await scannerRef.current?.stop?.();
    } catch {}
    setScanning(false);
  }

  async function capture(qrToken: string) {
    setBusy(true);
    const res = await fetch("/api/exhibitor/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ exhibitorId, qrToken }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setLastResult({ ok: false, error: data.error ?? "Capture failed" });
      return;
    }
    const lead: Lead = {
      id: data.lead.id,
      notes: null,
      qualified: false,
      createdAt: data.lead.capturedAt,
      attendee: data.lead.attendee,
    };
    setLastResult({ ok: true, lead });
    setLeads((prev) => {
      const without = prev.filter((p) => p.id !== lead.id);
      return [lead, ...without];
    });
  }

  async function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await capture(manualCode.trim());
    setManualCode("");
  }

  async function patchLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
    await fetch(`/api/exhibitor/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        notes: patch.notes,
        qualified: patch.qualified,
      }),
    });
  }

  async function removeLead(id: string) {
    if (!confirm("Remove this lead?")) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/exhibitor/leads/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
              <Camera className="h-4 w-4" /> Scan a badge
            </h2>
            {scanning ? (
              <button onClick={stop} className="btn-ghost px-3 py-1 text-xs">
                Stop
              </button>
            ) : (
              <button onClick={start} className="btn-primary px-3 py-1.5 text-xs">
                Start
              </button>
            )}
          </div>
          <div
            id={containerId}
            className="rounded-md overflow-hidden bg-ink-100 aspect-square mb-3"
          />
          {busy ? (
            <div className="text-sm text-ink-500 inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Capturing…
            </div>
          ) : null}
          {lastResult ? (
            lastResult.ok ? (
              <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-100 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Captured {lastResult.lead.attendee.name}
              </div>
            ) : (
              <div className="rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700 inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {lastResult.error}
              </div>
            )
          ) : null}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2 mb-3">
            <Type className="h-4 w-4" /> Manual entry
          </h2>
          <p className="text-xs text-ink-500 mb-3">
            Type or paste an attendee's QR token if the camera isn't available.
          </p>
          <form onSubmit={manualSubmit} className="flex gap-2">
            <input
              className="input font-mono text-sm"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="qr-token..."
            />
            <button type="submit" className="btn-primary">
              Capture
            </button>
          </form>
        </section>
      </div>

      <section>
        <h2 className="font-semibold text-ink-900 mb-3">
          Leads ({leads.length})
        </h2>
        {leads.length === 0 ? (
          <div className="card p-6 text-sm text-ink-500 text-center">
            No leads yet. Start scanning badges above.
          </div>
        ) : (
          <ul className="space-y-2">
            {leads.map((l) => (
              <LeadRow
                key={l.id}
                lead={l}
                onUpdate={(patch) => patchLead(l.id, patch)}
                onDelete={() => removeLead(l.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LeadRow({
  lead,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  onUpdate: (patch: Partial<Lead>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);

  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink-900">{lead.attendee.name}</div>
          <div className="text-xs text-ink-500">
            {lead.attendee.email}
            {lead.attendee.jobTitle ? ` · ${lead.attendee.jobTitle}` : ""}
            {lead.attendee.organization
              ? ` · ${lead.attendee.organization}`
              : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onUpdate({ qualified: !lead.qualified })}
            className={`inline-flex items-center gap-1 text-xs ${
              lead.qualified ? "text-amber-700" : "text-ink-500"
            } hover:underline`}
            title={lead.qualified ? "Unmark qualified" : "Mark qualified"}
          >
            {lead.qualified ? (
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            ) : (
              <StarOff className="h-3.5 w-3.5" />
            )}
            {lead.qualified ? "Qualified" : "Mark qualified"}
          </button>
          <button
            onClick={() => setEditingNotes((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-ink-500 hover:underline"
          >
            <StickyNote className="h-3.5 w-3.5" />
            {lead.notes || editingNotes ? "Edit notes" : "Add notes"}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
            title="Remove lead"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {editingNotes || lead.notes ? (
        <div className="mt-3">
          <textarea
            className="input min-h-[60px] text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conversation notes…"
            maxLength={500}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                onUpdate({ notes: notes.trim() || null });
                setEditingNotes(false);
              }}
              className="btn-secondary text-xs"
            >
              Save notes
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
