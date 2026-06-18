"use client";
import { useState } from "react";
import { UserPlus, Check } from "lucide-react";

export function ConnectButton({ receiverId }: { receiverId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  async function onClick() {
    if (state !== "idle") return;
    setState("loading");
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });
    setState(res.ok ? "sent" : "idle");
  }

  if (state === "sent") {
    return (
      <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
        <Check className="h-3 w-3" /> Request sent
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={state === "loading"}
      className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
    >
      <UserPlus className="h-3 w-3" /> {state === "loading" ? "…" : "Connect"}
    </button>
  );
}
