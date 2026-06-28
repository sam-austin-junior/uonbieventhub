"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Trash2 } from "lucide-react";

export function DeleteEventButton({
  eventId,
  eventName,
  eventSlug,
}: {
  eventId: string;
  eventName: string;
  eventSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete event");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label={`Delete ${eventName}`}
        title="Delete event"
        disabled={pending}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={`Delete "${eventName}"?`}
        body={`This permanently removes the event at /e/${eventSlug} and all its sessions, speakers, exhibitors, registrations, discussions and survey responses. This cannot be undone.`}
        confirmLabel={pending ? "Deleting…" : "Delete event"}
      />
      {error ? (
        <div className="fixed bottom-4 right-4 rounded-md bg-red-50 ring-1 ring-red-200 text-red-700 px-3 py-2 text-sm shadow-pop z-50">
          {error}
        </div>
      ) : null}
    </>
  );
}
