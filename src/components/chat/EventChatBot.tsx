"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Trash2, FileText, Loader2 } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type StatusResponse = {
  available: boolean;
  enabled: boolean;
  knowledge: {
    fileName: string;
    fileType: string;
    updatedAt: string;
    charCount: number;
  } | null;
  history: ChatMsg[];
};

export function EventChatBot({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!open || fetched.current) return;
    fetched.current = true;
    fetch(`/api/chat?eventId=${eventId}`)
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        setStatus(data);
        setMessages(data.history ?? []);
      })
      .catch(() => setError("Could not load the chatbot."));
  }, [open, eventId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    const optimistic: ChatMsg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, message: text }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Chatbot is unavailable right now.");
      return;
    }
    const data = await res.json();
    setMessages((m) => [
      ...m,
      {
        id: data.reply.id,
        role: "assistant",
        content: data.reply.content,
        createdAt: data.reply.createdAt,
      },
    ]);
  }

  async function clearHistory() {
    await fetch(`/api/chat?eventId=${eventId}`, { method: "DELETE" });
    setMessages([]);
  }

  const suggested = [
    "When does the event start?",
    "What's on the agenda for day one?",
    "Where is the venue and how do I get there?",
    "Who is the keynote speaker?",
  ];

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full shadow-pop transition-all",
          open
            ? "h-12 w-12 bg-ink-900 text-white justify-center"
            : "h-14 px-5 bg-brand-700 text-white hover:bg-brand-800"
        )}
        aria-label={open ? "Close chatbot" : "Open event assistant"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-medium text-sm">Ask the event assistant</span>
          </>
        )}
      </button>

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl bg-white shadow-pop ring-1 ring-ink-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-700 to-brand-900 text-white p-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">Event Assistant</div>
                <div className="text-xs text-brand-100 truncate">
                  Ask anything about {eventName}
                </div>
              </div>
              {messages.length > 0 ? (
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {status?.knowledge ? (
              <div className="mt-2 text-[10px] text-brand-100/80 inline-flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                Trained on {status.knowledge.fileName}
              </div>
            ) : null}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-ink-50/50">
            {!status ? (
              <div className="flex items-center justify-center h-full text-sm text-ink-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !status.enabled ? (
              <DisabledState reason="The chatbot is not configured yet. An admin needs to add an ANTHROPIC_API_KEY to .env." />
            ) : !status.knowledge ? (
              <DisabledState reason="No event document has been uploaded yet. The organiser can upload one from the admin dashboard to enable this assistant." />
            ) : messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-ink-600">
                  Hi! I can answer questions about {eventName} based on the event programme.
                  Try one of these to get started:
                </div>
                <div className="space-y-2">
                  {suggested.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="w-full text-left text-sm rounded-md bg-white ring-1 ring-ink-200 px-3 py-2 hover:bg-brand-50 hover:ring-brand-200 text-ink-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <Bubble key={m.id} msg={m} />
                ))}
                {sending ? <TypingBubble /> : null}
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={send} className="border-t border-ink-100 p-3 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                status?.knowledge ? "Type a question…" : "Ask the event assistant…"
              }
              disabled={!status?.available || sending}
              className="input flex-1 disabled:bg-ink-50"
            />
            <button
              type="submit"
              disabled={!status?.available || sending || !input.trim()}
              className="btn-primary px-3"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {error ? (
            <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-t border-red-100">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const mine = msg.role === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line",
          mine
            ? "bg-brand-700 text-white rounded-br-sm"
            : "bg-white text-ink-800 ring-1 ring-ink-100 rounded-bl-sm"
        )}
      >
        {msg.content}
        <div
          className={cn(
            "text-[10px] mt-1",
            mine ? "text-brand-100" : "text-ink-400"
          )}
        >
          {formatTime(msg.createdAt)}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-ink-500 ring-1 ring-ink-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm inline-flex items-center gap-1.5">
        <Dot delay="0s" />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

function DisabledState({ reason }: { reason: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-400">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm text-ink-600">{reason}</p>
    </div>
  );
}
