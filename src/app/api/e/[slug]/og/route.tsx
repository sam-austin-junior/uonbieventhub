import { ImageResponse } from "next/og";
import { getEventBySlug } from "@/lib/event";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  const dateLine =
    event.startDate.toDateString() === event.endDate.toDateString()
      ? formatDate(event.startDate)
      : `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b1426 0%, #1e3a8a 60%, #4338ca 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#fbbf24",
            fontWeight: 600,
          }}
        >
          {event.tagline ?? "Event Hub"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: "1000px",
            }}
          >
            {event.name}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#cbd5e1",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div>{dateLine}</div>
            {event.venue ? (
              <div style={{ color: "#94a3b8" }}>{event.venue}</div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex" }}>uonbieventhub.co.ke</div>
          <div style={{ display: "flex" }}>{event.organizer.name}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
