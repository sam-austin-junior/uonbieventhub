import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const KINDS = {
  image: {
    accept: ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"],
    maxBytes: 5 * 1024 * 1024,
    subdir: "images",
  },
  video: {
    accept: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 100 * 1024 * 1024,
    subdir: "videos",
  },
  document: {
    accept: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
    ],
    maxBytes: 10 * 1024 * 1024,
    subdir: "documents",
  },
} as const;

const EXT_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "txt",
  "text/markdown": "md",
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const kindParam = String(form.get("kind") ?? "image");
  const kind = (KINDS as any)[kindParam] as (typeof KINDS)[keyof typeof KINDS] | undefined;
  if (!kind) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const accepted: readonly string[] = kind.accept;
  if (!accepted.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} not allowed for ${kindParam}` },
      { status: 400 }
    );
  }
  if (file.size > kind.maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(kind.maxBytes / 1024 / 1024)} MB)` },
      { status: 400 }
    );
  }

  const ext = EXT_MAP[file.type] ?? "bin";
  const id = crypto.randomBytes(12).toString("hex");
  const filename = `${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadFile({
    buffer,
    filename,
    subdir: kind.subdir,
    contentType: file.type,
  });

  return NextResponse.json({
    url,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
