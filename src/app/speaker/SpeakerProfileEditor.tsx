"use client";
import { useState } from "react";
import { Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";

export function SpeakerProfileEditor({
  speakerId,
  initialName,
  initialJobTitle,
  initialOrganization,
  initialBio,
  initialPhotoUrl,
  initialLinkedinUrl,
  initialTwitterUrl,
}: {
  speakerId: string;
  initialName: string;
  initialJobTitle: string | null;
  initialOrganization: string | null;
  initialBio: string | null;
  initialPhotoUrl: string | null;
  initialLinkedinUrl: string | null;
  initialTwitterUrl: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [organization, setOrganization] = useState(initialOrganization ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialLinkedinUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(initialTwitterUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    const res = await fetch(`/api/speaker/profile/${speakerId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        jobTitle: jobTitle || null,
        organization: organization || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setInfo("Profile saved.");
  }

  return (
    <form onSubmit={save} className="card p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Display name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Job title</label>
          <input
            className="input"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Organisation</label>
        <input
          className="input"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Photo URL</label>
        <input
          type="url"
          className="input"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="label">Short bio</label>
        <textarea
          className="input min-h-[100px]"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">LinkedIn URL</label>
          <input
            type="url"
            className="input"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Twitter / X URL</label>
          <input
            type="url"
            className="input"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="text-xs text-red-600 inline-flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="text-xs text-emerald-700 inline-flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          {info}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </button>
      </div>
    </form>
  );
}
