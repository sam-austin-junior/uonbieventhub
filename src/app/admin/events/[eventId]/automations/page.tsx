import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff, getOwnedEvent } from "@/lib/admin-scope";
import {
  AUTOMATION_TRIGGERS,
  TRIGGER_LABELS,
  TRIGGER_DEFAULTS,
  type AutomationTrigger,
} from "@/lib/automations";
import { AutomationsEditor } from "./AutomationsEditor";

export const dynamic = "force-dynamic";

export default async function AutomationsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await requireStaff();
  const event = await getOwnedEvent(session, params.eventId);
  if (!event) notFound();

  const existing = await prisma.emailAutomation.findMany({
    where: { eventId: event.id },
  });
  const byTrigger = new Map(existing.map((a) => [a.trigger, a]));

  const automations = AUTOMATION_TRIGGERS.map((t: AutomationTrigger) => {
    const row = byTrigger.get(t);
    return {
      trigger: t,
      label: TRIGGER_LABELS[t],
      enabled: row?.enabled ?? false,
      subject: row?.subject || TRIGGER_DEFAULTS[t].subject,
      body: row?.body || TRIGGER_DEFAULTS[t].body,
    };
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Email automations</h1>
        <p className="text-sm text-ink-500 mt-1">
          Triggered emails that fire automatically at key moments. Use the
          placeholders below — they're substituted at send time.
        </p>
        <div className="mt-3 inline-flex flex-wrap gap-1.5">
          {[
            "attendee_name",
            "event_name",
            "event_dates",
            "event_venue",
            "event_url",
            "requester_name",
            "recipient_name",
          ].map((v) => (
            <span
              key={v}
              className="text-[10px] font-mono bg-ink-100 text-ink-700 rounded px-1.5 py-0.5"
            >
              {"{{"}
              {v}
              {"}}"}
            </span>
          ))}
        </div>
      </header>

      <AutomationsEditor eventId={event.id} initial={automations} />
    </div>
  );
}
