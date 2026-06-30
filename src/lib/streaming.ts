/**
 * Streaming URL normaliser. Detects the provider from a session's
 * videoUrl and returns the data the UI needs to render it nicely —
 * an embed URL (suitable for an <iframe>), the provider, and a
 * "Join live" external URL for providers that don't embed cleanly.
 */

export type StreamProvider =
  | "youtube"
  | "vimeo"
  | "zoom"
  | "teams"
  | "meet"
  | "twitch"
  | "facebook"
  | "linkedin"
  | "other";

export type StreamInfo = {
  provider: StreamProvider;
  /** URL that's safe to put inside <iframe>. May be null if the provider blocks framing (Zoom, Teams, Meet). */
  embedUrl: string | null;
  /** URL the user can open in a new tab to join the stream. */
  joinUrl: string;
  /** True if we know this is a live-style stream (Zoom/Meet/Teams/LinkedIn Live) rather than VOD. */
  isLive: boolean;
};

export function normaliseStreamUrl(input: string): StreamInfo | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // YouTube — many URL shapes; normalise to embed.
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    let videoId: string | null = null;
    if (host === "youtu.be") {
      videoId = url.pathname.split("/")[1] ?? null;
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] ?? null;
    } else if (url.pathname.startsWith("/live/")) {
      videoId = url.pathname.split("/")[2] ?? null;
    } else if (url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] ?? null;
    }
    if (!videoId) return { provider: "youtube", embedUrl: null, joinUrl: raw, isLive: false };
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      joinUrl: `https://www.youtube.com/watch?v=${videoId}`,
      isLive: url.pathname.startsWith("/live/"),
    };
  }

  // Vimeo — vimeo.com/<id> or vimeo.com/event/<id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    let videoId: string | null = null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "event" && parts[1]) videoId = parts[1];
    else if (parts[0] === "video" && parts[1]) videoId = parts[1];
    else if (parts[0] && /^\d+$/.test(parts[0])) videoId = parts[0];
    if (!videoId) return { provider: "vimeo", embedUrl: null, joinUrl: raw, isLive: false };
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      joinUrl: raw,
      isLive: url.pathname.startsWith("/event/"),
    };
  }

  // Twitch — channel or video
  if (host === "twitch.tv" || host === "m.twitch.tv") {
    const channel = url.pathname.split("/")[1];
    if (!channel) return { provider: "twitch", embedUrl: null, joinUrl: raw, isLive: false };
    if (typeof window === "undefined") {
      return {
        provider: "twitch",
        // Parent param must match the embedding host; rendered client-side.
        embedUrl: null,
        joinUrl: raw,
        isLive: true,
      };
    }
    return {
      provider: "twitch",
      embedUrl: `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`,
      joinUrl: raw,
      isLive: true,
    };
  }

  // Zoom / Teams / Meet — must open externally, can't be iframed.
  if (host.endsWith("zoom.us") || host.endsWith("zoom.com")) {
    return { provider: "zoom", embedUrl: null, joinUrl: raw, isLive: true };
  }
  if (host === "teams.microsoft.com" || host === "teams.live.com") {
    return { provider: "teams", embedUrl: null, joinUrl: raw, isLive: true };
  }
  if (host === "meet.google.com") {
    return { provider: "meet", embedUrl: null, joinUrl: raw, isLive: true };
  }
  if (host === "facebook.com" || host === "fb.watch") {
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false`,
      joinUrl: raw,
      isLive: true,
    };
  }
  if (host === "linkedin.com") {
    return { provider: "linkedin", embedUrl: null, joinUrl: raw, isLive: true };
  }

  // Unknown host: trust it as an iframe but also expose joinUrl.
  return { provider: "other", embedUrl: raw, joinUrl: raw, isLive: false };
}

export function liveWindow(
  startTime: Date,
  endTime: Date,
  now: Date = new Date(),
) {
  // Treat the session as "joinable" from 15 min before until 15 min after.
  const startBuffer = 15 * 60 * 1000;
  const endBuffer = 15 * 60 * 1000;
  return (
    now.getTime() >= startTime.getTime() - startBuffer &&
    now.getTime() <= endTime.getTime() + endBuffer
  );
}

export function streamProviderLabel(p: StreamProvider) {
  switch (p) {
    case "youtube":
      return "YouTube";
    case "vimeo":
      return "Vimeo";
    case "zoom":
      return "Zoom";
    case "teams":
      return "Microsoft Teams";
    case "meet":
      return "Google Meet";
    case "twitch":
      return "Twitch";
    case "facebook":
      return "Facebook Live";
    case "linkedin":
      return "LinkedIn Live";
    default:
      return "External stream";
  }
}
