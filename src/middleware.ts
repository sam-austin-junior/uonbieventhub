import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-change-me-in-production-please-32chars"
);
const COOKIE = "uon_hub_session";

const PLATFORM_HOST = (process.env.PLATFORM_HOST ?? "uonbieventhub.co.ke").toLowerCase();
const HOST_TTL_MS = 60_000;
const hostCache = new Map<string, { slug: string | null; expiresAt: number }>();

async function lookupSlugForHost(req: NextRequest, host: string): Promise<string | null> {
  const hit = hostCache.get(host);
  if (hit && Date.now() < hit.expiresAt) return hit.slug;
  try {
    const url = new URL("/api/internal/host-lookup", req.nextUrl.origin);
    url.searchParams.set("host", host);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      hostCache.set(host, { slug: null, expiresAt: Date.now() + HOST_TTL_MS });
      return null;
    }
    const data = (await res.json()) as { slug?: string | null };
    const slug = data.slug ?? null;
    hostCache.set(host, { slug, expiresAt: Date.now() + HOST_TTL_MS });
    return slug;
  } catch {
    return null;
  }
}

function isPlatformHost(host: string) {
  const h = host.toLowerCase().split(":")[0];
  if (h === PLATFORM_HOST || h === `www.${PLATFORM_HOST}`) return true;
  if (h.endsWith(".vercel.app")) return true;
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) return true;
  return false;
}

const PUBLIC_EXACT = [
  "/",
  "/login",
  "/forgot",
  "/reset",
  "/api/auth/login",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/manifest.webmanifest",
];

const PUBLIC_PREFIX = [
  "/uploads/",
  "/uon-logo.png",
  "/favicon.png",
];

function isEventLoginOrActivate(pathname: string) {
  // /e/<slug>/login  OR  /api/e/<slug>/activate/...  OR  /api/e/<slug>/register
  return (
    /^\/e\/[^/]+\/login\/?$/.test(pathname) ||
    /^\/api\/e\/[^/]+\/activate\//.test(pathname) ||
    /^\/api\/e\/[^/]+\/register\/?$/.test(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Custom-domain → event rewrite: if this request arrived on a host other
  // than the platform host, and we have an Event with a matching customDomain,
  // rewrite the URL to /e/<slug>/... so the event hub serves it.
  const incomingHost = req.headers.get("host") ?? "";
  if (
    incomingHost &&
    !isPlatformHost(incomingHost) &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api/internal/") &&
    !pathname.startsWith("/e/")
  ) {
    const hostOnly = incomingHost.toLowerCase().split(":")[0];
    const slug = await lookupSlugForHost(req, hostOnly);
    if (slug) {
      const rewritten = req.nextUrl.clone();
      const tail = pathname === "/" ? "" : pathname;
      rewritten.pathname = `/e/${slug}${tail}`;
      return NextResponse.rewrite(rewritten);
    }
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/internal/") ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p)) ||
    PUBLIC_EXACT.includes(pathname) ||
    isEventLoginOrActivate(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    // For event hub pages, send to event-branded login; for everything else use central login.
    const eventMatch = pathname.match(/^\/e\/([^/]+)(?:\/|$)/);
    if (eventMatch) {
      url.pathname = `/e/${eventMatch[1]}/login`;
    } else {
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = (payload as { role?: string }).role;
    if (pathname.startsWith("/hub-admin")) {
      if (role !== "SUPERADMIN") return NextResponse.redirect(new URL("/", req.url));
    } else if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "ORGANIZER" && role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
