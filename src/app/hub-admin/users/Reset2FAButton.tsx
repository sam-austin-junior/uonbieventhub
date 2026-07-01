"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff, Loader2 } from "lucide-react";

export function Reset2FAButton({
  userId,
  userEmail,
  enabled,
}: {
  userId: string;
  userEmail: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (
      !confirm(
        `Reset 2FA for ${userEmail}? They'll be able to sign in with just their password afterwards.`,
      )
    )
      return;
    setBusy(true);
    const res = await fetch(`/api/hub-admin/users/${userId}/reset-2fa`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Could not reset 2FA");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={reset}
      disabled={busy}
      title={enabled ? "Reset 2FA (account recovery)" : "Clear stale 2FA secret"}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
    </button>
  );
}
