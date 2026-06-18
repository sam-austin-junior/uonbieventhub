"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Prefs = {
  showInDirectory: boolean;
  allowConnectionRequests: boolean;
  language: string;
  timezone: string;
  notifySessionEmail: boolean;
  notifySessionInApp: boolean;
  notifyMessagesEmail: boolean;
  notifyMessagesInApp: boolean;
  notifyConnectionsEmail: boolean;
  notifyConnectionsInApp: boolean;
  notifyDiscussionsEmail: boolean;
  notifyDiscussionsInApp: boolean;
  notifyEventUpdatesEmail: boolean;
  notifyEventUpdatesInApp: boolean;
};

const TABS = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "languageAndTime", label: "Language & Time" },
  { id: "privacy", label: "Privacy" },
] as const;

export function SettingsClient({
  slug,
  current,
  user,
  initial,
}: {
  slug: string;
  current: string;
  user: { name: string; email: string; role: string };
  initial: Prefs;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  async function update<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    setSaving(true);
    setSavedKey(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [k]: v }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedKey(String(k));
      setTimeout(() => setSavedKey((s) => (s === String(k) ? null : s)), 1500);
      router.refresh();
    } else {
      setPrefs(prefs);
    }
  }

  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-6">
      <nav className="space-y-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/e/${slug}/settings?tabId=${t.id}`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm",
              current === t.id
                ? "bg-brand-50 text-brand-800 font-medium"
                : "text-ink-600 hover:bg-ink-100"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="card p-6">
        {current === "account" ? (
          <AccountTab user={user} slug={slug} />
        ) : current === "notifications" ? (
          <NotificationsTab prefs={prefs} update={update} savedKey={savedKey} />
        ) : current === "languageAndTime" ? (
          <LanguageTab prefs={prefs} update={update} savedKey={savedKey} />
        ) : current === "privacy" ? (
          <PrivacyTab prefs={prefs} update={update} savedKey={savedKey} />
        ) : (
          <AccountTab user={user} slug={slug} />
        )}
        {saving ? (
          <div className="mt-4 text-xs text-ink-400">Saving…</div>
        ) : null}
      </div>
    </div>
  );
}

function AccountTab({
  user,
  slug,
}: {
  user: { name: string; email: string; role: string };
  slug: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">Account</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <Field label="Name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Role" value={user.role.toLowerCase()} />
      </div>
      <p className="text-sm text-ink-500">
        Update your personal details on the{" "}
        <Link href={`/e/${slug}/profile-edit`} className="text-brand-700 hover:underline">
          My Profile
        </Link>{" "}
        page.
      </p>
    </div>
  );
}

function NotificationsTab({
  prefs,
  update,
  savedKey,
}: {
  prefs: Prefs;
  update: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  savedKey: string | null;
}) {
  const channels: { label: string; desc: string; emailKey: keyof Prefs; appKey: keyof Prefs }[] = [
    {
      label: "Session reminders",
      desc: "30 minutes before sessions on my schedule begin",
      emailKey: "notifySessionEmail",
      appKey: "notifySessionInApp",
    },
    {
      label: "New messages",
      desc: "When another attendee sends you a direct message",
      emailKey: "notifyMessagesEmail",
      appKey: "notifyMessagesInApp",
    },
    {
      label: "Connection requests",
      desc: "When someone wants to connect with you",
      emailKey: "notifyConnectionsEmail",
      appKey: "notifyConnectionsInApp",
    },
    {
      label: "Replies on discussions you posted",
      desc: "Stay on top of conversations you started",
      emailKey: "notifyDiscussionsEmail",
      appKey: "notifyDiscussionsInApp",
    },
    {
      label: "Event announcements",
      desc: "Organizer broadcasts and programme changes",
      emailKey: "notifyEventUpdatesEmail",
      appKey: "notifyEventUpdatesInApp",
    },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">Notifications</h2>
      <p className="text-sm text-ink-500">
        Choose what we send you. Changes save automatically.
      </p>
      <div className="divide-y divide-ink-100">
        {channels.map((c) => (
          <div key={c.label} className="flex items-center justify-between py-3">
            <div className="min-w-0 pr-4">
              <div className="font-medium text-ink-800">{c.label}</div>
              <div className="text-sm text-ink-500">{c.desc}</div>
            </div>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <ToggleLabel
                label="Email"
                checked={prefs[c.emailKey] as boolean}
                onChange={(v) => update(c.emailKey, v as any)}
                flash={savedKey === c.emailKey}
              />
              <ToggleLabel
                label="In-app"
                checked={prefs[c.appKey] as boolean}
                onChange={(v) => update(c.appKey, v as any)}
                flash={savedKey === c.appKey}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanguageTab({
  prefs,
  update,
  savedKey,
}: {
  prefs: Prefs;
  update: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  savedKey: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">Language & Time</h2>
      <div>
        <label className="label">
          Display language
          {savedKey === "language" ? <SavedFlag /> : null}
        </label>
        <select
          value={prefs.language}
          onChange={(e) => update("language", e.target.value)}
          className="input max-w-xs"
        >
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
          <option value="fr">Français</option>
        </select>
      </div>
      <div>
        <label className="label">
          Time zone
          {savedKey === "timezone" ? <SavedFlag /> : null}
        </label>
        <select
          value={prefs.timezone}
          onChange={(e) => update("timezone", e.target.value)}
          className="input max-w-xs"
        >
          <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
          <option value="UTC">UTC</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New_York</option>
        </select>
      </div>
      <p className="text-xs text-ink-500">
        Session times will display in your chosen time zone.
      </p>
    </div>
  );
}

function PrivacyTab({
  prefs,
  update,
  savedKey,
}: {
  prefs: Prefs;
  update: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  savedKey: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">Privacy</h2>
      <SwitchRow
        title="Show me in the attendee directory"
        body="When off, other attendees can't find or message you."
        checked={prefs.showInDirectory}
        onChange={(v) => update("showInDirectory", v)}
        flash={savedKey === "showInDirectory"}
      />
      <SwitchRow
        title="Allow connection requests"
        body="Other attendees can request to connect with you."
        checked={prefs.allowConnectionRequests}
        onChange={(v) => update("allowConnectionRequests", v)}
        flash={savedKey === "allowConnectionRequests"}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 font-medium text-ink-800 capitalize">{value}</div>
    </div>
  );
}

function ToggleLabel({
  label,
  checked,
  onChange,
  flash,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  flash: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span className={flash ? "text-emerald-700" : "text-ink-600"}>{label}</span>
    </label>
  );
}

function SwitchRow({
  title,
  body,
  checked,
  onChange,
  flash,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  flash: boolean;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <div>
        <div className="font-medium text-ink-800">
          {title}
          {flash ? <SavedFlag /> : null}
        </div>
        <div className="text-sm text-ink-500">{body}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}

function SavedFlag() {
  return <span className="ml-2 text-xs text-emerald-700">Saved</span>;
}
