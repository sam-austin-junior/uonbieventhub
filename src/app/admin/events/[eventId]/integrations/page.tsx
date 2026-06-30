import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";
import { WebhooksEditor } from "./WebhooksEditor";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const webhooks = await prisma.webhook.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Integrations</h1>
        <p className="text-sm text-ink-500 mt-1">
          Outbound webhooks let you mirror this event's activity into HubSpot,
          Salesforce, Pipedrive, Zapier, n8n or any HTTP endpoint. Every
          delivery is signed with HMAC-SHA256 in the{" "}
          <code className="font-mono text-xs">x-uon-signature</code> header.
        </p>
      </header>

      <WebhooksEditor
        eventId={event.id}
        availableEvents={WEBHOOK_EVENTS as unknown as string[]}
        initialWebhooks={webhooks.map((w) => ({
          id: w.id,
          url: w.url,
          events: w.events.split(",").map((s) => s.trim()),
          active: w.active,
          lastDeliveredAt: w.lastDeliveredAt?.toISOString() ?? null,
          lastError: w.lastError,
        }))}
      />
    </div>
  );
}
