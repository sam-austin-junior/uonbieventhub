import { prisma } from "./prisma";
import { sendEmail, emailTemplate, appUrl, isEmailConfigured } from "./email";

/**
 * Trigger codes for per-event email automations. Each one corresponds to
 * a specific moment in the attendee lifecycle; organizers enable the
 * ones they want and customise subject/body.
 */
export const AUTOMATION_TRIGGERS = [
  "registration.confirmation",
  "registration.checked_in",
  "ticket.purchased",
  "waitlist.joined",
  "meeting.requested",
  "meeting.accepted",
] as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  "registration.confirmation": "Sent right after someone registers",
  "registration.checked_in": "Sent when an attendee is checked in at the door",
  "ticket.purchased": "Sent when a paid ticket purchase completes",
  "waitlist.joined": "Sent when an attendee joins the waitlist",
  "meeting.requested": "Sent to the recipient when someone requests a meeting",
  "meeting.accepted": "Sent to the requester when their meeting is accepted",
};

export const TRIGGER_DEFAULTS: Record<AutomationTrigger, { subject: string; body: string }> = {
  "registration.confirmation": {
    subject: "You're registered for {{event_name}}",
    body: `Hi {{attendee_name}},\n\nYou're confirmed for {{event_name}} ({{event_dates}}). We'll see you at {{event_venue}}.\n\nManage your event from {{event_url}}.`,
  },
  "registration.checked_in": {
    subject: "Welcome to {{event_name}}",
    body: `Hi {{attendee_name}},\n\nYou're checked in. Have a great event — your full programme is at {{event_url}}.`,
  },
  "ticket.purchased": {
    subject: "Your ticket to {{event_name}}",
    body: `Hi {{attendee_name}},\n\nThanks for your purchase. Your seat at {{event_name}} is confirmed for {{event_dates}}.\n\n{{event_url}}`,
  },
  "waitlist.joined": {
    subject: "You're on the waitlist for {{event_name}}",
    body: `Hi {{attendee_name}},\n\nYou're on the waitlist for {{event_name}}. We'll email you as soon as a seat opens up.`,
  },
  "meeting.requested": {
    subject: "New meeting request at {{event_name}}",
    body: `Hi {{attendee_name}},\n\n{{requester_name}} would like to meet with you at {{event_name}}. Review the request at {{event_url}}/meetings.`,
  },
  "meeting.accepted": {
    subject: "{{recipient_name}} accepted your meeting",
    body: `Hi {{attendee_name}},\n\n{{recipient_name}} accepted your meeting request at {{event_name}}. See your schedule at {{event_url}}/meetings.`,
  },
};

type Vars = Record<string, string | undefined>;

function render(template: string, vars: Vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? "");
}

/**
 * Look up an enabled automation for the given trigger and dispatch a
 * single email if one is configured. Best-effort: returns silently on
 * any failure so it doesn't block the user flow that triggered it.
 */
export async function triggerAutomation(
  trigger: AutomationTrigger,
  eventId: string,
  toEmail: string,
  vars: Vars,
) {
  try {
    if (!(await isEmailConfigured())) return;
    const automation = await prisma.emailAutomation.findUnique({
      where: { eventId_trigger: { eventId, trigger } },
    });
    if (!automation || !automation.enabled) return;

    const subject = render(automation.subject, vars);
    const bodyText = render(automation.body, vars);
    const bodyHtml = bodyText
      .split(/\n+/)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");

    await sendEmail({
      to: toEmail,
      subject,
      html: emailTemplate({
        heading: subject,
        body: bodyHtml,
        cta: vars.event_url
          ? { label: `Open ${vars.event_name ?? "event"}`, href: vars.event_url }
          : undefined,
      }),
    });
  } catch {
    // soft-fail
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Build the common variable bag from an event row. */
export function eventVars(event: {
  slug: string;
  name: string;
  startDate: Date;
  endDate: Date;
  venue: string | null;
}): Vars {
  return {
    event_name: event.name,
    event_dates: `${event.startDate.toLocaleDateString()} – ${event.endDate.toLocaleDateString()}`,
    event_venue: event.venue ?? "",
    event_url: `${appUrl}/e/${event.slug}`,
  };
}
