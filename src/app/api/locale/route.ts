import { NextResponse } from "next/server";
import { LOCALE_COOKIE, LOCALE_LABELS } from "@/lib/locales";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = typeof body?.locale === "string" ? body.locale.toLowerCase() : "";
  if (!LOCALE_LABELS[locale]) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
