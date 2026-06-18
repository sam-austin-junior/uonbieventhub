import Link from "next/link";
import { Calendar, Lock, AlertCircle } from "lucide-react";

type Props = {
  reason: "EVENT_ENDED" | "ORGANIZER_SUSPENDED" | "ORGANIZER_EXPIRED";
  eventName: string;
  eventLogoUrl: string | null;
  coverImage: string | null;
  suspendedSince?: Date;
};

const COPY: Record<Props["reason"], { title: string; body: string; icon: React.ComponentType<any> }> = {
  EVENT_ENDED: {
    title: "This event is no longer available",
    body: "The event ended and the attendee hub has been archived. Reach out to the organisers if you need session recordings or other materials.",
    icon: Calendar,
  },
  ORGANIZER_SUSPENDED: {
    title: "This event is no longer available",
    body: "The hosting account has been suspended. Reach out to the organisers or to the platform team for more information.",
    icon: Lock,
  },
  ORGANIZER_EXPIRED: {
    title: "This event is no longer available",
    body: "The hosting account's access window has ended. Reach out to the organisers if you need session materials.",
    icon: AlertCircle,
  },
};

export function EventUnavailable({ reason, eventName, eventLogoUrl, coverImage, suspendedSince }: Props) {
  const copy = COPY[reason];
  const Icon = copy.icon;
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-6 relative bg-ink-900"
      style={
        coverImage
          ? {
              backgroundImage: `linear-gradient(rgba(11,20,38,0.75), rgba(11,20,38,0.85)), url("${coverImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-pop p-8 sm:p-10 text-center">
        {eventLogoUrl ? (
          <img
            src={eventLogoUrl}
            alt={eventName}
            className="h-16 w-16 mx-auto rounded-md object-contain ring-1 ring-ink-100 bg-white p-1.5 grayscale opacity-80"
          />
        ) : null}
        <div className="mt-6 mx-auto h-12 w-12 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink-900">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink-600">{copy.body}</p>
        {suspendedSince ? (
          <p className="mt-3 text-xs text-ink-400">
            Archived {suspendedSince.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        ) : null}
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-800"
        >
          Visit the platform
        </Link>
      </div>
    </main>
  );
}
