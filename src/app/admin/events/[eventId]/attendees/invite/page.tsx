import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { InviteClient } from "./InviteClient";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default async function InviteAttendeesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) notFound();

  const invites = await prisma.attendeeInvite.findMany({
    where: { eventId: event.id },
    orderBy: { invitedAt: "desc" },
  });
  const emailReady = await isEmailConfigured();

  const activated = invites.filter((i) => i.activatedAt).length;
  const sent = invites.filter((i) => i.emailSentAt).length;

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/admin/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Manage attendee invites</h1>
        <p className="text-sm text-ink-500 mt-1">
          Each invitee can activate their account from <code className="font-mono">/e/{event.slug}/login</code>{" "}
          by entering their first name, last name, email, and the 6-digit code sent to their inbox.
        </p>
      </header>

      {!emailReady ? (
        <div className="mb-6 rounded-md bg-amber-50 ring-1 ring-amber-100 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            SMTP isn't configured yet, so activation codes will be returned on screen during
            development instead of emailed. The hub admin can set SMTP up at{" "}
            <strong>Hub admin → Platform settings → Email</strong>.
          </div>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Kpi label="Invited" value={invites.length} />
        <Kpi label="Emails sent" value={sent} />
        <Kpi label="Activated" value={activated} />
      </div>

      <InviteClient
        eventId={event.id}
        invites={invites.map((i) => ({
          id: i.id,
          firstName: i.firstName,
          lastName: i.lastName,
          email: i.email,
          invitedAt: i.invitedAt.toISOString(),
          activatedAt: i.activatedAt?.toISOString() ?? null,
          emailSentAt: i.emailSentAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-900">{value}</div>
    </div>
  );
}
