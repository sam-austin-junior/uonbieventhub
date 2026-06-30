"use client";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Handshake,
  AlertCircle,
} from "lucide-react";

type Rec = {
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

/**
 * Lives at the top of the attendee directory: AI-ranked "people you
 * should meet" with one-line reasons grounded in profile overlap.
 * Cached server-side for 6h; can be refreshed on demand.
 */
export function NetworkingRecommendations({ slug }: { slug: string }) {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    setError(null);
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(
        `/api/e/${slug}/networking/recommendations${refresh ? "?refresh=1" : ""}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Could not load recommendations");
      const data = await res.json();
      setRecs(data.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
      setRecs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <section className="card p-5">
        <div className="text-sm text-ink-500 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding people you should
          meet…
        </div>
      </section>
    );
  }
  if (!recs || recs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-amber-50 ring-1 ring-brand-100 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> AI-picked for you
          </div>
          <h2 className="mt-1 text-lg font-bold text-ink-900">
            People you should meet
          </h2>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-900 disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-3 text-xs text-red-600 inline-flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </div>
      ) : null}

      <ul className="space-y-2">
        {recs.map((r) => (
          <li
            key={r.user.id}
            className="flex items-start gap-3 rounded-xl bg-white/80 backdrop-blur ring-1 ring-white p-3"
          >
            <Avatar name={r.user.name} src={r.user.avatarUrl} size={44} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink-900 truncate">
                {r.user.name}
              </div>
              {r.user.jobTitle || r.user.organization ? (
                <div className="text-xs text-ink-500 truncate">
                  {r.user.jobTitle}
                  {r.user.jobTitle && r.user.organization ? " · " : ""}
                  {r.user.organization}
                </div>
              ) : null}
              <p className="mt-1.5 text-sm text-ink-700">{r.reason}</p>
            </div>
            <a
              href={`/e/${slug}/meetings`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-ink-800 transition"
            >
              <Handshake className="h-3.5 w-3.5" />
              Meet
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-ink-500">
        Recommendations refresh automatically every 6 hours based on profile
        overlap.
      </p>
    </section>
  );
}
