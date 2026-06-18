import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export function isChatbotEnabled() {
  return !!process.env.GROQ_API_KEY;
}

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const MAX_CONTEXT_CHARS = 60_000;

export async function askEventBot({
  eventName,
  knowledgeText,
  history,
  userMessage,
}: {
  eventName: string;
  knowledgeText: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
}): Promise<string> {
  const client = getGroqClient();

  const context =
    knowledgeText.length > MAX_CONTEXT_CHARS
      ? knowledgeText.slice(0, MAX_CONTEXT_CHARS) +
        "\n\n[Document truncated — only the first portion was included.]"
      : knowledgeText;

  const system = [
    `You are the official AI assistant for "${eventName}".`,
    `Answer attendee questions clearly and concisely using ONLY the event document below.`,
    ``,
    `Rules:`,
    `- If the answer is in the document, answer directly with specifics (times, locations, names).`,
    `- If the answer is NOT in the document, say "I don't have that detail in the event materials — please check the event home page or contact the organisers" and suggest a related question.`,
    `- Be friendly, conversational, and brief. Use short paragraphs and bullet points for lists.`,
    `- Never invent information. If unsure, say so.`,
    `- If the user greets you, greet them back and offer to help with sessions, speakers, venue, schedule, etc.`,
    ``,
    `=== EVENT DOCUMENT ===`,
    context || "(No document has been uploaded yet.)",
    `=== END DOCUMENT ===`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}
