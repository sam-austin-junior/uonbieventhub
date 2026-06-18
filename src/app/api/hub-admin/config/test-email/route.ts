import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { sendEmail, emailTemplate, appUrl } from "@/lib/email";

const schema = z.object({ to: z.string().email() });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "SUPERADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    await sendEmail({
      to: parsed.data.to,
      subject: "UoN Event Hub — Resend test",
      html: emailTemplate({
        heading: "Resend is working",
        body: "<p>If you're reading this, the UoN Event Hub can now send activation codes, organizer credentials and announcement emails via Resend.</p>",
        cta: { label: "Back to the dashboard", href: `${appUrl}/hub-admin` },
      }),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Send failed" }, { status: 502 });
  }
}
