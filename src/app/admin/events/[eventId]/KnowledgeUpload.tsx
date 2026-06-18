"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Knowledge = {
  fileName: string;
  fileType: string;
  charCount: number;
  updatedAt: string;
} | null;

export function KnowledgeUpload({
  eventId,
  initial,
  chatbotConfigured,
}: {
  eventId: string;
  initial: Knowledge;
  chatbotConfigured: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [kb, setKb] = useState<Knowledge>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    setSuccess(false);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/events/${eventId}/knowledge`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    setKb({
      fileName: data.knowledge.fileName,
      fileType: data.knowledge.fileType,
      charCount: data.knowledge.charCount,
      updatedAt: data.knowledge.updatedAt,
    });
    setSuccess(true);
    startTransition(() => router.refresh());
  }

  async function remove() {
    if (!confirm("Delete the uploaded document and reset the chatbot?")) return;
    await fetch(`/api/admin/events/${eventId}/knowledge`, { method: "DELETE" });
    setKb(null);
    startTransition(() => router.refresh());
  }

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-brand-700 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Event Assistant
          </div>
          <h2 className="mt-1 font-semibold text-ink-900">Chatbot knowledge base</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-2xl">
            Upload a single document (PDF, DOCX, TXT or MD) with everything an attendee
            might want to know about this event — schedule, venue, speaker bios, FAQs.
            The AI assistant on the event home page will answer questions from this
            document only.
          </p>
        </div>
      </div>

      {!chatbotConfigured ? (
        <div className="mt-4 rounded-md bg-amber-50 ring-1 ring-amber-100 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            The chatbot won't answer until <code className="font-mono">ANTHROPIC_API_KEY</code> is
            set in <code className="font-mono">.env</code>. You can still upload a document now
            — it'll activate as soon as the key is added.
          </div>
        </div>
      ) : null}

      {kb ? (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/50 p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-white ring-1 ring-brand-100 flex items-center justify-center text-brand-700">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink-900 truncate">{kb.fileName}</div>
            <div className="text-xs text-ink-500 mt-0.5">
              {kb.fileType.toUpperCase()} · {kb.charCount.toLocaleString()} characters ·
              uploaded {new Date(kb.updatedAt).toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-emerald-700 inline-flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Active
            </div>
          </div>
          <button
            onClick={remove}
            className="p-2 rounded text-red-600 hover:bg-red-50"
            aria-label="Remove document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing document…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {kb ? "Replace document" : "Upload event document"}
            </>
          )}
        </button>
        {success ? (
          <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Uploaded and activated
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 rounded-md bg-red-50 ring-1 ring-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-ink-400">
        Tip: replacing the document also clears all attendee chat histories so they start
        fresh with the new content.
      </p>
    </section>
  );
}
