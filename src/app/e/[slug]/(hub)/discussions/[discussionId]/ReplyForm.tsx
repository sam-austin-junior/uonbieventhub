"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReplyForm({ discussionId }: { discussionId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/discussions/${discussionId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setLoading(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        className="input"
      />
      <div className="flex justify-end">
        <button type="submit" disabled={loading || !body.trim()} className="btn-primary">
          {loading ? "Posting…" : "Reply"}
        </button>
      </div>
    </form>
  );
}
