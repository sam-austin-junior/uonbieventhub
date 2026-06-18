import { Resend } from "resend";
import { prisma } from "./prisma";

let cachedClient: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cachedClient) cachedClient = new Resend(process.env.RESEND_API_KEY);
  return cachedClient;
}

async function getFrom() {
  const config = await prisma.platformConfig.findUnique({ where: { id: "singleton" } });
  const email = config?.fromEmail || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const name = config?.fromName || process.env.RESEND_FROM_NAME || "UoN Event Hub";
  return { email, name };
}

export async function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  const client = getClient();
  if (!client) throw new Error("RESEND_API_KEY is not set. Add it to .env to enable email.");
  const from = await getFrom();
  const result = await client.emails.send({
    from: `${from.name} <${from.email}>`,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ""),
  });
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
  return result.data;
}

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function emailTemplate({
  preheader,
  heading,
  body,
  cta,
  footer,
  brandColor = "#174776",
}: {
  preheader?: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  footer?: string;
  brandColor?: string;
}) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0b1426;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escape(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:40px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);overflow:hidden;">
      <tr><td style="background:${brandColor};height:6px;line-height:6px;">&nbsp;</td></tr>
      <tr><td style="padding:32px 32px 16px;">
        <h1 style="margin:0 0 16px;font-size:22px;color:#0b1426;line-height:1.3;">${escape(heading)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#374863;">${body}</div>
        ${cta ? `<div style="margin:28px 0 4px;"><a href="${escape(cta.href)}" style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;font-size:14px;">${escape(cta.label)}</a></div>` : ""}
      </td></tr>
      <tr><td style="padding:16px 32px 28px;font-size:12px;color:#7a8aa3;border-top:1px solid #eef2f7;">
        ${footer ?? `<a href="${PUBLIC_URL}" style="color:${brandColor};text-decoration:none;">${PUBLIC_URL.replace(/^https?:\/\//, "")}</a>`}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const appUrl = PUBLIC_URL;
