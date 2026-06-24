/**
 * Minimal .ics (iCalendar) generator. No external lib — just enough of RFC 5545
 * for Google / Outlook / Apple Calendar to import what we throw at it.
 */

export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function utc(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escape(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold lines at 75 octets as RFC 5545 requires. */
function fold(line: string) {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i + 75));
    i += 75;
  }
  return out.join("\r\n");
}

export function buildIcs({
  prodId = "-//UoN Event Hub//Calendar//EN",
  events,
}: {
  prodId?: string;
  events: IcsEvent[];
}): string {
  const stamp = utc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${utc(e.start)}`);
    lines.push(`DTEND:${utc(e.end)}`);
    lines.push(fold(`SUMMARY:${escape(e.summary)}`));
    if (e.description) lines.push(fold(`DESCRIPTION:${escape(e.description)}`));
    if (e.location) lines.push(fold(`LOCATION:${escape(e.location)}`));
    if (e.url) lines.push(fold(`URL:${e.url}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
