"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDiscussionForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, title, body }),
    });
    setLoading(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        Start a discussion
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="What's on your mind?"
        className="input font-medium"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        placeholder="Share more details…"
        className="input"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
