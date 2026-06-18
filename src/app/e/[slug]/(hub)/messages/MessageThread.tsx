"use client";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Send } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";

type Msg = { id: string; senderId: string; body: string; sentAt: string };

export function MessageThread({
  currentUserId,
  other,
  initialMessages,
}: {
  currentUserId: string;
  other: { id: string; name: string; avatarUrl: string | null };
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      senderId: currentUserId,
      body,
      sentAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receiverId: other.id, body }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((m) =>
        m.map((x) =>
          x.id === optimistic.id
            ? { id: data.message.id, senderId: data.message.senderId, body: data.message.body, sentAt: data.message.sentAt }
            : x
        )
      );
    }
    setSending(false);
  }

  return (
    <>
      <header className="flex items-center gap-3 p-4 border-b border-ink-100">
        <Avatar name={other.name} src={other.avatarUrl} size={40} />
        <div>
          <div className="font-semibold text-ink-900">{other.name}</div>
          <div className="text-xs text-ink-500">Direct message</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-ink-500 mt-12">
            Say hello — your message will start the conversation.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    mine ? "bg-brand-700 text-white rounded-br-sm" : "bg-ink-100 text-ink-900 rounded-bl-sm"
                  )}
                >
                  <div className="whitespace-pre-line">{m.body}</div>
                  <div
                    className={cn(
                      "text-[10px] mt-1",
                      mine ? "text-brand-100" : "text-ink-400"
                    )}
                  >
                    {formatTime(m.sentAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="border-t border-ink-100 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="input flex-1"
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-3">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}
