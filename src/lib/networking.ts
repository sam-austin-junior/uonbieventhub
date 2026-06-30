import { prisma } from "./prisma";
import { getGroqClient, isChatbotEnabled } from "./llm";

/**
 * AI-powered networking recommendations.
 *
 * For a given attendee at an event, find the 3-5 other attendees they
 * should most prioritise meeting and explain why in one short line. We
 * cache results in NetworkingMatch (per attendee, per event) and only
 * re-rank when the cache is older than CACHE_TTL_MS, the directory has
 * grown noticeably, or the caller forces a refresh.
 */

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const MAX_CANDIDATES = 40;
const TARGET_MATCHES = 5;

export type NetworkingRecommendation = {
  user: {
    id: string;
    name: string;
    jobTitle: string | null;
    organization: string | null;
    avatarUrl: string | null;
  };
  score: number;
  reason: string;
};

export async function getNetworkingRecommendations(
  eventId: string,
  userId: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<NetworkingRecommendation[]> {
  const cached = await prisma.networkingMatch.findMany({
    where: { eventId, userId },
    include: {
      matchUser: {
        select: {
          id: true,
          name: true,
          jobTitle: true,
          organization: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { score: "desc" },
  });

  const fresh =
    cached.length > 0 &&
    cached[0].generatedAt.getTime() > Date.now() - CACHE_TTL_MS;
  if (fresh && !opts.forceRefresh) {
    return cached.map((c) => ({
      user: c.matchUser,
      score: c.score,
      reason: c.reason,
    }));
  }

  const recommendations = await rankFresh(eventId, userId);
  if (recommendations.length > 0) {
    await prisma.$transaction([
      prisma.networkingMatch.deleteMany({ where: { eventId, userId } }),
      prisma.networkingMatch.createMany({
        data: recommendations.map((r) => ({
          eventId,
          userId,
          matchUserId: r.user.id,
          score: r.score,
          reason: r.reason,
        })),
        skipDuplicates: true,
      }),
    ]);
  }
  return recommendations;
}

async function rankFresh(
  eventId: string,
  userId: string,
): Promise<NetworkingRecommendation[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      jobTitle: true,
      organization: true,
      bio: true,
    },
  });
  if (!me) return [];

  // Pool: registered attendees on this event who opt in to the directory,
  // accept requests, and aren't me. Cap to MAX_CANDIDATES for prompt size.
  const regs = await prisma.registration.findMany({
    where: {
      eventId,
      userId: { not: userId },
      user: {
        showInDirectory: true,
        allowConnectionRequests: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          jobTitle: true,
          organization: true,
          bio: true,
          avatarUrl: true,
        },
      },
    },
    take: MAX_CANDIDATES,
  });

  if (regs.length === 0) return [];

  // If the LLM isn't configured, fall back to a deterministic rule
  // (same org first, then matching job-title keywords). This keeps the
  // feature usable in dev without a Groq key.
  if (!isChatbotEnabled()) {
    return fallbackRanker(me, regs.map((r) => r.user)).slice(0, TARGET_MATCHES);
  }

  const candidates = regs.map((r, i) => ({
    idx: i,
    user: r.user,
  }));

  const candidateBlock = candidates
    .map(
      (c) =>
        `${c.idx}. ${c.user.name}${
          c.user.jobTitle ? ` — ${c.user.jobTitle}` : ""
        }${
          c.user.organization ? ` at ${c.user.organization}` : ""
        }${c.user.bio ? `. Bio: ${c.user.bio.slice(0, 200)}` : ""}`,
    )
    .join("\n");

  const prompt = [
    `Me:`,
    `Name: ${me.name}`,
    me.jobTitle ? `Role: ${me.jobTitle}` : null,
    me.organization ? `Organisation: ${me.organization}` : null,
    me.bio ? `Bio: ${me.bio.slice(0, 400)}` : null,
    ``,
    `Other attendees (numbered):`,
    candidateBlock,
    ``,
    `Pick the top ${TARGET_MATCHES} people I should prioritise meeting at this event, ranked best first. For each, give a 1-sentence reason grounded in our profile overlap (shared field, complementary role, organisation interest, etc.). Avoid generic reasons like "interesting person".`,
    ``,
    `Reply with ONLY valid JSON of the shape:`,
    `{"matches":[{"idx":<number>,"score":<1-100>,"reason":"<one sentence>"}]}`,
  ]
    .filter(Boolean)
    .join("\n");

  let parsed: { matches?: { idx: number; score: number; reason: string }[] } = {};
  try {
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You match conference attendees. Output strict JSON. Only reference attendees by their numeric idx.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    parsed = JSON.parse(raw);
  } catch {
    return fallbackRanker(me, regs.map((r) => r.user)).slice(0, TARGET_MATCHES);
  }

  const out: NetworkingRecommendation[] = [];
  for (const m of parsed.matches ?? []) {
    const c = candidates[m.idx];
    if (!c) continue;
    const score = Math.max(1, Math.min(100, Math.round(m.score)));
    const reason = (m.reason ?? "").slice(0, 240);
    if (!reason) continue;
    out.push({
      user: c.user,
      score,
      reason,
    });
    if (out.length >= TARGET_MATCHES) break;
  }

  // If the LLM returned nothing usable, fall back deterministically so
  // the UI still shows something useful.
  if (out.length === 0) {
    return fallbackRanker(me, regs.map((r) => r.user)).slice(0, TARGET_MATCHES);
  }
  return out;
}

function fallbackRanker(
  me: { name: string; jobTitle: string | null; organization: string | null; bio: string | null },
  pool: {
    id: string;
    name: string;
    jobTitle: string | null;
    organization: string | null;
    bio: string | null;
    avatarUrl: string | null;
  }[],
): NetworkingRecommendation[] {
  const myTokens = tokenize(`${me.jobTitle ?? ""} ${me.bio ?? ""}`);
  const scored = pool.map((u) => {
    let score = 0;
    const reasons: string[] = [];
    if (
      me.organization &&
      u.organization &&
      me.organization.toLowerCase() === u.organization.toLowerCase()
    ) {
      score += 40;
      reasons.push(`Same organisation (${u.organization})`);
    }
    const theirTokens = tokenize(`${u.jobTitle ?? ""} ${u.bio ?? ""}`);
    const overlap = myTokens.filter((t) => theirTokens.includes(t));
    if (overlap.length > 0) {
      score += Math.min(40, overlap.length * 8);
      reasons.push(`Shared focus on ${overlap.slice(0, 2).join(", ")}`);
    }
    if (u.jobTitle) {
      score += 5;
      reasons.push(`${u.jobTitle}${u.organization ? ` at ${u.organization}` : ""}`);
    }
    return {
      user: u,
      score: Math.max(1, score),
      reason: reasons.join(". ") || "Active attendee at this event.",
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function tokenize(s: string) {
  return Array.from(
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w)),
    ),
  );
}

const STOP = new Set([
  "with",
  "this",
  "that",
  "from",
  "have",
  "your",
  "ours",
  "their",
  "they",
  "them",
  "into",
  "about",
  "over",
  "team",
  "work",
  "working",
  "events",
  "event",
]);
