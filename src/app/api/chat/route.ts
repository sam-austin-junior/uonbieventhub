import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { askEventBot, isChatbotEnabled } from "@/lib/llm";

const schema = z.object({
  eventId: z.string(),
  message: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isChatbotEnabled()) {
    return NextResponse.json(
      { error: "The event chatbot is not configured. Ask an organiser to add an ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { eventId, message } = parsed.data;

  const [event, kb] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { name: true } }),
    prisma.eventKnowledgeBase.findUnique({ where: { eventId } }),
  ]);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!kb) {
    return NextResponse.json(
      { error: "No event document has been uploaded yet. Ask an organiser to upload one." },
      { status: 404 }
    );
  }

  const history = await prisma.chatMessage.findMany({
    where: { eventId, userId: session.userId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  await prisma.chatMessage.create({
    data: { eventId, userId: session.userId, role: "user", content: message },
  });

  let answer = "";
  try {
    answer = await askEventBot({
      eventName: event.name,
      knowledgeText: kb.rawText,
      history: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      userMessage: message,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Chatbot is unavailable right now. Please try again." },
      { status: 502 }
    );
  }

  const saved = await prisma.chatMessage.create({
    data: { eventId, userId: session.userId, role: "assistant", content: answer },
  });

  return NextResponse.json({
    reply: { id: saved.id, content: answer, createdAt: saved.createdAt },
  });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const [kb, history] = await Promise.all([
    prisma.eventKnowledgeBase.findUnique({
      where: { eventId },
      select: { fileName: true, fileType: true, updatedAt: true, charCount: true },
    }),
    prisma.chatMessage.findMany({
      where: { eventId, userId: session.userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    available: !!kb && isChatbotEnabled(),
    enabled: isChatbotEnabled(),
    knowledge: kb,
    history: history.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { eventId, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
