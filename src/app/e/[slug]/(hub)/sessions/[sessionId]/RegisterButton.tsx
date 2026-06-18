"use client";
import { useState } from "react";

export function SessionRegisterButton({
  sessionId,
  initialRegistered,
}: {
  sessionId: string;
  initialRegistered: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/sessions/${sessionId}/register`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setRegistered(data.registered);
    }
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading} className={registered ? "btn-secondary" : "btn-primary"}>
      {loading ? "…" : registered ? "Remove from my schedule" : "Add to my schedule"}
    </button>
  );
}
