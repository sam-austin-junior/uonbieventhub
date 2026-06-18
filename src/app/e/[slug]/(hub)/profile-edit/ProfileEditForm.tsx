"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { FileUpload } from "@/components/ui/FileUpload";

type FormState = {
  name: string;
  jobTitle: string | null;
  organization: string | null;
  bio: string | null;
  avatarUrl: string | null;
  faculty: string | null;
  studentId: string | null;
  phone: string | null;
  showInDirectory: boolean;
};

export function ProfileEditForm({ initial }: { initial: FormState }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-6">
          <Avatar name={form.name} src={form.avatarUrl} size={72} />
          <div className="flex-1">
            <FileUpload
              label="Profile photo"
              kind="image"
              value={form.avatarUrl}
              onChange={(url) => update("avatarUrl", url)}
              hint="Square image works best — at least 256×256px."
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Job title / role</label>
            <input
              value={form.jobTitle ?? ""}
              onChange={(e) => update("jobTitle", e.target.value || null)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Organization</label>
            <input
              value={form.organization ?? ""}
              onChange={(e) => update("organization", e.target.value || null)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Faculty / School</label>
            <input
              value={form.faculty ?? ""}
              onChange={(e) => update("faculty", e.target.value || null)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Student / Staff ID</label>
            <input
              value={form.studentId ?? ""}
              onChange={(e) => update("studentId", e.target.value || null)}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Phone</label>
            <input
              value={form.phone ?? ""}
              onChange={(e) => update("phone", e.target.value || null)}
              className="input"
              placeholder="+254 …"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea
              value={form.bio ?? ""}
              onChange={(e) => update("bio", e.target.value || null)}
              rows={4}
              className="input"
              placeholder="A short bio for your attendee directory profile."
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium text-ink-900">Show me in the attendee directory</div>
            <div className="text-sm text-ink-500">
              Other attendees can find you and start a conversation.
            </div>
          </div>
          <input
            type="checkbox"
            checked={form.showInDirectory}
            onChange={(e) => update("showInDirectory", e.target.checked)}
            className="h-5 w-5"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-sm text-emerald-700">Saved</span> : null}
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
