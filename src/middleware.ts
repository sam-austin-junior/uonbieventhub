import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-change-me-in-production-please-32chars"
);
const COOKIE = "uon_hub_session";

const PUBLIC_EXACT = [
  "/",
  "/login",
  "/forgot",
  "/reset",
  "/api/auth/login",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/locale",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
  "/sw.js",
];

const PUBLIC_PREFIX = [
  "/uploads/",
  "/uon-logo.png",
  "/uon-lockup.png",
  "/favicon.png",
  "/api/billing/webhook",
];

function isEventLoginOrActivate(pathname: string) {
  // /e/<slug>/login  OR  /api/e/<slug>/activate/...  OR  /api/e/<slug>/register
  // OR /api/e/<slug>/og — public OG image consumed by social crawlers
  return (
    /^\/e\/[^/]+\/login\/?$/.test(pathname) ||
    /^\/api\/e\/[^/]+\/activate\//.test(pathname) ||
    /^\/api\/e\/[^/]+\/register\/?$/.test(pathname) ||
    /^\/api\/e\/[^/]+\/og\/?$/.test(pathname)
  );
}

function isPublicEventLanding(pathname: string) {
  // /e/<slug>  or  /e/<slug>/  — the event landing page itself is public so
  // crawlers can index the JSON-LD Event schema. Deep paths stay gated.
  return /^\/e\/[^/]+\/?$/.test(pathname);
}

function passthrough(req: NextRequest) {
  // Forward the original pathname so server components can read it via
  // headers().get("x-pathname") — used for slug-alias redirects that need
  // to preserve the deep sub-path.
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/public") ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p)) ||
    PUBLIC_EXACT.includes(pathname) ||
    isEventLoginOrActivate(pathname) ||
    isPublicEventLanding(pathname)
  ) {
    return passthrough(req);
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
    return passthrough(req);
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
