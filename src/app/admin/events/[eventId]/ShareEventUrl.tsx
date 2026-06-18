"use client";
import { useState } from "react";
import { Copy, CheckCircle, ExternalLink, Link as LinkIcon } from "lucide-react";

export function ShareEventUrl({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/e/${slug}` : `/e/${slug}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg bg-brand-50 ring-1 ring-brand-100 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-700 font-semibold mb-2">
        <LinkIcon className="h-3.5 w-3.5" /> Attendee URL
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-0 font-mono text-sm bg-white border border-brand-200 rounded-md px-3 py-2 truncate">
          {url}
        </code>
        <button onClick={copy} className="btn-secondary">
          {copied ? <><CheckCircle className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
        <a href={`/e/${slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
          <ExternalLink className="h-4 w-4" /> Preview
        </a>
      </div>
      <p className="text-xs text-brand-700/80 mt-2">
        Share this link with your attendees. They never see the parent hub branding — only your event.
      </p>
    </div>
  );
}
