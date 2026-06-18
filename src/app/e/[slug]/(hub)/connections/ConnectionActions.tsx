"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export function ConnectionActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function respond(status: "ACCEPTED" | "DECLINED") {
    setLoading(true);
    await fetch("/api/connections", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => respond("ACCEPTED")}
        disabled={loading}
        className="btn-primary px-3 py-1.5 text-xs"
      >
        <Check className="h-3.5 w-3.5" /> Accept
      </button>
      <button
        onClick={() => respond("DECLINED")}
        disabled={loading}
        className="btn-ghost px-3 py-1.5 text-xs"
      >
        <X className="h-3.5 w-3.5" /> Decline
      </button>
    </div>
  );
}
