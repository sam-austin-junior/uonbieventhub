import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDocument } from "@/lib/parse-document";
import { uploadFile } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
];

async function assertStaff() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "ORGANIZER")) return null;
  return session;
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ACCEPTED.includes(file.type) && !/\.(pdf|docx?|txt|md)$/i.test(file.name)) {
    return NextResponse.json(
      { error: `Unsupported file type ${file.type}. Use PDF, DOCX, TXT or MD.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB)` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseDocument(buffer, file.type, file.name);
  } catch (e: any) {
    return NextResponse.json({ error: `Could not parse: ${e.message}` }, { status: 400 });
  }

  if (parsed.text.trim().length < 20) {
    return NextResponse.json(
      { error: "The document appears to be empty or unreadable. Try a different file." },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const id = crypto.randomBytes(12).toString("hex");
  const fileUrl = await uploadFile({
    buffer,
    filename: `${id}.${ext}`,
    subdir: "documents",
    contentType: file.type || "application/octet-stream",
  });

  const kb = await prisma.eventKnowledgeBase.upsert({
    where: { eventId: params.eventId },
    create: {
      eventId: params.eventId,
      fileName: file.name,
      fileType: parsed.fileType,
      fileUrl,
      rawText: parsed.text,
      charCount: parsed.charCount,
    },
    update: {
      fileName: file.name,
      fileType: parsed.fileType,
      fileUrl,
      rawText: parsed.text,
      charCount: parsed.charCount,
    },
  });

  await prisma.chatMessage.deleteMany({ where: { eventId: params.eventId } });

  return NextResponse.json({
    knowledge: {
      id: kb.id,
      fileName: kb.fileName,
      fileType: kb.fileType,
      charCount: kb.charCount,
      updatedAt: kb.updatedAt,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { eventId: string } }) {
  if (!(await assertStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.eventKnowledgeBase.deleteMany({ where: { eventId: params.eventId } });
  await prisma.chatMessage.deleteMany({ where: { eventId: params.eventId } });
  return NextResponse.json({ ok: true });
}
