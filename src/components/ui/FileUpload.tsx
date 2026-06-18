"use client";
import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "image" | "video" | "document";

const ACCEPT: Record<Kind, string> = {
  image: "image/png,image/jpeg,image/webp,image/svg+xml,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  document: ".pdf,.docx,.doc,.txt,.md",
};

const MAX_MB: Record<Kind, number> = {
  image: 5,
  video: 100,
  document: 10,
};

export function FileUpload({
  value,
  onChange,
  kind = "image",
  label,
  hint,
  allowUrl = true,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  kind?: Kind;
  label?: string;
  hint?: string;
  allowUrl?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">(value && /^https?:/i.test(value) ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }

  function onFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    upload(f);
  }

  const isImage = kind === "image";
  const isVideo = kind === "video";
  const showPreview = !!value;
  const isExternal = value && /^https?:/i.test(value);

  return (
    <div>
      {label ? <label className="label">{label}</label> : null}

      {allowUrl ? (
        <div className="mb-2 inline-flex rounded-md ring-1 ring-ink-200 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-3 py-1 rounded inline-flex items-center gap-1",
              mode === "upload" ? "bg-brand-700 text-white" : "text-ink-600 hover:text-ink-900"
            )}
          >
            <Upload className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-3 py-1 rounded inline-flex items-center gap-1",
              mode === "url" ? "bg-brand-700 text-white" : "text-ink-600 hover:text-ink-900"
            )}
          >
            <Link2 className="h-3 w-3" /> Paste URL
          </button>
        </div>
      ) : null}

      {mode === "upload" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "relative rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors",
            dragging
              ? "border-brand-500 bg-brand-50"
              : "border-ink-200 hover:border-brand-400 bg-ink-50/50"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT[kind]}
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />

          {showPreview ? (
            <div className="flex items-center gap-4">
              {isImage ? (
                <img
                  src={value}
                  alt="preview"
                  className="h-20 w-20 rounded-md object-cover ring-1 ring-ink-100 bg-white"
                />
              ) : isVideo ? (
                <video src={value} className="h-20 w-32 rounded-md bg-black object-cover" muted />
              ) : (
                <FileText className="h-12 w-12 text-brand-700" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-800 truncate">
                  {isExternal ? value : value.split("/").pop()}
                </div>
                <div className="text-xs text-emerald-700 inline-flex items-center gap-1 mt-0.5">
                  <CheckCircle className="h-3 w-3" />
                  Uploaded
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="p-1 rounded hover:bg-ink-100 text-ink-500"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center py-4 text-sm text-ink-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="mt-2">Uploading…</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center text-sm text-ink-500">
              <Upload className="h-5 w-5 text-ink-400" />
              <div className="mt-2">
                <span className="text-brand-700 font-medium">Click to choose a file</span> or drag &amp; drop here
              </div>
              <div className="text-xs text-ink-400 mt-1">
                {kind === "image" && "PNG, JPG, WebP, SVG, GIF · "}
                {kind === "video" && "MP4, WebM, MOV · "}
                {kind === "document" && "PDF, DOCX, TXT, MD · "}
                up to {MAX_MB[kind]} MB
              </div>
            </div>
          )}
        </div>
      ) : (
        <input
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://…"
          className="input"
        />
      )}

      {hint ? <p className="text-xs text-ink-400 mt-1">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}
