import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tabId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tab = searchParams.tabId ?? "account";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
      </header>

      <SettingsClient
        slug={params.slug}
        current={tab}
        user={{ name: user.name, email: user.email, role: user.role }}
        initial={{
          showInDirectory: user.showInDirectory,
          allowConnectionRequests: user.allowConnectionRequests,
          language: user.language,
          timezone: user.timezone,
          notifySessionEmail: user.notifySessionEmail,
          notifySessionInApp: user.notifySessionInApp,
          notifyMessagesEmail: user.notifyMessagesEmail,
          notifyMessagesInApp: user.notifyMessagesInApp,
          notifyConnectionsEmail: user.notifyConnectionsEmail,
          notifyConnectionsInApp: user.notifyConnectionsInApp,
          notifyDiscussionsEmail: user.notifyDiscussionsEmail,
          notifyDiscussionsInApp: user.notifyDiscussionsInApp,
          notifyEventUpdatesEmail: user.notifyEventUpdatesEmail,
          notifyEventUpdatesInApp: user.notifyEventUpdatesInApp,
        }}
      />
    </div>
  );
}
